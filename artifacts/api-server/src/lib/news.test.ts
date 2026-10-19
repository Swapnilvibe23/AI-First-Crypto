import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeEntities } from "./news-decode.ts";

describe("news decodeEntities", () => {
  it("decodes double-escaped markup only once", () => {
    assert.equal(decodeEntities("&amp;lt;script&amp;gt;"), "&lt;script&gt;");
  });

  it("decodes a numeric ampersand only once", () => {
    assert.equal(decodeEntities("&#38;amp;"), "&amp;");
    assert.notEqual(decodeEntities("&#38;amp;"), "&");
  });

  it("still decodes ordinary named and numeric entities", () => {
    assert.equal(decodeEntities("A &amp; B &quot;C&quot; &#39;D&#39; &apos;E&apos;"), `A & B "C" 'D' 'E'`);
    assert.equal(decodeEntities("&#60;"), "<");
    assert.equal(decodeEntities("&#x27;"), "'");
    assert.equal(decodeEntities("&#x2F;"), "/");
  });
});
