'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  argv = require('minimist')(process.argv.slice(2)),
  table = require('text-table'),
  cjk = require('./lib/cjk'),
  deps = require('./lib/deps'),
  kanji = require('./lib/kanji'),
  kanjiFreq = require('./lib/kanji-freq'),
  dag = require('./lib/dag'),
  format = require('./lib/format'),
  coverage = require('./lib/coverage');

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
  perLine: 'per-line',
  freqTable: 'freq-table',
  save: 'save',
  suggestAdd: 'suggest-add',
  suggestRemove: 'suggest-remove'
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
var freqTableAll = kanjiFreq.mergeFreqTables(freqTables, true);
freqTables.push(freqTableAll);
freqDataSets.all = kanjiFreq.buildFreqData(freqTableAll);

function selectLists() {
  if (_.isUndefined(argv[ARGS.freqTable])) {
    return Object.keys(freqDataSets);
  } else if (_.isString(argv[ARGS.freqTable])) {
    return [ argv[ARGS.freqTable] ];
  }
  throw new Error('Ingavlid value for argument --' + ARGS.freqTable + ': ' + argv[ARGS.freqTable]);
}

function getCandidates(coverageData, kanjiData, candidatesCount, removing) {
  return _.chain(coverageData)
    .filter(function (row) {
      var char = row[0];
      if (char === 'all') {
        return false;
      }
      var inList = _.contains(kanjiData.list, char);
      var isRadical = _.contains(kanjiData.radicals, char);
      if (removing) {
        return inList && !isRadical;
      } else {
        return !inList;
      }
    })
    .take(candidatesCount)
    .value();
}

var unknownArgs = _.without(Object.keys(argv), '_').filter(function (arg) {
  return !_.contains(ARGS, arg);
});
if (unknownArgs.length > 0) {
  throw new Error('Unknown arguments: ' + JSON.stringify(unknownArgs));
}

if (argv[ARGS.save]) { // overriding final lists

  selectLists().forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Writing list: ' + listFileName + ' ...');
    var finalList = buildList(freqDataSets[freqTableName]);
    fs.writeFileSync(listFileName, format.splitInLines(finalList, 10));
  });

} else if (argv[ARGS.suggestAdd] || argv[ARGS.suggestRemove]) { // suggesting kanji to add/remove to/from initial list

  var candidatesCount = _.get(argv, ARGS.suggestAdd, null) || _.get(argv, ARGS.suggestRemove, null);
  if (!_.isNumber(candidatesCount) || candidatesCount < 0 || (candidatesCount % 1 !== 0)) {
    throw new Error('Value of --' + ARGS.suggestAdd + '/--' + ARGS.suggestRemove +
                    ' must be positive integer, ' + candidatesCount + ' given');
  }
  var listNames = _.without(selectLists(), 'all');
  var tables = listNames.map(function (freqTableName) {
    return freqDataSets[freqTableName].freqTable;
  });
  var removing = !!argv[ARGS.suggestRemove]
  var coverageData = coverage.sort(tables, removing); // when removing, sort in ASC order
  var candidates = getCandidates(coverageData, kanjiData, candidatesCount, removing);
  var headRow = ['\u3000'].concat(listNames).concat(['total']);
  console.log('Candidates to ' + (removing ? 'remove' : 'add') +
              ', ordered by total coverage, ' + (removing ? 'ASC' : 'DESC') + ':');
  console.log(table([headRow].concat(candidates)));

} else {

  var charsPerLine = argv[ARGS.perLine] || 50;
  selectLists().forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Building list: ' + freqTableName + ' ...');
    var freqData = freqDataSets[freqTableName];
    var finalList = buildList(freqData);
    console.log(format.splitInLines(finalList, charsPerLine));
  });

}

console.log('DONE');
