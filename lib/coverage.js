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

function countDependencyUsage(dependencies, char) {
  return dependencies.filter(function (dep) {
    return dep[1] === char;
  }).length;
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

function buildFullTable(mergedTable, freqTables, dependencies, meanType) {
  return mergedTable.map(function (row) {
    var char = row[0];
    var coverageFromTables = freqTables.map(function (freqTable) {
      var row = _.find(freqTable, function (row) {
        return row[0] === char;
      });
      return row ? row[2] : 0;
    });

    return _.flatten([
      char,
      coverageFromTables,
      mean[meanType](coverageFromTables),
      countDependencyUsage(dependencies, row[0])
    ]);
  });
}

function sort(freqTables, dependencies, meanType, asc) {
  if (!_.contains(_.keys(mean), meanType)) {
    throw new Error(
      '"meanType" must be one of these: ' + _.keys(mean).join(', ') +
      '; ' + meanType + ' given'
    );
  }
  if (!_.isBoolean(asc)) {
    throw new Error('"asc" must be a boolean, ' + asc + ' given');
  }

  var mergedTable = _.without(kanjiFreq.mergeFreqTables(freqTables, false), 0);

  return _.chain(buildFullTable(mergedTable, freqTables, dependencies, meanType))
    .sortBy(function (row) {
      var mean = row[row.length - 2];
      return asc ? mean : (1 / mean);
    })
    .map(function (row) {
      return _.flatten([
        row[0],
        _.map(_.slice(row, 1, row.length - 1), toPercents),
        _.last(row)
      ]);
    })
    .value();
}

function getCoverage(kanjiList, freqTable) {
  return _.chain(freqTable)
    .filter(function (row) {
      return _.contains(kanjiList, row[0]);
    })
    .map(function (row) {
      return row[2];
    })
    .sum().value();
}

function report(kanjiList, freqTableNames, freqTables) {
  return freqTables.map(function (freqTable, i) {
    return [freqTableNames[i], getCoverage(kanjiList, freqTable)];
  });
}

exports.sort = sort;
exports.report = report;
