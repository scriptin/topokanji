'use strict';

var _ = require('lodash'), cjk = require('./cjk');

function buildDependencies(kanjiList, decompositions) {
var dependencies = _.chain(kanjiList)
  .map(function (char) {
    return cjk.decompose(char, decompositions, kanjiList).map(function (part) {
      return [char, part];
    });
  })
  .flatten()
  .value();

  var missing = dependencies.filter(function (dep) {
    return !(dep[1] === cjk.EMPTY_CHAR || _.contains(kanjiList, dep[1]));
  });

  if (missing.length > 0) {
    console.log('MISSING DEPENDENCIES:');
    missing.forEach(function (dep) {
      console.log(dep.join(' -> '));
    });
    throw new Error('Fix mising dependencies and retry');
  }
  
  return dependencies;
}

exports.buildDependencies = buildDependencies;
