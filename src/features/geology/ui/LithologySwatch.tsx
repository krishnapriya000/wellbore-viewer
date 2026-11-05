import { useEffect, useRef } from 'react';
import type { Lithology } from '../model/types';
import { drawLithologySwatch } from '../lib/lithologyPatterns';

export interface LithologySwatchProps {
  id?: string;
  lith: Lithology;
  baseColor?: string;
  width?: number;
  height?: number;
  className?: string;
  title?: string;
  style?: React.CSSProperties;
}

/**
 * Renders a visual pattern swatch canvas for a given lithology.
 * Displays the exact procedural pattern and base color matching the 3D viewport.
 */
export function LithologySwatch({
  id,
  lith,
  baseColor,
  width = 36,
  height = 22,
  className = 'lith-swatch',
  title,
  style,
}: LithologySwatchProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawLithologySwatch(canvas, lith, baseColor);
  }, [lith, baseColor, width, height]);

  return (
    <canvas
      ref={canvasRef}
      id={id}
      width={width}
      height={height}
      className={className}
      title={title}
      style={{
        display: 'inline-block',
        verticalAlign: 'middle',
        borderRadius: '3px',
        border: '1px solid var(--line, rgba(0,0,0,0.2))',
        flexShrink: 0,
        ...(className?.includes('sw') ? {} : { width: `${width}px`, height: `${height}px` }),
        ...style,
      }}
    />
  );
}
