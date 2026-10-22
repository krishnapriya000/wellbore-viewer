import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useConstructionStore } from '@/features/construction';
import { computeSurvey, useSurveyStore, type Well } from '@/features/survey';
import { CasingLayer } from './CasingLayer';

// Mock Drei's Html component for testing inside JSDOM
vi.mock('@react-three/drei', () => ({
  Html: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="html-mock" className={className}>
      {children}
    </div>
  ),
}));

describe('<CasingLayer>', () => {
  const l1Stations = computeSurvey([
    { md: 0, inc: 0, azi: 0 },
    { md: 1000, inc: 0, azi: 0 },
    { md: 2500, inc: 30, azi: 45 },
    { md: 4000, inc: 60, azi: 45 },
    { md: 7500, inc: 90, azi: 45 },
  ]);

  const l2Stations = computeSurvey([
    { md: 0, inc: 0, azi: 0 },
    { md: 1500, inc: 0, azi: 0 },
    { md: 3500, inc: 45, azi: 135 },
    { md: 7500, inc: 90, azi: 135 },
  ]);

  const mockWells: Record<string, Well> = {
    L1: {
      name: 'L1',
      slot: 0,
      junction: 0,
      version: 1,
      plan: l1Stations,
      actual: l1Stations,
    },
    L2: {
      name: 'L2',
      slot: 1,
      junction: 1500,
      version: 1,
      plan: l2Stations,
      actual: l2Stations,
    },
  };

  beforeEach(() => {
    useConstructionStore.getState().resetToSample();
    useConstructionStore.setState({ version: 0 });
    useSurveyStore.setState({
      wells: mockWells,
      order: ['L1', 'L2'],
      status: 'ready',
      error: null,
    });
  });

  it('renders default sample casing shoes and annotations along the motherbore', () => {
    render(<CasingLayer />);

    // Default sample has:
    // 13.375" Surface Casing to 1,200 ft (csg-1)
    // 9.625" Intermediate Casing to 4,500 ft (csg-2)
    // 7" Production Casing to 7,200 ft (csg-3)
    expect(screen.getByText(/13\.375" Shoe @ 1,200 ft/i)).toBeInTheDocument();
    expect(screen.getByText(/9\.625" Shoe @ 4,500 ft/i)).toBeInTheDocument();
    expect(screen.getByText(/7" Shoe @ 7,200 ft/i)).toBeInTheDocument();
  });

  it('dynamically reflects new construction casing additions in the 3D layer', () => {
    const { rerender } = render(<CasingLayer />);
    expect(screen.queryByText(/4\.5" Shoe/i)).not.toBeInTheDocument();

    act(() => {
      useConstructionStore.getState().addItem({
        kind: 'casing',
        size: 4.5,
        from: 5000,
        to: 7400,
        well: 'L1',
        note: 'Short production liner',
      });
    });

    rerender(<CasingLayer />);
    expect(screen.getByText(/4\.5" Shoe @ 7,400 ft/i)).toBeInTheDocument();
  });

  it('dynamically reflects construction item updates', () => {
    const { rerender } = render(<CasingLayer />);
    expect(screen.getByText(/13\.375" Shoe @ 1,200 ft/i)).toBeInTheDocument();

    const existing = useConstructionStore.getState().items.find((i) => i.id === 'csg-1')!;
    act(() => {
      useConstructionStore.getState().updateItem('csg-1', {
        ...existing,
        to: 1400,
      });
    });

    rerender(<CasingLayer />);
    expect(screen.getByText(/13\.375" Shoe @ 1,400 ft/i)).toBeInTheDocument();
  });

  it('dynamically reflects construction item removals', () => {
    const { rerender } = render(<CasingLayer />);
    expect(screen.getByText(/7" Shoe @ 7,200 ft/i)).toBeInTheDocument();

    act(() => {
      useConstructionStore.getState().removeItem('csg-3');
    });

    rerender(<CasingLayer />);
    expect(screen.queryByText(/7" Shoe @ 7,200 ft/i)).not.toBeInTheDocument();
  });

  it('renders null when construction items are empty', () => {
    act(() => {
      useConstructionStore.setState({ items: [], version: 99 });
    });

    const { container } = render(<CasingLayer />);
    expect(container).toBeEmptyDOMElement();
  });

  it('flags fit-check warnings visually on incompatible casing strings', () => {
    act(() => {
      useConstructionStore.setState({
        items: [
          {
            id: 'small-hole',
            kind: 'hole',
            size: 8.5,
            from: 0,
            to: 2000,
            well: 'L1',
            note: '',
          },
          {
            id: 'huge-casing',
            kind: 'casing',
            size: 13.375, // 13.375" will not fit 8.5" hole!
            from: 0,
            to: 2000,
            well: 'L1',
            note: '',
          },
        ],
        version: 1,
      });
    });

    render(<CasingLayer />);
    const pill = screen.getByRole('button', { name: /13\.375" Shoe @ 2,000 ft/i });
    expect(pill).toHaveClass('has-warning');
    expect(screen.getByText('⚠️')).toBeInTheDocument();
  });
});
