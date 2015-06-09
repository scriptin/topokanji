'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

function validateRow(row) {
  if (!_.isArray(row) || row.length !== 3 || !_.isString(row[0]) || !_.isNumber(row[2])) {
    throw new Error('Invalid row in kanji frequency table in ' + freqTableFileName + ': ' + row);
  }
}

function readFreqData(freqTableFileName) {
  var result = {
    freqTable: JSON.parse(fs.readFileSync(freqTableFileName)),
    frequency: {}
  };

  if (!_.isArray(result.freqTable)) {
    throw new Error('Invalid kanji frequency table in ' + freqTableFileName);
  }

  result.freqTable.forEach(function (row) {
    validateRow(row);
    result.frequency[row[0]] = row[2];
  });

  return result;
}

exports.readFreqData = readFreqData;
