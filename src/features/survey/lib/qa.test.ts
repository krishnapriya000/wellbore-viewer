import { describe, expect, it } from 'vitest';
import { computeSurvey } from './mcm';
import { qaSurvey } from './qa';

describe('qaSurvey', () => {
  it('passes a clean 3°/100 ft build', () => {
    const s = computeSurvey([0, 100, 200, 300].map((md, i) => ({ md, inc: i * 3, azi: 0 })));
    expect(qaSurvey(s)).toEqual([]);
  });

  it('flags DLS over the limit, critical above 1.5× the limit', () => {
    const s = computeSurvey([
      { md: 0, inc: 0, azi: 0 },
      { md: 100, inc: 4, azi: 0 },
      { md: 200, inc: 10, azi: 0 },
    ]);
    const f = qaSurvey(s);
    expect(f.map((x) => [x.md, x.code, x.severity])).toEqual([
      [100, 'DLS_OVER_LIMIT', 'warn'],
      [200, 'DLS_OVER_LIMIT', 'crit'],
    ]);
  });

  it('flags station gaps and low-inclination azimuth jumps', () => {
    const s = computeSurvey([
      { md: 0, inc: 0, azi: 0 },
      { md: 50, inc: 1, azi: 10 },
      { md: 500, inc: 1, azi: 120 },
    ]);
    const codes = qaSurvey(s, { maxDls: 99, maxStationGap: 300 }).map((x) => x.code);
    expect(codes).toEqual(['STATION_GAP', 'AZI_JUMP_LOW_INC']);
  });
});
