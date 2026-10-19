import Papa from 'papaparse';
import { StationSchema, WellNameSchema } from './schema';
import type { Station } from './types';

export interface ParseIssue {
  row: number;
  message: string;
}

export interface ParsedSurvey {
  wells: Map<string, Station[]>;
  issues: ParseIssue[];
}

export const MAX_FILE_BYTES = 10 * 1024 * 1024;
export const MAX_ROWS = 200_000;

const isMd = (c: string) => /^md\b|^md_|^md\s|measured/.test(c) || c === 'md';

/**
 * Finds the header row (first 40 rows) with MD, Inc and Azi columns, and an optional Well column.
 * Rows without a well name go to `fallbackWell`. Every rejected row is reported with its 1-based row number.
 */
export function parseSurveyRows(rows: readonly (readonly unknown[])[], fallbackWell: string): ParsedSurvey {
  const issues: ParseIssue[] = [];
  let header = -1;
  let cMd = 0;
  let cInc = 1;
  let cAzi = 2;
  let cWell = -1;

  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const cells = (rows[r] ?? []).map((c) =>
      String(c ?? '')
        .trim()
        .toLowerCase(),
    );
    const md = cells.findIndex(isMd);
    const inc = cells.findIndex((c) => c.includes('inc'));
    const azi = cells.findIndex((c) => c.includes('az'));
    if (md >= 0 && inc >= 0 && azi >= 0) {
      header = r;
      cMd = md;
      cInc = inc;
      cAzi = azi;
      cWell = cells.findIndex((c) => /well|lateral|bore|leg/.test(c));
      break;
    }
  }

  const wells = new Map<string, Station[]>();
  for (let r = header + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;
    const parsed = StationSchema.safeParse({
      md: Number(row[cMd]),
      inc: Number(row[cInc]),
      azi: Number(row[cAzi]),
    });
    if (!parsed.success) {
      issues.push({ row: r + 1, message: parsed.error.issues.map((i) => i.message).join('; ') });
      continue;
    }
    const rawWell = cWell >= 0 ? String(row[cWell] ?? '').trim() : '';
    const name = WellNameSchema.safeParse(rawWell || fallbackWell);
    if (!name.success) {
      issues.push({ row: r + 1, message: `Invalid well name "${rawWell}"` });
      continue;
    }
    const list = wells.get(name.data) ?? [];
    list.push(parsed.data);
    wells.set(name.data, list);
  }

  if (!wells.size)
    throw new Error(header < 0 ? 'No MD, Inc and Azi columns found.' : 'No valid survey rows found.');

  for (const [name, list] of wells) {
    list.sort((a, b) => a.md - b.md);
    const dedup = list.filter((s, i) => {
      const keep = i === 0 || s.md > list[i - 1]!.md;
      if (!keep) issues.push({ row: 0, message: `${name}: duplicate MD ${s.md} dropped` });
      return keep;
    });
    if (dedup[0]!.md > 0) dedup.unshift({ md: 0, inc: 0, azi: dedup[0]!.azi });
    wells.set(name, dedup);
  }
  return { wells, issues };
}

/** CSV / TSV / semicolon-separated text. Handles quoted fields and BOMs via Papa Parse. */
export function parseSurveyText(text: string, fallbackWell: string): ParsedSurvey {
  if (text.length > MAX_FILE_BYTES) throw new Error('File is larger than 10 MB.');
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), {
    skipEmptyLines: 'greedy',
    delimiter: '',
  });
  if (result.data.length > MAX_ROWS) throw new Error(`File has more than ${MAX_ROWS.toLocaleString()} rows.`);
  return parseSurveyRows(result.data, fallbackWell);
}
