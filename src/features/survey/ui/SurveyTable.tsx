import { useState } from 'react';
import { useThrottledStore } from '@/shared/lib/useThrottledStore';
import { Segmented } from '@/shared/ui/Segmented';
import { dlsToDisplay, formatNumber } from '@/shared/units/units';
import { useUnits } from '@/shared/units/useUnits';
import { stationsReached } from '../lib/mcm';
import { useSurveyStore } from '../model/surveyStore';
import type { StoreApi, UseBoundStore } from 'zustand';

/** `bitStore` is passed in so this feature does not import the drilling feature. */
export function SurveyTable({
  well,
  bitStore,
}: {
  well: string | null;
  bitStore: UseBoundStore<StoreApi<{ md: number }>>;
}) {
  const [mode, setMode] = useState<'actual' | 'plan'>('actual');
  const w = useSurveyStore((s) => (well ? s.wells[well] : undefined));
  const md = useThrottledStore(bitStore, (s) => s.md, 250);
  const units = useUnits();
  const rows = !w
    ? []
    : mode === 'plan'
      ? w.plan
      : w.actual.slice(0, stationsReached(w.actual, md)).reverse();

  return (
    <section className="block">
      <h2>
        Survey table
        <Segmented
          label="Table source"
          value={mode}
          onChange={setMode}
          options={[
            { value: 'actual', label: 'Actual' },
            { value: 'plan', label: 'Plan' },
          ]}
        />
      </h2>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <th>MD</th>
              <th>Inc</th>
              <th>Azi</th>
              <th>TVD</th>
              <th>N(+)/S</th>
              <th>E(+)/W</th>
              <th>DLS</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((s, i) => (
              <tr key={s.md} className={mode === 'actual' && i === 0 ? 'new' : undefined}>
                <td>{units.depthValue(s.md)}</td>
                <td>{formatNumber(s.inc, 2)}</td>
                <td>{formatNumber(s.azi, 2)}</td>
                <td>{units.depthValue(s.tvd)}</td>
                <td>{units.depthValue(s.n)}</td>
                <td>{units.depthValue(s.e)}</td>
                <td className={s.dls > 3.0001 ? 'hot' : undefined}>
                  {formatNumber(dlsToDisplay(s.dls, units.unit), 2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
