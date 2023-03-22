'use strict';

var _ = require('lodash'),
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
  KANJI_TABLE = DATA_DIR + 'kanji.json',
  KANJIVG_LIST = DATA_DIR + 'kanjivg.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt',
  DEPS_PAIRS_TXT = KANJI_DEPS_DIR + '1-to-1.txt',
  DEPS_PAIRS_JSON = KANJI_DEPS_DIR + '1-to-1.json',
  DEPS_MAP_TXT = KANJI_DEPS_DIR + '1-to-N.txt',
  DEPS_MAP_JSON = KANJI_DEPS_DIR + '1-to-N.json';

command.init();

console.log('Reading kanji table...');
var kanjiData = kanji.readKanjiData(KANJI_TABLE, KANJIVG_LIST);
var kanjiList = _.keys(kanjiData);
console.log(kanjiList.length + ' characters');

console.log('Reading CJK decompositions...');
var decompositions = cjk.readFromFile(CJK_OVERRIDE, cjk.readFromFile(CJK));

console.log('Building list of dependency pairs...');
var dependencies = deps.buildDependencyPairs(kanjiList, decompositions);

function buildWeightFunction(freqData) {
  return function (char) {
    return 1.0 - (freqData.frequency[char] || 0.0);
  };
}

function buildList(freqData) {
  var weightFunction = buildWeightFunction(freqData);
  return _.without(
    dag.toposort(dependencies, weightFunction),
    cjk.EMPTY_CHAR,
  ).reverse();
}

var freqTables = [],
  freqDataSets = {};
fs.readdirSync(FREQ_TABLES_DIR).forEach(function (fileName) {
  var freqTableName = fileName.replace('.json', '');
  var freqTableFileName = FREQ_TABLES_DIR + fileName;
  console.log(
    'Reading kanji usage frequency data from ' + freqTableFileName + ' ...',
  );
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
  return [command.getFreqTable()];
}

if (command.is(command.CMDS.show)) {
  // displaying list(s)

  var charsPerLine = command.getCharsPerLine();
  selectLists(false).forEach(function (freqTableName) {
    var listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Building list: ' + freqTableName + ' ...');
    var freqData = freqDataSets[freqTableName];
    var finalList = buildList(freqData);
    console.log(format.splitInLines(finalList, charsPerLine));
  });
} else if (command.is(command.CMDS.save)) {
  // overriding final lists

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

  console.log('Writing 1-to-1 dependencies into ' + DEPS_PAIRS_JSON + ' ...');
  fs.writeFileSync(
    DEPS_PAIRS_JSON,
    JSON.stringify(depsPairs).replace(/\],/g, '],\n'),
    files.WRITE_UTF8,
  );

  console.log('Writing 1-to-1 dependencies into ' + DEPS_PAIRS_TXT + ' ...');
  fs.writeFileSync(
    DEPS_PAIRS_TXT,
    depsPairs
      .map(function (dep) {
        return dep.join(' ');
      })
      .join('\n'),
    files.WRITE_UTF8,
  );

  console.log('Writing 1-to-N dependencies into ' + DEPS_MAP_JSON + ' ...');
  fs.writeFileSync(
    DEPS_MAP_JSON,
    JSON.stringify(depsMap).replace(/\],/g, '],\n'),
    files.WRITE_UTF8,
  );

  console.log('Writing 1-to-N dependencies into ' + DEPS_MAP_TXT + ' ...');
  fs.writeFileSync(
    DEPS_MAP_TXT,
    _.pairs(depsMap)
      .map(function (dep) {
        return dep[0] + ' ' + dep[1].join('');
      })
      .join('\n'),
    files.WRITE_UTF8,
  );

  selectLists(true).forEach(function (freqTableName) {
    console.log('Building list: ' + freqTableName + ' ...');
    var finalList = buildList(freqDataSets[freqTableName]);

    var listFileName = FINAL_LISTS_DIR + freqTableName + '.json';
    console.log('Writing list: ' + listFileName + ' ...');
    fs.writeFileSync(
      listFileName,
      JSON.stringify(finalList).replace(/",/g, '",\n'),
      files.WRITE_UTF8,
    );

    listFileName = FINAL_LISTS_DIR + freqTableName + '.txt';
    console.log('Writing list: ' + listFileName + ' ...');
    fs.writeFileSync(listFileName, finalList.join('\n'), files.WRITE_UTF8);
  });
} else if (
  command.is(command.CMDS.suggestAdd) ||
  command.is(command.CMDS.suggestRemove)
) {
  // suggest kanji to add/remove

  var candidatesCount = command.getNum();
  var meanType = command.getMeanType();
  var removing = command.is(command.CMDS.suggestRemove);
  var listNames = _.without(selectLists(true), 'all'); // 'all' list is generated from others
  var tables = listNames.map(function (freqTableName) {
    return freqDataSets[freqTableName].freqTable;
  });

  var coverageData = coverage.sort(tables, dependencies, meanType, removing); // when removing, sort in ASC order
  var candidates = coverage.getCandidates(
    coverageData,
    kanjiData,
    candidatesCount,
    removing,
  );

  var headRow = _.flatten(['\u3000', listNames, meanType + ' mean', 'part of']);
  console.log(
    'Candidates to ' +
      (removing ? 'remove' : 'add') +
      ', ordered by ' +
      meanType +
      ' mean of coverage, ' +
      (removing ? 'ASC' : 'DESC') +
      ':',
  );
  console.log(table([headRow].concat(candidates)));
} else if (command.is(command.CMDS.coverage)) {
  var listNames = selectLists(true);
  var tables = listNames.map(function (freqTableName) {
    return freqDataSets[freqTableName].freqTable;
  });
  var coverage = coverage
    .report(kanjiList, listNames, tables)
    .map(function (row) {
      return [row[0], (row[1] * 100).toFixed(4) + '%'];
    });
  console.log(table([['table', 'coverage']].concat(coverage)));
}

console.log('DONE');
