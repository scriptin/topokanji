import kanjiList from './kanjiList.js';
import kradfile from './kradfile/kradfile.js';
import { Edge, Node } from './graphTypes.js';

export const emptyNode: Node = '0';

const kanji = Object.keys(kradfile.kanji).filter((k) => kanjiList.includes(k));

const kradfileExclude: Edge[] = [
  ['口', '囗'], // circular dependency
  ['毋', '母'], // circular dependency
  ['刂', '刈'], // dependency is more complex
  ['鉢', '木'], // should be 本
  ['氵', '汁'], // dependency is more complex
];

const kradfileEdges: Edge[] = kanji
  .reduce((acc: [string, string][], k) => {
    const decomposition = kradfile.kanji[k];
    if (!decomposition) return acc;
    for (const component of decomposition) {
      acc.push([k, component]);
    }
    return acc;
  }, [])
  .filter((e) => e[0] !== e[1]) // exclude self-references
  .filter(
    // exclude dependencies which create loops or don't make sense
    (e) =>
      !kradfileExclude.find(
        (exclusion) => exclusion[0] === e[0] && exclusion[1] === e[1],
      ),
  );

const additionalEdges: Edge[] = [
  // 1-stroke characters
  ['一', emptyNode],
  ['｜', emptyNode], // not a Han character, but useful
  ['ノ', emptyNode],
  ['丶', emptyNode],
  ['亅', emptyNode],

  // fixes for kradfile
  ['鉢', '本'],

  // opinionated additions to push simpler kanji closer to the beginning
  ['亠', '一'],
  ['亠', '丶'],
  ['子', '亅'],
  ['山', '凵'],
  ['目', '日'],
  ['白', '日'],
  ['月', '日'],
  ['日', '口'],
  ['亻', '｜'],
  ['彳', '亻'],
  ['何', '亻'],
  ['化', '亻'],
  ['米', '丶'],
  ['門', '冂'],
  ['氵', '冫'],
  ['汁', '氵'],
  ['汁', '十'],
  ['刈', '刂'],
  ['火', '人'],
  ['迎', '卬'],
];

const combinedEdges = [...additionalEdges, ...kradfileEdges];

const toEmptyNode: Edge[] = kanji
  .filter((k) => !combinedEdges.find(([start]) => start === k))
  .map((k) => [k, emptyNode]);

export default [...toEmptyNode, ...combinedEdges];
