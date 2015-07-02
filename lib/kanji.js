'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  files = require('./files');

function loadKanjiVgChars(kanjiVgListFileName) {
  var kanjiVgChars = [];
  files.readNonEmptyLines(kanjiVgListFileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      if (_.contains(kanjiVgChars, char)) {
        throw new Error('Duplicate kanji "' + char + '" in ' + kanjiVgListFileName);
      }
      kanjiVgChars.push(char);
    });
  });
  return kanjiVgChars;
}

function findDuplicates(arr) {
  return _.chain(arr)
    .countBy()
    .filter(function (count) {
      return count > 1;
    })
    .keys()
    .value();
}

function validateKanjiTable(kanjiTable, kanjiVgChars) {
  var chars = kanjiTable.map(function (row) {
    return row[0];
  });

  var duplicates = findDuplicates(chars);
  if (duplicates.length > 0) {
    throw new Error('Duplicate characters in kanji table: ' + duplicates.join(', '));
  }

  var missingKanjiVG = _.difference(chars, kanjiVgChars);
  if (missingKanjiVG.length > 0) {
    throw new Error(
      'Some kanji in the kanji table are not included in KanjiVG list: ' +
      missingKanjiVG.join(', ')
    );
  }
}

function readKanjiData(kanjiTableFileName, kanjiVgListFileName) {
  var kanjiVgChars = loadKanjiVgChars(kanjiVgListFileName);
  var kanjiTable = JSON.parse(fs.readFileSync(kanjiTableFileName, files.READ_UTF8));
  validateKanjiTable(kanjiTable, kanjiVgChars);

  var kanjiData = _.chain(kanjiTable)
    .map(function (row) {
      return [row[0], {
        strokeCount: row[1],
        isKanji: row[2],
        isRadical: !row[2]
      }];
    })
    .zipObject()
    .value();

  return kanjiData;
}

exports.readKanjiData = readKanjiData;
