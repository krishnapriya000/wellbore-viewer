import * as XLSX from 'xlsx';
import { describe, expect, it } from 'vitest';
import { parseSurveyFile } from './parseFile';
import { parseSurveyRows, parseSurveyText, parseSurveyWorkbook } from './parseSurvey';

describe('parseSurveyText', () => {
  it('finds the header below title rows and splits wells', () => {
    const csv = [
      'Survey export,,,',
      'Rig 7,,,',
      'Lateral,MD (ft),Inc,Azimuth',
      'A,0,0,10',
      'A,100,1,10',
      'B,0,0,200',
      'B,100,2,200',
    ].join('\n');
    const { wells, issues } = parseSurveyText(csv, 'X');
    expect([...wells.keys()]).toEqual(['A', 'B']);
    expect(wells.get('B')![1]).toEqual({ md: 100, inc: 2, azi: 200 });
    expect(issues).toEqual([]);
  });

  it('uses the fallback well when there is no well column, and handles tabs and quotes', () => {
    const tsv = '"MD"\t"Inc"\t"Azi"\n0\t0\t0\n"100"\t"1.5"\t"45"';
    const { wells } = parseSurveyText(tsv, 'L9');
    expect(wells.get('L9')).toHaveLength(2);
  });

  it('handles column-name variations safely', () => {
    const csv1 = 'Well_Name,Measured Depth,Inclination,Azimuth\nL1,0,0,0\nL1,500,5,90';
    const res1 = parseSurveyText(csv1, 'fallback');
    expect(res1.wells.has('L1')).toBe(true);
    expect(res1.wells.get('L1')).toHaveLength(2);

    const csv2 = 'Bore,depth_md,drift,dir\nL2,0,0,0\nL2,1000,12,180';
    const res2 = parseSurveyText(csv2, 'fallback');
    expect(res2.wells.has('L2')).toBe(true);
    expect(res2.wells.get('L2')![1]).toEqual({ md: 1000, inc: 12, azi: 180 });

    const csv3 = 'MD_ft,Inc_deg,Azi_deg\n0,0,45\n100,2,45';
    const res3 = parseSurveyText(csv3, 'L3');
    expect(res3.wells.has('L3')).toBe(true);

    const csv4 = 'Depth,Dev,Bearing\n0,0,45\n500,3,90';
    const res4 = parseSurveyText(csv4, 'L1');
    expect(res4.wells.get('L1')).toHaveLength(2);

    const csv5 = 'AH,Angle,Heading\n0,0,180\n200,4,185';
    const res5 = parseSurveyText(csv5, 'L2');
    expect(res5.wells.get('L2')).toHaveLength(2);
  });

  it('parses comma-formatted numbers above 1000 ft without dropping rows', () => {
    const csv = [
      'Well,MD,Inc,Azi',
      'L1,"1,000.0",1.50,45.00',
      'L1,"1,250.5",2.00,45.00',
      'L1,"12,500.0",90.00,45.00',
    ].join('\n');
    const { wells, issues } = parseSurveyText(csv, 'fallback');
    expect(wells.has('L1')).toBe(true);
    // Notice surface tie-in is added at md=0 because survey starts at 1,000 ft
    expect(wells.get('L1')).toHaveLength(4);
    expect(wells.get('L1')![1]!.md).toBe(1000);
    expect(wells.get('L1')![2]!.md).toBe(1250.5);
    expect(wells.get('L1')![3]!.md).toBe(12500);
    expect(issues).toEqual([]);
  });

  it('propagates the well name across continuation rows with sparse well cells', () => {
    const csv = [
      'Well,MD,Inc,Azi',
      'L1,0,0,45',
      ',100,1,45',
      ',200,2,45',
      'L2,0,0,160',
      ',100,1.5,160',
    ].join('\n');
    const { wells, issues } = parseSurveyText(csv, 'fallback');
    expect([...wells.keys()].sort()).toEqual(['L1', 'L2']);
    expect(wells.get('L1')).toHaveLength(3);
    expect(wells.get('L2')).toHaveLength(2);
    expect(issues).toEqual([]);
  });

  it('supports L1, L2, and L3 multi-lateral rows in a single file', () => {
    const csv = [
      'Well,MD,Inc,Azi',
      'L1,0,0,45',
      'L1,100,2,45',
      'L2,0,0,160',
      'L2,150,3,160',
      'L3,0,0,290',
      'L3,200,4,290',
    ].join('\n');
    const { wells, issues } = parseSurveyText(csv, 'fallback');
    expect([...wells.keys()].sort()).toEqual(['L1', 'L2', 'L3']);
    expect(wells.get('L1')).toHaveLength(2);
    expect(wells.get('L2')).toHaveLength(2);
    expect(wells.get('L3')).toHaveLength(2);
    expect(issues).toEqual([]);
  });

  it('reports bad rows with their row number and keeps the rest', () => {
    const csv = 'MD,Inc,Azi\n0,0,0\n100,200,0\n200,abc,0\n300,3,0';
    const { wells, issues } = parseSurveyText(csv, 'W');
    expect(wells.get('W')!.map((s) => s.md)).toEqual([0, 300]);
    expect(issues.map((i) => i.row)).toEqual([3, 4]);
    expect(issues[0]!.message).toMatch(/Inclination/);
  });

  it('sorts, drops duplicate MDs, and reports duplicate and unordered MD validation issues', () => {
    const csv = [
      'Well,MD,Inc,Azi',
      'W,200,2,30',
      'W,100,1,30',
      'W,200,2.1,30',
    ].join('\n');
    const { wells, issues } = parseSurveyText(csv, 'W');
    expect(wells.get('W')!.map((s) => s.md)).toEqual([0, 100, 200]);
    expect(issues.some((i) => /unordered measured depth/.test(i.message))).toBe(true);
    expect(issues.some((i) => /duplicate MD 200/.test(i.message))).toBe(true);
  });

  it('normalises negative azimuths', () => {
    const { wells } = parseSurveyText('MD,Inc,Azi\n0,0,-90', 'W');
    expect(wells.get('W')![0]!.azi).toBe(270);
  });

  it('throws a readable error when no survey columns exist', () => {
    expect(() => parseSurveyText('name,value\nfoo,bar', 'W')).toThrow(/No MD, Inc and Azi columns/);
  });

  it('throws an error for missing required columns when partial header is detected', () => {
    expect(() => parseSurveyText('MD,Inc\n0,0\n100,2', 'W')).toThrow(/Missing required column.*Azimuth/);
    expect(() => parseSurveyText('Inc,Azi\n0,0\n2,45', 'W')).toThrow(/Missing required column.*Measured Depth/);
  });

  it('throws an error for empty files or whitespace-only files', () => {
    expect(() => parseSurveyText('', 'W')).toThrow(/empty/i);
    expect(() => parseSurveyText('   \n\r\n   ', 'W')).toThrow(/empty/i);
    expect(() => parseSurveyRows([], 'W')).toThrow(/empty/i);
  });

  it('parses headerless numeric survey data', () => {
    const csv = '0,0,45\n100,1.5,45\n200,3.0,46';
    const { wells } = parseSurveyText(csv, 'L1');
    expect(wells.get('L1')).toHaveLength(3);
    expect(wells.get('L1')![2]!.md).toBe(200);
  });
});

describe('parseSurveyWorkbook (XLSX)', () => {
  it('parses a valid XLSX workbook with a single survey sheet', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['Well', 'MD', 'Inc', 'Azi'],
      ['L1', 0, 0, 45],
      ['L1', 100, 1.5, 45],
      ['L1', 200, 3.0, 46],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Survey');
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const { wells, issues } = parseSurveyWorkbook(ab, 'fallback');
    expect(wells.has('L1')).toBe(true);
    expect(wells.get('L1')).toHaveLength(3);
    expect(issues).toEqual([]);
  });

  it('parses multi-sheet XLSX workbooks where each sheet represents a wellbore', () => {
    const wb = XLSX.utils.book_new();
    const ws1 = XLSX.utils.aoa_to_sheet([
      ['MD', 'Inc', 'Azi'],
      [0, 0, 45],
      [100, 2, 45],
    ]);
    const ws2 = XLSX.utils.aoa_to_sheet([
      ['MD', 'Inc', 'Azi'],
      [0, 0, 160],
      [100, 2.5, 160],
    ]);
    const ws3 = XLSX.utils.aoa_to_sheet([
      ['MD', 'Inc', 'Azi'],
      [0, 0, 290],
      [100, 3, 290],
    ]);
    XLSX.utils.book_append_sheet(wb, ws1, 'L1');
    XLSX.utils.book_append_sheet(wb, ws2, 'L2');
    XLSX.utils.book_append_sheet(wb, ws3, 'L3');
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const { wells } = parseSurveyWorkbook(ab, 'fallback');
    expect([...wells.keys()].sort()).toEqual(['L1', 'L2', 'L3']);
    expect(wells.get('L1')).toHaveLength(2);
    expect(wells.get('L2')).toHaveLength(2);
    expect(wells.get('L3')).toHaveLength(2);
  });

  it('treats sheets named Plan or Actual as generic sheets and applies fallback well', () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['MD', 'Inc', 'Azi'],
      [0, 0, 45],
      [100, 2, 45],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Plan');
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;

    const { wells } = parseSurveyWorkbook(ab, 'L1');
    expect(wells.has('L1')).toBe(true);
    expect(wells.has('Plan')).toBe(false);
    expect(wells.get('L1')).toHaveLength(2);
  });

  it('throws an error for empty or sheetless Excel buffers', () => {
    expect(() => parseSurveyWorkbook(new Uint8Array(0), 'W')).toThrow(/empty/i);
  });
});

describe('parseSurveyFile', () => {
  it('parses a CSV File object', async () => {
    const file = new File(['MD,Inc,Azi\n0,0,0\n100,2,45'], 'survey.csv', { type: 'text/csv' });
    const { wells } = await parseSurveyFile(file, 'L1');
    expect(wells.get('L1')).toHaveLength(2);
  });

  it('parses an XLSX File object', async () => {
    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['MD', 'Inc', 'Azi'],
      [0, 0, 45],
      [100, 2, 45],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const file = new File([ab], 'survey.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const { wells } = await parseSurveyFile(file, 'L2');
    expect(wells.get('L2')).toHaveLength(2);
  });

  it('rejects unsupported file formats with a clear validation error', async () => {
    const file = new File(['some data'], 'report.pdf', { type: 'application/pdf' });
    await expect(parseSurveyFile(file, 'L1')).rejects.toThrow(/Unsupported file format/);
  });

  it('rejects empty files with a clear validation error', async () => {
    const file = new File([], 'empty.csv', { type: 'text/csv' });
    await expect(parseSurveyFile(file, 'L1')).rejects.toThrow(/empty/i);
  });
});
