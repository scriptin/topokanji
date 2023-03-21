'use strict';

var _ = require('lodash'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

var CJK_LINE_REGEXP = /^\S+[:]\S+\((\S+([,]\S+)*)?\)$/;

var EMPTY_CHAR = '0';

function validate(line) {
  return CJK_LINE_REGEXP.test(line);
}

function parse(line) {
  var parts = line.split(':');
  parts[1] = _.trimEnd(parts[1], ')').split('(');
  return {
    char: parts[0],
    op: parts[1][0],
    components: parts[1][1].split(','),
  };
}

function readFromFile(fileName, decompositions) {
  decompositions = decompositions || {};
  readNonEmptyLines(fileName, /#.*$/).forEach(function (lineData) {
    if (!validate(lineData.line)) {
      throw new Error(
        'Line "' +
          lineData.line +
          '" in ' +
          lineData.location +
          ' has invalid format',
      );
    }
    var d = parse(lineData.line);
    decompositions[d.char] = d.components;
  });
  return decompositions;
}

function decompose(char, decompositions, terminalChars) {
  if (_.isUndefined(decompositions[char]) || _.isEmpty(decompositions[char])) {
    return char;
  }
  return decompositions[char].map(function (c) {
    if (_.contains(terminalChars, c) || c === EMPTY_CHAR) {
      return c;
    }
    return decompose(c, decompositions, terminalChars);
  });
}

var decompose = _.flow(decompose, _.flattenDeep, _.uniq);

exports.readFromFile = readFromFile;
exports.decompose = decompose;
exports.EMPTY_CHAR = EMPTY_CHAR;
