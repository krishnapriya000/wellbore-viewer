import { wrap } from 'comlink';
import type { ParseWorkerApi } from './parse.worker';
import { MAX_FILE_BYTES, type ParsedSurvey } from './parseSurvey';

let worker: ReturnType<typeof wrap<ParseWorkerApi>> | null = null;

function getWorker() {
  worker ??= wrap<ParseWorkerApi>(
    new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' }),
  );
  return worker;
}

/**
 * Parses an uploaded survey file in a Web Worker.
 * XLSX: add SheetJS from its official CDN build (not the npm 0.18 package, which has open advisories)
 * inside the worker, convert the first matching sheet to rows, then call parseSurveyRows.
 */
export async function parseSurveyFile(file: File, fallbackWell: string): Promise<ParsedSurvey> {
  if (file.size > MAX_FILE_BYTES) throw new Error('File is larger than 10 MB.');
  if (!/\.(csv|txt|tsv)$/i.test(file.name)) throw new Error('Upload a .csv, .tsv or .txt survey file.');
  const result = await getWorker().parse(await file.text(), fallbackWell);
  return { wells: new Map(result.wells), issues: result.issues };
}
