import { act, fireEvent, render, renderHook, screen } from '@testing-library/react';
import { Box3, Vector3 } from 'three';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useDrilling } from '@/features/drilling';
import type { Well } from '@/features/survey';
import { LayersPanel } from './LayersPanel';
import { useLayersState } from './useLayersState';
import { ActualLayer } from './layers/ActualLayer';
import { BitLayer } from './layers/BitLayer';
import { PlanLayer } from './layers/PlanLayer';
import { ScaleLayer } from './layers/ScaleLayer';
import { SleeveLayer } from './layers/SleeveLayer';

// Mock Drei components that render inside a 3D canvas
vi.mock('@react-three/drei', () => ({
  Html: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="html-mock" className={className}>
      {children}
    </div>
  ),
  OrbitControls: () => null,
}));

// Mock useFrame from @react-three/fiber
vi.mock('@react-three/fiber', () => ({
  useFrame: vi.fn(),
}));

const MOCK_WELLS: Well[] = [
  {
    name: 'L1',
    slot: 0,
    junction: 0,
    version: 1,
    plan: [
      { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 1000, inc: 0, azi: 0, tvd: 1000, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 2500, inc: 30, azi: 45, tvd: 2400, n: 200, e: 200, dls: 2, beta: 0 },
    ],
    actual: [
      { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 1000, inc: 0, azi: 0, tvd: 1000, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 2500, inc: 30, azi: 45, tvd: 2400, n: 200, e: 200, dls: 2, beta: 0 },
    ],
  },
  {
    name: 'L2',
    slot: 1,
    junction: 1200,
    version: 1,
    plan: [
      { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 1200, inc: 0, azi: 0, tvd: 1200, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 3000, inc: 60, azi: 90, tvd: 2200, n: 0, e: 800, dls: 3, beta: 0 },
    ],
    actual: [],
  },
  {
    name: 'L3',
    slot: 2,
    junction: 1500,
    version: 1,
    plan: [
      { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 1500, inc: 0, azi: 0, tvd: 1500, n: 0, e: 0, dls: 0, beta: 0 },
      { md: 3500, inc: 88, azi: 180, tvd: 2600, n: -1000, e: 0, dls: 2.5, beta: 0 },
    ],
    actual: [],
  },
];

const MOCK_BOUNDS = new Box3(new Vector3(-50, -50, -50), new Vector3(50, 0, 50));

describe('<LayersPanel />', () => {
  beforeEach(() => {
    useDrilling.setState({ activeWell: 'L1', md: 5000, mode: 'actual' });
  });

  it('renders the LAYERS panel header and all seven required entries', () => {
    render(<LayersPanel wells={MOCK_WELLS} />);

    // Header
    expect(screen.getByText('LAYERS')).toBeInTheDocument();

    // 1. L1 plan
    expect(screen.getByLabelText('L1 plan')).toBeInTheDocument();
    // 2. L2 plan
    expect(screen.getByLabelText('L2 plan')).toBeInTheDocument();
    // 3. L3 plan
    expect(screen.getByLabelText('L3 plan')).toBeInTheDocument();
    // 4. Actual (drilling wellbore)
    expect(screen.getByLabelText('Actual (drilling wellbore)')).toBeInTheDocument();
    // 5. Show plans
    expect(screen.getByLabelText('Show plans')).toBeInTheDocument();
    // 6. Formations & lithology
    expect(screen.getByLabelText('Formations & lithology')).toBeInTheDocument();
    // 7. MD / TVD scale
    expect(screen.getByLabelText('MD / TVD scale')).toBeInTheDocument();
  });

  it('initializes all checkboxes as checked by default', () => {
    render(<LayersPanel wells={MOCK_WELLS} />);

    expect(screen.getByLabelText('L1 plan')).toBeChecked();
    expect(screen.getByLabelText('L2 plan')).toBeChecked();
    expect(screen.getByLabelText('L3 plan')).toBeChecked();
    expect(screen.getByLabelText('Actual (drilling wellbore)')).toBeChecked();
    expect(screen.getByLabelText('Show plans')).toBeChecked();
    expect(screen.getByLabelText('Formations & lithology')).toBeChecked();
    expect(screen.getByLabelText('MD / TVD scale')).toBeChecked();
  });

  it('renders swatches matching the expected styling for all layers', () => {
    const { container } = render(<LayersPanel wells={MOCK_WELLS} />);

    const swatches = container.querySelectorAll('.sw');
    expect(swatches.length).toBe(7);

    // Show plans has dashed plan swatch
    expect(container.querySelector('.sw.plan')).toBeInTheDocument();

    // Formations & lithology has formations swatch
    expect(container.querySelector('.sw.formations')).toBeInTheDocument();

    // MD / TVD scale has scale swatch
    expect(container.querySelector('.sw.scale')).toBeInTheDocument();
  });

  it('stops pointer down propagation to protect 3D viewport controls', () => {
    const parentHandler = vi.fn();
    render(
      <div onPointerDown={parentHandler}>
        <LayersPanel wells={MOCK_WELLS} />
      </div>,
    );

    const panel = screen.getByRole('region', { name: /layers/i });
    fireEvent.pointerDown(panel);
    expect(parentHandler).not.toHaveBeenCalled();
  });

  it('invokes callback handlers when checkboxes are clicked in controlled mode', () => {
    const onTogglePlan = vi.fn();
    const onToggleShowPlans = vi.fn();
    const onToggleActual = vi.fn();
    const onToggleGeology = vi.fn();
    const onToggleScale = vi.fn();

    render(
      <LayersPanel
        wells={MOCK_WELLS}
        showPlans={true}
        planVisibility={{ L1: true, L2: true, L3: true }}
        showActual={true}
        showGeology={true}
        showScale={true}
        onTogglePlan={onTogglePlan}
        onToggleShowPlans={onToggleShowPlans}
        onToggleActual={onToggleActual}
        onToggleGeology={onToggleGeology}
        onToggleScale={onToggleScale}
      />,
    );

    fireEvent.click(screen.getByLabelText('L1 plan'));
    expect(onTogglePlan).toHaveBeenCalledWith('L1', false);

    fireEvent.click(screen.getByLabelText('Actual (drilling wellbore)'));
    expect(onToggleActual).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByLabelText('Show plans'));
    expect(onToggleShowPlans).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByLabelText('Formations & lithology'));
    expect(onToggleGeology).toHaveBeenCalledWith(false);

    fireEvent.click(screen.getByLabelText('MD / TVD scale'));
    expect(onToggleScale).toHaveBeenCalledWith(false);
  });
});

describe('useLayersState - Checkbox behavior and Master Toggle Synchronization', () => {
  it('controls individual plan visibility independently', () => {
    const { result } = renderHook(() => useLayersState(MOCK_WELLS));

    expect(result.current.isPlanVisible('L1')).toBe(true);
    expect(result.current.isPlanVisible('L2')).toBe(true);
    expect(result.current.isPlanVisible('L3')).toBe(true);

    act(() => {
      result.current.togglePlan('L2', false);
    });

    expect(result.current.isPlanVisible('L1')).toBe(true);
    expect(result.current.isPlanVisible('L2')).toBe(false);
    expect(result.current.isPlanVisible('L3')).toBe(true);
    expect(result.current.showPlans).toBe(true);
  });

  it('disables all plans when Show plans is toggled off, and restores individual selections when re-enabled', () => {
    const { result } = renderHook(() => useLayersState(MOCK_WELLS));

    // First, uncheck L2
    act(() => {
      result.current.togglePlan('L2', false);
    });
    expect(result.current.isPlanVisible('L1')).toBe(true);
    expect(result.current.isPlanVisible('L2')).toBe(false);
    expect(result.current.isPlanVisible('L3')).toBe(true);

    // Disable Show plans master toggle -> all plans hidden
    act(() => {
      result.current.toggleShowPlans(false);
    });
    expect(result.current.showPlans).toBe(false);
    expect(result.current.isPlanVisible('L1')).toBe(false);
    expect(result.current.isPlanVisible('L2')).toBe(false);
    expect(result.current.isPlanVisible('L3')).toBe(false);

    // Re-enable Show plans master toggle -> restores plans selected by individual checkboxes
    act(() => {
      result.current.toggleShowPlans(true);
    });
    expect(result.current.showPlans).toBe(true);
    expect(result.current.isPlanVisible('L1')).toBe(true);
    expect(result.current.isPlanVisible('L2')).toBe(false);
    expect(result.current.isPlanVisible('L3')).toBe(true);
  });

  it('automatically unchecks Show plans when all individual plans are unchecked', () => {
    const { result } = renderHook(() => useLayersState(MOCK_WELLS));

    act(() => {
      result.current.togglePlan('L1', false);
    });
    expect(result.current.showPlans).toBe(true);

    act(() => {
      result.current.togglePlan('L2', false);
    });
    expect(result.current.showPlans).toBe(true);

    act(() => {
      result.current.togglePlan('L3', false);
    });
    // All individual plans are now unchecked -> Show plans master toggle turns off
    expect(result.current.showPlans).toBe(false);
  });

  it('re-enables all individual plans when Show plans is checked while all were unchecked', () => {
    const { result } = renderHook(() => useLayersState(MOCK_WELLS));

    // Uncheck all individual plans
    act(() => {
      result.current.togglePlan('L1', false);
      result.current.togglePlan('L2', false);
      result.current.togglePlan('L3', false);
    });
    expect(result.current.showPlans).toBe(false);

    // Checking master toggle re-enables all plans
    act(() => {
      result.current.toggleShowPlans(true);
    });
    expect(result.current.showPlans).toBe(true);
    expect(result.current.isPlanVisible('L1')).toBe(true);
    expect(result.current.isPlanVisible('L2')).toBe(true);
    expect(result.current.isPlanVisible('L3')).toBe(true);
  });

  it('automatically enables Show plans when an individual plan is checked while master toggle was off', () => {
    const { result } = renderHook(() => useLayersState(MOCK_WELLS));

    act(() => {
      result.current.toggleShowPlans(false);
    });
    expect(result.current.showPlans).toBe(false);

    // Checking L1 plan turns master toggle back on so L1 is visible
    act(() => {
      result.current.togglePlan('L1', true);
    });
    expect(result.current.showPlans).toBe(true);
    expect(result.current.isPlanVisible('L1')).toBe(true);
  });

  it('controls Actual, Geology, and Scale visibility toggles', () => {
    const { result } = renderHook(() => useLayersState(MOCK_WELLS));

    expect(result.current.showActual).toBe(true);
    expect(result.current.showGeology).toBe(true);
    expect(result.current.showScale).toBe(true);

    act(() => {
      result.current.toggleActual(false);
      result.current.toggleGeology(false);
      result.current.toggleScale(false);
    });

    expect(result.current.showActual).toBe(false);
    expect(result.current.showGeology).toBe(false);
    expect(result.current.showScale).toBe(false);
  });
});

describe('3D Layers visibility propagation', () => {
  beforeEach(() => {
    useDrilling.setState({ activeWell: 'L1', md: 5000, mode: 'actual' });
  });

  it('hides PlanLayer when visible={false} is passed', () => {
    const { container: visibleContainer } = render(
      <PlanLayer well={MOCK_WELLS[0]!} color="#b2650a" visible={true} />,
    );
    expect(visibleContainer.querySelector('.well-label')).toBeInTheDocument();

    const { container: hiddenContainer } = render(
      <PlanLayer well={MOCK_WELLS[0]!} color="#b2650a" visible={false} />,
    );
    expect(hiddenContainer.querySelector('.well-label')).not.toBeInTheDocument();
  });

  it('hides ActualLayer when visible={false} is passed', () => {
    const { container: visibleContainer } = render(
      <ActualLayer well={MOCK_WELLS[0]!} color="#1f4fd1" visible={true} />,
    );
    expect(visibleContainer.querySelector('mesh')).toBeInTheDocument();

    const { container: hiddenContainer } = render(
      <ActualLayer well={MOCK_WELLS[0]!} color="#1f4fd1" visible={false} />,
    );
    expect(hiddenContainer.querySelector('mesh')).not.toBeInTheDocument();
  });

  it('hides SleeveLayer when visible={false} is passed', () => {
    const { container: visibleContainer } = render(
      <SleeveLayer well={MOCK_WELLS[0]!} visible={true} />,
    );
    expect(visibleContainer.querySelector('group')).toBeInTheDocument();

    const { container: hiddenContainer } = render(
      <SleeveLayer well={MOCK_WELLS[0]!} visible={false} />,
    );
    expect(hiddenContainer.querySelector('group')).not.toBeInTheDocument();
  });

  it('hides ScaleLayer when visible={false} is passed', () => {
    const { container: visibleContainer } = render(
      <ScaleLayer
        bounds={MOCK_BOUNDS}
        well={MOCK_WELLS[0]!}
        wells={MOCK_WELLS}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
        visible={true}
      />,
    );
    expect(visibleContainer.querySelector('.tvd-header-badge')).toBeInTheDocument();

    const { container: hiddenContainer } = render(
      <ScaleLayer
        bounds={MOCK_BOUNDS}
        well={MOCK_WELLS[0]!}
        wells={MOCK_WELLS}
        color="#1f4fd1"
        labelColor="#42514d"
        gridColor="#b4c0bc"
        visible={false}
      />,
    );
    expect(hiddenContainer.querySelector('.tvd-header-badge')).not.toBeInTheDocument();
  });

  it('hides BitLayer mesh and indicator when visible={false}', () => {
    const { container: visibleContainer } = render(<BitLayer color="#1f4fd1" visible={true} />);
    expect(visibleContainer.querySelector('mesh')).toBeInTheDocument();

    const { container: hiddenContainer } = render(<BitLayer color="#1f4fd1" visible={false} />);
    expect(hiddenContainer.querySelector('mesh')).not.toBeInTheDocument();
  });
});
