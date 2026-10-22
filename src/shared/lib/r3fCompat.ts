import * as ReactDOMClient from 'react-dom/client';
import * as THREE from 'three';
import { Timer } from 'three';

/**
 * 1. Safe Timer-backed Clock implementation.
 * Three.js r183 deprecated THREE.Clock in favor of THREE.Timer.
 * @react-three/fiber v9 instantiates `new THREE.Clock()` internally when setting up its default store.
 * By bridging THREE.Clock with THREE.Timer, R3F gets the modern Timer precision without deprecation warnings.
 */
export class TimerBackedClock {
  autoStart: boolean;
  startTime = 0;
  oldTime = 0;
  elapsedTime = 0;
  running = false;
  private _timer: Timer;

  constructor(autoStart = true) {
    this.autoStart = autoStart;
    this._timer = new Timer();
    if (typeof document !== 'undefined') {
      this._timer.connect(document);
    }
    if (autoStart) {
      this.start();
    }
  }

  start(): void {
    this.startTime = performance.now();
    this.oldTime = this.startTime;
    this.elapsedTime = 0;
    this.running = true;
    this._timer.reset();
  }

  stop(): void {
    this.getElapsedTime();
    this.running = false;
    this.autoStart = false;
  }

  getElapsedTime(): number {
    this.getDelta();
    return this.elapsedTime;
  }

  getDelta(): number {
    let diff = 0;
    if (this.autoStart && !this.running) {
      this.start();
      return 0;
    }
    if (this.running) {
      this._timer.update();
      diff = this._timer.getDelta();
      this.elapsedTime = this._timer.getElapsed();
      this.oldTime = performance.now();
    }
    return diff;
  }
}

// Define on THREE.Clock if not already patched
if ((THREE.Clock as unknown) !== TimerBackedClock) {
  try {
    Object.defineProperty(THREE, 'Clock', {
      value: TimerBackedClock,
      writable: true,
      configurable: true,
    });
  } catch {
    // Ignore if immutable
  }
}

/**
 * 2. Asynchronous Root Unmount Protection.
 * In React 19, synchronous unmounting of nested roots during an active render or commit phase
 * (such as in @react-three/drei's <Html> component layout effect cleanup) triggers:
 * "Attempted to synchronously unmount a root while React was already rendering."
 *
 * Wrapping createRoot to defer unmount via `queueMicrotask` ensures:
 * - Cleanup occurs immediately after the active React render/commit phase completes.
 * - Unmounting is safe, idempotent, and avoids race conditions.
 * - StrictMode and HMR continue to function cleanly.
 */
const originalCreateRoot = ReactDOMClient.createRoot;
if (typeof originalCreateRoot === 'function' && !(originalCreateRoot as unknown as Record<string, unknown>)['__patched']) {
  const patchedCreateRoot = function (
    this: unknown,
    container: Element | DocumentFragment,
    options?: ReactDOMClient.RootOptions,
  ): ReactDOMClient.Root {
    const root = originalCreateRoot.call(this, container, options);
    const originalUnmount = root.unmount.bind(root);
    let isUnmounted = false;
    root.unmount = () => {
      if (isUnmounted) return;
      isUnmounted = true;
      queueMicrotask(() => {
        try {
          originalUnmount();
        } catch {
          // Idempotent safety catch
        }
      });
    };
    return root;
  };

  (patchedCreateRoot as unknown as Record<string, unknown>)['__patched'] = true;
  try {
    Object.defineProperty(ReactDOMClient, 'createRoot', {
      value: patchedCreateRoot,
      writable: true,
      configurable: true,
    });
  } catch {
    // Ignore if immutable
  }
}
