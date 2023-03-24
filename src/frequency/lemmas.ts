import { readFileSync } from 'fs';
import { join } from 'path';
import dirname from '../dirname.js';
import { isHan } from '@scriptin/is-han';
import isKana from '../kana.js';

const __dirname = dirname(import.meta.url);

const lines = readFileSync(join(__dirname, 'internet-jp.num.txt'), {
  encoding: 'utf-8',
}).split('\n');

export default function getLemmas(n: number): string[] {
  const result = [];
  let count = 0;
  for (const line of lines) {
    if (count === n) break;
    const lemma = line.split(/\s+/g).pop();
    if (!lemma) continue;
    if (Array.from(lemma).every((c) => isHan(c) || isKana(c))) {
      result.push(lemma);
      count++;
    }
  }

  return result;
}
