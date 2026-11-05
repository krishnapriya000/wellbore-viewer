import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import type { Mesh } from 'three';
import { CatmullRomCurve3, TubeGeometry } from 'three';
import { useDrilling } from '@/features/drilling';
import { atMd, densify, stationsReached, type SurveyPoint, type Well } from '@/features/survey';
import { toScene } from '../../lib/scene';

/**
 * Builds the dense CatmullRom curve for the drilled actual path up to `md`.
 * Includes all survey stations reached plus the exact current tip point.
 */
function buildActualSamples(points: readonly SurveyPoint[], md: number): SurveyPoint[] {
  if (points.length < 2 || md <= 0) return [];
  const count = stationsReached(points, md);
  const stations = points.slice(0, count);
  const tip = atMd(points, md);
  const pts: SurveyPoint[] = [...stations];
  if (tip) {
    const last = pts.at(-1);
    if (!last || tip.md > last.md + 1e-4) {
      pts.push(tip);
    }
  }
  return pts.length >= 2 ? densify(pts) : [];
}

function buildActualCurve(points: readonly SurveyPoint[], md: number): CatmullRomCurve3 | null {
  const samples = buildActualSamples(points, md);
  if (samples.length < 2) return null;
  const scenePts = samples.map((p) => toScene(p));
  return scenePts.length > 1 ? new CatmullRomCurve3(scenePts, false, 'centripetal') : null;
}

/**
 * The drilled actual path for the actively drilling wellbore.
 * - Thick tube (radius 0.62) in prominent blue (`--actual`, #1f4fd1), distinctly thicker
 *   than the planned path (0.40).
 * - Smoothly extends and updates in real-time as the drill bit advances.
 * - Only the selected active wellbore renders an actual path; others remain as planned paths.
 */
export function ActualLayer({
  well,
  color,
  mode = 'actual',
  visible = true,
}: {
  well: Well;
  color: string;
  mode?: 'actual' | 'plan';
  visible?: boolean;
}) {
  const meshRef = useRef<Mesh>(null);
  const lastMdRef = useRef<number>(-1);
  const accRef = useRef<number>(0);

  const points = useMemo(() => {
    return mode === 'plan' || well.actual.length < 2 ? well.plan : well.actual;
  }, [mode, well.plan, well.actual]);

  // Initial curve for initial render and test assertions
  const initialCurve = useMemo(() => {
    const currentMd = useDrilling.getState().md;
    return (
      buildActualCurve(points, currentMd) ??
      (points.length > 1
        ? new CatmullRomCurve3(
            densify(points.slice(0, Math.min(2, points.length))).map((p) => toScene(p)),
            false,
            'centripetal',
          )
        : null)
    );
  }, [points]);

  useEffect(() => {
    const mesh = meshRef.current;
    return () => {
      mesh?.geometry?.dispose();
    };
  }, []);

  useFrame((_, dt) => {
    if (!visible || !meshRef.current) return;
    const drill = useDrilling.getState();
    if (drill.activeWell !== well.name) return;

    accRef.current += dt;
    if (accRef.current < 0.04) return; // ~25 FPS tube updates for butter-smooth animation
    accRef.current = 0;

    const currentMd = drill.md;
    if (Math.abs(currentMd - lastMdRef.current) < 1.0) return;
    lastMdRef.current = currentMd;

    const curve = buildActualCurve(points, currentMd);
    if (!curve) return;

    const newGeo = new TubeGeometry(
      curve,
      Math.min(1400, curve.points.length * 3),
      0.62,
      8,
      false,
    );
    meshRef.current.geometry.dispose();
    meshRef.current.geometry = newGeo;
  });

  if (!visible) return null;
  const isPlanMode = mode === 'plan';

  return (
    <mesh ref={meshRef} name={`actual-${well.name}`}>
      {initialCurve && (
        <tubeGeometry
          args={[
            initialCurve,
            Math.min(1400, initialCurve.points.length * 3),
            0.62,
            8,
            false,
          ]}
        />
      )}
      {isPlanMode ? (
        <meshBasicMaterial color={color} transparent opacity={0.25} depthWrite={false} />
      ) : (
        <meshStandardMaterial color={color} roughness={0.45} metalness={0.1} />
      )}
    </mesh>
  );
}
