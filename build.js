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
  RADICALS_LIST = DATA_DIR + 'radicals.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt';

var ARGS = {
  charsPerLine: 'chars-per-line',
  useFreqTable: 'use-freq-table',
  overrideFinalLists: 'override-final-lists',
  suggest: 'suggest'
};

console.log('Reading kanji lists...');
var kanjiData = kanji.readKanjiData(KANJI_LIST, KANJIVG_LIST, RADICALS_LIST);
console.log(kanjiData.list.length + ' kanji + ' + kanjiData.radicals.length + ' radicals');

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

var freqTables = [], freqDataSets = {};
fs.readdirSync(FREQ_TABLES_DIR).forEach(function (fileName) {
  var freqTableName = fileName.replace('.json', '');
  var freqTableFileName = FREQ_TABLES_DIR + fileName;
  console.log('Reading kanji usage frequency data from ' + freqTableFileName + ' ...');
  var freqTable = kanjiFreq.readFreqTable(freqTableFileName);
  freqTables.push(freqTable);
  freqDataSets[freqTableName] = kanjiFreq.buildFreqData(freqTable);
});

console.log('Merging kanji usage frequency data...');
var freqTableAll = kanjiFreq.mergeFreqTables(freqTables);
freqTables.push(freqTableAll);
freqDataSets.all = kanjiFreq.buildFreqData(freqTableAll);

function suggestAdd(candidatesCount, freqTableName, freqData, kanjiData) {
  return _.chain(freqData.freqTable)
    .tail()
    .filter(function (row) {
      return !_.contains(kanjiData.list, row[0]);
    })
    .take(candidatesCount)
    .map(function (row) {
      return [row[0], (row[2] * 100).toFixed(8) + ' %'];
    })
    .value();
}

function suggestRemove(candidatesCount, freqTableName, freqData, kanjiData) {
  return _.chain(kanjiData.list)
    .filter(function (char) {
      return !_.contains(kanjiData.radicals, char);
    })
    .map(function (char) {
      return [char, freqData.frequency[char] || 0];
    })
    .sortBy(function (row) {
      return row[1];
    })
    .take(candidatesCount)
    .map(function (row) {
      return [row[0], (row[1] > 0) ? row[1].toFixed(8) + ' %' : 'missing'];
    })
    .value();
}

function selectLists() {
  if (_.isUndefined(argv[ARGS.useFreqTable])) {
    return Object.keys(freqDataSets);
  } else if (_.isString(argv[ARGS.useFreqTable])) {
    return [ argv[ARGS.useFreqTable] ];
  }
  throw new Error('Ingavlid value for argument --' + ARGS.useFreqTable + ': ' + argv[ARGS.useFreqTable]);
}

var unknownArgs = _.without(Object.keys(argv), '_').filter(function (arg) {
  return !_.contains(ARGS, arg);
});
if (unknownArgs.length > 0) {
  throw new Error('Unknown arguments: ' + JSON.stringify(unknownArgs));
}

if (argv[ARGS.overrideFinalLists]) { // overriding final lists

  selectLists().forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Writing list: ' + listFileName + ' ...');
    var finalList = buildList(freqDataSets[freqTableName]);
    fs.writeFileSync(listFileName, format.splitInLines(finalList, 10));
  });

} else if (argv[ARGS.suggest] && _.isNumber(argv[ARGS.suggest])) { // checking (un)common characters

  var candidatesCount = argv[ARGS.suggest];
  selectLists().forEach(function (freqTableName) {
    var freqData = freqDataSets[freqTableName];
    console.log(candidatesCount + ' candidates to be added into kanji list according to "' + freqTableName + '":');
    console.log(suggestAdd(candidatesCount, freqTableName, freqData, kanjiData));
    console.log(candidatesCount + ' candidates to be removed from kanji list according to "' + freqTableName + '":');
    console.log(suggestRemove(candidatesCount, freqTableName, freqData, kanjiData));
  });

} else {

  var charsPerLine = argv[ARGS.charsPerLine] || 50;
  selectLists().forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Building list: ' + freqTableName + ' ...');
    var freqData = freqDataSets[freqTableName];
    var finalList = buildList(freqData);
    console.log(format.splitInLines(finalList, charsPerLine));
  });

}

console.log('DONE');
