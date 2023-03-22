import _ from 'lodash';

export type Node = string;
export type Edge = [Node, Node];

function hasIncomingEdges(node: Node, edges: Edge[]): boolean {
  for (const edge of edges) {
    if (edge[1] === node) {
      return true;
    }
  }
  return false;
}

function getEdgesFrom(node: Node, edges: Edge[]): Edge[] {
  const result = [];
  for (const edge of edges) {
    if (edge[0] === node) {
      result.push(edge);
    }
  }
  return result;
}

function getUniqNodes(edges: Edge[], extract: (edge: Edge) => Node): string[] {
  return _.uniq(edges.map(extract));
}

export default function (edges: Edge[], sort: (a: Node) => number): string[] {
  const result: string[] = [];
  let restEdges = edges.slice(); // copy
  const sourceNodes = getUniqNodes(edges, (e) => e[0]);
  const destinationNodes = getUniqNodes(edges, (e) => e[1]);
  let free = _.difference(sourceNodes, destinationNodes);
  let nextNode: string | null = null;
  let edgesFromNextNode: Edge[] = [];
  let nodesFromNextNode: string[] = [];

  while (free.length > 0) {
    free = _.sortBy(free, sort).reverse();
    nextNode = free.splice(0, 1)[0] ?? '';
    result.push(nextNode);
    edgesFromNextNode = getEdgesFrom(nextNode, restEdges);
    nodesFromNextNode = getUniqNodes(edgesFromNextNode, (e) => e[1]);
    restEdges = _.difference(restEdges, edgesFromNextNode);
    for (const node of nodesFromNextNode) {
      if (!hasIncomingEdges(node, restEdges)) {
        free.push(node);
      }
    }
  }

  if (restEdges.length > 0) {
    throw new Error(
      `Graph has at least one cycle! ${restEdges.length} edges left:\n${restEdges}`,
    );
  }

  return result;
}
