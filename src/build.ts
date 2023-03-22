import graphEdges from './graphEdges.js';
import weightFunction from './weightFunction.js';
import toposort from './toposort.js';

console.log('sorting...');
const sorted = toposort(graphEdges, weightFunction);
sorted.reverse();

console.log(sorted);
