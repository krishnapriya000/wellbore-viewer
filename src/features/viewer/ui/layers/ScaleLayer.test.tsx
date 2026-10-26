import { act, render, screen } from '@testing-library/react';
import { Box3, Vector3 } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDrilling } from '@/features/drilling';
import { computeSurvey, useSurveyStore, type Well } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { ScaleLayer } from './ScaleLayer';

// Mock Drei's Html component for testing inside JSDOM
vi.mock('@react-three/drei', () => ({
  Html: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="html-mock" className={className}>
      {children}
    </div>
  ),
}));

// Mock useFrame from @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}));

describe('<ScaleLayer>', () => {
  const l1Plan = computeSurvey([
    { md: 0, inc: 0, azi: 45 },
    { md: 2000, inc: 0, azi: 45 },
    { md: 4000, inc: 30, azi: 45 },
    { md: 6000, inc: 60, azi: 45 },
    { md: 8000, inc: 90, azi: 45 },
    { md: 10000, inc: 90, azi: 45 },
  ]);

  const l2Plan = computeSurvey([
    { md: 0, inc: 0, azi: 160 },
    { md: 3000, inc: 0, azi: 160 },
    { md: 6000, inc: 45, azi: 160 },
    { md: 9000, inc: 90, azi: 160 },
    { md: 12000, inc: 90, azi: 160 },
  ]);

  const mockWells: { L1: Well; L2: Well } = {
    L1: {
      name: 'L1',
      slot: 0,
      junction: 0,
      version: 1,
      plan: l1Plan,
      actual: l1Plan,
    },
    L2: {
      name: 'L2',
      slot: 1,
      junction: 2000,
      version: 1,
      plan: l2Plan,
      actual: l2Plan,
    },
  };

  const bounds = new Box3(new Vector3(-50, -80, -50), new Vector3(50, 0, 50));

  beforeEach(() => {
    useSettings.setState({ unit: 'ft' });
    useDrilling.setState({ activeWell: 'L1', mode: 'actual', md: 5000 });
    useSurveyStore.setState({
      wells: mockWells,
      order: ['L1', 'L2'],
      status: 'ready',
      error: null,
    });
  });

  it('renders top TVD axis header badge with current depth unit', () => {
    render(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L1}
        wells={[mockWells.L1, mockWells.L2]}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    expect(screen.getByText('TVD (ft)')).toBeInTheDocument();
  });

  it('updates TVD axis header badge and tick labels when unit changes to meters', () => {
    const { rerender } = render(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L1}
        wells={[mockWells.L1, mockWells.L2]}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    expect(screen.getByText('TVD (ft)')).toBeInTheDocument();

    act(() => {
      useSettings.setState({ unit: 'm' });
    });

    rerender(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L1}
        wells={[mockWells.L1, mockWells.L2]}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    expect(screen.getByText('TVD (m)')).toBeInTheDocument();
  });

  it('renders landing target reference plane labels for horizontal sections', () => {
    render(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L1}
        wells={[mockWells.L1, mockWells.L2]}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    expect(screen.getByText(/L1 Landing Target/i)).toBeInTheDocument();
    expect(screen.getByText(/L2 Landing Target/i)).toBeInTheDocument();
  });

  it('renders measured depth (MD) markers along the trajectory', () => {
    render(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L1}
        wells={[mockWells.L1, mockWells.L2]}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    // MD markers are generated along the trajectory and TVD ticks on the staff
    expect(screen.getAllByText('2,000 ft').length).toBe(2);
    expect(screen.getAllByText('4,000 ft').length).toBe(2);
  });

  it('adjusts scale and markers safely when switching active well from L1 to L2', () => {
    const { rerender } = render(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L1}
        wells={[mockWells.L1, mockWells.L2]}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    act(() => {
      useDrilling.setState({ activeWell: 'L2' });
    });

    rerender(
      <ScaleLayer
        bounds={bounds}
        well={mockWells.L2}
        wells={[mockWells.L1, mockWells.L2]}
        color="#0f7c76"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    // L2 depth markers exist and landing target remains visible
    expect(screen.getByText(/L2 Landing Target/i)).toBeInTheDocument();
    expect(screen.getByText('TVD (ft)')).toBeInTheDocument();
  });

  it('renders correctly in plan mode when actual surveys are not available', () => {
    act(() => {
      useDrilling.setState({ mode: 'plan' });
    });

    const wellPlanOnly: Well = {
      name: 'L3',
      slot: 2,
      junction: 0,
      version: 1,
      plan: l1Plan,
      actual: [],
    };

    render(
      <ScaleLayer
        bounds={bounds}
        well={wellPlanOnly}
        wells={[wellPlanOnly]}
        color="#ad3552"
        labelColor="#42514d"
        gridColor="#b4c0bc"
      />,
    );

    expect(screen.getByText('TVD (ft)')).toBeInTheDocument();
    expect(screen.getByText(/L3 Landing Target/i)).toBeInTheDocument();
  });
});
