import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

/** The reference viewer's sample surveys, as shipped in public/samples. */
export const sampleCsv = (name: 'plan' | 'actual') =>
  readFileSync(resolve(__dirname, '../../public/samples', `${name}.csv`), 'utf8');
