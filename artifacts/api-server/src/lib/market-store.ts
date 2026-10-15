/**
 * Netlify Blobs storage for market data.
 *
 * The scheduled ingest function writes here; the API routes only read.
 */

import { getStore } from "@netlify/blobs";
import type { CoinRecord, CreditInfo, GlobalRecord } from "./market-data";

export type HistoryPoint = [timestamp: number, price: number];

export interface CoinsSnapshot {
  updated_at: string;
  coins: CoinRecord[];
}

export interface GlobalSnapshot {
  updated_at: string;
  data: GlobalRecord;
}

export interface SparklineSnapshot {
  updated_at: string;
  prices: Record<string, number[]>;
}

export interface InfoSnapshot {
  updated_at: string;
  descriptions: Record<string, string>;
}

export interface IngestStatus {
  last_run_at: string | null;
  last_global_at: string | null;
  last_hour_key: string | null;
  last_day_key: string | null;
  credits: CreditInfo | null;
  credits_used_last_run: number;
  /** "backfill": daily history comes from CoinMarketCap; "self": built from snapshots only. */
  history_mode: "backfill" | "self";
  backfilled: string[];
  backfill_failures: number;
  errors: string[];
}

export const KEYS = {
  coinsTop: "snapshot/coins-1",
  coinsRest: "snapshot/coins-2",
  global: "snapshot/global",
  sparklines: "snapshot/sparklines",
  info: "meta/info",
  status: "meta/status",
  hourly: (slug: string) => `history/hourly/${slug}`,
  daily: (slug: string) => `history/daily/${slug}`,
} as const;

export const HOURLY_RETENTION_MS = 30 * 86_400_000;
export const DAILY_RETENTION_MS = 400 * 86_400_000;

function store() {
  return getStore("market");
}

export async function readJSON<T>(key: string): Promise<T | null> {
  return ((await store().get(key, { type: "json" })) as T | null) ?? null;
}

export async function writeJSON(key: string, value: unknown): Promise<void> {
  await store().setJSON(key, value);
}

export async function readHistory(key: string): Promise<HistoryPoint[]> {
  const data = await readJSON<{ points?: unknown }>(key);
  if (!Array.isArray(data?.points)) return [];
  return data.points.filter(
    (p): p is HistoryPoint =>
      Array.isArray(p) && typeof p[0] === "number" && typeof p[1] === "number",
  );
}

/**
 * Merge points into one per bucket (hour or UTC day), newest value wins,
 * then drop anything older than the retention window.
 */
export function mergeHistory(
  existing: HistoryPoint[],
  incoming: HistoryPoint[],
  bucketMs: number,
  retentionMs: number,
  now = Date.now(),
): HistoryPoint[] {
  const byBucket = new Map<number, HistoryPoint>();
  for (const point of [...existing, ...incoming]) {
    byBucket.set(Math.floor(point[0] / bucketMs), point);
  }
  const cutoff = now - retentionMs;
  return [...byBucket.values()]
    .filter(([ts]) => ts >= cutoff)
    .sort((a, b) => a[0] - b[0]);
}

/** Top 100 (refreshed every 15 min) merged with ranks 101–200 (hourly). */
export async function readTrackedCoins(): Promise<{ coins: CoinRecord[]; updated_at: string | null }> {
  const [top, rest] = await Promise.all([
    readJSON<CoinsSnapshot>(KEYS.coinsTop),
    readJSON<CoinsSnapshot>(KEYS.coinsRest),
  ]);
  const seen = new Set<string>();
  const coins: CoinRecord[] = [];
  for (const coin of [...(top?.coins ?? []), ...(rest?.coins ?? [])]) {
    if (seen.has(coin.id)) continue;
    seen.add(coin.id);
    coins.push(coin);
  }
  coins.sort((a, b) => a.market_cap_rank - b.market_cap_rank);
  return { coins, updated_at: top?.updated_at ?? rest?.updated_at ?? null };
}
