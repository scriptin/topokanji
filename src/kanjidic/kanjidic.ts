import { readFileSync } from 'fs';
import { resolve } from 'path';
import { Kanjidic2 } from '@scriptin/jmdict-simplified-types';
import dirname from '../dirname.js';

const __dirname = dirname(import.meta.url);

export default JSON.parse(
  readFileSync(resolve(__dirname, 'kanjidic2-en-3.5.0.json'), {
    encoding: 'utf-8',
  }),
) as Kanjidic2;
