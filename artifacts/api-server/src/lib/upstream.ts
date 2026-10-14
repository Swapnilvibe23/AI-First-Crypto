/**
 * Fetch helper for fixed upstream APIs.
 * CybeDefend owasp-2025-a01 / owasp-2025-a06: https only, host allowlist,
 * no credentialed URLs, one checked redirect, timeout, and a byte cap
 * enforced while the body streams. Unread 3xx and error bodies are cancelled.
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
    await response.body?.cancel();
    if (!location) throw new UpstreamHttpError(response.status, url.hostname);
    url = nextHttpsUrl(url, location, allowed, redirectPolicy);
    response = await fetch(url, {
      headers: options.headers,
      redirect: "error",
      signal: AbortSignal.timeout(timeoutMs),
    });
  }

  if (!response.ok) {
    await response.body?.cancel();
    throw new UpstreamHttpError(response.status, url.hostname);
  }

  return readCappedBody(response, maxBytes, url.hostname);
}

/** Read a response as UTF-8, stopping once the received bytes pass maxBytes. */
export async function readCappedBody(
  response: Response,
  maxBytes: number,
  hostname: string,
): Promise<string> {
  const declared = Number(response.headers.get("content-length"));
  if (Number.isFinite(declared) && declared > maxBytes) {
    await response.body?.cancel();
    throw new Error(`Upstream ${hostname} response exceeded size limit`);
  }

  const body = response.body;
  if (!body) return "";

  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let received = 0;
  try {
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      if (!value) continue;
      received += value.byteLength;
      if (received > maxBytes) {
        throw new Error(`Upstream ${hostname} response exceeded size limit`);
      }
      chunks.push(value);
    }
  } catch (error) {
    await reader.cancel().catch(() => undefined);
    throw error;
  }

  return Buffer.concat(chunks).toString("utf8");
}
