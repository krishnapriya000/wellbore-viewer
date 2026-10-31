export { formationAt } from './lib/formationAt';
export {
  blendLithologyColor,
  DEFAULT_LITHOLOGY_COLOR,
  dominantLithology,
  formatCompSummary,
  LITHOLOGY_COLORS,
  LITHOLOGY_METAS,
  LITHOLOGY_META_LIST,
  type ColorRgb,
  type LithologyMeta,
} from './lib/lithologyColors';
export {
  clearLithologyTileCache,
  drawLithologySwatch,
  drawLithologyTile,
  getLithologyTileCanvas,
} from './lib/lithologyPatterns';
export { clearPersistedFormations, loadPersistedFormations, persistFormations } from './lib/persistence';
export {
  computeSleeveSegments,
  GEOLOGY_SCALE,
  pointToScene,
  type SleevePoint,
  type SleeveSegment,
} from './lib/sleevePath';
export { drawStripLog, type StripLogDrawOptions } from './lib/stripLogDraw';
export {
  computeMdIntervals,
  computeStripLogTicks,
  computeTvdIntervals,
  getIntervalsDepthRange,
  type DepthTick,
  type StripLogInterval,
} from './lib/stripLogLayout';
export { INITIAL_FORMATIONS, useGeologyStore, type GeologyState } from './model/geologyStore';
export { FormationSchema, LITHOLOGIES, type Formation, type Lithology } from './model/types';
export { FormationEditor } from './ui/FormationEditor';
export { LithologySwatch, type LithologySwatchProps } from './ui/LithologySwatch';
export { StripLog } from './ui/StripLog';
