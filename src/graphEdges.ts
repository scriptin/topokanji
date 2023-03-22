import kanjiList from './kanjiList.js';
import kradfile from './kradfile/kradfile.js';
import { Edge, Node } from './graphTypes.js';

export const emptyNode: Node = '';

const kanji = Object.keys(kradfile.kanji).filter((k) => kanjiList.includes(k));

const kradfileExclude: Edge[] = [
  ['口', '囗'], // circular dependency
  ['毋', '母'], // circular dependency
  ['刂', '刈'], // circular dependency
  ['鉢', '木'], // should be 本
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
  ['一', emptyNode],
  ['｜', emptyNode],
  ['ノ', emptyNode],
  ['丶', emptyNode],
  ['亅', emptyNode],

  ['人', 'ノ'],
  ['入', 'ノ'],
  ['八', 'ノ'],
  ['儿', 'ノ'],

  ['山', '｜'],
  ['山', '凵'],

  ['火', '丶'],
  ['火', '人'],

  ['乙', '一'],

  ['勹', 'ノ'],
  ['勹', '一'],
  ['勹', '亅'],

  ['卜', '｜'],
  ['卜', '丶'],

  ['二', '一'],

  ['口', '一'],
  ['口', '｜'],
  ['日', '口'],
  ['目', '日'],
  ['白', '日'],
  ['白', '丶'],
  ['臼', '日'],
  ['甘', '日'],
  ['月', '日'],

  ['工', '一'],
  ['工', '｜'],
  ['王', '工'],

  ['牙', '一'],
  ['牙', 'ノ'],

  ['牛', 'ノ'],
  ['牛', '一'],
  ['牛', '｜'],

  ['斤', 'ノ'],
  ['斤', '一'],
  ['斤', '｜'],

  ['九', '儿'],

  ['刈', 'ノ'],
  ['刈', '刂'],

  ['弓', '一'],
  ['弓', '亅'],

  ['已', '一'],

  ['廴', '一'],
  ['廴', 'ノ'],

  ['廾', 'ノ'],
  ['廾', '｜'],
  ['廾', '一'],

  ['片', 'ノ'],
  ['片', '｜'],
  ['片', '一'],

  ['方', '亠'],
  ['方', '勹'],

  ['烏', '口'],
  ['烏', '丶'],
  ['烏', '一'],
  ['烏', '弓'],

  ['雨', '丶'],
  ['雨', '冂'],

  ['言', '亠'],
  ['言', '二'],
  ['言', '口'],

  ['米', '丶'],
  ['米', '木'],

  ['鉢', '本'],
];

export default [...additionalEdges, ...kradfileEdges];
