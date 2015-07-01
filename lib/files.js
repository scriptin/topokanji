'use strict';

var
  _ = require('lodash'),
  fs = require('fs');

var // file operation modes
  READ_UTF8 = {mode: 'r', encoding: 'utf8'},
  WRITE_UTF8 = {flag: 'w', encoding: 'utf8', mode: 438};

var readLines = function (fileName, commentRegex) {
  return fs.readFileSync(fileName, READ_UTF8)
    .split('\n')
    .map(function (line, i) {
      var trimmed = _.trimRight(line, '\r'); // in case of CRLF
      return {
        line: _.isUndefined(commentRegex) ? trimmed : trimmed.replace(commentRegex, ''),
        fileName: fileName,
        lineNumber: (i + 1),
        location: fileName + ':' + (i + 1)
      };
    });
};

var isBlank = function (lineData) {
  return (/^\s*$/).test(lineData.line);
};

var readNonEmptyLines = function (fileName, commentRegex) {
  return exports.readLines(fileName, commentRegex).filter(_.negate(isBlank));
};

exports.readLines = readLines;
exports.readNonEmptyLines = readNonEmptyLines;
exports.READ_UTF8 = READ_UTF8;
exports.WRITE_UTF8 = WRITE_UTF8;
