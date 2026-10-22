import { useConstructionStore } from '@/features/construction';
import { useEventsStore } from '@/features/events';
import { useGeologyStore } from '@/features/geology';
import { useSurveyStore } from '@/features/survey';
import { useThrottledStore } from '@/shared/lib/useThrottledStore';
import { Segmented } from '@/shared/ui/Segmented';
import { formatNumber } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { computeDrillingReadout, type DrillingReadoutMode } from '../lib/readout';
import { DEVIATION_BANDS } from '../model/deviation';
import { useDrilling } from '../model/drillingStore';

export function BitReadout() {
  const activeWell = useDrilling((s) => s.activeWell);
  const mode = useDrilling((s) => s.mode);
  const setMode = useDrilling((s) => s.setMode);
  const well = useSurveyStore((s) => (activeWell ? s.wells[activeWell] : undefined));
  const md = useThrottledStore(useDrilling, (s) => s.md, 200);
  const formations = useGeologyStore((s) => s.formations);
  const constructionItems = useConstructionStore((s) => s.items);
  const events = useEventsStore((s) => s.events);
  const units = useUnits();

  const readout = computeDrillingReadout(
    well,
    md,
    mode,
    formations,
    constructionItems,
    events,
  );
  const { tip, formation, casingShoe, latestEvent, deviation } = readout;

  if (!well) {
    return (
      <section className="block">
        <h2>At the bit</h2>
        <p className="hint">Select a wellbore to inspect drilling position.</p>
      </section>
    );
  }

  if (!tip) {
    return (
      <section className="block">
        <h2>
          <span>At the bit</span>
          <Segmented<DrillingReadoutMode>
            label="Readout mode"
            value={mode}
            onChange={setMode}
            options={[
              { value: 'actual', label: 'Actual' },
              { value: 'plan', label: 'Plan' },
            ]}
          />
        </h2>
        <p className="hint">
          {mode === 'actual'
            ? 'No actual surveys for this wellbore.'
            : 'No planned trajectory for this wellbore.'}
        </p>
      </section>
    );
  }

  const band =
    mode === 'plan'
      ? 'idle'
      : deviation
        ? deviation.ctc <= DEVIATION_BANDS.onPlan
          ? 'ok'
          : deviation.ctc <= DEVIATION_BANDS.watch
            ? 'warn'
            : 'crit'
        : 'idle';
  const label =
    mode === 'plan'
      ? 'Planned'
      : { ok: 'On plan', warn: 'Watch', crit: 'Off plan', idle: 'No plan' }[band];

  return (
    <section className="block">
      <h2>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
          At the bit <span className={`pill ${band}`}>{label}</span>
        </span>
        <Segmented<DrillingReadoutMode>
          label="Readout mode"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'actual', label: 'Actual' },
            { value: 'plan', label: 'Plan' },
          ]}
        />
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
          <dd>{`${formatNumber(tip.inc, 2)}°`}</dd>
        </div>
        <div>
          <dt>Azi</dt>
          <dd>{`${formatNumber(tip.azi, 2)}°`}</dd>
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
        <div>
          <dt>Formation</dt>
          <dd
            title={
              formation
                ? `${formation.name} (${formation.comp.map((c) => `${c.pct}% ${c.lith}`).join(', ')})`
                : 'No formation'
            }
          >
            {formation ? formation.name : '—'}
          </dd>
        </div>
        <div>
          <dt>Casing shoe</dt>
          <dd
            title={
              casingShoe
                ? `${casingShoe.sizeInches}" shoe at ${units.depth(casingShoe.shoeMd, 0)}`
                : 'No casing shoe'
            }
          >
            {casingShoe
              ? `${casingShoe.sizeInches}" @ ${units.depth(casingShoe.shoeMd, 0)}`
              : '—'}
          </dd>
        </div>
        <div>
          <dt>Latest event</dt>
          <dd
            title={
              latestEvent
                ? `${latestEvent.label} @ ${units.depth(latestEvent.md, 0)}${
                    latestEvent.note ? `: ${latestEvent.note}` : ''
                  }`
                : 'No event'
            }
          >
            {latestEvent
              ? `${latestEvent.label} @ ${units.depth(latestEvent.md, 0)}`
              : '—'}
          </dd>
        </div>
        {mode === 'actual' && deviation && (
          <>
            <div>
              <dt>{deviation.below >= 0 ? 'Below plan' : 'Above plan'}</dt>
              <dd>{units.depth(Math.abs(deviation.below))}</dd>
            </div>
            <div>
              <dt>{deviation.right >= 0 ? 'Right of plan' : 'Left of plan'}</dt>
              <dd>{units.depth(Math.abs(deviation.right))}</dd>
            </div>
            <div>
              <dt>Ctr-to-ctr</dt>
              <dd>{units.depth(deviation.ctc)}</dd>
            </div>
          </>
        )}
      </dl>
    </section>
  );
}
