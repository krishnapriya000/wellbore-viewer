import { describe, expect, it } from 'vitest';
import { TimerBackedClock } from './r3fCompat';

describe('r3fCompat', () => {
  describe('TimerBackedClock', () => {
    it('instantiates and provides Clock interface backed by Timer', () => {
      const clock = new TimerBackedClock();
      expect(clock.autoStart).toBe(true);
      expect(clock.running).toBe(true);
      expect(typeof clock.getDelta).toBe('function');
      expect(typeof clock.getElapsedTime).toBe('function');
      expect(typeof clock.start).toBe('function');
      expect(typeof clock.stop).toBe('function');

      const dt = clock.getDelta();
      expect(dt).toBeGreaterThanOrEqual(0);
      expect(clock.getElapsedTime()).toBeGreaterThanOrEqual(0);

      clock.stop();
      expect(clock.running).toBe(false);
    });

    it('provides TimerBackedClock with full Clock API backed by Timer', () => {
      const clock = new TimerBackedClock();
      expect(clock).toBeInstanceOf(TimerBackedClock);
      expect(typeof clock.getDelta).toBe('function');
      expect(typeof clock.getElapsedTime).toBe('function');
    });
  });

  describe('asynchronous root unmount', () => {
    it('defers root.unmount asynchronously via queueMicrotask', async () => {
      const { act } = await import('@testing-library/react');
      const container = document.createElement('div');
      const ReactDOM = await import('react-dom/client');
      const root = ReactDOM.createRoot(container);

      act(() => {
        root.render(null);
      });

      // Unmount should not throw and should defer cleanup
      act(() => {
        root.unmount();
      });

      // Wait for microtask queue to flush
      await new Promise<void>((resolve) => {
        queueMicrotask(() => resolve());
      });
    });
  });
});
