import graphEdges from './graphEdges.js';
import weightFunction from './weightFunction.js';
import toposort from './toposort.js';
import _ from 'lodash';
import { isHan } from '@scriptin/is-han';
import { selectWords } from './words.js';
import jmdict from './jmdict/jmdict.js';

console.log('Sorting kanji...');
const kanjiList = toposort(graphEdges, weightFunction).filter((n) => isHan(n));
kanjiList.reverse();

const kanjiListPretty = _.chunk(kanjiList, 60)
  .slice(0, 10)
  .map((chunk) => chunk.join(''))
  .join('\n');
console.log(kanjiListPretty);

console.log('Selecting words...');
const totalWords = jmdict.words.length;
console.log(`Total words in the dictionary: ${totalWords}`);
const selectedWords = selectWords(kanjiList);
console.log(`Found ${selectedWords.length} words`);
const coveragePct = (selectedWords.length / totalWords) * 100;
console.log(`Coverage = ${coveragePct.toFixed(2)}%`);

const wordsPretty = selectedWords.map((w, idx) => {
  const kanji = w.kanji.filter((k) => k.common).map((k) => k.text);
  const kana = w.kana
    .filter(
      (kana) =>
        kana.appliesToKanji.includes('*') ||
        kana.appliesToKanji.some((atk) => kanji.includes(atk)),
    )
    .map((k) => k.text);
  const trans = w.sense.flatMap((s) => s.gloss.map((g) => g.text));

  return [
    idx.toString().padStart(6, ' '),
    w.id,
    kanji.join(', '),
    kana.join(', '),
    trans.join(', '),
  ].join(' - ');
});

console.log(wordsPretty.slice(0, 50).join('\n'));
console.log('...');
console.log(wordsPretty.slice(-50).join('\n'));
