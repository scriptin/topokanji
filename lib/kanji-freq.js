'use strict';

var
  _ = require('lodash'),
  fs = require('fs');

function validateRow(row, i) {
  if (!_.isArray(row)) {
    throw new Error('Invalid row: ' + JSON.stringify(row) + ' - not an array');
  }
  if (row.length !== 3 || !_.isString(row[0]) || !_.isNumber(row[2])) {
    throw new Error('Invalid row format: ' + JSON.stringify(row));
  }
  if (i === 0 && row[0] !== 'all') {
    throw new Error('Invalid first row: ' + JSON.stringify(row) + ' - should be "all" row');
  }
}

function readFreqTable(freqTableFileName) {
  var freqTable = JSON.parse(fs.readFileSync(freqTableFileName));
  if (!_.isArray(freqTable)) {
    throw new Error('Invalid kanji frequency table in ' + freqTableFileName);
  }
  freqTable.forEach(function (row, i) {
    validateRow(row, i);
  });
  return freqTable;
}

function buildFreqData(freqTable) {
  var result = {
    freqTable: freqTable,
    frequency: {}
  };
  result.freqTable.forEach(function (row) {
    result.frequency[row[0]] = row[2];
  });
  return result;
}

function maxTotalChars(freqTables) {
  return _.max(freqTables.map(function (freqTable) {
    return freqTable[0][1];
  }));
}

function getScaleFactors(freqTables) {
  var maxTotal = maxTotalChars(freqTables);
  return freqTables.map(function (freqTable) {
    if (freqTable[0][1] === maxTotal) {
      return 1;
    }
    return maxTotal / freqTable[0][1];
  });
}

function mergeFreqTables(freqTables) {
  var freqTablesScaleFactors = getScaleFactors(freqTables);
  var total = maxTotalChars(freqTables) * freqTables.length;
  var charOccurs = { all: total };

  _.each(freqTables, function (freqTable, freqTableIndex) {
    var row, scale = freqTablesScaleFactors[freqTableIndex];
    for (var i = 1; i < freqTable.length; i += 1) {
      row = freqTable[i];
      charOccurs[row[0]] = (charOccurs[row[0]] || 0) + Math.round(scale * row[1]);
    }
  });

  var charsFreqTable = _.chain(Object.keys(charOccurs)).without('all').map(function (char) {
    return [char, charOccurs[char], charOccurs[char] / total];
  }).sortBy(function (row) {
    return 1 / row[1];
  }).value();

  return [['all', total , 1]].concat(charsFreqTable);
}

exports.readFreqTable = readFreqTable;
exports.buildFreqData = buildFreqData;
exports.mergeFreqTables = mergeFreqTables;
