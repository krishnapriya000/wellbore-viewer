import { act, render, screen } from '@testing-library/react';
import { Box3, Vector3 } from 'three';
import { beforeEach, describe, expect, it } from 'vitest';
import { useGeologyStore } from '@/features/geology';
import type { Well } from '@/features/survey';
import { GeologyWallsLayer } from './GeologyWallsLayer';
import { SleeveLayer } from './SleeveLayer';

// Mock React Three Fiber / Drei components that render inside a 3D canvas
vi.mock('@react-three/drei', () => ({
  Html: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="html-mock" className={className}>
      {children}
    </div>
  ),
}));

const MOCK_WELL: Well = {
  name: 'L1',
  slot: 0,
  junction: 0,
  version: 1,
  plan: [
    { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
    { md: 1000, inc: 0, azi: 0, tvd: 1000, n: 0, e: 0, dls: 0, beta: 0 },
    { md: 2000, inc: 30, azi: 45, tvd: 1900, n: 100, e: 100, dls: 1.5, beta: 0 },
    { md: 4200, inc: 90, azi: 45, tvd: 3800, n: 1000, e: 1000, dls: 3, beta: 0 },
  ],
  actual: [],
};

const MOCK_BOUNDS = new Box3(new Vector3(-50, -50, -50), new Vector3(50, 0, 50));

describe('<GeologyWallsLayer> and <SleeveLayer>', () => {
  beforeEach(() => {
    useGeologyStore.getState().resetToSample();
    useGeologyStore.setState({ version: 0 });
  });

  describe('GeologyWallsLayer', () => {
    it('renders stratigraphic labels for configured TVD formations', () => {
      render(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);

      expect(screen.getByText('Overburden')).toBeInTheDocument();
      expect(screen.getByText('Upper Shale')).toBeInTheDocument();
      expect(screen.getByText('Target Sand')).toBeInTheDocument();
      expect(screen.getByText('Lower Carbonate')).toBeInTheDocument();
    });

    it('renders localized MD override badge for well-specific formation', () => {
      render(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);

      expect(screen.getByText(/Sand Stringer \(L1 MD Override\)/i)).toBeInTheDocument();
    });

    it('refreshes rendered layers when formation data is edited in geologyStore', () => {
      const { rerender } = render(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);

      expect(screen.queryByText('Deep Basement Layer')).not.toBeInTheDocument();

      // Add a new formation through the store
      act(() => {
        useGeologyStore.getState().addFormation({
          name: 'Deep Basement Layer',
          ref: 'TVD',
          well: 'All',
          from: 6500,
          to: 8500,
          comp: [{ lith: 'basement', pct: 100 }],
        });
      });

      rerender(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);

      expect(screen.getByText('Deep Basement Layer')).toBeInTheDocument();
    });
  });

  describe('SleeveLayer', () => {
    it('renders sleeve segments for a well trajectory', () => {
      const { container } = render(<SleeveLayer well={MOCK_WELL} />);

      // Contains group for the well
      expect(container.querySelector('group[name="sleeve-layer-L1"]')).toBeDefined();
    });

    it('refreshes sleeve segments when formations are updated', () => {
      const { rerender } = render(<SleeveLayer well={MOCK_WELL} />);

      // Update formation in store
      act(() => {
        useGeologyStore.getState().updateFormation('fm-1', {
          name: 'Modified Overburden',
          ref: 'TVD',
          well: 'All',
          from: 0,
          to: 1200,
          comp: [{ lith: 'sandstone', pct: 100 }],
        });
      });

      rerender(<SleeveLayer well={MOCK_WELL} />);
      expect(useGeologyStore.getState().version).toBe(1);
    });
  });
});
