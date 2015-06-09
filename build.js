'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  argv = require('minimist')(process.argv.slice(2)),
  cjk = require('./lib/cjk'),
  deps = require('./lib/deps'),
  kanji = require('./lib/kanji'),
  kanjiFreq = require('./lib/kanji-freq'),
  dag = require('./lib/dag'),
  format = require('./lib/format');

var // directories
  FINAL_LISTS_DIR = './lists/',
  DATA_DIR = './data/',
  FREQ_TABLES_DIR = DATA_DIR + 'kanji-frequency/';

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

function buildWeightFinction(freqData) {
  return function (char) {
    return 1.0 - (freqData.frequency[char] || 0.0);
  };
}

function buildList(freqData) {
  var weightFuntion = buildWeightFinction(freqData);
  return _.without(
    dag.toposort(dependencies, weightFuntion),
    cjk.EMPTY_CHAR
  ).reverse();
}

if (argv[ARGS.overrideFinalLists]) {

  var freqTables = {};
  fs.readdirSync(FREQ_TABLES_DIR).forEach(function (fileName) {
    var freqTableName = fileName.replace('.json', '');
    var freqTableFileName = FREQ_TABLES_DIR + fileName;
    console.log('Reading kanji usage frequency data from ' + freqTableFileName + ' ...');
    freqTables[freqTableName] = kanjiFreq.readFreqData(freqTableFileName);
  });

  Object.keys(freqTables).forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Building final list: ' + listFileName + ' ...');
    var finalList = buildList(freqTables[freqTableName]);
    fs.writeFileSync(listFileName, format.splitInLines(finalList, 10));
  });

} else { // not building yet
  
  var freqTableFileName = FREQ_TABLES_DIR + (argv[ARGS.useFreqTable] || 'aozora') + '.json';
  console.log('Reading kanji usage frequency data from ' + freqTableFileName + ' ...');
  var freqData = kanjiFreq.readFreqData(freqTableFileName);
  var charsPerLine = argv[ARGS.charsPerLine] || 50;
  console.log('Building list...');
  var finalList = buildList(freqData);

  console.log('RESULT:');
  console.log(format.splitInLines(finalList, charsPerLine));
  console.log('(' + finalList.length + ' characters)');

}

console.log('DONE');
