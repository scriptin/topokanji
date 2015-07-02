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

function getTotalChars(freqTables, scale) {
  if (scale) {
    return maxTotalChars(freqTables) * freqTables.length;
  }
  return _.sum(freqTables.map(function (freqTable) {
    return freqTable[0][1];
  }));
}

function mergeFreqTables(freqTables, scale) {
  var scaleFactors = getScaleFactors(freqTables);
  var total = getTotalChars(freqTables, scale);
  var charOccurs = {};

  _.each(freqTables, function (freqTable, i) {
    _.tail(freqTable).forEach(function (row) {
      var count = scale ? Math.round(scaleFactors[i] * row[1]) : row[1];
      charOccurs[row[0]] = _.get(charOccurs, row[0], 0) + count;
    });
  });

  var charsFreqTable = _.chain(_.keys(charOccurs))
    .map(function (char) {
      return [char, charOccurs[char], charOccurs[char] / total];
    })
    .sortBy(function (row) {
      return 1 / row[1];
    })
    .value();

  return [['all', total , 1]].concat(charsFreqTable);
}

exports.readFreqTable = readFreqTable;
exports.buildFreqData = buildFreqData;
exports.mergeFreqTables = mergeFreqTables;
