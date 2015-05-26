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
  KANJI_FREQUENCY_TABLE = DATA_DIR + 'kanji-frequency-wikipedia.json',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt';

var EMPTY_CHAR = '0';

var ARGS = {
  charsPerLine: 'chars-per-line'
};

console.log('Reading KanjiVG data...');
var kanjiVgChars = kanji.readKanjiVGList(KANJIVG_SVG_DIR);

console.log('Reading kanji lists...');
var kanjiData = kanji.readFromFile(KANJI_LIST, KANJI_FREQUENCY_TABLE, kanjiVgChars);

console.log('Reading CJK decompositions...');
var decompositions = cjk.readFromFile(CJK_OVERRIDE, cjk.readFromFile(CJK));

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
var dependencies = _.chain(kanjiData.list)
  .map(function (char) {
    return decomposeFlat(char, decompositions, kanjiData.list).map(function (part) {
      return [char, part];
    });
  })
  .flatten()
  .value();

console.log('Looking for missing/broken dependencies...');
var missing = dependencies.filter(function (dep) {
  return !(dep[1] === EMPTY_CHAR || _.contains(kanjiData.list, dep[1]));
});

if (missing.length > 0) {
  console.log('MISSING DEPENDENCIES:');
  missing.forEach(function (dep) {
    console.log(dep.join(' -> '));
  });
  throw new Error('Fix mising dependencies and retry');
}

var maxFreq = kanjiData.freqTable[1][2]; // 1st row is all kanji, 2nd is the most used one
var maxStrokeCount = _.max(kanjiData.strokeCount);
function weight(char) {
  var
    f = 1.0 - (kanjiData.frequency[char] || 0.0) / maxFreq,
    s = kanjiData.strokeCount[char] / maxStrokeCount;
  return s * f;
}

console.log('Sorting...');
var sorted = _.without(dag.toposort(dependencies, weight), EMPTY_CHAR).reverse();

console.log(sorted.length + ' characters in the final list');

var charsPerLine = argv[ARGS.charsPerLine] || 50;

function splitInLines(chars, charsPerLine) {
  return _.chunk(chars, charsPerLine)
    .map(function (row) {
      return row.join('');
    }).join('\n');
}

console.log('RESULT:');
console.log(splitInLines(sorted, charsPerLine));

console.log('DONE');
