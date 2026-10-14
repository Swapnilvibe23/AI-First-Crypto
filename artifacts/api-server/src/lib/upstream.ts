/**
 * Fetch helper for fixed upstream APIs.
 * CybeDefend owasp-2025-a01 / owasp-2025-a06: https only, host allowlist,
 * no credentialed URLs, one checked redirect, timeout, and a response cap.
 * Upstream bodies are not copied into errors.
 */

export class UpstreamHttpError extends Error {
  status: number;

  constructor(status: number, hostname: string) {
    super(`Upstream ${hostname} responded ${status}`);
    this.name = "UpstreamHttpError";
    this.status = status;
  }
}

export type RedirectPolicy = "allowlist" | "public";

export function isBlockedHostname(hostname: string): boolean {
  const host = hostname
    .toLowerCase()
    .replace(/\.+$/, "")
    .replace(/^\[|\]$/g, "");
  if (
    !host ||
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal"
  ) {
    return true;
  }
  if (host.includes(":")) return true;
  if (/^\d+$/.test(host)) return true;
  if (/^\d{1,3}(?:\.\d{1,3}){3}$/.test(host)) return true;
  if (!host.includes(".")) return true;
  return false;
}

export function nextHttpsUrl(
  current: URL,
  location: string,
  allowedHosts: ReadonlySet<string>,
  redirectPolicy: RedirectPolicy,
): URL {
  const next = new URL(location, current);
  assertHttps(next, allowedHosts, redirectPolicy);
  return next;
}

function assertHttps(
  url: URL,
  allowedHosts: ReadonlySet<string>,
  policy: RedirectPolicy,
): void {
  if (url.protocol !== "https:") {
    throw new Error("Upstream URL must use https");
  }
  if (url.username || url.password) {
    throw new Error("Upstream URL must not include credentials");
  }
  const host = url.hostname.toLowerCase();
  if (isBlockedHostname(host)) {
    throw new Error("Upstream host is not allowed");
  }
  if (policy === "allowlist" && !allowedHosts.has(host)) {
    throw new Error("Upstream host is not allowlisted");
  }
}

export async function fetchAllowlisted(
  rawUrl: string,
  allowedHosts: readonly string[],
  options: {
    headers?: Record<string, string>;
    timeoutMs?: number;
    maxBytes?: number;
    redirect?: RedirectPolicy;
  } = {},
): Promise<string> {
  const allowed = new Set(allowedHosts.map((host) => host.toLowerCase()));
  const redirectPolicy = options.redirect ?? "allowlist";
  const timeoutMs = options.timeoutMs ?? 8_000;
  const maxBytes = options.maxBytes ?? 2_000_000;

  let url = new URL(rawUrl);
  assertHttps(url, allowed, "allowlist");

  let response = await fetch(url, {
    headers: options.headers,
    redirect: "manual",
    signal: AbortSignal.timeout(timeoutMs),
  });

  if (response.status >= 300 && response.status < 400) {
    const location = response.headers.get("location");
    if (!location) throw new UpstreamHttpError(response.status, url.hostname);
    url = nextHttpsUrl(url, location, allowed, redirectPolicy);
    response = await fetch(url, {
      headers: options.headers,
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  if (!response.ok) throw new UpstreamHttpError(response.status, url.hostname);

  const text = await response.text();
  if (text.length > maxBytes) {
    throw new Error(`Upstream ${url.hostname} response exceeded size limit`);
  }
  return text;
}
