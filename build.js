/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  argv = require('minimist')(process.argv.slice(2));

var // directories
  DATA_DIR = './',
  KANJIVG_SVG_DIR = DATA_DIR + 'kanjivg/kanji/';

var // files
  KANJI_LIST = DATA_DIR + 'kanji.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt',
  KANJI_DEPENDENCIES = DATA_DIR + 'dependencies.txt',
  KANJI_RAW_DEPENDENCIES = DATA_DIR + 'raw-dependencies.txt';

var // file operation modes
  READ_UTF8 = {mode: 'r', encoding: 'utf8'},
  WRITE_UTF8 = {flag: 'w', encoding: 'utf8', mode: 438};

// List of characters available in KanjiVG project
var kanjiVgChars = fs.readdirSync(KANJIVG_SVG_DIR)
  .filter(function (fileName) {
    return (/^[0-9a-f]+\.svg$/).test(fileName);
  })
  .map(function (fileName) {
    return String.fromCharCode(
      Number.parseInt(fileName.replace(/\.svg$/, ''), 16)
    );
  });

function readLines(fileName) {
  return fs.readFileSync(fileName, READ_UTF8)
    .split('\n')
    .map(function (line, i) {
      return {
        line: _.trimRight(line, '\r'), // in case of CRLF
        fileName: fileName,
        lineNumber: (i + 1),
        location: fileName + ':' + (i + 1)
      };
    });
}

function isBlank(lineData) {
  return /^\s*$/.test(lineData.line);
}

function readNonEmptyLines(fileName) {
  return readLines(fileName).filter(_.negate(isBlank));
}

function readKanjiList(fileName) {
  var list = [];
  readNonEmptyLines(fileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      if (!_.contains(kanjiVgChars, char)) {
        throw new Error('Character "' + char + '" in ' + lineData.location +
                        ' is not included in KanjiVG project');
      }
      if (_.contains(list, char)) {
        throw new Error('Duplicate character "' + char + '" in ' + lineData.location);
      }
      list.push(char);
    });
  });
  return list;
}

var kanji = readKanjiList(KANJI_LIST);

function parseCJKLine(line) {
  var parts = line.split(':');
  parts[1] = _.trimRight(parts[1], ')').split('(');
  return {
    char: parts[0],
    op: parts[1][0],
    components: parts[1][1].split(',')
  };
}

var CJK_LINE_REGEXP = /^\S+[:]\S+\((\S+([,]\S+)*)?\)$/;

function readCJK(fileName, decompositions) {
  decompositions = decompositions || {};
  readNonEmptyLines(fileName)
    .forEach(function (lineData) {
      if (!CJK_LINE_REGEXP.test(lineData.line)) {
        throw new Error('Line "' + lineData.line + '" in ' +
                        lineData.location + ' has invalid format, ' +
                        'must match ' + CJK_LINE_REGEXP);
      }
      var d = parseCJKLine(lineData.line);
      decompositions[d.char] = d.components;
    });
  return decompositions;
}

var UNKNOWN_CHAR = '!', EMPTY_CHAR = '0';

function decompose(char, decompositions, terminalChars) {
  if (_.isEmpty(decompositions[char])) {
    return '!';
  }
  return decompositions[char].map(function (c) {
    if (_.contains(terminalChars, c) || (c === EMPTY_CHAR)) {
      return c;
    }
    return decompose(c, decompositions, terminalChars);
  });
}

var decompositions = readCJK(CJK_OVERRIDE, readCJK(CJK));

var decomposeFlat = _.flow(decompose, _.flattenDeep, _.uniq);

var dependencies = _.chain(kanji)
  .map(function (char) {
    return decomposeFlat(char, decompositions, kanji).map(function (part) {
      return char + part;
    });
  })
  .flatten()
  .value();

var missing = dependencies.filter(function (dep) {
  return _.contains(dep, UNKNOWN_CHAR);
});

fs.unlinkSync(KANJI_RAW_DEPENDENCIES);
console.log('Writing into ' + KANJI_RAW_DEPENDENCIES);
fs.writeFileSync(KANJI_RAW_DEPENDENCIES, dependencies.join('\n'), WRITE_UTF8);
console.log('Written ' + dependencies.length + ' lines, ' + missing.length + ' missing dependencies');
