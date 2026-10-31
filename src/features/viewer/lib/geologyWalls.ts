import { Box3, Vector3 } from 'three';
import {
  blendLithologyColor,
  dominantLithology,
  formatCompSummary,
  type ColorRgb,
  type Formation,
  type Lithology,
} from '@/features/geology';
import { atMd, type Well } from '@/features/survey';
import { SCALE, toScene } from './scene';

export interface TvdWallDescriptor {
  id: string;
  name: string;
  ref: 'TVD';
  well: string;
  fromFt: number;
  toFt: number;
  color: ColorRgb;
  compSummary: string;
  dominantLith: Lithology;
  comp: readonly { lith: Lithology; pct: number }[];
  position: [number, number, number];
  size: [number, number, number];
  labelPosition: [number, number, number];
  yTop: number;
  yBottom: number;
  northWallPosition: [number, number, number];
  northWallSize: [number, number];
  westWallPosition: [number, number, number];
  westWallSize: [number, number];
  topPlanePosition: [number, number, number];
  topPlaneSize: [number, number];
  horizonLoop: [number, number, number][];
}

export interface MdOverrideDescriptor {
  id: string;
  name: string;
  ref: 'MD';
  well: string;
  fromFt: number;
  toFt: number;
  color: ColorRgb;
  compSummary: string;
  dominantLith: Lithology;
  comp: readonly { lith: Lithology; pct: number }[];
  position: [number, number, number];
  size: [number, number, number];
  labelPosition: [number, number, number];
}

export interface GeologyWallsLayout {
  tvdWalls: TvdWallDescriptor[];
  mdOverrides: MdOverrideDescriptor[];
  footprint: {
    minX: number;
    maxX: number;
    minZ: number;
    maxZ: number;
    width: number;
    depth: number;
  };
}

/**
 * Computes 3D geometry descriptors for stratigraphic formation walls and localized MD overrides.
 *
 * Requirements satisfied:
 * - Extents derived from actual well geometry bounds (with sensible padding).
 * - Correct scene depth conventions (increasing TVD is negative Y).
 * - Correct handling of TVD regional layers and wellbore-specific MD overrides.
 */
export function computeGeologyWalls(
  formations: readonly Formation[],
  bounds: Box3,
  wells: readonly Well[],
): GeologyWallsLayout {
  const size = bounds.getSize(new Vector3());

  // Horizontal footprint padding around well trajectories (minimum 30 scene units)
  const padX = Math.max(15, size.x * 0.15);
  const padZ = Math.max(15, size.z * 0.15);

  const minX = bounds.min.x === 0 && bounds.max.x === 0 ? -30 : bounds.min.x - padX;
  const maxX = bounds.min.x === 0 && bounds.max.x === 0 ? 30 : bounds.max.x + padX;
  const minZ = bounds.min.z === 0 && bounds.max.z === 0 ? -30 : bounds.min.z - padZ;
  const maxZ = bounds.min.z === 0 && bounds.max.z === 0 ? 30 : bounds.max.z + padZ;

  const width = Math.max(20, maxX - minX);
  const depth = Math.max(20, maxZ - minZ);
  const centerX = (minX + maxX) / 2;
  const centerZ = (minZ + maxZ) / 2;

  const tvdWalls: TvdWallDescriptor[] = [];
  const mdOverrides: MdOverrideDescriptor[] = [];

  for (const f of formations) {
    if (f.visible === false || f.from >= f.to) continue; // Skip hidden or invalid intervals

    const color = blendLithologyColor(f.comp);
    const compSummary = formatCompSummary(f);

    if (f.ref === 'TVD') {
      const yTop = -f.from * SCALE;
      const yBottom = -f.to * SCALE;
      const height = (f.to - f.from) * SCALE;
      const centerY = -(f.from + f.to) * 0.5 * SCALE;
      const dominantLith = dominantLithology(f.comp);

      const northWallPosition: [number, number, number] = [centerX, centerY, minZ];
      const northWallSize: [number, number] = [width, height];
      const westWallPosition: [number, number, number] = [minX, centerY, centerZ];
      const westWallSize: [number, number] = [depth, height];
      const topPlanePosition: [number, number, number] = [centerX, yTop, centerZ];
      const topPlaneSize: [number, number] = [width, depth];
      const horizonLoop: [number, number, number][] = [
        [minX, yTop, minZ],
        [maxX, yTop, minZ],
        [maxX, yTop, maxZ],
        [minX, yTop, maxZ],
        [minX, yTop, minZ],
      ];

      tvdWalls.push({
        id: f.id,
        name: f.name,
        ref: 'TVD',
        well: f.well,
        fromFt: f.from,
        toFt: f.to,
        color,
        compSummary,
        dominantLith,
        comp: f.comp,
        position: [centerX, centerY, centerZ],
        size: [width, height, depth],
        // Place label on the north back-wall, 20% from the top of the formation,
        // centered horizontally — this is the most visible face in the default camera view.
        labelPosition: [centerX, yTop - height * 0.2, minZ],
        yTop,
        yBottom,
        northWallPosition,
        northWallSize,
        westWallPosition,
        westWallSize,
        topPlanePosition,
        topPlaneSize,
        horizonLoop,
      });
    } else if (f.ref === 'MD') {
      const dominantLith = dominantLithology(f.comp);
      // Find the associated wellbore
      const targetWell = wells.find((w) => w.name === f.well);
      const points = targetWell ? (targetWell.actual.length >= 2 ? targetWell.actual : targetWell.plan) : [];

      if (points.length >= 2) {
        // Sample points along the MD override interval
        const localBox = new Box3();
        const tmp = new Vector3();
        const startP = atMd(points, f.from);
        const endP = atMd(points, f.to);
        const midP = atMd(points, (f.from + f.to) / 2);

        if (startP) localBox.expandByPoint(toScene(startP, tmp));
        if (endP) localBox.expandByPoint(toScene(endP, tmp));
        if (midP) localBox.expandByPoint(toScene(midP, tmp));

        // Add padding around the wellbore segment
        const localSize = localBox.getSize(new Vector3());
        const localCenter = localBox.getCenter(new Vector3());

        const wSize = Math.max(4, localSize.x + 4);
        const hSize = Math.max(4, localSize.y + 4);
        const dSize = Math.max(4, localSize.z + 4);

        mdOverrides.push({
          id: f.id,
          name: f.name,
          ref: 'MD',
          well: f.well,
          fromFt: f.from,
          toFt: f.to,
          color,
          compSummary,
          dominantLith,
          comp: f.comp,
          position: [localCenter.x, localCenter.y, localCenter.z],
          size: [wSize, hSize, dSize],
          labelPosition: [localCenter.x, localCenter.y + hSize / 2 + 1.2, localCenter.z],
        });
      }
    }
  }

  return {
    tvdWalls,
    mdOverrides,
    footprint: { minX, maxX, minZ, maxZ, width, depth },
  };
}
