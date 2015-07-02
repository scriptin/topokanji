'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  table = require('text-table'),
  cjk = require('./lib/cjk'),
  command = require('./lib/command'),
  deps = require('./lib/deps'),
  kanji = require('./lib/kanji'),
  kanjiFreq = require('./lib/kanji-freq'),
  dag = require('./lib/dag'),
  files = require('./lib/files'),
  format = require('./lib/format'),
  coverage = require('./lib/coverage');

var // directories
  FINAL_LISTS_DIR = './lists/',
  KANJI_DEPS_DIR = './dependencies/',
  DATA_DIR = './data/',
  FREQ_TABLES_DIR = DATA_DIR + 'kanji-frequency/';

var // files
  KANJI_LIST = DATA_DIR + 'kanji.txt',
  KANJIVG_LIST = DATA_DIR + 'kanjivg.txt',
  RADICALS_LIST = DATA_DIR + 'radicals.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt',
  DEPS_PAIRS = KANJI_DEPS_DIR + '1-to-1.txt',
  DEPS_MAP = KANJI_DEPS_DIR + '1-to-N.txt';

command.init();

console.log('Reading kanji lists...');
var kanjiData = kanji.readKanjiData(KANJI_LIST, KANJIVG_LIST, RADICALS_LIST);
console.log(kanjiData.list.length + ' kanji + ' + kanjiData.radicals.length + ' radicals');

console.log('Reading CJK decompositions...');
var decompositions = cjk.readFromFile(CJK_OVERRIDE, cjk.readFromFile(CJK));

console.log('Building list of dependency pairs...');
var dependencies = deps.buildDependencyPairs(kanjiData.list, decompositions);

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

function selectLists(forceAll) {
  if (forceAll || _.isUndefined(command.getFreqTable())) {
    return _.keys(freqDataSets);
  }
  return [ command.getFreqTable() ];
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

if (command.is(command.CMDS.show)) { // displaying list(s)

  var charsPerLine = command.getCharsPerLine();
  selectLists(false).forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Building list: ' + freqTableName + ' ...');
    var freqData = freqDataSets[freqTableName];
    var finalList = buildList(freqData);
    console.log(format.splitInLines(finalList, charsPerLine));
  });

} else if (command.is(command.CMDS.save)) { // overriding final lists

  var depsMap = deps.buildDependencyMap(dependencies);
  var depsPairs = _.chain(depsMap)
    .pairs()
    .map(function (dep) {
      return dep[1].map(function (d) {
        return [dep[0], d];
      });
    })
    .flatten()
    .value();

  console.log('Writing 1-to-1 dependencies into ' + DEPS_PAIRS + ' ...');
  fs.writeFileSync(DEPS_PAIRS, depsPairs.map(function (dep) {
    return dep.join(' ');
  }).join('\n'), files.WRITE_UTF8);

  console.log('Writing 1-to-N dependencies into ' + DEPS_MAP + ' ...');
  fs.writeFileSync(DEPS_MAP, _.pairs(depsMap).map(function (dep) {
    return dep[0] + ' ' + dep[1].join('');
  }).join('\n'), files.WRITE_UTF8);

  selectLists(true).forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Writing list: ' + listFileName + ' ...');
    var finalList = buildList(freqDataSets[freqTableName]);
    fs.writeFileSync(listFileName, format.splitInLines(finalList, 10));
  });

} else if (
  command.is(command.CMDS.suggestAdd) ||
  command.is(command.CMDS.suggestRemove)
) { // suggest kanji to add/remove

  var candidatesCount = command.getNum();
  var meanType = command.getMeanType();
  var removing = command.is(command.CMDS.suggestRemove);
  var listNames = _.without(selectLists(true), 'all'); // 'all' list is generated from others
  var tables = listNames.map(function (freqTableName) {
    return freqDataSets[freqTableName].freqTable;
  });

  var coverageData = coverage.sort(tables, dependencies, meanType, removing); // when removing, sort in ASC order
  var candidates = getCandidates(coverageData, kanjiData, candidatesCount, removing);

  var headRow = _.flatten(['\u3000', listNames, meanType + ' mean', 'part of']);
  console.log('Candidates to ' + (removing ? 'remove' : 'add') +
              ', ordered by ' + meanType + ' mean of coverage, ' +
              (removing ? 'ASC' : 'DESC') + ':');
  console.log(table([headRow].concat(candidates)));

} else if (command.is(command.CMDS.coverage)) {

  var listNames = selectLists(true);
  var tables = listNames.map(function (freqTableName) {
    return freqDataSets[freqTableName].freqTable;
  });
  var coverage = coverage.report(kanjiData.list, listNames, tables).map(function (row) {
    return [row[0], (row[1] * 100).toFixed(4) + '%'];
  });
  console.log(table([['table', 'coverage']].concat(coverage)));

}

console.log('DONE');
