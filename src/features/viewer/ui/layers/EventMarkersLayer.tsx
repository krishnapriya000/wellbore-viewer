import { Html } from '@react-three/drei';
import { useEffect, useMemo, useRef, useState } from 'react';
import { computeEventMarkers, drawEventIcon, type PlacedEventMarker } from '@/features/events';
import { useEventsStore } from '@/features/events';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { formatNumber } from '@/shared/units/units';

function EventMarkerBadge({ marker }: { marker: PlacedEventMarker }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hovered, setHovered] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, 28, 28);
    drawEventIcon(ctx, marker.type, 14, 14, 28, {
      badge: true,
      color: marker.color.fg,
      bgColor: marker.color.bg,
      borderColor: marker.color.border,
    });
  }, [marker.type, marker.color]);

  return (
    <div
      className="event-marker-badge"
      style={{ borderColor: marker.color.border }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      title={`${marker.label} (${marker.well}) at ${formatNumber(marker.mdDisplay, 1)} ${marker.unit}${marker.note ? `\n${marker.note}` : ''}`}
    >
      <canvas
        ref={canvasRef}
        width={28}
        height={28}
        style={{ width: '18px', height: '18px', display: 'block', flexShrink: 0 }}
      />
      <div className="event-marker-info">
        <span className="event-marker-title">{marker.label}</span>
        <span className="event-marker-depth">
          {formatNumber(marker.mdDisplay, 1)} {marker.unit}
        </span>
      </div>

      {hovered && marker.note && (
        <div className="event-marker-tooltip">
          <strong>
            {marker.label} · {marker.well}
          </strong>
          <small>
            {formatNumber(marker.mdDisplay, 1)} {marker.unit} MD
          </small>
          <p>{marker.note}</p>
        </div>
      )}
    </div>
  );
}

/**
 * 3D Event Markers Layer
 *
 * Displays all engineering events anchored at their exact MD positions along
 * their respective wellbore trajectories.
 *
 * Characteristics:
 * - Rebuilds marker geometry and placements only when events, wells, or units change.
 * - Does not perform any React setState calls or re-renders inside per-frame loops.
 * - Anchors 3D marker pins to wellbore trajectories with legible billboarding HTML badges.
 * - Shows event type, well, MD, and notes with color-coded category borders.
 */
export function EventMarkersLayer() {
  const events = useEventsStore((s) => s.events);
  const eventsVersion = useEventsStore((s) => s.version);
  const wells = useSurveyStore((s) => s.wells);
  const order = useSurveyStore((s) => s.order);
  const unit = useSettings((s) => s.unit);

  const wellsVersion = useMemo(
    () => order.map((n) => `${n}:${wells[n]?.version ?? 0}`).join('|'),
    [order, wells],
  );

  const markers = useMemo(
    () => computeEventMarkers(events, wells, unit),
    // eslint-disable-next-line react-hooks/exhaustive-deps -- eventsVersion & wellsVersion track content modifications
    [events, eventsVersion, wells, wellsVersion, unit],
  );

  if (markers.length === 0) return null;

  return (
    <group name="event-markers-layer">
      {markers.map((marker) => (
        <group
          key={marker.id}
          name={`event-marker-${marker.id}`}
          position={[marker.position.x, marker.position.y, marker.position.z]}
        >
          {/* 3D anchor sphere on wellbore */}
          <mesh>
            <sphereGeometry args={[0.42, 12, 8]} />
            <meshBasicMaterial color={marker.color.border} />
          </mesh>

          {/* Stalk connecting wellbore anchor to badge */}
          <mesh position={[0, 0.7, 0]}>
            <cylinderGeometry args={[0.05, 0.05, 1.4, 6]} />
            <meshBasicMaterial color={marker.color.border} transparent opacity={0.65} />
          </mesh>

          {/* Billboarding HTML Badge with 2D Canvas Icon */}
          <Html position={[0, 1.6, 0]} center distanceFactor={28} className="event-marker-wrapper">
            <EventMarkerBadge marker={marker} />
          </Html>
        </group>
      ))}
    </group>
  );
}
