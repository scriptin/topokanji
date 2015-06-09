'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

function readKanjiData(kanjiListFileName, kanjiVgListFileName) {
  var kanjiVgChars = [];
  readNonEmptyLines(kanjiVgListFileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      kanjiVgChars.push(char);
    });
  });
  
  var result = {
    list: [],
    strokeCount: {}
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

  return result;
}

exports.readKanjiData = readKanjiData;
