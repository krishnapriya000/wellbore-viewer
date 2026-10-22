import { beforeEach, describe, expect, it } from 'vitest';
import { sampleCsv } from '@/test/fixtures';
import { useSurveyStore } from './surveyStore';

const reset = () => useSurveyStore.setState({ wells: {}, order: [], status: 'empty', error: null });

describe('surveyStore', () => {
  beforeEach(reset);

  it('creates a well from an actual-only upload instead of dropping it', () => {
    useSurveyStore.getState().setActual(
      new Map([
        [
          'A',
          [
            { md: 0, inc: 0, azi: 0 },
            { md: 100, inc: 1, azi: 0 },
          ],
        ],
      ]),
    );
    const a = useSurveyStore.getState().wells['A']!;
    expect(a.actual).toHaveLength(2);
    expect(a.plan).toHaveLength(0);
    expect(useSurveyStore.getState().order).toEqual(['A']);
  });

  it('keeps the actual when a new plan arrives and bumps the version', () => {
    const s = useSurveyStore.getState();
    s.setActual(new Map([['A', [{ md: 0, inc: 0, azi: 0 }]]]));
    const v = useSurveyStore.getState().wells['A']!.version;
    s.setPlan(
      new Map([
        [
          'A',
          [
            { md: 0, inc: 0, azi: 0 },
            { md: 100, inc: 0, azi: 0 },
          ],
        ],
      ]),
    );
    const a = useSurveyStore.getState().wells['A']!;
    expect(a.actual).toHaveLength(1);
    expect(a.plan).toHaveLength(2);
    expect(a.version).toBe(v + 1);
  });

  it('validates live stations', () => {
    const s = useSurveyStore.getState();
    s.setActual(
      new Map([
        [
          'A',
          [
            { md: 0, inc: 0, azi: 0 },
            { md: 100, inc: 1, azi: 0 },
          ],
        ],
      ]),
    );
    expect(s.addLiveStation('A', { md: 90, inc: 1, azi: 0 })).toMatchObject({
      ok: false,
      error: expect.stringMatching(/deeper/),
    });
    expect(s.addLiveStation('A', { md: 200, inc: 190, azi: 0 })).toMatchObject({ ok: false });
    expect(s.addLiveStation('Z', { md: 200, inc: 1, azi: 0 })).toMatchObject({
      ok: false,
      error: 'Unknown well Z',
    });
    const ok = s.addLiveStation('A', { md: 200, inc: 4, azi: -10 });
    expect(ok).toMatchObject({ ok: true, point: { md: 200, azi: 350 } });
  });

  it('loads the bundled sample data', async () => {
    const fakeFetch = (async (url: string) =>
      new Response(sampleCsv(url.includes('plan') ? 'plan' : 'actual'))) as unknown as typeof fetch;
    await useSurveyStore.getState().loadSample(fakeFetch);
    const st = useSurveyStore.getState();
    expect(st.status).toBe('ready');
    expect(st.order).toEqual(['L1', 'L2', 'L3']);
    expect(st.wells['L2']!.junction).toBe(4600);
  });

  it('updates a selected wellbore trajectory without overwriting unrelated wellbores', async () => {
    const fakeFetch = (async (url: string) =>
      new Response(sampleCsv(url.includes('plan') ? 'plan' : 'actual'))) as unknown as typeof fetch;
    await useSurveyStore.getState().loadSample(fakeFetch);

    const store = useSurveyStore.getState();
    const l1PlanLen = store.wells['L1']!.plan.length;
    const l3ActualLen = store.wells['L3']!.actual.length;

    // Update only L2 actual with new survey stations
    store.setActual(
      new Map([
        [
          'L2',
          [
            { md: 0, inc: 0, azi: 160 },
            { md: 500, inc: 5, azi: 160 },
            { md: 1000, inc: 10, azi: 160 },
          ],
        ],
      ]),
    );

    const updated = useSurveyStore.getState();
    // L1 and L3 are preserved
    expect(updated.wells['L1']!.plan).toHaveLength(l1PlanLen);
    expect(updated.wells['L3']!.actual).toHaveLength(l3ActualLen);

    // L2 actual is updated with correct MCM computed coordinates
    const l2 = updated.wells['L2']!;
    expect(l2.actual).toHaveLength(3);
    expect(l2.actual[2]!.md).toBe(1000);
    expect(l2.actual[2]!.tvd).toBeGreaterThan(900);
    expect(l2.actual[2]!.n).toBeLessThan(0); // azimuth 160 is south/east
    expect(l2.actual[2]!.e).toBeGreaterThan(0);
    expect(l2.actual[2]!.dls).toBeGreaterThan(0);
  });
});

