import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useConstructionStore } from '@/features/construction';
import { useEventsStore } from '@/features/events';
import { useGeologyStore } from '@/features/geology';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { useDrilling } from '../model/drillingStore';
import { BitReadout } from './BitReadout';

describe('<BitReadout>', () => {
  beforeEach(() => {
    useSettings.setState({ unit: 'ft' });
    useDrilling.setState({
      activeWell: 'L1',
      md: 2000,
      mode: 'actual',
      playing: false,
      speedFtPerS: 250,
      feed: [],
    });

    useSurveyStore.setState({
      order: ['L1', 'L2', 'L3'],
      wells: {
        L1: {
          name: 'L1',
          slot: 0,
          junction: 0,
          version: 1,
          plan: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 2000, inc: 0, azi: 0, tvd: 2000, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 4000, inc: 30, azi: 90, tvd: 3800, n: 0, e: 1000, dls: 1.5, beta: 0 },
          ],
          actual: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 2000, inc: 5, azi: 45, tvd: 1990, n: 50, e: 50, dls: 0.25, beta: 0 },
            { md: 4000, inc: 35, azi: 90, tvd: 3750, n: 60, e: 1050, dls: 1.8, beta: 0 },
          ],
        },
        L2: {
          name: 'L2',
          slot: 1,
          junction: 1500,
          version: 1,
          plan: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 3000, inc: 20, azi: 180, tvd: 2900, n: -500, e: 0, dls: 1, beta: 0 },
          ],
          actual: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 3000, inc: 22, azi: 182, tvd: 2890, n: -510, e: -10, dls: 1.1, beta: 0 },
          ],
        },
        L3: {
          name: 'L3',
          slot: 2,
          junction: 2500,
          version: 1,
          plan: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 3000, inc: 15, azi: 270, tvd: 2950, n: 0, e: -400, dls: 1, beta: 0 },
          ],
          actual: [], // Empty actual surveys for L3
        },
      },
    });

    useGeologyStore.setState({
      formations: [
        {
          id: 'fm-1',
          name: 'Overburden',
          ref: 'TVD',
          well: 'All',
          from: 0,
          to: 1500,
          comp: [{ lith: 'shale', pct: 100 }],
        },
        {
          id: 'fm-2',
          name: 'Upper Shale',
          ref: 'TVD',
          well: 'All',
          from: 1500,
          to: 3500,
          comp: [{ lith: 'shale', pct: 100 }],
        },
      ],
      version: 1,
    });

    useConstructionStore.setState({
      items: [
        {
          id: 'csg-1',
          kind: 'casing',
          well: 'All',
          from: 0,
          to: 1200,
          size: 13.375,
          note: 'Surface casing string',
        },
        {
          id: 'csg-2',
          kind: 'casing',
          well: 'All',
          from: 0,
          to: 3500,
          size: 9.625,
          note: 'Intermediate casing string',
        },
      ],
      version: 1,
    });

    useEventsStore.setState({
      events: [
        {
          id: 'ev-1',
          well: 'All',
          md: 1200,
          type: 'casing',
          note: 'Surface casing shoe set',
        },
        {
          id: 'ev-2',
          well: 'L1',
          md: 1800,
          type: 'gas',
          note: 'Background gas increase',
        },
        {
          id: 'ev-3',
          well: 'L2',
          md: 1600,
          type: 'tight',
          note: 'Tight hole',
        },
      ],
      version: 1,
    });
  });

  it('renders notice when activeWell is not set or not in store', () => {
    act(() => {
      useDrilling.setState({ activeWell: null });
    });
    render(<BitReadout />);
    expect(screen.getByText(/select a wellbore to inspect drilling position/i)).toBeInTheDocument();
  });

  it('renders graceful notice when active well has no actual surveys in actual mode', () => {
    act(() => {
      useDrilling.setState({ activeWell: 'L3', mode: 'actual' });
    });
    render(<BitReadout />);
    expect(screen.getByText(/no actual surveys for this wellbore/i)).toBeInTheDocument();
  });

  it('renders complete bit readouts including formation, casing shoe, and latest event', () => {
    render(<BitReadout />);

    // Trajectory position
    expect(screen.getByText('Bit MD')).toBeInTheDocument();
    expect(screen.getByText('2,000.0 ft')).toBeInTheDocument();

    expect(screen.getByText('Bit TVD')).toBeInTheDocument();
    expect(screen.getByText('1,990.0 ft')).toBeInTheDocument();

    expect(screen.getByText('Inc')).toBeInTheDocument();
    expect(screen.getByText('5.00°')).toBeInTheDocument();

    expect(screen.getByText('Azi')).toBeInTheDocument();
    expect(screen.getByText('45.00°')).toBeInTheDocument();

    // Formation at bit (tvd=1990 falls in Upper Shale 1500-3500)
    expect(screen.getByText('Formation')).toBeInTheDocument();
    expect(screen.getByText('Upper Shale')).toBeInTheDocument();

    // Casing shoe (at md=2000, inside 9.625" string with shoe at 3500 ft)
    expect(screen.getByText('Casing shoe')).toBeInTheDocument();
    expect(screen.getByText('9.625" @ 3,500 ft')).toBeInTheDocument();

    // Latest engineering event (at md=2000, latest on L1 is ev-2 gas show at 1800 ft)
    expect(screen.getByText('Latest event')).toBeInTheDocument();
    expect(screen.getByText('Gas Show @ 1,800 ft')).toBeInTheDocument();

    // Deviation from plan displayed in actual mode
    expect(screen.getByText('Ctr-to-ctr')).toBeInTheDocument();
  });

  it('synchronizes when switching from ACTUAL to PLAN mode', async () => {
    const user = userEvent.setup();
    render(<BitReadout />);

    // In actual mode: TVD is 1990.0 ft, pill shows deviation status
    expect(screen.getByText('1,990.0 ft')).toBeInTheDocument();

    // Click 'Plan' mode toggle
    const planBtn = screen.getByRole('button', { name: 'Plan' });
    await user.click(planBtn);

    // Verify store mode was updated
    expect(useDrilling.getState().mode).toBe('plan');

    // In plan mode: TVD is 2000.0 ft (from plan), pill shows 'Planned'
    expect(screen.getByText('Planned')).toBeInTheDocument();
    expect(screen.getAllByText('2,000.0 ft').length).toBeGreaterThanOrEqual(2); // MD and TVD both 2000.0 ft

    // Deviation fields are hidden in plan mode
    expect(screen.queryByText('Ctr-to-ctr')).not.toBeInTheDocument();
  });

  it('synchronizes readouts when switching between L1, L2, and L3', () => {
    const { rerender } = render(<BitReadout />);

    // Check L1 readouts
    expect(screen.getByText('Gas Show @ 1,800 ft')).toBeInTheDocument();

    // Switch to L2
    act(() => {
      useDrilling.setState({ activeWell: 'L2', md: 2000 });
    });
    rerender(<BitReadout />);

    // L2 junction is 1500 ft
    expect(screen.getByText('1,500 ft')).toBeInTheDocument();
    // L2 latest event at md 2000 is ev-3 (tight hole at 1600 ft)
    expect(screen.getByText('Tight Hole @ 1,600 ft')).toBeInTheDocument();

    // Switch to L3 in plan mode (since L3 only has planned surveys)
    act(() => {
      useDrilling.setState({ activeWell: 'L3', md: 2000, mode: 'plan' });
    });
    rerender(<BitReadout />);

    expect(screen.getByText('2,500 ft')).toBeInTheDocument(); // L3 junction
    expect(screen.getByText('Planned')).toBeInTheDocument();
  });

  it('handles missing formation, casing, and event gracefully with em dash', () => {
    // Clear formations, casings, and events
    act(() => {
      useGeologyStore.setState({ formations: [] });
      useConstructionStore.setState({ items: [] });
      useEventsStore.setState({ events: [] });
    });

    render(<BitReadout />);

    const dashes = screen.getAllByText('—');
    // At least 3 dashes for formation, casing shoe, and latest event
    expect(dashes.length).toBeGreaterThanOrEqual(3);
  });
});

