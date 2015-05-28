/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  argv = require('minimist')(process.argv.slice(2)),
  cjk = require('./lib/cjk'),
  deps = require('./lib/deps'),
  kanji = require('./lib/kanji'),
  dag = require('./lib/dag'),
  format = require('./lib/format');

var // directories
  FINAL_LISTS_DIR = './lists/',
  DATA_DIR = './data/',
  FREQ_TABLES_DIR = DATA_DIR + 'kanji-frequency/',
  KANJIVG_SVG_DIR = './kanjivg/kanji/';

var // files
  KANJI_LIST = DATA_DIR + 'kanji.txt',
  KANJIVG_LIST = DATA_DIR + 'kanjivg.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt';

var ARGS = {
  charsPerLine: 'chars-per-line',
  useFreqTable: 'use-freq-table',
  overrideFinalLists: 'override-final-lists'
};

console.log('Reading kanji lists...');
var kanjiData = kanji.readKanjiData(KANJI_LIST, KANJIVG_LIST);

console.log('Reading CJK decompositions...');
var decompositions = cjk.readFromFile(CJK_OVERRIDE, cjk.readFromFile(CJK));

console.log('Building list of dependencies...');
var dependencies = deps.buildDependencies(kanjiData.list, decompositions);

var maxStrokeCount = _.max(kanjiData.strokeCount);

function buildWeightFinction(freqData) {
  var maxFreq = freqData.freqTable[1][2]; // 1st row is all kanji, 2nd is the most used one
  return function (char) {
    var
      f = 1.0 - (freqData.frequency[char] || 0.0) / maxFreq,
      s = kanjiData.strokeCount[char] / maxStrokeCount;
    return s * f;
  }
}

function buildList(freqTableName) {
  var freqTableFileName = FREQ_TABLES_DIR + freqTableName + '.json';
  console.log('Reading kanji usage frequency data from ' + freqTableFileName + ' ...');
  var freqData = kanji.readFreqData(freqTableFileName);
  var weightFuntion = buildWeightFinction(freqData);

  return _.without(
    dag.toposort(dependencies, weightFuntion),
    cjk.EMPTY_CHAR
  ).reverse();
}

if (argv[ARGS.overrideFinalLists]) {

  fs.readdirSync(FREQ_TABLES_DIR).forEach(function (fileName) {
    var freqTableName = fileName.replace('.json', '');
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Building final list: ' + listFileName + ' ...');
    var finalList = buildList(freqTableName);
    fs.writeFileSync(listFileName, format.splitInLines(finalList, 10));
  });

} else { // not building yet
  
  var freqTableName = argv[ARGS.useFreqTable] || 'aozora';
  var charsPerLine = argv[ARGS.charsPerLine] || 50;
  var finalList = buildList(freqTableName);

  console.log('RESULT:');
  console.log(format.splitInLines(finalList, charsPerLine));
  console.log('(' + finalList.length + ' characters)');

}

console.log('DONE');
