/**
 * Bounds and encoding for untrusted market-data, RSS, and request data.
 * CybeDefend owasp-2025-a05 / owasp-2025-a06: upstream fields are not HTML
 * or URLs until they pass these checks.
 */

export const COIN_ID_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,98}[a-z0-9])?$/;

export const COIN_ORDERS = [
  "market_cap_desc",
  "market_cap_asc",
  "volume_desc",
  "volume_asc",
] as const;

export type CoinOrder = (typeof COIN_ORDERS)[number];

export const LIMITS = {
  page: { min: 1, max: 100 },
  perPage: { min: 1, max: 250 },
  // Stored daily history covers one year.
  days: { min: 1, max: 365 },
  news: { min: 1, max: 50 },
  fearGreed: { min: 1, max: 365 },
} as const;

const COIN_ORDER_SET = new Set<string>(COIN_ORDERS);

export function isCoinId(id: string): boolean {
  return COIN_ID_PATTERN.test(id);
}

export function isCoinOrder(order: string): order is CoinOrder {
  return COIN_ORDER_SET.has(order);
}

export function clampInt(value: number, min: number, max: number): number {
  if (!Number.isInteger(value)) {
    throw new Error("Expected an integer");
  }
  if (value < min || value > max) {
    throw new Error(`Expected an integer between ${min} and ${max}`);
  }
  return value;
}

/** http(s) only. Rejects javascript:, data:, and credentialed URLs. */
export function safeHttpUrl(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > 2048) return null;
  try {
    const url = new URL(trimmed);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    if (url.username || url.password) return null;
    return url.href;
  } catch {
    return null;
  }
}

export function safeImageUrl(value: unknown, fallback = "/favicon.svg"): string {
  return safeHttpUrl(value) ?? fallback;
}

/**
 * Collapse upstream HTML to plain text. Tag stripping runs again after
 * entity decoding so `&#60;script&#62;` cannot reappear as markup.
 */
export function htmlToPlainText(input: string, maxLength = 500): string {
  let text = input.replace(/\0/g, "");
  for (let pass = 0; pass < 4; pass++) {
    const next = stripTags(text);
    if (next === text) break;
    text = next;
  }
  text = decodeEntities(text);
  text = stripTags(text).replace(/[<>]/g, "");
  text = text.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "");
  text = text
    .replace(/[ \t]+\n/g, "\n")
    .replace(/\n{3,}/g, "\n\n")
    .replace(/[ \t]{2,}/g, " ")
    .trim();
  return text.slice(0, maxLength);
}

function stripTags(value: string): string {
  return value
    .replace(/<(script|style|iframe|object|embed|svg|math)\b[^>]*>[\s\S]*?<\/\1>/gi, " ")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/p>/gi, "\n")
    .replace(/<[^>]*>/g, " ");
}

export function decodeEntities(value: string): string {
  return value
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&#x27;/gi, "'")
    .replace(/&#x2F;/gi, "/")
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_match, code: string) => {
      const point = Number(code);
      if (!Number.isInteger(point) || point < 0 || point > 0x10ffff) return "";
      return String.fromCodePoint(point);
    })
    .replace(/&#x([0-9a-f]+);/gi, (_match, code: string) => {
      const point = Number.parseInt(code, 16);
      if (!Number.isInteger(point) || point < 0 || point > 0x10ffff) return "";
      return String.fromCodePoint(point);
    })
    .replace(/&amp;/g, "&");
}
