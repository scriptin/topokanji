'use strict';

var _ = require('lodash'),
  cjk = require('./cjk');

function findMissing(kanjiList, dependencies) {
  return dependencies.filter(function (dep) {
    var isEmptyChar = dep[1] === cjk.EMPTY_CHAR;
    var inList = kanjiList.includes(dep[1]);
    return !(isEmptyChar || inList);
  });
}

function buildDependencyPairs(kanjiList, decompositions) {
  var dependencies = _.chain(kanjiList)
    .map(function (char) {
      return cjk
        .decompose(char, decompositions, kanjiList)
        .map(function (part) {
          return [char, part];
        });
    })
    .flatten()
    .value();

  var missing = findMissing(kanjiList, dependencies).map(function (dep) {
    return dep.join('->');
  });
  if (missing.length > 0) {
    throw new Error('Mising dependencies: ' + missing.join(', '));
  }

  return dependencies;
}

function buildDependencyMap(depsNormal) {
  var deps = {};
  depsNormal.forEach(function (pair) {
    deps[pair[0]] = deps[pair[0]] || [];
    deps[pair[0]].push(pair[1]);
  });

  // remove empty chars from non-empty dependency lists
  Object.keys(deps).forEach(function (char) {
    if (deps[char].length > 1) {
      deps[char] = _.without(deps[char], cjk.EMPTY_CHAR);
    }
  });

  return deps;
}

exports.buildDependencyPairs = buildDependencyPairs;
exports.buildDependencyMap = buildDependencyMap;
