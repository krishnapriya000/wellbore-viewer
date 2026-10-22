export {
  computeConstructionRadius,
  computeConstructionSegments,
  sampleTrajectorySpan,
  type Construction3DSegment,
} from './lib/casingGeometry';
export { checkItem, holeAt, itemsFor } from './lib/rules';
export {
  computeHalfWidthPx,
  computeSchematicTicks,
  drawSchematic,
  layoutCallouts,
  type SchematicCallout,
  type SchematicDrawOptions,
  type SchematicTick,
} from './lib/schematicDraw';
export {
  CASING_SIZES_IN,
  ConstructionItemSchema,
  HOLE_SIZES_IN,
  type ConstructionItem,
} from './model/types';
export {
  useConstructionStore,
  INITIAL_CONSTRUCTION_ITEMS,
  type ConstructionState,
} from './model/constructionStore';
export { ConstructionEditor } from './ui/ConstructionEditor';
export { Schematic } from './ui/Schematic';
