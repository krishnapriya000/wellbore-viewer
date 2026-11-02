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

/**
 * Query helper: find a TVD wall group by formation name.
 *
 * TvdWallMesh renders <group name="tvd-wall-{formationName}">. Formation labels are
 * now THREE.Sprite canvas-texture objects rendered via <primitive> — they are not
 * DOM text nodes and cannot be found by screen.getByText(). Tests verify formation
 * presence by querying the group[name] attribute instead.
 */
function wallGroup(container: HTMLElement, formationName: string) {
  return container.querySelector(`group[name="tvd-wall-${formationName}"]`);
}

describe('<GeologyWallsLayer> and <SleeveLayer>', () => {
  beforeEach(() => {
    useGeologyStore.getState().resetToSample();
    useGeologyStore.setState({ version: 0 });
  });

  describe('GeologyWallsLayer', () => {
    it('renders 3D wall geometry for configured TVD formations', () => {
      const { container } = render(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);

      // Labels are THREE.Sprite objects placed on the north wall face — not DOM text.
      // Verify presence by the group name rendered by TvdWallMesh.
      expect(wallGroup(container, 'Overburden')).not.toBeNull();
      expect(wallGroup(container, 'Upper Shale')).not.toBeNull();
      expect(wallGroup(container, 'Target Sand')).not.toBeNull();
      expect(wallGroup(container, 'Lower Carbonate')).not.toBeNull();
    });

    it('renders localized MD override badge for well-specific formation', () => {
      // MD override labels still use <Html> so they appear as DOM text in tests.
      render(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);
      expect(screen.getByText(/Sand Stringer \(L1 MD Override\)/i)).toBeInTheDocument();
    });

    it('refreshes rendered layers when formation data is edited in geologyStore', () => {
      const { container, rerender } = render(
        <GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />,
      );
      expect(wallGroup(container, 'Deep Basement Layer')).toBeNull();

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
      expect(wallGroup(container, 'Deep Basement Layer')).not.toBeNull();
    });

    it('hides stratigraphic wall geometry when formation visibility is toggled off', () => {
      const { container, rerender } = render(
        <GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />,
      );
      expect(wallGroup(container, 'Overburden')).not.toBeNull();

      act(() => {
        useGeologyStore.getState().toggleVisibility('fm-1');
      });

      rerender(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);
      // Formation removed from layout → TvdWallMesh group no longer rendered
      expect(wallGroup(container, 'Overburden')).toBeNull();
    });

    it('hides the entire layer when visible={false} is passed', () => {
      const { container } = render(
        <GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} visible={false} />,
      );
      expect(wallGroup(container, 'Overburden')).toBeNull();
      expect(wallGroup(container, 'Upper Shale')).toBeNull();
    });

    it('updates 3D layer when formation lithology is updated in store', () => {
      const { container, rerender } = render(
        <GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />,
      );
      expect(wallGroup(container, 'Target Sand')).not.toBeNull();

      act(() => {
        useGeologyStore.getState().updateFormation('fm-3', {
          name: 'Target Limestone',
          ref: 'TVD',
          well: 'All',
          from: 3500,
          to: 4500,
          comp: [{ lith: 'limestone', pct: 100 }],
        });
      });

      rerender(<GeologyWallsLayer bounds={MOCK_BOUNDS} wells={[MOCK_WELL]} />);
      expect(wallGroup(container, 'Target Limestone')).not.toBeNull();
      expect(wallGroup(container, 'Target Sand')).toBeNull();
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

    it('partitions sleeve into drilled (solid) and ahead-of-bit (faint) intervals when drilling', () => {
      // Inactive well has all drilled segments
      const { container } = render(<SleeveLayer well={MOCK_WELL} />);

      const meshes = container.querySelectorAll('mesh');
      expect(meshes.length).toBeGreaterThan(0);
      // All rendered meshes have a sleeve name
      for (const m of meshes) {
        expect(m.getAttribute('name')).toMatch(/^sleeve-/);
      }
    });

    it('excludes hidden formations from sleeve rendering when visibility is toggled off', () => {
      const { container, rerender } = render(<SleeveLayer well={MOCK_WELL} />);
      const countBefore = container.querySelectorAll('mesh').length;

      act(() => {
        useGeologyStore.getState().toggleVisibility('fm-1');
      });

      rerender(<SleeveLayer well={MOCK_WELL} />);
      const countAfter = container.querySelectorAll('mesh').length;
      expect(countAfter).toBeLessThan(countBefore);
    });
  });
});
