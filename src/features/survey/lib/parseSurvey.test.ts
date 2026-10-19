import { describe, expect, it } from 'vitest';
import { parseSurveyText } from './parseSurvey';

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

  it('reports bad rows with their row number and keeps the rest', () => {
    const csv = 'MD,Inc,Azi\n0,0,0\n100,200,0\n200,abc,0\n300,3,0';
    const { wells, issues } = parseSurveyText(csv, 'W');
    expect(wells.get('W')!.map((s) => s.md)).toEqual([0, 300]);
    expect(issues.map((i) => i.row)).toEqual([3, 4]);
    expect(issues[0]!.message).toMatch(/Inclination/);
  });

  it('sorts, drops duplicate MDs, and adds a surface station when missing', () => {
    const { wells, issues } = parseSurveyText('MD,Inc,Azi\n200,2,30\n100,1,30\n200,2.1,30', 'W');
    expect(wells.get('W')!.map((s) => s.md)).toEqual([0, 100, 200]);
    expect(issues.some((i) => /duplicate MD 200/.test(i.message))).toBe(true);
  });

  it('normalises negative azimuths', () => {
    const { wells } = parseSurveyText('MD,Inc,Azi\n0,0,-90', 'W');
    expect(wells.get('W')![0]!.azi).toBe(270);
  });

  it('throws a readable error when no survey columns exist', () => {
    expect(() => parseSurveyText('name,value\nfoo,bar', 'W')).toThrow(/No MD, Inc and Azi columns/);
  });
});
