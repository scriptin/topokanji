import { readFileSync } from 'fs';
import { resolve } from 'path';
import { isHan } from '@scriptin/is-han';
import type { Kanjidic2, Kradfile } from '@scriptin/jmdict-simplified-types';
import _ from 'lodash';
import dirname from './dirname.js';

const __dirname = dirname(import.meta.url);

export function getKanjiList(): string[] {
  const kanjivg = readFileSync(resolve(__dirname, 'kanjivg', 'list.txt'), {
    encoding: 'utf-8',
  })
    .split('\n')
    .filter((l) => !l.startsWith('#'))
    .join('\n');
  const kanjivgKanji = Array.from(kanjivg).filter(isHan);

  const kanjidic = JSON.parse(
    readFileSync(resolve(__dirname, 'kanjidic', 'kanjidic2-en-3.5.0.json'), {
      encoding: 'utf-8',
    }),
  ) as Kanjidic2;
  const kanjidicKanji = kanjidic.characters.map((c) => c.literal);

  const kradfile = JSON.parse(
    readFileSync(resolve(__dirname, 'kradfile', 'kradfile-3.5.0.json'), {
      encoding: 'utf-8',
    }),
  ) as Kradfile;
  const kradfileKanji = Object.keys(kradfile.kanji);

  return _.intersection(kanjivgKanji, kanjidicKanji, kradfileKanji);
}
