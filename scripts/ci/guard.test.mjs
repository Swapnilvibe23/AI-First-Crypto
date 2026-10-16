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

const HEADERS_NO_SCRIPT_SRC = `/*
  Content-Security-Policy: default-src 'self'; style-src 'self'
`;

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

test("fails when CSP lacks script-src 'self'", () => {
  const dir = fixture(
    layout({
      "artifacts/aifirstcrypto/public/_headers": HEADERS_NO_SCRIPT_SRC,
    }),
  );
  const errors = runGuards(dir);
  assert.ok(errors.some((e) => /script-src 'self'/.test(e)));
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
