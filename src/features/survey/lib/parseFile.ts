import { wrap } from 'comlink';
import type { ParseWorkerApi } from './parse.worker';
import { MAX_FILE_BYTES, parseSurveyText, parseSurveyWorkbook, type ParsedSurvey } from './parseSurvey';

let worker: ReturnType<typeof wrap<ParseWorkerApi>> | null = null;

function getWorker() {
  worker ??= wrap<ParseWorkerApi>(
    new Worker(new URL('./parse.worker.ts', import.meta.url), { type: 'module' }),
  );
  return worker;
}

/**
 * Parses an uploaded survey file (.csv, .tsv, .txt, .xlsx, .xls) in a Web Worker,
 * with fallback to direct parsing in environments without Worker support.
 */
export async function parseSurveyFile(file: File, fallbackWell: string): Promise<ParsedSurvey> {
  if (file.size > MAX_FILE_BYTES) throw new Error('File is larger than 10 MB.');
  if (file.size === 0) throw new Error('The survey file is empty.');

  const name = file.name.toLowerCase();
  const isCsv = /\.(csv|txt|tsv)$/i.test(name);
  const isXlsx = /\.(xlsx|xls)$/i.test(name);
  if (!isCsv && !isXlsx) {
    throw new Error(`Unsupported file format "${file.name}". Please upload a .csv, .tsv, .txt, or .xlsx file.`);
  }

  if (typeof Worker !== 'undefined') {
    try {
      const w = getWorker();
      if (isXlsx) {
        const buffer = await file.arrayBuffer();
        const result = await w.parseBuffer(buffer, fallbackWell);
        return { wells: new Map(result.wells), issues: result.issues };
      } else {
        const text = await file.text();
        const result = await w.parse(text, fallbackWell);
        return { wells: new Map(result.wells), issues: result.issues };
      }
    } catch {
      // Fallback to direct parsing if worker execution fails
    }
  }

  if (isXlsx) {
    const buffer = await file.arrayBuffer();
    return parseSurveyWorkbook(buffer, fallbackWell);
  } else {
    const text = await file.text();
    return parseSurveyText(text, fallbackWell);
  }
}

