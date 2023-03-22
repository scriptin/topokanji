import kanjiList from './kanjiList.js';
import kradfile from './kradfile/kradfile.js';

const kanji = Object.keys(kradfile.kanji).filter((k) => kanjiList.includes(k));

export default kanji.reduce((acc: [string, string][], k) => {
  const decomposition = kradfile.kanji[k];
  if (!decomposition) return acc;
  for (const component of decomposition) {
    acc.push([k, component]);
  }
  return acc;
}, []);
