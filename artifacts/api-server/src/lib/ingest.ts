/**
 * Scheduled market-data ingest (runs every 15 minutes).
 *
 * Fixed schedule, so CoinMarketCap credit use does not depend on traffic:
 *   - top 100 coins            every run      ~96 credits/day
 *   - ranks 101–200            hourly         ~24 credits/day
 *   - global metrics           every 30 min   ~48 credits/day
 *   - descriptions (200 coins) daily          ~2 credits/day
 * Spare daily credits backfill one year of daily history per coin, top
 * ranks first, while keeping a reserve for the rest of the day and month.
 */

import {
  fetchCoinInfo,
  fetchCreditInfo,
  fetchDailyHistory,
  fetchGlobalMetrics,
  fetchListings,
  type CoinRecord,
  type CreditInfo,
} from "./market-data";
import {
  DAILY_RETENTION_MS,
  HOURLY_RETENTION_MS,
  KEYS,
  mergeHistory,
  readHistory,
  readJSON,
  writeJSON,
  type CoinsSnapshot,
  type HistoryPoint,
  type IngestStatus,
} from "./market-store";
import { UpstreamHttpError } from "./upstream";

const HOUR_MS = 3_600_000;
const DAY_MS = 86_400_000;
const GLOBAL_INTERVAL_MS = 29 * 60_000;
const REGULAR_CREDITS_PER_DAY = 170;
const SPARKLINE_POINTS = 168;
const BACKFILL_DAYS = 364;
const BACKFILL_MAX_PER_RUN = 10;
const BACKFILL_CREDITS_PER_COIN = 4;
const BACKFILL_MAX_FAILURES = 5;
// Scheduled functions stop at 30 seconds; leave room to save status.
const RUN_TIME_BUDGET_MS = 22_000;
const WRITE_CONCURRENCY = 20;

function defaultStatus(): IngestStatus {
  return {
    last_run_at: null,
    last_global_at: null,
    last_hour_key: null,
    last_day_key: null,
    credits: null,
    credits_used_last_run: 0,
    history_mode: "backfill",
    backfilled: [],
    backfill_failures: 0,
    errors: [],
  };
}

function message(err: unknown): string {
  return err instanceof Error ? err.message : String(err);
}

async function pool<T>(items: T[], size: number, fn: (item: T) => Promise<void>): Promise<void> {
  let next = 0;
  const workers = Array.from({ length: Math.min(size, items.length) }, async () => {
    while (next < items.length) {
      const item = items[next++];
      await fn(item);
    }
  });
  await Promise.all(workers);
}

function dedupeByRank(coins: CoinRecord[]): CoinRecord[] {
  const seen = new Set<string>();
  return coins
    .filter((coin) => (seen.has(coin.id) ? false : (seen.add(coin.id), true)))
    .sort((a, b) => a.market_cap_rank - b.market_cap_rank);
}

/** Credits that can go to backfill without eating into the regular schedule. */
export function spareCredits(info: CreditInfo | null, usedThisRun: number, now: Date): number {
  if (!info || (info.day_left === null && info.month_left === null)) return 0;
  const y = now.getUTCFullYear();
  const m = now.getUTCMonth();
  const d = now.getUTCDate();
  const dayFractionLeft = (Date.UTC(y, m, d + 1) - now.getTime()) / DAY_MS;
  const monthDaysLeft = (Date.UTC(y, m + 1, 1) - now.getTime()) / DAY_MS;
  const dayReserve = Math.ceil(REGULAR_CREDITS_PER_DAY * dayFractionLeft) + 20;
  const monthReserve = Math.ceil(REGULAR_CREDITS_PER_DAY * monthDaysLeft) + 50;
  const fromDay = info.day_left === null ? Infinity : info.day_left - usedThisRun - dayReserve;
  const fromMonth = info.month_left === null ? Infinity : info.month_left - usedThisRun - monthReserve;
  return Math.max(0, Math.min(fromDay, fromMonth));
}

export async function runMarketIngest(now = new Date()) {
  const started = Date.now();
  const nowIso = now.toISOString();
  const hourKey = nowIso.slice(0, 13);
  const dayKey = nowIso.slice(0, 10);
  const errors: string[] = [];
  let credits = 0;

  if (!process.env.CMC_API_KEY) {
    return { ok: false, errors: ["CMC_API_KEY is not configured"] };
  }

  const [savedStatus, storedTop, storedRest] = await Promise.all([
    readJSON<IngestStatus>(KEYS.status),
    readJSON<CoinsSnapshot>(KEYS.coinsTop),
    readJSON<CoinsSnapshot>(KEYS.coinsRest),
  ]);
  const status: IngestStatus = { ...defaultStatus(), ...savedStatus };

  let creditInfo: CreditInfo | null = null;
  try {
    creditInfo = await fetchCreditInfo();
  } catch (err) {
    errors.push(`credit check: ${message(err)}`);
  }

  // Top 100: every run.
  let top = storedTop?.coins ?? [];
  try {
    const result = await fetchListings(1, 100);
    credits += result.credits;
    top = result.data;
    await writeJSON(KEYS.coinsTop, { updated_at: nowIso, coins: top } satisfies CoinsSnapshot);
  } catch (err) {
    errors.push(`top 100: ${message(err)}`);
  }

  // Global metrics: every 30 minutes.
  const lastGlobal = status.last_global_at ? Date.parse(status.last_global_at) : 0;
  if (now.getTime() - lastGlobal >= GLOBAL_INTERVAL_MS) {
    try {
      const result = await fetchGlobalMetrics();
      credits += result.credits;
      await writeJSON(KEYS.global, { updated_at: nowIso, data: result.data });
      status.last_global_at = nowIso;
    } catch (err) {
      errors.push(`global: ${message(err)}`);
    }
  }

  // Hourly: ranks 101–200, hourly history and sparklines.
  let rest = storedRest?.coins ?? [];
  const hourlyDue = status.last_hour_key !== hourKey;
  if (hourlyDue) {
    try {
      const result = await fetchListings(101, 100);
      credits += result.credits;
      rest = result.data;
      await writeJSON(KEYS.coinsRest, { updated_at: nowIso, coins: rest } satisfies CoinsSnapshot);
    } catch (err) {
      errors.push(`ranks 101-200: ${message(err)}`);
    }
  }

  const tracked = dedupeByRank([...top, ...rest]);

  if (hourlyDue && tracked.length > 0) {
    try {
      const sparklines: Record<string, number[]> = {};
      const weekAgo = now.getTime() - 7 * DAY_MS;
      await pool(tracked, WRITE_CONCURRENCY, async (coin) => {
        const points = mergeHistory(
          await readHistory(KEYS.hourly(coin.id)),
          [[now.getTime(), coin.current_price]],
          HOUR_MS,
          HOURLY_RETENTION_MS,
          now.getTime(),
        );
        await writeJSON(KEYS.hourly(coin.id), { points });
        sparklines[coin.id] = points
          .filter(([ts]) => ts >= weekAgo)
          .slice(-SPARKLINE_POINTS)
          .map(([, price]) => price);
      });
      await writeJSON(KEYS.sparklines, { updated_at: nowIso, prices: sparklines });
      status.last_hour_key = hourKey;
    } catch (err) {
      errors.push(`hourly history: ${message(err)}`);
    }
  }

  // Daily: descriptions and one daily history point per coin.
  if (status.last_day_key !== dayKey && tracked.length > 0) {
    try {
      const result = await fetchCoinInfo(tracked.map((coin) => coin.cmc_id));
      credits += result.credits;
      await writeJSON(KEYS.info, { updated_at: nowIso, descriptions: result.data });
    } catch (err) {
      errors.push(`coin info: ${message(err)}`);
    }
    try {
      await pool(tracked, WRITE_CONCURRENCY, async (coin) => {
        const points = mergeHistory(
          await readHistory(KEYS.daily(coin.id)),
          [[now.getTime(), coin.current_price]],
          DAY_MS,
          DAILY_RETENTION_MS,
          now.getTime(),
        );
        await writeJSON(KEYS.daily(coin.id), { points });
      });
      status.last_day_key = dayKey;
    } catch (err) {
      errors.push(`daily history: ${message(err)}`);
    }
  }

  // Backfill one year of daily history with spare credits, highest rank first.
  const backfilledThisRun: string[] = [];
  if (status.history_mode === "backfill") {
    const done = new Set(status.backfilled);
    const pending = tracked.filter((coin) => !done.has(coin.id));
    for (const coin of pending) {
      if (backfilledThisRun.length >= BACKFILL_MAX_PER_RUN) break;
      if (Date.now() - started > RUN_TIME_BUDGET_MS) break;
      if (spareCredits(creditInfo, credits, now) < BACKFILL_CREDITS_PER_COIN) break;
      try {
        const result = await fetchDailyHistory(coin.cmc_id, BACKFILL_DAYS);
        credits += result.credits || BACKFILL_CREDITS_PER_COIN;
        const points = mergeHistory(
          await readHistory(KEYS.daily(coin.id)),
          result.data as HistoryPoint[],
          DAY_MS,
          DAILY_RETENTION_MS,
          now.getTime(),
        );
        await writeJSON(KEYS.daily(coin.id), { points });
        status.backfilled.push(coin.id);
        backfilledThisRun.push(coin.id);
        status.backfill_failures = 0;
      } catch (err) {
        if (err instanceof UpstreamHttpError && err.status === 403) {
          // Plan does not include historical quotes: build history from snapshots only.
          status.history_mode = "self";
          errors.push("history backfill: not included in plan, switching to self-built history");
        } else {
          status.backfill_failures += 1;
          if (status.backfill_failures >= BACKFILL_MAX_FAILURES) status.history_mode = "self";
          errors.push(`history backfill (${coin.id}): ${message(err)}`);
        }
        break;
      }
    }
  }

  status.last_run_at = nowIso;
  status.credits = creditInfo;
  status.credits_used_last_run = credits;
  status.errors = errors.slice(0, 10);
  await writeJSON(KEYS.status, status);

  return {
    ok: errors.length === 0,
    credits_used: credits,
    tracked: tracked.length,
    hourly: hourlyDue,
    backfilled: backfilledThisRun.length,
    backfill_total: status.backfilled.length,
    history_mode: status.history_mode,
    duration_ms: Date.now() - started,
    errors,
  };
}
