import { useSettings } from '@/shared/settings/settingsStore';
import { dlsLabel, dlsToDisplay, formatDepth, formatNumber, toDisplay, toFeet } from './units';

/** Components format and parse depths only through this hook. */
export function useUnits() {
  const unit = useSettings((s) => s.unit);
  return {
    unit,
    depth: (ft: number, digits = 1) => formatDepth(ft, unit, digits),
    depthValue: (ft: number, digits = 1) => formatNumber(toDisplay(ft, unit), digits),
    dls: (v: number) => `${formatNumber(dlsToDisplay(v, unit), 2)} ${dlsLabel(unit)}`,
    parseDepth: (input: number) => toFeet(input, unit),
  };
}
