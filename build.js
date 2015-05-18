/*jslint node: true */
'use strict';

var
  fs = require('fs'),
  DATA_DIR = './',
  KANJIVG_SVG_DIR = './kanjivg/kanji/',
  KANJI_BY_STROKE_COUNT = DATA_DIR + 'kanji-by-stroke-count.txt',
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
 * Check if character is included into KanjiVG set of files.
 *
 * @param char String character to check
 * @param fileName String name of a file where the char comes from
 * @param lineNumber Number line number in the file
 * @throws Error if character is not in KanjiVG
 */
function checkKanjiVG(char, fileName, lineNumber) {
  if (kanjiVgChars.indexOf(char) === -1) {
    throw new Error('Character "' + char + '" in ' +
                    fileName + ':' + (lineNumber + 1) +
                    ' is not included in KanjiVG project');
  }
}

var kanji = [];
fs.readFileSync(KANJI_BY_STROKE_COUNT, READ_UTF8)
  .split('\n')
  .forEach(function (line, i) {
    line.split('').forEach(function (char) {
      checkKanjiVG(char, KANJI_BY_STROKE_COUNT, i);
      kanji.push(char);
    });
  });

/**
 * Check if character is present in KANJI_BY_STROKE_COUNT file.
 *
 * @param char String character to check
 * @param fileName String name of a file where the char comes from
 * @param lineNumber Number line number in the file
 * @throws Error if character is not in KANJI_BY_STROKE_COUNT
 */
function checkKanjiListed(char, fileName, lineNumber) {
  if (kanji.indexOf(char) === -1) {
    throw new Error('Character "' + char + '" in ' +
                    fileName + ':' + (lineNumber + 1) +
                    ' is not included in ' + KANJI_BY_STROKE_COUNT);
  }
}

fs.readFileSync(KANJI_DEPENDENCIES, READ_UTF8)
  .split('\n')
  .forEach(function (line, i) {
    if (line.trim().length > 0 && line.trim()[0] !== '#') {
      var parts = line.split(' ');
      checkKanjiVG(parts[0], KANJI_DEPENDENCIES, i);
      checkKanjiVG(parts[1], KANJI_DEPENDENCIES, i);
      checkKanjiListed(parts[0], KANJI_DEPENDENCIES, i);
    }
  });
