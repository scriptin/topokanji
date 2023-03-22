import { readFileSync } from 'fs';
import { join } from 'path';
import dirname from '../dirname.js';

const __dirname = dirname(import.meta.url);

const lines = readFileSync(join(__dirname, 'aozora_characters.csv'), {
  encoding: 'utf-8',
}).split('\n');

export type KanjiFrequencyRow = {
  rank: number;
  codePoint: string;
  char: string;
  charCount: number;
};

export default lines.slice(1).map((row) => {
  const parts = row.split(',');
  const result: KanjiFrequencyRow = {
    rank: parseInt(parts[0] ?? '-1', 10),
    codePoint: parts[1] ?? '',
    char: parts[2] ?? '',
    charCount: parseInt(parts[3] ?? '-1', 10),
  };
  return result;
});
