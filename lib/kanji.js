/*jslint node: true */
/*jslint nomen: true */
'use strict';

var
  _ = require('lodash'),
  fs = require('fs'),
  readNonEmptyLines = require('./files').readNonEmptyLines;

var readKanjiVGList = function (dir) {
  return fs.readdirSync(dir)
    .filter(function (fileName) {
      return (/^[0-9a-f]+\.svg$/).test(fileName);
    })
    .map(function (fileName) {
      return String.fromCharCode(
        Number.parseInt(fileName.replace(/\.svg$/, ''), 16)
      );
    });
};

var readFromFile = function (fileName, validChars) {
  var result = [];
  readNonEmptyLines(fileName).forEach(function (lineData) {
    lineData.line.split('').forEach(function (char) {
      if (!_.contains(validChars, char)) {
        throw new Error('Character "' + char + '" in ' + lineData.location +
                        ' is not included in valid characters list');
      }
      if (_.contains(result, char)) {
        throw new Error('Duplicate character "' + char + '" in ' + lineData.location);
      }
      result.push(char);
    });
  });
  return result;
};

exports.readKanjiVGList = readKanjiVGList;
exports.readFromFile = readFromFile;
