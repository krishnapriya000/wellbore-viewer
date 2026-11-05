import { useEffect, useMemo } from 'react';
import type { SpriteMaterial, Vector3 } from 'three';
import { createTextSprite } from '../lib/scene';

export interface TextSpriteProps {
  text: string;
  color: string;
  height?: number;
  weight?: number | string;
  bg?: string | null;
  position?: [number, number, number] | Vector3;
  center?: [number, number];
}

export function TextSprite({
  text,
  color,
  height = 3.2,
  weight = 600,
  bg = null,
  position = [0, 0, 0],
  center,
}: TextSpriteProps) {
  const sprite = useMemo(() => {
    const s = createTextSprite(text, color, height, weight, bg);
    if (s && center) {
      s.center.set(center[0], center[1]);
    }
    return s;
  }, [text, color, height, weight, bg, center]);

  useEffect(() => {
    return () => {
      if (!sprite) return;
      (sprite.material as SpriteMaterial).map?.dispose();
      (sprite.material as SpriteMaterial).dispose();
    };
  }, [sprite]);

  if (!sprite) return null;

  if (Array.isArray(position)) {
    sprite.position.set(...position);
  } else {
    sprite.position.copy(position);
  }

  return <primitive object={sprite} />;
}

