import graphEdges, { emptyNode } from './graphEdges.js';
import weightFunction from './weightFunction.js';
import toposort from './toposort.js';
import _ from 'lodash';
import { isHan } from '@scriptin/is-han';

console.log('sorting...');
const sorted = toposort(graphEdges, weightFunction);
sorted.reverse().filter((n) => n !== emptyNode && isHan(n));

const pretty = _.chunk(sorted, 60)
  .slice(0, 10)
  .map((chunk) => chunk.join(''))
  .join('\n');
console.log(pretty);
