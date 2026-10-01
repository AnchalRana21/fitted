// Built-in PDF fonts use WinAnsi encoding. Characters outside it render as blanks.
const EXTRA = new Set(Array.from("€‚ƒ„…†‡ˆ‰Š‹ŒŽ‘’“”•–—˜™š›œžŸ"));

function isSupported(char: string): boolean {
  const code = char.codePointAt(0) ?? 0;
  return (
    code === 0x09 ||
    code === 0x0a ||
    (code >= 0x20 && code <= 0x7e) ||
    (code >= 0xa0 && code <= 0xff) ||
    EXTRA.has(char)
  );
}

export function unsupportedPdfChars(text: string): string[] {
  const found: string[] = [];
  for (const char of Array.from(text)) {
    if (!isSupported(char) && !found.includes(char)) found.push(char);
  }
  return found;
}
