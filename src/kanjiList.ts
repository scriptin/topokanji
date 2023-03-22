import _ from 'lodash';
import kanjivgKanji from './kanjivg/kranjivgKanji.js';
import kanjidic from './kanjidic/kanjidic.js';

const kanjidicKanji = kanjidic.characters.map((c) => c.literal);

export default _.intersection(kanjivgKanji, kanjidicKanji);
