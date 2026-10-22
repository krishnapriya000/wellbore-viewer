import { Html } from '@react-three/drei';
import { useMemo, useState } from 'react';
import { CatmullRomCurve3, Vector3 } from 'three';
import {
  computeConstructionSegments,
  useConstructionStore,
  type Construction3DSegment,
} from '@/features/construction';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber, toDisplay } from '@/shared/units/units';

interface CasingShoeProps {
  segment: Construction3DSegment;
  unit: 'ft' | 'm';
}

function CasingShoe({ segment, unit }: Readonly<CasingShoeProps>) {
  const [hovered, setHovered] = useState(false);
  if (!segment.shoePosition) return null;

  const depthDisplay = formatNumber(toDisplay(segment.toMd, unit), 0);
  const shoeColor = segment.hasWarnings ? '#e74c3c' : '#f39c12';

  return (
    <group
      name={`casing-shoe-${segment.id}`}
      position={[segment.shoePosition[0], segment.shoePosition[1], segment.shoePosition[2]]}
    >
      {/* 3D collar ring marking the casing shoe datum */}
      <mesh>
        <cylinderGeometry args={[segment.radius * 1.08, segment.radius * 1.08, 0.35, 16]} />
        <meshStandardMaterial
          color={shoeColor}
          metalness={0.7}
          roughness={0.3}
          transparent
          opacity={0.95}
        />
      </mesh>

      {/* Billboarding HTML annotation */}
      <Html
        position={[0, -0.6, 0]}
        center
        distanceFactor={32}
        className="casing-shoe-annotation"
        style={{ pointerEvents: 'auto' }}
      >
        <div
          role="button"
          tabIndex={0}
          className={`casing-shoe-pill ${segment.hasWarnings ? 'has-warning' : ''}`}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            padding: '2px 6px',
            borderRadius: '4px',
            fontSize: '10px',
            fontWeight: 600,
            fontFamily: 'var(--font-mono, monospace)',
            background: segment.hasWarnings ? 'rgba(231, 76, 60, 0.9)' : 'rgba(30, 41, 59, 0.85)',
            color: '#ffffff',
            border: `1px solid ${shoeColor}`,
            boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
            cursor: 'pointer',
            userSelect: 'none',
            whiteSpace: 'nowrap',
          }}
          onMouseEnter={() => setHovered(true)}
          onMouseLeave={() => setHovered(false)}
          onFocus={() => setHovered(true)}
          onBlur={() => setHovered(false)}
          title={`${segment.sizeInches}" Shoe at ${depthDisplay} ${unit}`}
        >
          <span>
            {segment.sizeInches}&quot; Shoe @ {depthDisplay} {unit}
          </span>
          {segment.hasWarnings && <span>⚠️</span>}

          {hovered && (
            <div
              className="casing-shoe-tooltip"
              style={{
                position: 'absolute',
                bottom: '100%',
                left: '50%',
                transform: 'translateX(-50%)',
                marginBottom: '6px',
                padding: '6px 8px',
                borderRadius: '6px',
                background: '#0f172a',
                border: `1px solid ${shoeColor}`,
                color: '#f8fafc',
                fontSize: '11px',
                fontWeight: 400,
                textAlign: 'left',
                boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
                zIndex: 100,
                minWidth: '160px',
              }}
            >
              <div style={{ fontWeight: 600, color: shoeColor, marginBottom: '2px' }}>
                {segment.sizeInches}&quot; Casing String ({segment.wellName})
              </div>
              <div>
                Interval: {formatNumber(toDisplay(segment.fromMd, unit), 0)} – {depthDisplay} {unit}
              </div>
              {segment.warnings.map((w, idx) => (
                <div
                  key={`warn-${idx}`}
                  style={{ color: '#fca5a5', marginTop: '3px', fontSize: '10px' }}
                >
                  ⚠️ {w}
                </div>
              ))}
            </div>
          )}
        </div>
      </Html>
    </group>
  );
}

function ConstructionSegmentMesh({ segment }: Readonly<{ segment: Construction3DSegment }>) {
  const curve = useMemo(() => {
    if (segment.points.length < 2) return null;
    const pts = segment.points.map((p) => new Vector3(p[0], p[1], p[2]));
    return new CatmullRomCurve3(pts, false, 'centripetal');
  }, [segment.points]);

  if (!curve) return null;

  // Material and geometry parameters based on construction kind
  let color = '#a6b2be';
  let roughness = 0.35;
  let metalness = 0.65;
  let opacity = 0.85;
  let depthWrite = true;
  let radialSegments = 10;

  if (segment.kind === 'casing') {
    color = segment.hasWarnings ? '#e67e22' : '#bdc3c7';
    metalness = 0.7;
    roughness = 0.3;
    opacity = 0.88;
    depthWrite = true;
  } else if (segment.kind === 'cement') {
    // Annular cement sheath enveloping casing
    color = segment.hasWarnings ? '#e74c3c' : '#c5d1d9';
    metalness = 0.05;
    roughness = 0.95;
    opacity = 0.42;
    depthWrite = false;
  } else if (segment.kind === 'hole') {
    // Outer drilled borehole rock wall
    color = segment.hasWarnings ? '#d35400' : '#4a5568';
    metalness = 0.05;
    roughness = 0.85;
    opacity = 0.18;
    depthWrite = false;
    radialSegments = 12;
  }

  const tubularSegments = Math.min(400, Math.max(4, segment.points.length * 2));

  return (
    <mesh name={`construction-${segment.id}`}>
      <tubeGeometry args={[curve, tubularSegments, segment.radius, radialSegments, false]} />
      <meshStandardMaterial
        color={color}
        roughness={roughness}
        metalness={metalness}
        transparent
        opacity={opacity}
        depthWrite={depthWrite}
      />
    </mesh>
  );
}

/**
 * 3D Casing, Cement, and Hole Construction Visualization Layer.
 *
 * Characteristics:
 * - Concentric hierarchy: Trajectory core < Casing string < Cement sheath < Drilled hole boundary.
 * - Explicit, documented visual scale for diameters to guarantee field-scale visibility.
 * - Respects well associations: shared 'All' items map to motherbore; well-specific items map only to their lateral.
 * - Renders beveled casing shoes with billboarding depth annotations.
 * - Visually differentiates items triggering fit-check engineering warnings.
 * - Memoized on constructionVersion and survey dataKey; zero per-frame React state churn.
 */
export function CasingLayer() {
  const items = useConstructionStore((s) => s.items);
  const constructionVersion = useConstructionStore((s) => s.version);
  const wells = useSurveyStore((s) => s.wells);
  const order = useSurveyStore((s) => s.order);
  const unit = useSettings((s) => s.unit);

  const wellsVersionKey = useMemo(
    () => order.map((n) => `${n}:${wells[n]?.version ?? 0}`).join('|'),
    [order, wells],
  );

  const segments = useMemo(() => {
    if (order.length === 0 || items.length === 0) return [];
    return computeConstructionSegments(items, wells, order);
    // eslint-disable-next-line react-hooks/exhaustive-deps -- tracked by version keys
  }, [items, constructionVersion, wells, wellsVersionKey, order]);

  if (segments.length === 0) return null;

  return (
    <group name="construction-casing-layer">
      {/* 1. Hole rock walls (outermost, translucent) */}
      {segments
        .filter((s) => s.kind === 'hole')
        .map((seg) => (
          <ConstructionSegmentMesh key={seg.id} segment={seg} />
        ))}

      {/* 2. Cement annular sheaths (middle, translucent matte) */}
      {segments
        .filter((s) => s.kind === 'cement')
        .map((seg) => (
          <ConstructionSegmentMesh key={seg.id} segment={seg} />
        ))}

      {/* 3. Casing pipe strings (inner, metallic steel) */}
      {segments
        .filter((s) => s.kind === 'casing')
        .map((seg) => (
          <ConstructionSegmentMesh key={seg.id} segment={seg} />
        ))}

      {/* 4. Casing shoes and depth datum annotations */}
      {segments
        .filter((s) => s.kind === 'casing' && s.shoePosition)
        .map((seg) => (
          <CasingShoe key={`shoe-${seg.id}`} segment={seg} unit={unit} />
        ))}
    </group>
  );
}
