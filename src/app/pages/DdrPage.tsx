import { useEffect, useState } from 'react';
import { useSurveyStore } from '@/features/survey';

export function DdrPage() {
  const order = useSurveyStore((s) => s.order);
  const status = useSurveyStore((s) => s.status);
  const loadSample = useSurveyStore((s) => s.loadSample);

  const [userSelectedWell, setUserSelectedWell] = useState<string | null>(null);
  const [reportDate, setReportDate] = useState<string>(() => new Date().toISOString().slice(0, 10));

  useEffect(() => {
    if (status === 'empty') void loadSample();
  }, [status, loadSample]);

  const selectedWell =
    userSelectedWell && order.includes(userSelectedWell)
      ? userSelectedWell
      : order[0] ?? 'L1';

  return (
    <div className="module-page" style={{ padding: '16px 20px', overflowY: 'auto', flex: 1, display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Header Banner */}
      <div
        className="block"
        style={{
          borderLeft: '4px solid var(--accent)',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '12px',
        }}
      >
        <div>
          <h1
            style={{
              margin: '0 0 4px 0',
              font: '700 1.3rem var(--f-display)',
              letterSpacing: '0.02em',
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
            }}
          >
            Daily Drilling Report (DDR)
            <span className="pill idle" style={{ fontSize: '0.72rem' }}>
              Draft Template
            </span>
          </h1>
          <p className="hint" style={{ margin: 0 }}>
            Daily drilling operations log, 24-hour activity chronology, mud rheology, BHA specs, and HSE tracking.
          </p>
        </div>

        {/* Filters: Well & Date */}
        <div className="row" style={{ alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
          <div className="row" style={{ alignItems: 'center', gap: '6px' }}>
            <label htmlFor="ddr-well-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Wellbore:
            </label>
            <select
              id="ddr-well-select"
              value={selectedWell}
              onChange={(e) => setUserSelectedWell(e.target.value)}
              style={{ minWidth: '100px' }}
            >
              {order.length === 0 ? (
                <option value="L1">L1</option>
              ) : (
                order.map((w) => (
                  <option key={w} value={w}>
                    {w}
                  </option>
                ))
              )}
            </select>
          </div>

          <div className="row" style={{ alignItems: 'center', gap: '6px' }}>
            <label htmlFor="ddr-date-select" style={{ fontSize: '0.85rem', fontWeight: 600 }}>
              Date:
            </label>
            <input
              id="ddr-date-select"
              type="date"
              value={reportDate}
              onChange={(e) => setReportDate(e.target.value)}
              style={{ padding: '4px 8px', fontSize: '0.85rem' }}
            />
          </div>

          <button
            type="button"
            className="btn small primary"
            onClick={() => alert('DDR logging interface will be connected in the next phase.')}
          >
            + Create New DDR
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: '12px',
        }}
      >
        <div className="block" style={{ padding: '12px 16px' }}>
          <span className="hint" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
            Current Depth
          </span>
          <div style={{ font: '700 1.25rem var(--f-mono)', color: 'var(--ink)', marginTop: '4px' }}>
            — <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted)' }}>ft MD</span>
          </div>
        </div>

        <div className="block" style={{ padding: '12px 16px' }}>
          <span className="hint" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
            24-Hour Footage
          </span>
          <div style={{ font: '700 1.25rem var(--f-mono)', color: 'var(--ink)', marginTop: '4px' }}>
            0.0 <span style={{ fontSize: '0.8rem', fontWeight: 'normal', color: 'var(--muted)' }}>ft / day</span>
          </div>
        </div>

        <div className="block" style={{ padding: '12px 16px' }}>
          <span className="hint" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
            Current Operation
          </span>
          <div style={{ font: '600 1.05rem var(--f-sans)', color: 'var(--ink)', marginTop: '4px' }}>
            Standby / Routine
          </div>
        </div>

        <div className="block" style={{ padding: '12px 16px' }}>
          <span className="hint" style={{ fontSize: '0.75rem', textTransform: 'uppercase' }}>
            Safety / Incidents
          </span>
          <div style={{ font: '700 1.25rem var(--f-sans)', color: 'var(--ok, #10b981)', marginTop: '4px' }}>
            0 Anomalies
          </div>
        </div>
      </div>

      {/* Basic DDR Sections Structure */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(400px, 1.3fr) minmax(320px, 1fr)',
          gap: '16px',
        }}
        className="ddr-grid"
      >
        {/* Left Column: 24-hr Activity Chronology & Operations */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section className="block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ margin: 0, font: '600 1.05rem var(--f-display)' }}>
                24-Hour Activity Log ({reportDate})
              </h2>
              <span className="pill idle" style={{ fontSize: '0.7rem' }}>
                0 Entries
              </span>
            </div>

            <div
              style={{
                padding: '36px 16px',
                textAlign: 'center',
                border: '1px dashed var(--line)',
                borderRadius: '8px',
                background: 'color-mix(in srgb, var(--surface) 50%, transparent)',
              }}
            >
              <p className="hint" style={{ margin: 0 }}>
                No daily operations logged for {selectedWell} on {reportDate}.
              </p>
              <p style={{ margin: '6px 0 0 0', fontSize: '0.8rem', color: 'var(--muted)' }}>
                Activity periods (From–To hours, depth intervals, phase, and operation remarks) will appear here.
              </p>
            </div>
          </section>

          <section className="block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ margin: 0, font: '600 1.05rem var(--f-display)' }}>
              Operational Time Breakdown
            </h2>
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px dashed var(--line)',
                borderRadius: '8px',
              }}
            >
              <p className="hint" style={{ margin: 0 }}>
                Time distribution (Drilling, Tripping, Casing, Circulating, Waiting on Weather) will calculate automatically.
              </p>
            </div>
          </section>
        </div>

        {/* Right Column: Mud Properties & Drill String Specifications */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <section className="block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ margin: 0, font: '600 1.05rem var(--f-display)' }}>
              Mud Properties & Rheology
            </h2>
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px dashed var(--line)',
                borderRadius: '8px',
              }}
            >
              <p className="hint" style={{ margin: 0 }}>
                Density, funnel viscosity, plastic viscosity, yield point, and fluid loss parameters.
              </p>
            </div>
          </section>

          <section className="block" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h2 style={{ margin: 0, font: '600 1.05rem var(--f-display)' }}>
              Bottom Hole Assembly (BHA) Summary
            </h2>
            <div
              style={{
                padding: '24px 16px',
                textAlign: 'center',
                border: '1px dashed var(--line)',
                borderRadius: '8px',
              }}
            >
              <p className="hint" style={{ margin: 0 }}>
                Bit type, serial number, stabilizers, drill collars, and downhole motor specifications.
              </p>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
