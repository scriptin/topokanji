'use strict';

var
  _ = require('lodash'),
  fs = require('fs');

var // file operation modes
  READ_UTF8 = {mode: 'r', encoding: 'utf8'},
  WRITE_UTF8 = {flag: 'w', encoding: 'utf8', mode: 438};

var readLines = function (fileName) {
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
};

var isBlank = function (lineData) {
  return (/^\s*$/).test(lineData.line);
};

var readNonEmptyLines = function (fileName) {
  return exports.readLines(fileName).filter(_.negate(isBlank));
};

exports.readLines = readLines;
exports.readNonEmptyLines = readNonEmptyLines;
