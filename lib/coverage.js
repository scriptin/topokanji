'use strict';

var
  _ = require('lodash'),
  kanjiFreq = require('./kanji-freq');

function toPercents(val) {
  return (val > 0) ? (val * 100).toFixed(8) : '-.-';
}

function product(values) {
  return _.reduce(values, function (result, n) {
    return result * n;
  }, 1);
}

var mean = {
  arithmetic: function (values) {
    return _.sum(values) / values.length;
  },
  geometric: function (values) {
    return Math.pow(product(values), 1 / values.length);
  },
  harmonic: function (values) {
    var sumOfReversed = _.chain(values).map(function (n) { return 1 / n; }).sum().value();
    return values.length / sumOfReversed;
  }
};

function sort(freqTables, meanType, asc) {
  if (!_.contains(Object.keys(mean), meanType)) {
    throw new Error('"meanType" must be one of these: ' + Object.keys(mean).join(', ') + 
                    '; ' + meanType + ' given');
  }
  if (!_.isBoolean(asc)) {
    throw new Error('"asc" must be a boolean, ' + asc + ' given');
  }
  var merged = _.without(kanjiFreq.mergeFreqTables(freqTables, false), 0);
  var fullTable = merged.map(function (row) {
    var char = row[0];
    var coverageFromTables = freqTables.map(function (freqTable) {
      for (var i = 0; i < freqTable.length; i += 1) {
        if (freqTable[i][0] === char) {
          return freqTable[i][2];
        }
      }
      return 0.0;
    });
    return [row[0]].concat(coverageFromTables).concat([mean[meanType](coverageFromTables)]);
  });
  return _.chain(fullTable)
    .sortBy(function (row) {
      var total = row[row.length - 1];
      return asc ? total : (1 / total);
    })
    .map(function (row) {
      return [row[0]].concat(_.map(_.tail(row), toPercents));
    })
    .value();
}

function report(kanjiList, freqTableNames, freqTables) {
  return freqTables.map(function (freqTable, i) {
    var coverage = _.chain(freqTable)
      .filter(function (row) {
        return _.contains(kanjiList, row[0]);
      })
      .map(function (row) {
        return row[2];
      })
      .sum().value();
    return [freqTableNames[i], coverage];
  });
}

exports.sort = sort;
exports.report = report;
