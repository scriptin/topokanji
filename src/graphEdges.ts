import { Edge, Node } from './graphTypes.js';
import dirname from './dirname.js';
import { readFileSync } from 'fs';
import { join } from 'path';

const __dirname = dirname(import.meta.url);

export const emptyNode: Node = '0';

const graphEdges = JSON.parse(
  readFileSync(join(__dirname, '..', 'dependencies', '1-to-1.json'), {
    encoding: 'utf-8',
  }),
) as Edge[];

export default graphEdges;
