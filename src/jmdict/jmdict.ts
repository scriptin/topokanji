import { readFileSync } from 'fs';
import { join } from 'path';
import dirname from '../dirname.js';
import { JMdict } from '@scriptin/jmdict-simplified-types';

const __dirname = dirname(import.meta.url);

export default JSON.parse(
  readFileSync(join(__dirname, 'jmdict-eng-common-3.5.0.json'), {
    encoding: 'utf-8',
  }),
) as JMdict;
