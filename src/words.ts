import jmdict from './jmdict/jmdict.js';
import { JMdictWord } from '@scriptin/jmdict-simplified-types';
import { isHan } from '@scriptin/is-han';

let jmdictWords: JMdictWord[] = [];

function getWords(seenKanjiList: string[]): JMdictWord[] {
  const latestKanji = seenKanjiList[0];
  if (!latestKanji) throw new Error('seenKanjiList must be non-empty');
  const candidateWords = jmdictWords.filter((w) => {
    return !!w.kanji.find(
      (kanji) => kanji.common && Array.from(kanji.text).includes(latestKanji),
    );
  });
  const bestCandidates = candidateWords.filter((w) => {
    const commonKanji = w.kanji.filter((kanji) => kanji.common);
    return !!commonKanji.find((kanji) =>
      Array.from(kanji.text)
        .filter(isHan)
        .every((k) => seenKanjiList.includes(k)),
    );
  });
  if (bestCandidates.length) {
    const bestCandidateIds = bestCandidates.map((w) => w.id);
    jmdictWords = jmdictWords.filter((w) => !bestCandidateIds.includes(w.id));
    return bestCandidates;
  }
  return [];
}

/**
 * Mutates all arguments
 */
function selectWordsRecursive(
  kanjiList: string[],
  seenKanjiList: string[],
  selectedWords: JMdictWord[],
): JMdictWord[] {
  const nextKanji = kanjiList.shift();
  if (!nextKanji) return selectedWords;
  seenKanjiList.unshift(nextKanji);

  const nextSelectedWords = getWords(seenKanjiList);
  if (nextSelectedWords.length) {
    selectedWords.push(...nextSelectedWords);
  }

  return selectWordsRecursive(kanjiList, seenKanjiList, selectedWords);
}

export function selectWords(kanjiList: string[]): JMdictWord[] {
  const kanjiListCopy = [...kanjiList];
  jmdictWords = [...jmdict.words];
  return selectWordsRecursive(kanjiListCopy, [], []);
}
