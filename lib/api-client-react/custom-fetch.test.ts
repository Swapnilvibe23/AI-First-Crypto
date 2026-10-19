import assert from "node:assert/strict";
import { afterEach, describe, it } from "node:test";
import { customFetch, setBaseUrl } from "./src/custom-fetch.ts";

describe("setBaseUrl", () => {
  afterEach(() => {
    setBaseUrl(null);
  });

  async function requestedUrl(path: string): Promise<string> {
    const previous = globalThis.fetch;
    let captured = "";
    globalThis.fetch = (async (input: RequestInfo | URL) => {
      captured = String(input);
      return new Response("{}", {
        status: 200,
        headers: { "content-type": "application/json" },
      });
    }) as typeof fetch;
    try {
      await customFetch(path);
      return captured;
    } finally {
      globalThis.fetch = previous;
    }
  }

  it("trims trailing slashes from the base URL", async () => {
    setBaseUrl("https://api.example.com///");
    assert.equal(await requestedUrl("/v1/coins"), "https://api.example.com/v1/coins");

    setBaseUrl("https://api.example.com/");
    assert.equal(await requestedUrl("/health"), "https://api.example.com/health");

    setBaseUrl("https://api.example.com");
    assert.equal(await requestedUrl("/ok"), "https://api.example.com/ok");
  });

  it("trims a 100k-slash suffix", async () => {
    setBaseUrl(`https://api.example.com${"/".repeat(100_000)}`);
    assert.equal(await requestedUrl("/v1/coins"), "https://api.example.com/v1/coins");
  });
});
