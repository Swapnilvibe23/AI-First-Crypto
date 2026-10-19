const NAMED_ENTITIES: Record<string, string> = {
  "&amp;": "&",
  "&lt;": "<",
  "&gt;": ">",
  "&quot;": '"',
  "&#x27;": "'",
  "&#x2F;": "/",
  "&apos;": "'",
};

export function decodeEntities(text: string): string {
  // One pass: replacements are not re-scanned, so &#38;amp; stays &amp;.
  return text.replace(
    /&(?:amp|lt|gt|quot|apos|#x27|#x2F|#(\d+));/g,
    (match, decimal?: string) => {
      if (decimal !== undefined) {
        const point = Number(decimal);
        if (!Number.isInteger(point) || point < 0 || point > 0x10ffff) return "";
        return String.fromCodePoint(point);
      }
      return NAMED_ENTITIES[match] ?? match;
    },
  );
}
