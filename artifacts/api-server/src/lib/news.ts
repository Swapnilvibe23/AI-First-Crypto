/**
 * Crypto news aggregator — fetches RSS from free public feeds, scores sentiment.
 * No API key required. Cache TTL: 5 minutes.
 */

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
}

const NEWS_CACHE_TTL = 5 * 60_000;
let cache: { items: NewsItem[]; expiresAt: number } | null = null;

const RSS_FEEDS: { url: string; source: string }[] = [
  { url: "https://www.coindesk.com/arc/outboundfeeds/rss/", source: "CoinDesk" },
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph" },
  { url: "https://decrypt.co/feed", source: "Decrypt" },
];

const BULLISH_WORDS = [
  "surge", "soar", "rally", "gain", "rise", "rises", "rose", "high",
  "record", "bull", "bullish", "above", "break", "breaks", "launch",
  "adopt", "adoption", "approve", "approves", "approved", "partnership",
  "positive", "growth", "all-time", "ath", "milestone", "inflow", "buy",
  "pump", "rebound", "recovery", "upgrade", "listing", "added",
];

const BEARISH_WORDS = [
  "crash", "plunge", "drop", "drops", "fall", "falls", "fell", "decline",
  "bear", "bearish", "below", "ban", "bans", "banned", "hack", "hacked",
  "exploit", "fraud", "scam", "fear", "sec", "lawsuit", "regulation",
  "crackdown", "loss", "losses", "collapse", "sell", "dump", "low",
  "warning", "risk", "delisted", "delist", "fine", "penalty",
];

function scoreSentiment(text: string): "bullish" | "bearish" | "neutral" {
  const lower = text.toLowerCase();
  let bullish = 0;
  let bearish = 0;
  for (const w of BULLISH_WORDS) if (lower.includes(w)) bullish++;
  for (const w of BEARISH_WORDS) if (lower.includes(w)) bearish++;
  if (bullish > bearish) return "bullish";
  if (bearish > bullish) return "bearish";
  return "neutral";
}

function decodeEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCharCode(parseInt(code, 10)));
}

function extractText(xml: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[...]]></tag>
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch) return decodeEntities(cdataMatch[1].trim());

  // Plain text
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");
  const plainMatch = plainRe.exec(xml);
  if (plainMatch) return decodeEntities(plainMatch[1].trim());

  return "";
}

function extractLink(xml: string): string {
  // <link>...</link> (RSS 2.0)
  const m1 = /<link>([^<]+)<\/link>/i.exec(xml);
  if (m1) return m1[1].trim();
  // <link href="..." /> (Atom-style)
  const m2 = /<link[^>]+href=["']([^"']+)["']/i.exec(xml);
  if (m2) return m2[1].trim();
  return "";
}

function parseItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  // Split on <item> tags
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1];
    const title = extractText(block, "title");
    const link = extractLink(block);
    const pubDate = extractText(block, "pubDate");
    if (!title || !link) continue;
    items.push({ title, link, pubDate, source, sentiment: scoreSentiment(title) });
  }
  return items;
}

async function fetchFeed(url: string, source: string): Promise<NewsItem[]> {
  const res = await fetch(url, {
    headers: { "User-Agent": "AIFirstCrypto/1.0 RSS Reader", Accept: "application/rss+xml, text/xml" },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw new Error(`RSS fetch failed: ${res.status}`);
  const xml = await res.text();
  return parseItems(xml, source);
}

export async function fetchNews(limit = 10): Promise<NewsItem[]> {
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.items.slice(0, limit);
  }

  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeed(f.url, f.source))
  );

  const allItems: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  // Sort by date descending (most recent first), fall back to feed order
  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  cache = { items: allItems, expiresAt: now + NEWS_CACHE_TTL };
  return allItems.slice(0, limit);
}
