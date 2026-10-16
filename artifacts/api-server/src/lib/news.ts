/**
 * Crypto news aggregator — fetches RSS from free public feeds, scores sentiment.
 * No API key required. Cache TTL: 5 minutes.
 *
 * Sources (all verified working, no auth required):
 *   - CoinTelegraph  https://cointelegraph.com/rss
 *   - Decrypt        https://decrypt.co/feed
 *   - Bitcoin Magazine https://bitcoinmagazine.com/feed
 *   - The Block      https://www.theblock.co/rss.xml
 *
 * CybeDefend owasp-2025-a05: headline links and images are http(s) only.
 * CybeDefend owasp-2025-a01: feed hosts are fixed and response size is capped.
 */

import { LIMITS, clampInt, safeHttpUrl } from "./sanitize";
import { fetchAllowlisted } from "./upstream";

export interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  sentiment: "bullish" | "bearish" | "neutral";
  imageUrl: string;
}

const NEWS_CACHE_TTL = 5 * 60_000;
const MAX_FEED_BYTES = 2_000_000;
let cache: { items: NewsItem[]; expiresAt: number } | null = null;

const RSS_FEEDS: { url: string; source: string; hosts: readonly string[] }[] = [
  { url: "https://cointelegraph.com/rss", source: "CoinTelegraph", hosts: ["cointelegraph.com"] },
  { url: "https://decrypt.co/feed", source: "Decrypt", hosts: ["decrypt.co"] },
  { url: "https://bitcoinmagazine.com/feed", source: "Bitcoin Magazine", hosts: ["bitcoinmagazine.com"] },
  { url: "https://www.theblock.co/rss.xml", source: "The Block", hosts: ["www.theblock.co"] },
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
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/g, "'")
    .replace(/&#x2F;/g, "/")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => {
      const point = Number(code);
      if (!Number.isInteger(point) || point < 0 || point > 0x10ffff) return "";
      return String.fromCodePoint(point);
    })
    .replace(/&amp;/g, "&");
}

function extractText(xml: string, tag: string): string {
  // Handle CDATA: <tag><![CDATA[...]]></tag>
  const cdataRe = new RegExp(`<${tag}[^>]*>\\s*<!\\[CDATA\\[([\\s\\S]*?)\\]\\]>\\s*<\\/${tag}>`, "i");
  const cdataMatch = cdataRe.exec(xml);
  if (cdataMatch?.[1]) return decodeEntities(cdataMatch[1].trim());

  // Plain text
  const plainRe = new RegExp(`<${tag}[^>]*>([^<]*)<\\/${tag}>`, "i");
  const plainMatch = plainRe.exec(xml);
  if (plainMatch?.[1]) return decodeEntities(plainMatch[1].trim());

  return "";
}

function extractLink(xml: string): string {
  // <link>...</link> (RSS 2.0)
  const m1 = /<link>([^<]+)<\/link>/i.exec(xml);
  if (m1?.[1]) return m1[1].trim();
  // <link href="..." /> (Atom-style)
  const m2 = /<link[^>]+href=["']([^"']+)["']/i.exec(xml);
  if (m2?.[1]) return m2[1].trim();
  return "";
}

/**
 * Extracts an image URL from a feed item block.
 * Tries (in order):
 *   1. <media:content url="..." medium="image" />
 *   2. <media:thumbnail url="..." />
 *   3. <enclosure url="..." type="image/..." />
 *   4. <image><url>...</url></image>
 *   5. First <img src="..."> found inside <content:encoded>
 */
function extractImage(xml: string): string {
  // media:content
  const mc = /<media:content[^>]+url=["']([^"']+)["'][^>]*(?:medium=["']image["'][^>]*)?\/>/i.exec(xml);
  if (mc?.[1] && isImage(mc[1])) return mc[1];

  // media:thumbnail
  const mt = /<media:thumbnail[^>]+url=["']([^"']+)["']/i.exec(xml);
  if (mt?.[1] && isImage(mt[1])) return mt[1];

  // enclosure
  const enc = /<enclosure[^>]+url=["']([^"']+)["'][^>]+type=["']image\/[^"']*["']/i.exec(xml);
  if (enc?.[1]) return enc[1];

  // image/url tag
  const imgUrl = /<image[^>]*>\s*<url>([^<]+)<\/url>/i.exec(xml);
  if (imgUrl?.[1] && isImage(imgUrl[1])) return imgUrl[1];

  // img src inside content:encoded CDATA
  const imgSrc = /<img[^>]+src=["']([^"']+)["']/i.exec(xml);
  if (imgSrc?.[1] && isImage(imgSrc[1])) return imgSrc[1];

  return "";
}

function isImage(url: string): boolean {
  return /\.(jpg|jpeg|png|webp|gif|svg)(\?|$)/i.test(url) || url.includes("image") || url.includes("img");
}

function plainTitle(value: string): string {
  return value.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 300);
}

function parseItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRe = /<item[\s>]([\s\S]*?)<\/item>/gi;
  let match: RegExpExecArray | null;
  while ((match = itemRe.exec(xml)) !== null) {
    const block = match[1] ?? "";
    const title = plainTitle(extractText(block, "title"));
    const link = safeHttpUrl(extractLink(block));
    const pubDate = extractText(block, "pubDate").slice(0, 80);
    const imageUrl = safeHttpUrl(extractImage(block)) ?? "";
    if (!title || !link) continue;
    items.push({ title, link, pubDate, source, sentiment: scoreSentiment(title), imageUrl });
  }
  return items;
}

async function fetchFeed(url: string, source: string, hosts: readonly string[]): Promise<NewsItem[]> {
  const xml = await fetchAllowlisted(url, hosts, {
    headers: { "User-Agent": "AIFirstCrypto/1.0 RSS Reader", Accept: "application/rss+xml, text/xml, */*" },
    timeoutMs: 8_000,
    maxBytes: MAX_FEED_BYTES,
    // Feeds sometimes redirect onto their own CDN. The first hop is allowlisted;
    // the single redirect must still be public https (no loopback or metadata IPs).
    redirect: "public",
  });
  return parseItems(xml, source);
}

export async function fetchNews(limit = 20): Promise<NewsItem[]> {
  const safeLimit = clampInt(limit, LIMITS.news.min, LIMITS.news.max);
  const now = Date.now();
  if (cache && cache.expiresAt > now) {
    return cache.items.slice(0, safeLimit);
  }

  const results = await Promise.allSettled(
    RSS_FEEDS.map((f) => fetchFeed(f.url, f.source, f.hosts)),
  );

  const allItems: NewsItem[] = [];
  for (const r of results) {
    if (r.status === "fulfilled") allItems.push(...r.value);
  }

  if (allItems.length === 0 && results.every((r) => r.status === "rejected")) {
    throw new Error("All news feeds failed");
  }

  // Sort by date descending (most recent first)
  allItems.sort((a, b) => {
    const da = a.pubDate ? new Date(a.pubDate).getTime() : 0;
    const db = b.pubDate ? new Date(b.pubDate).getTime() : 0;
    return db - da;
  });

  // De-duplicate by title similarity (same headline from multiple feeds)
  const seen = new Set<string>();
  const deduped: NewsItem[] = [];
  for (const item of allItems) {
    const key = item.title.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 60);
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(item);
    }
  }

  cache = { items: deduped, expiresAt: now + NEWS_CACHE_TTL };
  return deduped.slice(0, safeLimit);
}
