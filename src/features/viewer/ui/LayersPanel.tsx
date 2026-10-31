import type { Well } from '@/features/survey';
import { useSceneColors, type SceneColors } from './useSceneColors';
import { useLayersState } from './useLayersState';

export interface LayersPanelProps {
  wells?: readonly Well[];
  colors?: SceneColors;
  showPlans?: boolean;
  planVisibility?: Record<string, boolean>;
  showActual?: boolean;
  showGeology?: boolean;
  showScale?: boolean;
  onTogglePlan?: (wellName: string, visible: boolean) => void;
  onToggleShowPlans?: (visible: boolean) => void;
  onToggleActual?: (visible: boolean) => void;
  onToggleGeology?: (visible: boolean) => void;
  onToggleScale?: (visible: boolean) => void;
}

const DEFAULT_WELLS = [
  { name: 'L1', slot: 0 },
  { name: 'L2', slot: 1 },
  { name: 'L3', slot: 2 },
];

export function LayersPanel(props?: LayersPanelProps) {
  const defaultColors = useSceneColors();
  const internal = useLayersState(props?.wells);

  const colors = props?.colors ?? defaultColors;
  const showPlans = props?.showPlans ?? internal.showPlans;
  const planVisibility = props?.planVisibility ?? internal.planVisibility;
  const showActual = props?.showActual ?? internal.showActual;
  const showGeology = props?.showGeology ?? internal.showGeology;
  const showScale = props?.showScale ?? internal.showScale;
  const onTogglePlan = props?.onTogglePlan ?? internal.togglePlan;
  const onToggleShowPlans = props?.onToggleShowPlans ?? internal.toggleShowPlans;
  const onToggleActual = props?.onToggleActual ?? internal.toggleActual;
  const onToggleGeology = props?.onToggleGeology ?? internal.toggleGeology;
  const onToggleScale = props?.onToggleScale ?? internal.toggleScale;

  const wells = props?.wells ?? [];
  const standardWells = DEFAULT_WELLS.map((dw) => {
    const found = wells.find((w) => w.name.toUpperCase() === dw.name.toUpperCase());
    return found ? { name: found.name, slot: found.slot } : dw;
  });

  const extraWells = wells.filter(
    (w) => !standardWells.some((sw) => sw.name.toUpperCase() === w.name.toUpperCase()),
  );

  const getWellColor = (slot: number) =>
    colors.wells[slot % colors.wells.length] ?? `var(--w${(slot % 6) + 1})`;

  return (
    <div
      className="hud legend"
      id="legend"
      role="region"
      aria-label="Layers"
      onPointerDown={(e) => e.stopPropagation()}
    >
      <div className="legend-header">LAYERS</div>

      {/* 1, 2, 3: Individual Plan Toggles */}
      {standardWells.map((w) => {
        const checked = planVisibility[w.name] ?? true;
        const inputId = `layer-plan-${w.name.toLowerCase()}`;
        return (
          <label key={w.name} className="row" htmlFor={inputId}>
            <input
              type="checkbox"
              id={inputId}
              data-testid={inputId}
              checked={checked}
              onChange={(e) => onTogglePlan(w.name, e.target.checked)}
            />
            <span className="sw" style={{ background: getWellColor(w.slot) }} />
            <span>{w.name} plan</span>
          </label>
        );
      })}

      {extraWells.map((w) => {
        const checked = planVisibility[w.name] ?? true;
        const inputId = `layer-plan-${w.name.toLowerCase()}`;
        return (
          <label key={w.name} className="row" htmlFor={inputId}>
            <input
              type="checkbox"
              id={inputId}
              data-testid={inputId}
              checked={checked}
              onChange={(e) => onTogglePlan(w.name, e.target.checked)}
            />
            <span className="sw" style={{ background: getWellColor(w.slot) }} />
            <span>{w.name} plan</span>
          </label>
        );
      })}

      {/* 4. Actual (drilling wellbore) */}
      <label className="row" htmlFor="layer-actual">
        <input
          type="checkbox"
          id="layer-actual"
          data-testid="layer-actual"
          checked={showActual}
          onChange={(e) => onToggleActual(e.target.checked)}
        />
        <span className="sw" style={{ background: colors.actual ?? 'var(--actual)' }} />
        <span>Actual (drilling wellbore)</span>
      </label>

      {/* 5. Show plans (Master toggle) */}
      <label className="row" htmlFor="layer-show-plans">
        <input
          type="checkbox"
          id="layer-show-plans"
          data-testid="layer-show-plans"
          checked={showPlans}
          onChange={(e) => onToggleShowPlans(e.target.checked)}
        />
        <span className="sw plan" />
        <span>Show plans</span>
      </label>

      {/* 6. Formations & lithology */}
      <label className="row" htmlFor="layer-formations">
        <input
          type="checkbox"
          id="layer-formations"
          data-testid="layer-formations"
          checked={showGeology}
          onChange={(e) => onToggleGeology(e.target.checked)}
        />
        <span className="sw formations" />
        <span>Formations & lithology</span>
      </label>

      {/* 7. MD / TVD scale */}
      <label className="row" htmlFor="layer-scale">
        <input
          type="checkbox"
          id="layer-scale"
          data-testid="layer-scale"
          checked={showScale}
          onChange={(e) => onToggleScale(e.target.checked)}
        />
        <span className="sw scale" style={{ background: colors.grid ?? 'var(--scene-grid)' }} />
        <span>MD / TVD scale</span>
      </label>
    </div>
  );
}
