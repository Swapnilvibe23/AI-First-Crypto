#!/usr/bin/env node
/**
 * CI guard: Netlify CSP must include script-src 'self', and exchange <a>
 * tags in artifacts/aifirstcrypto/src must use official domains plus
 * rel="noopener noreferrer".
 *
 * TODO(#28): require rel=sponsored once affiliate tracking links exist.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const SKIP_DIRS = new Set(["node_modules", ".git", "dist", "coverage", ".local", ".cache"]);

export const EXCHANGE_DOMAINS = {
  coinbase: ["coinbase.com"],
  binance: ["binance.com", "binance.us"],
  kraken: ["kraken.com"],
  gemini: ["gemini.com"],
  bybit: ["bybit.com"],
  okx: ["okx.com"],
};

const EXCHANGE_KEYS = Object.keys(EXCHANGE_DOMAINS);
const SRC_EXT = new Set([".js", ".jsx", ".ts", ".tsx", ".html"]);

function walk(dir) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP_DIRS.has(ent.name)) continue;
    const full = path.join(dir, ent.name);
    if (ent.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export function matchExchangeKey(text) {
  const t = String(text);
  for (const key of EXCHANGE_KEYS) {
    if (new RegExp(`\\b${key}\\b`, "i").test(t)) return key;
  }
  return null;
}

export function hostnameOf(href) {
  try {
    const url = new URL(href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return null;
    return url.hostname.toLowerCase();
  } catch {
    return null;
  }
}

export function isOfficialHost(exchange, host) {
  if (!exchange || !host) return false;
  return EXCHANGE_DOMAINS[exchange].some((domain) => host === domain || host.endsWith(`.${domain}`));
}

export function exchangeFromHost(host) {
  if (!host) return null;
  for (const [key, domains] of Object.entries(EXCHANGE_DOMAINS)) {
    if (domains.some((domain) => host === domain || host.endsWith(`.${domain}`))) return key;
  }
  const labels = host.split(".");
  for (const key of EXCHANGE_KEYS) {
    if (labels.some((label) => label === key || label.startsWith(`${key}-`))) return key;
  }
  return null;
}

export function relHasNoopenerNoreferrer(rel) {
  const tokens = new Set(
    String(rel ?? "")
      .toLowerCase()
      .split(/[\s]+/)
      .filter(Boolean),
  );
  return tokens.has("noopener") && tokens.has("noreferrer");
}

function parseAttrs(attrStr) {
  const attrs = {};
  const re = /([:@A-Za-z_][\w:.-]*)\s*=\s*(?:"([^"]*)"|'([^']*)'|\{([^}]*)\})/g;
  let match;
  while ((match = re.exec(attrStr))) {
    attrs[match[1]] = {
      quoted: match[2] ?? match[3] ?? null,
      expr: match[4] ?? null,
    };
  }
  return attrs;
}

function findAnchors(source) {
  const anchors = [];
  const re = /<a\b([^>]*)>([\s\S]*?)<\/a>/gi;
  let match;
  while ((match = re.exec(source))) {
    anchors.push({
      attrs: parseAttrs(match[1]),
      inner: match[2].replace(/<[^>]+>/g, " "),
    });
  }
  return anchors;
}

function collectNamedHrefs(source) {
  const results = [];
  // Flat object literals ({ ... }) that mention both name and href.
  const blockRe = /\{[^{}]*\}/g;
  let match;
  while ((match = blockRe.exec(source))) {
    const block = match[0];
    const nameMatch = block.match(/\bname\s*:\s*['"]([^'"]+)['"]/);
    const hrefMatch = block.match(/\bhref\s*:\s*['"]([^'"]+)['"]/);
    if (!nameMatch || !hrefMatch) continue;
    const exchange = matchExchangeKey(nameMatch[1]);
    if (exchange) results.push({ exchange, href: hrefMatch[1] });
  }
  return results;
}

function collectHrefStrings(source) {
  const out = [];
  const re = /\bhref\s*[:=]\s*(?:\{\s*)?['"](https?:[^'"]+)['"]/g;
  let match;
  while ((match = re.exec(source))) out.push(match[1]);
  return out;
}

function innerText(inner) {
  return String(inner ?? "")
    .replace(/\{[^}]*\}/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function checkExchangeLink({ file, href, rel, exchange, errors }) {
  let host;
  try {
    host = hostnameOf(href);
  } catch {
    host = null;
  }
  if (!host) {
    errors.push(`${file}: exchange <a> for ${exchange} has a non-http(s) or invalid href: ${href}`);
    return;
  }
  if (!isOfficialHost(exchange, host)) {
    const allowed = EXCHANGE_DOMAINS[exchange].join(", ");
    errors.push(
      `${file}: exchange <a> for ${exchange} points at ${host} (${href}); official domains are ${allowed} and their subdomains`,
    );
  }
  if (!relHasNoopenerNoreferrer(rel)) {
    errors.push(
      `${file}: exchange <a> for ${exchange} (${href}) must include rel="noopener noreferrer"`,
    );
  }
}

function lintSourceFile(file, source, errors) {
  const anchors = findAnchors(source);
  const namedHrefs = collectNamedHrefs(source);

  for (const anchor of anchors) {
    const hrefQuoted = anchor.attrs.href?.quoted;
    const hrefExpr = anchor.attrs.href?.expr;
    const rel = anchor.attrs.rel?.quoted ?? anchor.attrs.rel?.expr ?? "";
    const inner = innerText(anchor.inner);

    if (hrefQuoted && /^https?:\/\//i.test(hrefQuoted)) {
      const host = hostnameOf(hrefQuoted);
      const exchange = exchangeFromHost(host) || matchExchangeKey(inner);
      if (exchange) {
        checkExchangeLink({ file, href: hrefQuoted, rel, exchange, errors });
      }
    }

    if (hrefExpr) {
      const fromObjects = namedHrefs.length
        ? namedHrefs
        : collectHrefStrings(source)
            .map((href) => {
              const host = hostnameOf(href);
              const exchange = exchangeFromHost(host);
              return exchange ? { exchange, href } : null;
            })
            .filter(Boolean);
      for (const item of fromObjects) {
        checkExchangeLink({ file, href: item.href, rel, exchange: item.exchange, errors });
      }
    }
  }
}

function assertHeadersCsp(root, errors) {
  const headersFiles = walk(root).filter((file) => path.basename(file) === "_headers");
  if (headersFiles.length === 0) {
    errors.push("No Netlify _headers file found in the repository");
    return;
  }
  for (const file of headersFiles) {
    const content = fs.readFileSync(file, "utf8");
    const rel = path.relative(root, file);
    const cspLines = content.split(/\r?\n/).filter((line) => /^\s*Content-Security-Policy:/i.test(line));
    if (cspLines.length === 0) {
      errors.push(`${rel}: missing Content-Security-Policy header`);
      continue;
    }
    for (const line of cspLines) {
      if (!line.includes("script-src 'self'")) {
        errors.push(`${rel}: CSP lacks script-src 'self'`);
      }
    }
  }
}

export function runGuards(root) {
  const errors = [];
  assertHeadersCsp(root, errors);

  const srcRoot = path.join(root, "artifacts", "aifirstcrypto", "src");
  if (!fs.existsSync(srcRoot)) {
    errors.push(`Missing exchange source tree: ${path.relative(root, srcRoot) || srcRoot}`);
    return errors;
  }

  for (const file of walk(srcRoot)) {
    if (!SRC_EXT.has(path.extname(file))) continue;
    const source = fs.readFileSync(file, "utf8");
    lintSourceFile(path.relative(root, file), source, errors);
  }

  return [...new Set(errors)];
}

export function main(root = process.cwd()) {
  const errors = runGuards(root);
  if (errors.length > 0) {
    console.error("guard failed:\n");
    for (const err of errors) console.error(`- ${err}`);
    process.exitCode = 1;
    return;
  }
  console.log("guard: ok");
}

const invoked = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (invoked) {
  main();
}
