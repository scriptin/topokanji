'use strict';

var _ = require('lodash');

function splitInLines(chars, charsPerLine) {
  return _.chunk(chars, charsPerLine)
    .map(function (row) {
      return row.join('');
    }).join('\n');
}

exports.splitInLines = splitInLines;
