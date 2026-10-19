import { describe, expect, it } from 'vitest';
import { sampleCsv } from '@/test/fixtures';
import { arcPoint, atMd, computeSurvey, densify, junctionMd, stationsReached } from './mcm';
import { parseSurveyText } from './parseSurvey';
import type { Station } from './types';

/** Radius of curvature for a constant build rate in °/100 ft. */
const radius = (dlsPer100: number) => (100 * 180) / (Math.PI * dlsPer100);

/** Vertical to `kop`, then build at `rate` °/100 ft to 90°, then hold `holdFt`. Stations every 100 ft. */
function buildAndHold(kop: number, rate: number, holdFt: number, azi = 0): Station[] {
  const out: Station[] = [];
  for (let md = 0; md <= kop; md += 100) out.push({ md, inc: 0, azi });
  let inc = 0;
  let md = kop;
  while (inc < 90) {
    md += 100;
    inc = Math.min(90, inc + rate);
    out.push({ md, inc, azi });
  }
  for (let h = 100; h <= holdFt; h += 100) out.push({ md: md + h, inc: 90, azi });
  return out;
}

describe('minimum curvature', () => {
  it('vertical hole: TVD equals MD, no displacement', () => {
    const s = computeSurvey([0, 500, 1000].map((md) => ({ md, inc: 0, azi: 0 })));
    expect(s.at(-1)).toMatchObject({ tvd: 1000, n: 0, e: 0, dls: 0 });
  });

  it('straight inclined hole: TVD = MD·cos(I) below the kick-off', () => {
    const s = computeSurvey([
      { md: 0, inc: 30, azi: 90 },
      { md: 1000, inc: 30, azi: 90 },
    ]);
    expect(s[1]!.tvd).toBeCloseTo(1000 * Math.cos(Math.PI / 6), 9);
    expect(s[1]!.e).toBeCloseTo(500, 9);
    expect(s[1]!.n).toBeCloseTo(0, 9);
  });

  it('constant 3°/100 ft build from vertical to horizontal lands exactly one radius down and out', () => {
    const R = radius(3);
    const s = computeSurvey(buildAndHold(0, 3, 0));
    const end = s.at(-1)!;
    expect(end.inc).toBe(90);
    expect(end.tvd).toBeCloseTo(R, 6);
    expect(end.n).toBeCloseTo(R, 6);
    s.slice(1).forEach((p) => expect(p.dls).toBeCloseTo(3, 9));
  });

  it('turn in the horizontal plane keeps TVD constant', () => {
    const s = computeSurvey([
      { md: 0, inc: 90, azi: 0 },
      { md: 100, inc: 90, azi: 10 },
    ]);
    expect(s[1]!.tvd).toBeCloseTo(0, 9);
    expect(s[1]!.dls).toBeCloseTo(10, 9);
  });

  it('normalises azimuth into 0–360', () => {
    expect(computeSurvey([{ md: 0, inc: 0, azi: -450 }])[0]!.azi).toBe(270);
  });

  it('honours an explicit tie-in for sidetracks', () => {
    const s = computeSurvey(
      [
        { md: 5000, inc: 0, azi: 0 },
        { md: 5100, inc: 0, azi: 0 },
      ],
      { tvd: 4800, n: 120, e: -40 },
    );
    expect(s[0]).toMatchObject({ tvd: 4800, n: 120, e: -40 });
    expect(s[1]!.tvd).toBeCloseTo(4900, 9);
  });
});

describe('interpolation', () => {
  const R = radius(3);
  const s = computeSurvey(buildAndHold(0, 3, 0));

  it('arcPoint returns the end stations at f = 0 and 1', () => {
    expect(arcPoint(s[1]!, s[2]!, 0)).toBe(s[1]);
    expect(arcPoint(s[1]!, s[2]!, 1)).toBe(s[2]);
  });

  it('atMd follows the true arc between stations', () => {
    const mid = atMd(s, 1550)!; // halfway through the build → 46.5°
    const theta = (46.5 * Math.PI) / 180;
    expect(mid.inc).toBeCloseTo(46.5, 6);
    expect(mid.tvd).toBeCloseTo(R * Math.sin(theta), 6);
    expect(mid.n).toBeCloseTo(R * (1 - Math.cos(theta)), 6);
  });

  it('atMd clamps outside the survey and handles empty input', () => {
    expect(atMd(s, -10)).toBe(s[0]);
    expect(atMd(s, 1e9)).toBe(s.at(-1));
    expect(atMd([], 10)).toBeNull();
  });

  it('stationsReached counts stations at or above an MD', () => {
    expect(stationsReached(s, 0)).toBe(1);
    expect(stationsReached(s, 150)).toBe(2);
    expect(stationsReached(s, 200)).toBe(3);
    expect(stationsReached(s, 1e9)).toBe(s.length);
  });

  it('densify keeps every station and adds arc samples', () => {
    const d = densify(s);
    expect(d.length).toBeGreaterThan(s.length);
    for (const p of s) expect(d).toContain(p);
  });
});

describe('reference sample data', () => {
  const plan = parseSurveyText(sampleCsv('plan'), 'L1').wells;
  const actual = parseSurveyText(sampleCsv('actual'), 'L1').wells;

  it('has three laterals with 151 plan and 160 actual stations each', () => {
    expect([...plan.keys()]).toEqual(['L1', 'L2', 'L3']);
    for (const w of ['L1', 'L2', 'L3']) {
      expect(plan.get(w)).toHaveLength(151);
      expect(actual.get(w)).toHaveLength(160);
    }
  });

  it('L1 plan: KOP 4,000 ft, 3°/100 ft build, lands at 4,000 + R TVD and holds to 15,000 ft MD', () => {
    const R = radius(3);
    const l1 = computeSurvey(plan.get('L1')!);
    const end = l1.at(-1)!;
    expect(junctionMd(l1)).toBe(4000);
    expect(end.md).toBe(15000);
    expect(end.tvd).toBeCloseTo(4000 + R, 4);
    const horizontal = R + 8000; // build radius + 8,000 ft lateral at azimuth 45°
    expect(end.n).toBeCloseTo(horizontal / Math.SQRT2, 4);
    expect(end.e).toBeCloseTo(horizontal / Math.SQRT2, 4);
  });
});
