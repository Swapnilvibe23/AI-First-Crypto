import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeEntities, htmlToPlainText, isCoinId, safeHttpUrl } from "./sanitize.ts";
import { isBlockedHostname, nextHttpsUrl, readCappedBody } from "./upstream.ts";

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

  it("decodes double-escaped markup only once", () => {
    assert.equal(decodeEntities("&amp;lt;script&amp;gt;"), "&lt;script&gt;");
    assert.equal(htmlToPlainText("&amp;lt;script&amp;gt;"), "&lt;script&gt;");
  });

  it("still decodes ordinary named and numeric entities", () => {
    assert.equal(decodeEntities("A &amp; B &quot;C&quot; &#39;D&#39; &apos;E&apos;"), `A & B "C" 'D' 'E'`);
    assert.equal(htmlToPlainText("A &amp; B &quot;C&quot; &#39;D&#39; &apos;E&apos;"), `A & B "C" 'D' 'E'`);
  });

  it("strips tags that appear only after a single entity decode", () => {
    const text = htmlToPlainText("&lt;script&gt;alert(1)&lt;/script&gt;Hello");
    assert.equal(text.includes("<"), false);
    assert.equal(text.includes("alert"), false);
    assert.match(text, /Hello/);
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
  it("accepts coin slugs and rejects path tricks", () => {
    assert.equal(isCoinId("bitcoin"), true);
    assert.equal(isCoinId("yield-guild-games"), true);
    assert.equal(isCoinId("../bitcoin"), false);
    assert.equal(isCoinId("btc/history"), false);
    assert.equal(isCoinId("Bitcoin"), false);
    assert.equal(isCoinId(""), false);
  });
});

describe("upstream hosts", () => {
  const allowed = new Set(["pro-api.coinmarketcap.com"]);

  it("blocks local and metadata hosts", () => {
    assert.equal(isBlockedHostname("pro-api.coinmarketcap.com"), false);
    assert.equal(isBlockedHostname("localhost"), true);
    assert.equal(isBlockedHostname("127.0.0.1"), true);
    assert.equal(isBlockedHostname("169.254.169.254"), true);
    assert.equal(isBlockedHostname("10.0.0.1"), true);
    assert.equal(isBlockedHostname("metadata.google.internal"), true);
  });

  it("refuses off-allowlist and non-https redirects", () => {
    const current = new URL("https://pro-api.coinmarketcap.com/v1/global-metrics/quotes/latest");
    assert.throws(() => nextHttpsUrl(current, "http://pro-api.coinmarketcap.com/next", allowed, "allowlist"));
    assert.throws(() => nextHttpsUrl(current, "https://evil.example/next", allowed, "allowlist"));
    assert.throws(() => nextHttpsUrl(current, "https://169.254.169.254/", allowed, "public"));
    const same = nextHttpsUrl(current, "/v1/key/info", allowed, "allowlist");
    assert.equal(same.hostname, "pro-api.coinmarketcap.com");
  });
});

describe("readCappedBody", () => {
  it("decodes utf8 under the byte cap", async () => {
    const text = "café";
    const response = new Response(text, {
      headers: { "content-length": String(Buffer.byteLength(text)) },
    });
    assert.equal(await readCappedBody(response, 8, "api.example"), text);
  });

  it("counts bytes, so one multibyte character can exceed a one-byte cap", async () => {
    const response = new Response("é");
    await assert.rejects(
      () => readCappedBody(response, 1, "api.example"),
      /response exceeded size limit/,
    );
  });

  it("rejects a declared content-length above the cap", async () => {
    let pulled = false;
    const stream = new ReadableStream<Uint8Array>({
      pull(controller) {
        pulled = true;
        controller.enqueue(new Uint8Array([1]));
        controller.close();
      },
    });
    const response = new Response(stream, { headers: { "content-length": "5000" } });
    await assert.rejects(
      () => readCappedBody(response, 10, "api.example"),
      /response exceeded size limit/,
    );
    assert.equal(pulled, false);
  });

  it("stops a chunked body once received bytes pass the cap", async () => {
    const chunk = new Uint8Array(100);
    const stream = new ReadableStream<Uint8Array>({
      start(controller) {
        controller.enqueue(chunk);
        controller.enqueue(chunk);
        controller.close();
      },
    });
    const response = new Response(stream);
    await assert.rejects(
      () => readCappedBody(response, 150, "api.example"),
      /response exceeded size limit/,
    );
  });
});
