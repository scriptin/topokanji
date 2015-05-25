/*jslint node: true */
/*jslint nomen: true */
'use strict';

var _ = require('lodash');

function hasIncomingEdges(node, edges) {
  var i;
  for (i = 0; i < edges.length; i += 1) {
    if (edges[i][1] === node) {
      return true;
    }
  }
  return false;
}

function getEdgesFrom(node, edges) {
  var result = [], i;
  for (i = 0; i < edges.length; i += 1) {
    if (edges[i][0] === node) {
      result.push(edges[i]);
    }
  }
  return result;
}

function getUniqNodes(edges, extract) {
  return _.chain(edges.map(extract)).uniq().value();
}

var toposort = function (edges, sort) {
  var
    result = [],
    restEdges = edges.slice(),
    as = getUniqNodes(edges, _.head), // from
    bs = getUniqNodes(edges, _.last), // to
    free = _.difference(as, bs),
    node, edgesFromNode, nodesFromNode, i;

  while (free.length > 0) {
    free = _.sortBy(free, sort).reverse();
    node = free.splice(0, 1)[0];
    result.push(node);
    edgesFromNode = getEdgesFrom(node, restEdges);
    nodesFromNode = getUniqNodes(edgesFromNode, _.last);
    restEdges = _.difference(restEdges, edgesFromNode);
    for (i = 0; i < nodesFromNode.length; i += 1) {
      if (!hasIncomingEdges(nodesFromNode[i], restEdges)) {
        free.push(nodesFromNode[i]);
      }
    }
  }

  if (restEdges.length > 0) {
    throw new Error('Graph has at least one cycle! ' +
                    restEdges.length + ' edges left');
  }

  return result;
};

exports.toposort = toposort;
