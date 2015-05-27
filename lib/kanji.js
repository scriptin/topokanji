/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

var readFromFile = function (kanjiListFileName, kanjiVgListFileName, frequencyFileName) {
  var kanjiVgChars = [];
  readNonEmptyLines(kanjiVgListFileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      kanjiVgChars.push(char);
    });
  });
  
  var result = {
    list: [],
    strokeCount: {},
    frequency: {},
    freqTable: JSON.parse(fs.readFileSync(frequencyFileName, {mode: 'r', encoding: 'utf8'}))
  };

  readNonEmptyLines(kanjiListFileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      if (!_.contains(kanjiVgChars, char)) {
        throw new Error('Character "' + char + '" in ' + lineData.location +
                        ' is not included in valid characters list');
      }
      if (_.contains(result.list, char)) {
        throw new Error('Duplicate character "' + char + '" in ' + lineData.location);
      }
      result.list.push(char);
      result.strokeCount[char] = lineData.lineNumber;
    });
  });

  if (!_.isArray(result.freqTable)) {
    throw new Error('Invalid kanji frequency table in ' + frequencyFileName);
  }

  function validateRow(row) {
    if (!_.isArray(row) || row.length !== 3 || !_.isString(row[0]) || !_.isNumber(row[2])) {
      throw new Error('Invalid row in kanji frequency table in ' + frequencyFileName +
                      ': ' + row);
    }
  }

  result.freqTable.forEach(function (row) {
    validateRow(row);
    result.frequency[row[0]] = row[2];
  });

  return result;
};

exports.readFromFile = readFromFile;
