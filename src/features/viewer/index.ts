export { SCALE, toScene, wellBounds } from './lib/scene';
export {
  computeMdMarkers,
  computeStaffPosition,
  computeTvdTicks,
  pickMdInterval,
  pickTvdInterval,
  tvdToSceneY,
  type DepthTick,
  type MdMarker,
  type Point3D,
  type StaffPosition,
} from './lib/scale';
export { createLithologyTexture } from './lib/lithologyTexture';
export {
  computeGeologyWalls,
  type GeologyWallsLayout,
  type MdOverrideDescriptor,
  type TvdWallDescriptor,
} from './lib/geologyWalls';
// The viewport pulls in three.js; load it lazily from the app shell.
export { Viewport } from './ui/Viewport';
export { LayersPanel, type LayersPanelProps } from './ui/LayersPanel';
export { useLayersState, type LayersState, type UseLayersStateReturn } from './ui/useLayersState';
export { CasingLayer } from './ui/layers/CasingLayer';
export { EventMarkersLayer } from './ui/layers/EventMarkersLayer';
export { GeologyWallsLayer } from './ui/layers/GeologyWallsLayer';
export { ScaleLayer } from './ui/layers/ScaleLayer';
export { SleeveLayer } from './ui/layers/SleeveLayer';
