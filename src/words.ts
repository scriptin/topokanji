import jmdict from './jmdict/jmdict.js';
import { JMdictWord } from '@scriptin/jmdict-simplified-types';
import { isHan } from '@scriptin/is-han';
import getLemmas from './frequency/lemmas.js';

/**
 * Module-private mutable variable to speed up the processing.
 * Needs to be reassigned every time, see {@link selectWords}
 */
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

function filterWord(word: JMdictWord, lemmas: string[]): JMdictWord {
  // Filter spellings matching the list of lemmas
  const kanji = word.kanji.filter((k) => lemmas.includes(k.text));
  const kanjiTexts = kanji.map((k) => k.text);

  // Then, filter readings which apply to the filtered spellings
  const kana = word.kana.filter(
    (k) =>
      k.appliesToKanji.includes('*') ||
      k.appliesToKanji.some((atk) => kanjiTexts.includes(atk)),
  );
  const kanaTexts = kana.map((k) => k.text);

  // Then, filter senses (translations) which apply to both filtered spellings and readings
  const sense = word.sense.filter((s) => {
    if (s.appliesToKanji.includes('*') && s.appliesToKana.includes('*')) {
      // case 1: universal
      return true;
    }
    if (
      s.appliesToKanji.includes('*') &&
      s.appliesToKana.some((atk) => kanaTexts.includes(atk))
    ) {
      // case 2: applies to any spelling, but only specific readings
      return true;
    }
    if (
      s.appliesToKanji.some((atk) => kanjiTexts.includes(atk)) &&
      s.appliesToKana.includes('*')
    ) {
      // case 3: applies to only specific spellings, but any reading
      // (unlikely to happen, but we need to make sure)
      return true;
    }
    // case 4: applies to specific spellings and readings
    return (
      s.appliesToKanji.some((atk) => kanjiTexts.includes(atk)) &&
      s.appliesToKana.some((atk) => kanaTexts.includes(atk))
    );
  });

  return {
    ...word,
    kanji,
    kana,
    sense,
  };
}

function getFilteredWords(nTopLemmas: number): JMdictWord[] {
  const lemmas = getLemmas(nTopLemmas);
  return jmdict.words
    .filter((w) => w.kanji.some((kanji) => lemmas.includes(kanji.text)))
    .map((word) => filterWord(word, lemmas));
}

export function selectWords(
  kanjiList: string[],
  nTopLemmas: number,
): JMdictWord[] {
  const kanjiListCopy = [...kanjiList];
  // reassigning is required if we want to run this function multiple times
  jmdictWords = getFilteredWords(nTopLemmas);
  return selectWordsRecursive(kanjiListCopy, [], []);
}
