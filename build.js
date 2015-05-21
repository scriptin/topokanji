/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  argv = require('minimist')(process.argv.slice(2));

var // command-line args
  RAW_DEPENDENCIES_ARG = 'raw-dependencies';

var // directories
  DATA_DIR = './',
  KANJIVG_SVG_DIR = DATA_DIR + 'kanjivg/kanji/';

var // files
  KANJI_LIST = DATA_DIR + 'kanji.txt',
  CJK = DATA_DIR + 'cjk-decomp-0.4.0.txt',
  CJK_OVERRIDE = DATA_DIR + 'cjk-decomp-override.txt',
  KANJI_DEPENDENCIES = DATA_DIR + 'dependencies.txt',
  KANJI_RAW_DEPENDENCIES = DATA_DIR + RAW_DEPENDENCIES_ARG + '.txt';

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

function checkKanjiVG(char, where) {
  if (!_.contains(kanjiVgChars, char)) {
    throw new Error('Character "' + char + '" in ' + where +
                    ' is not included in KanjiVG project');
  }
}

function readKanjiList(fileName) {
  var list = [];
  fs.readFileSync(fileName, READ_UTF8)
    .split('\n')
    .forEach(function (line, i) {
      line.split('').forEach(function (char) {
        var where = fileName + ':' + (i + 1);
        checkKanjiVG(char, where);
        if (_.contains(list, char)) {
          throw new Error('Duplicate "' + char + '" in ' + where);
        }
        list.push(char);
      });
    });
  return list;
}

var kanji = readKanjiList(KANJI_LIST);

if (argv[RAW_DEPENDENCIES_ARG]) {

  var readCJK = function (fileName, decompositions) {
    decompositions = decompositions || {};
    fs.readFileSync(fileName, READ_UTF8)
      .split('\n')
      .forEach(function (line, i) {
        if (line.trim().length !== 0) {
          var parts = line.split(':'),
            char = parts[0].trim(),
            components = parts[1].split('(')[1].split(')')[0].split(',');
          if (char === '') {
            throw new Error('Decomposition rule with empty character in ' + fileName + ':' + (i + 1));
          }
          if (_.isEmpty(components)) {
            throw new Error('Decomposition rule with empty list of components in ' + fileName + ':' + (i + 1));
          }
          decompositions[parts[0].trim()] = parts[1].split('(')[1].split(')')[0].split(',');
        }
      });
    return decompositions;
  };

  var decompositions = readCJK(CJK_OVERRIDE, readCJK(CJK));

  var UNKNOWN_CHAR = '!', EMPTY_CHAR = '0';

  var decompose = function (char, decompositions, list) {
    if (_.isArray(decompositions[char])) {
      return decompositions[char].map(function (c) {
        if (_.contains(list, c) || c === EMPTY_CHAR) {
          return c;
        }
        return decompose(c, decompositions, list);
      });
    }
    return UNKNOWN_CHAR;
  };

  var dependencies = _.uniq(
    _.flatten(
      kanji.map(function (char) {
        return _.flattenDeep(decompose(char, decompositions, kanji)).map(function (part) {
          return char + part;
        });
      })
    )
  );

  var missing = dependencies.filter(function (dep) {
    return _.contains(dep, UNKNOWN_CHAR);
  });
  
  fs.unlinkSync(KANJI_RAW_DEPENDENCIES);
  console.log('Writing into ' + KANJI_RAW_DEPENDENCIES);
  fs.writeFileSync(KANJI_RAW_DEPENDENCIES, dependencies.join('\n'), WRITE_UTF8);
  console.log('Written ' + dependencies.length + ' lines, ' + missing.length + ' missing dependencies');

}
