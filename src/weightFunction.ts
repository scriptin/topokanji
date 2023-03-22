import aozora from './frequency/aozora.js';
import _ from 'lodash';

const totalChars = aozora[0]?.charCount ?? 0;

const freqDataPairs = aozora
  .slice(1) // skip header
  .map((row) => [row.char, row.charCount / totalChars] as [string, number]);

const freqData = _.fromPairs(freqDataPairs);

export default function (char: string): number {
  return 1 - (freqData[char] ?? 0);
}
