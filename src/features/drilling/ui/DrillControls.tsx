import { useShallow } from 'zustand/react/shallow';
import { useSurveyStore } from '@/features/survey';
import { formatNumber, toDisplay } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { useThrottledStore } from '@/shared/lib/useThrottledStore';
import { useDrilling } from '../model/drillingStore';

const SPEEDS = [100, 250, 600, 1500];

export function DrillControls() {
  const order = useSurveyStore((s) => s.order);
  const wells = useSurveyStore((s) => s.wells);
  // Select fields explicitly: subscribing to the whole store would re-render on every frame as `md` changes.
  const { activeWell, playing, speedFtPerS, setActiveWell, setPlaying, setSpeed, restart } = useDrilling(
    useShallow((s) => ({
      activeWell: s.activeWell,
      playing: s.playing,
      speedFtPerS: s.speedFtPerS,
      setActiveWell: s.setActiveWell,
      setPlaying: s.setPlaying,
      setSpeed: s.setSpeed,
      restart: s.restart,
    })),
  );
  const md = useThrottledStore(useDrilling, (s) => s.md, 200);
  const units = useUnits();
  const td = activeWell ? (wells[activeWell]?.actual.at(-1)?.md ?? 0) : 0;
  const done = td > 0 && md >= td - 1e-6;
  const status = !td ? 'No actual' : done ? 'TD reached' : playing ? 'Drilling' : 'Paused';

  return (
    <section className="block">
      <h2>
        Real-time drilling{' '}
        <span className={`pill ${done ? 'ok' : playing ? 'warn' : 'idle'}`} aria-live="polite">
          {status}
        </span>
      </h2>
      <div className="row">
        <button
          className="btn primary"
          onClick={() => (done ? restart() : setPlaying(!playing))}
          disabled={!td}
        >
          {done ? 'Drill again' : playing ? 'Pause' : 'Resume'}
        </button>
        <button className="btn" onClick={restart} disabled={!td}>
          Restart this wellbore
        </button>
      </div>
      <div className="row">
        <label className="field grow">
          Drilling wellbore
          <select value={activeWell ?? ''} onChange={(e) => setActiveWell(e.target.value)}>
            {order.map((n) => (
              <option key={n}>{n}</option>
            ))}
          </select>
        </label>
        <label className="field grow">
          Drilling speed
          <select value={speedFtPerS} onChange={(e) => setSpeed(Number(e.target.value))}>
            {SPEEDS.map((s) => (
              <option key={s} value={s}>
                {formatNumber(toDisplay(s, units.unit), 0)} {units.unit}/s
              </option>
            ))}
          </select>
        </label>
      </div>
      <div
        className="progress"
        role="progressbar"
        aria-valuemin={0}
        aria-valuemax={td}
        aria-valuenow={Math.round(md)}
      >
        <i style={{ width: td ? `${(100 * md) / td}%` : 0 }} />
      </div>
      <p className="hint mono">
        {td ? `${units.depth(md, 0)} / ${units.depth(td, 0)}` : 'Load an actual survey to start drilling.'}
      </p>
    </section>
  );
}
