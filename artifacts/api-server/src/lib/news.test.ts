import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { decodeEntities } from "./news.ts";

describe("news decodeEntities", () => {
  it("decodes double-escaped markup only once", () => {
    assert.equal(decodeEntities("&amp;lt;script&amp;gt;"), "&lt;script&gt;");
  });

  it("still decodes ordinary named and numeric entities", () => {
    assert.equal(decodeEntities("A &amp; B &quot;C&quot; &#39;D&#39; &apos;E&apos;"), `A & B "C" 'D' 'E'`);
    assert.equal(decodeEntities("&#60;"), "<");
  });
});
