import { atMd, useSurveyStore } from '@/features/survey';
import { useThrottledStore } from '@/shared/lib/useThrottledStore';
import { formatNumber } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { useDrilling } from '../model/drillingStore';
import { deviationFromPlan, DEVIATION_BANDS } from '../model/deviation';

export function BitReadout() {
  const activeWell = useDrilling((s) => s.activeWell);
  const well = useSurveyStore((s) => (activeWell ? s.wells[activeWell] : undefined));
  const md = useThrottledStore(useDrilling, (s) => s.md, 200);
  const units = useUnits();
  const tip = well ? atMd(well.actual, md) : null;

  if (!well || !tip) {
    return (
      <section className="block">
        <h2>At the bit</h2>
        <p className="hint">No actual surveys for this wellbore.</p>
      </section>
    );
  }

  const dev = well.plan.length ? deviationFromPlan(tip, well.plan) : null;
  const band = dev
    ? dev.ctc <= DEVIATION_BANDS.onPlan
      ? 'ok'
      : dev.ctc <= DEVIATION_BANDS.watch
        ? 'warn'
        : 'crit'
    : 'idle';
  const label = { ok: 'On plan', warn: 'Watch', crit: 'Off plan', idle: 'No plan' }[band];

  return (
    <section className="block">
      <h2>
        At the bit <span className={`pill ${band}`}>{label}</span>
      </h2>
      <dl className="readout">
        <div>
          <dt>Bit MD</dt>
          <dd>{units.depth(tip.md)}</dd>
        </div>
        <div>
          <dt>Bit TVD</dt>
          <dd>{units.depth(tip.tvd)}</dd>
        </div>
        <div>
          <dt>Inc</dt>
          <dd>{formatNumber(tip.inc, 2)}°</dd>
        </div>
        <div>
          <dt>Azi</dt>
          <dd>{formatNumber(tip.azi, 2)}°</dd>
        </div>
        <div>
          <dt>{tip.n >= 0 ? 'North' : 'South'}</dt>
          <dd>{units.depth(Math.abs(tip.n))}</dd>
        </div>
        <div>
          <dt>{tip.e >= 0 ? 'East' : 'West'}</dt>
          <dd>{units.depth(Math.abs(tip.e))}</dd>
        </div>
        <div>
          <dt>Junction</dt>
          <dd>{well.junction > 0 ? units.depth(well.junction, 0) : 'Surface'}</dd>
        </div>
        {dev && (
          <>
            <div>
              <dt>{dev.below >= 0 ? 'Below plan' : 'Above plan'}</dt>
              <dd>{units.depth(Math.abs(dev.below))}</dd>
            </div>
            <div>
              <dt>{dev.right >= 0 ? 'Right of plan' : 'Left of plan'}</dt>
              <dd>{units.depth(Math.abs(dev.right))}</dd>
            </div>
            <div>
              <dt>Ctr-to-ctr</dt>
              <dd>{units.depth(dev.ctc)}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
