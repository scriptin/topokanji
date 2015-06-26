'use strict';

var
  _ = require('lodash'),
  kanjiFreq = require('./kanji-freq');

function toPercents(val) {
  return (val > 0) ? (val * 100).toFixed(8) : '-.-';
}

function sort(freqTables, asc) {
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
    return [row[0]].concat(coverageFromTables).concat([_.sum(coverageFromTables)]);
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

exports.sort = sort;
