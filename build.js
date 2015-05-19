/*jslint node: true */
'use strict';

var
  fs = require('fs'),
  DATA_DIR = './',
  KANJIVG_SVG_DIR = './kanjivg/kanji/',
  KANJI_MAIN = DATA_DIR + 'kanji-main.txt',
  KANJI_AUXILIARY = DATA_DIR + 'kanji-auxiliary.txt',
  KANJI_DEPENDENCIES = DATA_DIR + 'kanji-dependencies.txt',
  READ_UTF8 = {mode: 'r', encoding: 'utf8'};

// List of characters available in KanjiVG project
var kanjiVgChars = fs.readdirSync(KANJIVG_SVG_DIR)
  .filter(function (fileName) {
    return (/^[0-9a-f]{5}\.svg$/).test(fileName);
  })
  .map(function (fileName) {
    return String.fromCharCode(
      Number.parseInt(fileName.replace(/\.svg$/, ''), 16)
    );
  });

/**
 * Check if character is present in a list.
 *
 * @param list Array
 * @param listName String
 * @param char String character to check
 * @param fileName String name of a file where the char comes from
 * @param lineNumber Number line number in the file
 * @throws Error if `char` is not in `list`
 */
function checkCharacterPresence(list, listName, char, fileName, lineNumber) {
  if (list.indexOf(char) === -1) {
    throw new Error('Character "' + char + '" in ' +
                    fileName + ':' + (lineNumber + 1) +
                    ' is not included in ' + listName);
  }
}

function checkKanjiKanjiVG(char, fileName, lineNumber) {
  checkCharacterPresence(kanjiVgChars, 'KanjiVG project', char, fileName, lineNumber);
}

function readKanjiList(fileName) {
  var list = [];
  fs.readFileSync(fileName, READ_UTF8)
    .split('\n')
    .forEach(function (line, i) {
      line.split('').forEach(function (char) {
        checkKanjiKanjiVG(char, fileName, i);
        list.push(char);
      });
    });
  return list;
}

var kanjiMain = readKanjiList(KANJI_MAIN);
function checkKanjiMain(char, fileName, lineNumber) {
  checkCharacterPresence(kanjiMain, KANJI_MAIN, char, fileName, lineNumber);
}

var kanjiAuxiliary = readKanjiList(KANJI_AUXILIARY);
function checkKanjiAuxiliary(char, fileName, lineNumber) {
  checkCharacterPresence(kanjiAuxiliary, KANJI_AUXILIARY, char, fileName, lineNumber);
}

fs.readFileSync(KANJI_DEPENDENCIES, READ_UTF8)
  .split('\n')
  .forEach(function (line, i) {
    if (line.trim().length > 0 && line.trim()[0] !== '#') {
      var parts = line.split(' ');
      checkKanjiKanjiVG(parts[0], KANJI_DEPENDENCIES, i);
      checkKanjiKanjiVG(parts[1], KANJI_DEPENDENCIES, i);
      checkKanjiMain(parts[0], KANJI_DEPENDENCIES, i);
      if (kanjiMain.indexOf(parts[1]) === -1) {
        checkKanjiAuxiliary(parts[1], KANJI_DEPENDENCIES, i);
      }
    }
  });
