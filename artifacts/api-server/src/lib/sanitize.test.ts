import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { htmlToPlainText, isCoinId, safeHttpUrl } from "./sanitize.ts";
import { isBlockedHostname, nextHttpsUrl } from "./upstream.ts";

describe("htmlToPlainText", () => {
  it("drops script contents and tags", () => {
    const text = htmlToPlainText("<p>Hello</p><script>alert(1)</script><b>world</b>");
    assert.equal(text.includes("<"), false);
    assert.equal(text.includes("alert"), false);
    assert.match(text, /Hello/);
    assert.match(text, /world/);
  });

  it("does not resurrect tags from entities", () => {
    const text = htmlToPlainText("&#60;img src=x onerror=alert(1)&#62;");
    assert.equal(text.includes("<"), false);
    assert.equal(text.includes(">"), false);
  });
});

describe("safeHttpUrl", () => {
  it("keeps https urls", () => {
    assert.equal(safeHttpUrl(" https://example.com/a?b=1 "), "https://example.com/a?b=1");
  });

  it("rejects javascript, data, and credentialed urls", () => {
    assert.equal(safeHttpUrl("javascript:alert(1)"), null);
    assert.equal(safeHttpUrl("JaVaScRiPt:alert(1)"), null);
    assert.equal(safeHttpUrl("data:text/html,hi"), null);
    assert.equal(safeHttpUrl("https://user:pass@example.com"), null);
    assert.equal(safeHttpUrl("//example.com"), null);
  });
});

describe("coin ids", () => {
  it("accepts coingecko slugs and rejects path tricks", () => {
    assert.equal(isCoinId("bitcoin"), true);
    assert.equal(isCoinId("yield-guild-games"), true);
    assert.equal(isCoinId("../bitcoin"), false);
    assert.equal(isCoinId("btc/history"), false);
    assert.equal(isCoinId("Bitcoin"), false);
    assert.equal(isCoinId(""), false);
  });
});

describe("upstream hosts", () => {
  const allowed = new Set(["api.coingecko.com"]);

  it("blocks local and metadata hosts", () => {
    assert.equal(isBlockedHostname("api.coingecko.com"), false);
    assert.equal(isBlockedHostname("localhost"), true);
    assert.equal(isBlockedHostname("127.0.0.1"), true);
    assert.equal(isBlockedHostname("169.254.169.254"), true);
    assert.equal(isBlockedHostname("10.0.0.1"), true);
    assert.equal(isBlockedHostname("metadata.google.internal"), true);
  });

  it("refuses off-allowlist and non-https redirects", () => {
    const current = new URL("https://api.coingecko.com/api/v3/global");
    assert.throws(() => nextHttpsUrl(current, "http://api.coingecko.com/next", allowed, "allowlist"));
    assert.throws(() => nextHttpsUrl(current, "https://evil.example/next", allowed, "allowlist"));
    assert.throws(() => nextHttpsUrl(current, "https://169.254.169.254/", allowed, "public"));
    const same = nextHttpsUrl(current, "/api/v3/ping", allowed, "allowlist");
    assert.equal(same.hostname, "api.coingecko.com");
  });
});
