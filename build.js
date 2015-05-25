/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  argv = require('minimist')(process.argv.slice(2)),
  cjk = require('./lib/cjk'),
  kanji = require('./lib/kanji'),
  dag = require('./lib/dag');

var // directories
  DATA_DIR = './data/',
  KANJIVG_SVG_DIR = './kanjivg/kanji/';

var // files
  KANJI_LIST = DATA_DIR + 'kanji.txt',
  KANJI_FREQUENCY_LIST = DATA_DIR + 'frequency.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt';

console.log('Reading KanjiVG data...');
var kanjiVgChars = kanji.readKanjiVGList(KANJIVG_SVG_DIR);

console.log('Reading kanji lists...');
var kanjiList = kanji.readFromFile(KANJI_LIST, KANJI_FREQUENCY_LIST, kanjiVgChars);

console.log('Reading CJK decompositions...');
var decompositions = cjk.readFromFile(CJK_OVERRIDE, cjk.readFromFile(CJK));

var EMPTY_CHAR = '0';

function decompose(char, decompositions, terminalChars) {
  if (_.isUndefined(decompositions[char]) || _.isEmpty(decompositions[char])) {
    return char;
  }
  return decompositions[char].map(function (c) {
    if (_.contains(terminalChars, c) || (c === EMPTY_CHAR)) {
      return c;
    }
    return decompose(c, decompositions, terminalChars);
  });
}

var decomposeFlat = _.flow(decompose, _.flattenDeep, _.uniq);

console.log('Building list of dependencies...');
var dependencies = _.chain(kanjiList.list)
  .map(function (char) {
    return decomposeFlat(char, decompositions, kanjiList.list).map(function (part) {
      return [char, part];
    });
  })
  .flatten()
  .value();

console.log('Looking for missing/broken dependencies...');
var missing = dependencies.filter(function (dep) {
  return !(dep[1] === EMPTY_CHAR || _.contains(kanjiList.list, dep[1]));
});

if (missing.length > 0) {
  console.log('MISSING DEPENDENCIES:');
  missing.forEach(function (dep) {
    console.log(dep.join(' -> '));
  });
  throw new Error('Fix mising dependencies and retry');
}

var maxFreqIndex = _.max(kanjiList.frequencyIndex) + 1;
var maxStrokeCount = _.max(kanjiList.strokeCount);
function weight(char) {
  var
    f = (kanjiList.frequencyIndex[char] || maxFreqIndex) / maxFreqIndex,
    s = kanjiList.strokeCount[char] / maxStrokeCount;
  return s * f;
}

console.log('Sorting...');
var sorted = dag.toposort(dependencies, weight).reverse();

console.log('RESULT:');
console.log(_.chain(sorted).without('0').chunk(50).map(function (row) {
  return row.join('');
}).value().join('\n'));

console.log('KANJI NOT ON FREQUENCY LIST:');
console.log(_.difference(
  kanjiList.list,
  Object.keys(kanjiList.frequencyIndex)
).join(''));

console.log('DONE');
