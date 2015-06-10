'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

function loadKanjiVgChars(kanjiVgListFileName) {
  var kanjiVgChars = [];
  readNonEmptyLines(kanjiVgListFileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      if (_.contains(kanjiVgChars, char)) {
        throw new Error('Duplicate kanji "' + char + '" in ' + kanjiVgListFileName);
      }
      kanjiVgChars.push(char);
    });
  });
  return kanjiVgChars;
}

function loadKanjiList(kanjiListFileName, kanjiVgChars) {
  var result = { list: [], strokeCount: {} };
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

function loadRadicals(radicalsFileName, kanjiList) {
  var radicals = [];
  readNonEmptyLines(radicalsFileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      if (_.contains(radicals, char)) {
        throw new Error('Duplicate radical "' + char + '" in ' + radicalsFileName);
      }
      if (!_.contains(kanjiList, char)) {
        throw new Error('Radical "' + char + '" is not included in the list of kanji');
      }
      radicals.push(char);
    });
  });
  return radicals;
}

function readKanjiData(kanjiListFileName, kanjiVgListFileName, radicalsFileName) {
  var result = loadKanjiList(
    kanjiListFileName,
    loadKanjiVgChars(kanjiVgListFileName)
  );
  result.radicals = loadRadicals(radicalsFileName, result.list);
  return result;
}

exports.readKanjiData = readKanjiData;
