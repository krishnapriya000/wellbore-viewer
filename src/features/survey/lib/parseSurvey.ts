import Papa from 'papaparse';
import * as XLSX from 'xlsx';
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

export const isMd = (c: string) =>
  /^(md|measured\s*depth|depth\s*md|measured_depth|depth_md)(\b|_|\s|\(|$)/i.test(c) ||
  c === 'md' ||
  c.startsWith('md ') ||
  c.startsWith('md_') ||
  c.startsWith('md(');

export const isInc = (c: string) =>
  /^(inc|inclination|incl|drift)(\b|_|\s|\(|$)/i.test(c) ||
  c.includes('inclination') ||
  c.includes('inc');

export const isAzi = (c: string) =>
  /^(az|azi|azimuth|azim|direction|dir)(\b|_|\s|\(|$)/i.test(c) ||
  c.includes('azimuth') ||
  c.includes('azi');

export const isWell = (c: string) =>
  /^(well|well_?name|wellbore|lateral|bore|leg)(\b|_|\s|\(|$)/i.test(c) ||
  /well|lateral|bore|leg/i.test(c);

/**
 * Finds the header row (first 40 rows) with MD, Inc and Azi columns, and an optional Well column.
 * Rows without a well name go to `fallbackWell`. Every rejected row is reported with its 1-based row number.
 */
export function parseSurveyRows(rows: readonly (readonly unknown[])[], fallbackWell: string): ParsedSurvey {
  if (!rows || rows.length === 0) {
    throw new Error('The survey file is empty.');
  }

  const nonEmptyRows = rows.filter((r) => r && r.some((c) => String(c ?? '').trim() !== ''));
  if (nonEmptyRows.length === 0) {
    throw new Error('The survey file is empty.');
  }

  const issues: ParseIssue[] = [];
  let header = -1;
  let cMd = -1;
  let cInc = -1;
  let cAzi = -1;
  let cWell = -1;

  for (let r = 0; r < Math.min(rows.length, 40); r++) {
    const row = rows[r];
    if (!row) continue;
    const cells = row.map((c) =>
      String(c ?? '')
        .trim()
        .toLowerCase(),
    );
    const md = cells.findIndex(isMd);
    const inc = cells.findIndex(isInc);
    const azi = cells.findIndex(isAzi);
    if (md >= 0 && inc >= 0 && azi >= 0) {
      header = r;
      cMd = md;
      cInc = inc;
      cAzi = azi;
      cWell = cells.findIndex(isWell);
      break;
    }
  }

  if (header < 0) {
    // Check if any row in the first 40 rows looks like a survey header with partial columns
    let bestMatch: { r: number; md: number; inc: number; azi: number } | null = null;
    for (let r = 0; r < Math.min(rows.length, 40); r++) {
      const row = rows[r];
      if (!row) continue;
      const cells = row.map((c) =>
        String(c ?? '')
          .trim()
          .toLowerCase(),
      );
      const md = cells.findIndex(isMd);
      const inc = cells.findIndex(isInc);
      const azi = cells.findIndex(isAzi);
      const count = (md >= 0 ? 1 : 0) + (inc >= 0 ? 1 : 0) + (azi >= 0 ? 1 : 0);
      if (count >= 1) {
        if (!bestMatch || count > (bestMatch.md >= 0 ? 1 : 0) + (bestMatch.inc >= 0 ? 1 : 0) + (bestMatch.azi >= 0 ? 1 : 0)) {
          bestMatch = { r, md, inc, azi };
        }
      }
    }

    if (bestMatch) {
      const missing: string[] = [];
      if (bestMatch.md < 0) missing.push('Measured Depth (MD)');
      if (bestMatch.inc < 0) missing.push('Inclination (Inc)');
      if (bestMatch.azi < 0) missing.push('Azimuth (Azi)');
      if (missing.length > 0) {
        throw new Error(`Missing required column(s): ${missing.join(', ')}.`);
      }
    }

    // If no header text found, check if first non-empty row has 3 numeric values (headerless survey)
    const firstNumericRowIdx = rows.findIndex(
      (r) =>
        r &&
        r.length >= 3 &&
        r.slice(0, 3).every((x) => x !== '' && x !== null && x !== undefined && Number.isFinite(Number(x))),
    );

    if (firstNumericRowIdx >= 0) {
      header = firstNumericRowIdx - 1;
      cMd = 0;
      cInc = 1;
      cAzi = 2;
      cWell = -1;
    } else {
      throw new Error('No MD, Inc and Azi columns found. Required columns: Measured Depth (MD), Inclination (Inc), and Azimuth (Azi).');
    }
  }

  const rawWells = new Map<string, { station: Station; row: number }[]>();
  for (let r = header + 1; r < rows.length; r++) {
    const row = rows[r];
    if (!row || row.every((c) => String(c ?? '').trim() === '')) continue;

    const rowNum = r + 1;
    const rawMd = row[cMd];
    const rawInc = row[cInc];
    const rawAzi = row[cAzi];

    if (
      rawMd === '' || rawMd === null || rawMd === undefined ||
      rawInc === '' || rawInc === null || rawInc === undefined ||
      rawAzi === '' || rawAzi === null || rawAzi === undefined
    ) {
      issues.push({ row: rowNum, message: 'Missing numeric value for MD, Inc, or Azi' });
      continue;
    }

    const mdNum = Number(rawMd);
    const incNum = Number(rawInc);
    const aziNum = Number(rawAzi);

    if (!Number.isFinite(mdNum) || !Number.isFinite(incNum) || !Number.isFinite(aziNum)) {
      issues.push({
        row: rowNum,
        message: `Invalid number (MD: "${rawMd}", Inc: "${rawInc}", Azi: "${rawAzi}")`,
      });
      continue;
    }

    const parsed = StationSchema.safeParse({
      md: mdNum,
      inc: incNum,
      azi: aziNum,
    });
    if (!parsed.success) {
      issues.push({ row: rowNum, message: parsed.error.issues.map((i) => i.message).join('; ') });
      continue;
    }

    const rawWell = cWell >= 0 ? String(row[cWell] ?? '').trim() : '';
    const name = WellNameSchema.safeParse(rawWell || fallbackWell);
    if (!name.success) {
      issues.push({ row: rowNum, message: `Invalid well name "${rawWell}"` });
      continue;
    }

    const list = rawWells.get(name.data) ?? [];
    list.push({ station: parsed.data, row: rowNum });
    rawWells.set(name.data, list);
  }

  if (!rawWells.size || Array.from(rawWells.values()).every((l) => l.length === 0)) {
    throw new Error('No valid survey rows found.');
  }

  const wells = new Map<string, Station[]>();
  for (const [name, list] of rawWells) {
    let prevMd: number | null = null;
    let hasUnordered = false;
    const kept: Station[] = [];

    for (const item of list) {
      const { station, row } = item;
      if (prevMd !== null) {
        if (station.md < prevMd) {
          issues.push({
            row,
            message: `${name}: unordered measured depth (${station.md} ft < previous ${prevMd} ft)`,
          });
          hasUnordered = true;
        } else if (station.md === prevMd) {
          issues.push({
            row,
            message: `${name}: duplicate MD ${station.md} dropped`,
          });
          continue;
        }
      }
      prevMd = station.md;
      kept.push(station);
    }

    if (hasUnordered) {
      kept.sort((a, b) => a.md - b.md);
    }

    const dedup = kept.filter((s, i) => {
      const keep = i === 0 || s.md > kept[i - 1]!.md;
      if (!keep) {
        issues.push({ row: 0, message: `${name}: duplicate MD ${s.md} dropped` });
      }
      return keep;
    });

    if (dedup.length > 0 && dedup[0]!.md > 0) {
      dedup.unshift({ md: 0, inc: 0, azi: dedup[0]!.azi });
    }
    wells.set(name, dedup);
  }

  return { wells, issues };
}

/** CSV / TSV / semicolon-separated text. Handles quoted fields and BOMs via Papa Parse. */
export function parseSurveyText(text: string, fallbackWell: string): ParsedSurvey {
  if (text.length > MAX_FILE_BYTES) throw new Error('File is larger than 10 MB.');
  if (!text || text.trim() === '') throw new Error('The survey file is empty.');
  const result = Papa.parse<string[]>(text.replace(/^\uFEFF/, ''), {
    skipEmptyLines: 'greedy',
    delimiter: '',
  });
  if (result.data.length > MAX_ROWS) throw new Error(`File has more than ${MAX_ROWS.toLocaleString()} rows.`);
  return parseSurveyRows(result.data, fallbackWell);
}

/**
 * Parses an Excel workbook (.xlsx, .xls) from an ArrayBuffer or Uint8Array.
 * Inspects all sheets for survey data tables.
 */
export function parseSurveyWorkbook(data: ArrayBuffer | Uint8Array, fallbackWell: string): ParsedSurvey {
  if (data.byteLength > MAX_FILE_BYTES) throw new Error('File is larger than 10 MB.');
  if (data.byteLength === 0) throw new Error('The survey file is empty.');

  let wb: XLSX.WorkBook;
  try {
    wb = XLSX.read(data, { type: 'array' });
  } catch (err) {
    throw new Error(`Failed to read spreadsheet: ${err instanceof Error ? err.message : String(err)}`, {
      cause: err,
    });
  }

  if (!wb.SheetNames || wb.SheetNames.length === 0) {
    throw new Error('Workbook contains no sheets.');
  }

  const combinedWells = new Map<string, Station[]>();
  const combinedIssues: ParseIssue[] = [];
  let foundAnyValidSheet = false;
  let firstError: Error | null = null;

  for (const sn of wb.SheetNames) {
    const sheet = wb.Sheets[sn];
    if (!sheet) continue;
    const rows = XLSX.utils.sheet_to_json<unknown[]>(sheet, { header: 1, raw: true, defval: '' });
    if (!rows || rows.length === 0) continue;

    const isGenericSheet = /^(sheet\d*|survey\d*|table\d*|data\d*)$/i.test(sn.trim());
    const sheetWell =
      !isGenericSheet && WellNameSchema.safeParse(sn.trim()).success ? sn.trim() : fallbackWell;

    try {
      const parsed = parseSurveyRows(rows, sheetWell);
      foundAnyValidSheet = true;
      for (const [wellName, stations] of parsed.wells) {
        combinedWells.set(wellName, stations);
      }
      combinedIssues.push(...parsed.issues);
    } catch (e) {
      if (!firstError && e instanceof Error) {
        firstError = e;
      }
    }
  }

  if (!foundAnyValidSheet || combinedWells.size === 0) {
    throw firstError ?? new Error('No sheet with MD, Inc and Azi columns found in spreadsheet.');
  }

  return { wells: combinedWells, issues: combinedIssues };
}
