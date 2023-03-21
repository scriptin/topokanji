import { readFileSync } from 'fs';
import { resolve } from 'path';
import { isHan } from '@scriptin/is-han';
import dirname from '../dirname.js';

const __dirname = dirname(import.meta.url);

const kanjivg = readFileSync(resolve(__dirname, 'list.txt'), {
  encoding: 'utf-8',
})
  .split('\n')
  .filter((l) => !l.startsWith('#'))
  .join('\n');

export default Array.from(kanjivg).filter(isHan);
