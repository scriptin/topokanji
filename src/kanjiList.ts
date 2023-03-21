import _ from 'lodash';
import kanjivgKanji from './kanjivg/kranjivgKanji.js';
import kanjidic from './kanjidic/kanjidic.js';
import kradfile from './kradfile/kradfile.js';

export function getKanjiList(): string[] {
  const kanjidicKanji = kanjidic.characters.map((c) => c.literal);
  const kradfileKanji = Object.keys(kradfile.kanji);
  return _.intersection(kanjivgKanji, kanjidicKanji, kradfileKanji);
}
