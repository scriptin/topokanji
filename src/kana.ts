import type { Range } from '@scriptin/is-han';

const hiraganaRange: Range = [0x3040, 0x309f];
const katakanaRanges: Range[] = [
  [0x30a0, 0x30fa], // excluding center-dot ("nakaguro"), 0x30fb
  [0x30fc, 0x30ff],
];

const kanaRanges: Range[] = [hiraganaRange, ...katakanaRanges];

export default function isKana(char: string): boolean {
  const codePoint = char.codePointAt(0);
  if (codePoint == null) {
    throw new Error(`Expected a character at index 0, got ${codePoint}`);
  }
  for (const range of kanaRanges) {
    if (range.length === 1 && codePoint === range[0]) {
      return true;
    } else if (
      range.length === 2 &&
      codePoint >= range[0] &&
      codePoint <= range[1]
    ) {
      return true;
    }
  }
  return false;
}
