/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

var CJK_LINE_REGEXP = /^\S+[:]\S+\((\S+([,]\S+)*)?\)$/;

var validate = function (line) {
  return CJK_LINE_REGEXP.test(line);
};

var parse = function (line) {
  var parts = line.split(':');
  parts[1] = _.trimRight(parts[1], ')').split('(');
  return {
    char: parts[0],
    op: parts[1][0],
    components: parts[1][1].split(',')
  };
};

var readFromFile = function (fileName, decompositions) {
  decompositions = decompositions || {};
  readNonEmptyLines(fileName)
    .forEach(function (lineData) {
      if (!validate(lineData.line)) {
        throw new Error('Line "' + lineData.line + '" in ' +
                        lineData.location + ' has invalid format');
      }
      var d = parse(lineData.line);
      decompositions[d.char] = d.components;
    });
  return decompositions;
};

exports.validate = validate;
exports.parse = parse;
exports.readFromFile = readFromFile;
