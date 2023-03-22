import _ from 'lodash';
import kanjivgKanji from './kanjivg/kranjivgKanji.js';
import kanjidic from './kanjidic/kanjidic.js';
import kradfile from './kradfile/kradfile.js';

const kanjidicKanji = kanjidic.characters.map((c) => c.literal);
const kradfileKanji = Object.keys(kradfile.kanji);

export default _.intersection(kanjivgKanji, kanjidicKanji, kradfileKanji);
