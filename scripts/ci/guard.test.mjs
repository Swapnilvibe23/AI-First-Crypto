import { test } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { runGuards } from "./guard.mjs";

function fixture(layout) {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "guard-"));
  for (const [rel, content] of Object.entries(layout)) {
    const full = path.join(dir, rel);
    fs.mkdirSync(path.dirname(full), { recursive: true });
    fs.writeFileSync(full, content);
  }
  return dir;
}

const HEADERS_OK = `/*
  Content-Security-Policy: default-src 'self'; script-src 'self'; style-src 'self'
`;

function headersWithCsp(csp) {
  return `/*\n  Content-Security-Policy: ${csp}\n`;
}

function layout(extra) {
  return {
    "artifacts/aifirstcrypto/public/_headers": HEADERS_OK,
    "artifacts/aifirstcrypto/src/.keep": "",
    ...extra,
  };
}

test("fails when no Netlify _headers file exists", () => {
  const dir = fixture({
    "artifacts/aifirstcrypto/src/.keep": "",
  });
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /_headers/i.test(e)));
});

test("fails when CSP lacks 'self' in script-src", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src https://cdn.example; style-src 'self'",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /'self'/i.test(e)));
});

test("falls back to default-src 'self' when script-src is absent", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; style-src 'self'",
      ),
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});

test("fails when script-src is absent and default-src lacks 'self'", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp("style-src 'self'"),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /'self'/i.test(e)));
});

test("fails when script-src contains 'unsafe-inline'", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' 'unsafe-inline'",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /unsafe-inline/i.test(e)));
});

test("fails when script-src contains 'unsafe-eval'", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' 'unsafe-eval'",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /unsafe-eval/i.test(e)));
});

test("fails when script-src contains another 'unsafe-*' keyword", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' 'unsafe-hashes'",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /unsafe-hashes/i.test(e)));
});

test("fails when script-src contains a bare *", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' *",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /\*/.test(e)));
});

test("fails when script-src contains data:", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' data:",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /data:/i.test(e)));
});

test("fails when script-src contains http: scheme", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' http:",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /http:/i.test(e)));
});

test("fails when script-src contains an http:// source", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self' http://cdn.example",
      ),
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /http:\/\//i.test(e)));
});

test("does not flag style-src 'unsafe-inline' or font-src data:", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": headersWithCsp(
        "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; font-src 'self' data:",
      ),
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});

test("passes official exchange <a> with noopener noreferrer", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        export default function Exchanges() {
          return (
            <a href="https://www.binance.com/en/register" target="_blank" rel="noopener noreferrer">
              Binance
            </a>
          );
        }
      `,
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});

test("does not require rel=sponsored", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        <a href="https://coinbase.com/join" rel="noopener noreferrer">Coinbase</a>
      `,
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});

test("fails unofficial host for an exchange <a>", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        <a href="https://coinbase.phishing.example/join" rel="noopener noreferrer">Coinbase</a>
      `,
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /official/i.test(e) && /coinbase/i.test(e)));
});

test("fails exchange <a> missing noopener noreferrer", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        <a href="https://www.kraken.com/sign-up" target="_blank" rel="noopener">Kraken</a>
      `,
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /noopener noreferrer/i.test(e)));
});

test("allows official subdomains and binance.us", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        <a href="https://pro.coinbase.com/" rel="noopener noreferrer">Coinbase</a>
        <a href="https://www.binance.us/register" rel="noopener noreferrer">Binance</a>
        <a href="https://www.okx.com/join/" rel="noopener noreferrer">OKX</a>
      `,
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});

test("pairs each exchange name with its own href, not a sibling object", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        const EXCHANGES = [
          { name: "Coinbase", href: "https://coinbase.com/join" },
          { name: "Binance", href: "https://www.binance.com/en/register" },
          { name: "Kraken", href: "https://www.kraken.com/sign-up" },
        ];
        export default function Page() {
          return EXCHANGES.map((ex) => (
            <a href={ex.href} rel="noopener noreferrer">{ex.name}</a>
          ));
        }
      `,
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});

test("checks href={ex.href} data against official domains and the <a> rel", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/pages/exchanges.tsx": `
        const EXCHANGES = [
          { name: "Gemini", href: "https://evil.example/gemini" },
        ];
        export default function Page() {
          return EXCHANGES.map((ex) => (
            <a href={ex.href} target="_blank" rel="noopener noreferrer">{ex.name}</a>
          ));
        }
      `,
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /gemini/i.test(e) && /official/i.test(e)));
});

test("ignores non-exchange external links", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/src/components/layout.tsx": `
        <a href="https://coinmarketcap.com/" target="_blank" rel="noopener noreferrer">CoinMarketCap</a>
      `,
    }),
  );
  assert.deepEqual(runGuards(dir), []);
});
