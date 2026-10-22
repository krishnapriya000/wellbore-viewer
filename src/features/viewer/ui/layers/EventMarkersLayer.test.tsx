import { act, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { useEventsStore } from '@/features/events';
import { computeSurvey, useSurveyStore, type Well } from '@/features/survey';
import { EventMarkersLayer } from './EventMarkersLayer';

// Mock Drei's Html component for testing inside standard JSDOM
vi.mock('@react-three/drei', () => ({
  Html: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="html-mock" className={className}>
      {children}
    </div>
  ),
}));

describe('<EventMarkersLayer>', () => {
  const l1Stations = computeSurvey([
    { md: 0, inc: 0, azi: 0 },
    { md: 1000, inc: 0, azi: 0 },
    { md: 2500, inc: 30, azi: 45 },
    { md: 4000, inc: 60, azi: 45 },
    { md: 5000, inc: 90, azi: 45 },
  ]);

  const l2Stations = computeSurvey([
    { md: 0, inc: 0, azi: 0 },
    { md: 1500, inc: 0, azi: 0 },
    { md: 3500, inc: 45, azi: 135 },
    { md: 5000, inc: 90, azi: 135 },
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
    useEventsStore.getState().resetToSample();
    useEventsStore.setState({ version: 0 });
    useSurveyStore.setState({
      wells: mockWells,
      order: ['L1', 'L2'],
      status: 'ready',
      error: null,
    });
  });

  it('renders 3D markers for default sample events along trajectories', () => {
    render(<EventMarkersLayer />);

    // Sample events on L1: Casing Shoe (1200), Gas Show (2450), Good Oil Show (3600), Tight Hole (4250)
    // Sample event on L2: Fault (3800)
    expect(screen.getByText('Casing Shoe')).toBeInTheDocument();
    expect(screen.getByText('Gas Show')).toBeInTheDocument();
    expect(screen.getByText('Good Oil Show')).toBeInTheDocument();
    expect(screen.getByText('Tight Hole')).toBeInTheDocument();
    expect(screen.getByText('Fault')).toBeInTheDocument();
  });

  it('dynamically reflects new event additions in the rendered layer', () => {
    const { rerender } = render(<EventMarkersLayer />);
    expect(screen.queryByText('Well Kick')).not.toBeInTheDocument();

    act(() => {
      useEventsStore.getState().addEvent({
        id: 'ev-new-kick',
        well: 'L1',
        md: 4600,
        type: 'kick',
        note: 'High pressure kick observed',
      });
    });

    rerender(<EventMarkersLayer />);
    expect(screen.getByText('Well Kick')).toBeInTheDocument();
  });

  it('dynamically reflects event updates in the rendered marker', () => {
    const { rerender } = render(<EventMarkersLayer />);

    act(() => {
      useEventsStore.getState().updateEvent('ev-1', {
        well: 'L1',
        md: 1200,
        type: 'bit',
        note: 'PDC Bit replaced',
      });
    });

    rerender(<EventMarkersLayer />);
    expect(screen.getByText('Bit Change')).toBeInTheDocument();
  });

  it('dynamically reflects event removals from the rendered layer', () => {
    const { rerender } = render(<EventMarkersLayer />);
    expect(screen.getByText('Tight Hole')).toBeInTheDocument();

    act(() => {
      useEventsStore.getState().removeEvent('ev-4'); // ev-4 is tight hole
    });

    rerender(<EventMarkersLayer />);
    expect(screen.queryByText('Tight Hole')).not.toBeInTheDocument();
  });

  it('safely skips events referencing non-existent wells or out-of-range depths', () => {
    act(() => {
      useEventsStore.setState({
        events: [
          { id: 'bad-well', well: 'GhostWell', md: 1000, type: 'gas', note: '' },
          { id: 'too-deep', well: 'L1', md: 99999, type: 'casing', note: '' },
        ],
        version: 1,
      });
    });

    const { container } = render(<EventMarkersLayer />);
    // Should render empty without throwing
    expect(container).toBeEmptyDOMElement();
  });
});
