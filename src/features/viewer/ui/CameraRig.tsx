import { useThree } from '@react-three/fiber';
import { useEffect } from 'react';
import { Vector3, type Box3, type PerspectiveCamera } from 'three';

/** The subset of OrbitControls this rig needs; avoids importing a transitive dependency. */
interface Controls {
  target: Vector3;
  update(): void;
}

export type CameraView = '3d' | 'plan' | 'section';

/**
 * Fits the camera ONLY when the view button changes or a new data set loads (`fitKey`).
 * Bit progress never moves the camera — the user can orbit freely while drilling.
 */
export function CameraRig({ view, bounds, fitKey }: { view: CameraView; bounds: Box3; fitKey: string }) {
  const get = useThree((s) => s.get);
  // Re-run once OrbitControls (makeDefault) has registered itself.
  const hasControls = useThree((s) => !!s.controls);

  useEffect(() => {
    const { camera: cam, controls: ctl } = get();
    const camera = cam as PerspectiveCamera;
    const controls = ctl as unknown as Controls | null;
    if (!controls) return;
    const c = bounds.getCenter(new Vector3());
    const r = bounds.getSize(new Vector3()).length() * 0.62 + 20;
    controls.target.copy(c);
    if (view === 'plan') camera.position.set(c.x, c.y + r * 1.9, c.z + 0.01);
    else if (view === 'section') camera.position.set(c.x, c.y, c.z + r * 1.9);
    else camera.position.set(c.x + r * 1.05, c.y + r * 0.75, c.z + r * 1.25);
    camera.far = r * 30;
    camera.updateProjectionMatrix();
    controls.update();
    // eslint-disable-next-line react-hooks/exhaustive-deps -- fitKey stands in for bounds content
  }, [view, fitKey, hasControls, get]);

  return null;
}
