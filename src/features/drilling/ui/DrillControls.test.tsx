import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { useDrilling } from '../model/drillingStore';
import { DrillControls } from './DrillControls';

describe('<DrillControls>', () => {
  beforeEach(() => {
    useSettings.setState({ unit: 'ft' });
    useDrilling.setState({
      activeWell: 'L1',
      md: 1000,
      mode: 'actual',
      playing: true,
      speedFtPerS: 250,
      feed: [],
    });

    useSurveyStore.setState({
      order: ['L1', 'L2'],
      wells: {
        L1: {
          name: 'L1',
          slot: 0,
          junction: 0,
          version: 1,
          plan: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 5000, inc: 30, azi: 45, tvd: 4800, n: 500, e: 500, dls: 1.5, beta: 0 },
          ],
          actual: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 3500, inc: 25, azi: 45, tvd: 3400, n: 400, e: 400, dls: 1.2, beta: 0 },
          ],
        },
        L2: {
          name: 'L2',
          slot: 1,
          junction: 1000,
          version: 1,
          plan: [],
          actual: [
            { md: 0, inc: 0, azi: 0, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 2000, inc: 10, azi: 160, tvd: 1980, n: -200, e: 50, dls: 1.0, beta: 0 },
          ],
        },
      },
      status: 'ready',
      error: null,
    });
  });

  it('renders drilling status and TD based on actual trajectory in actual mode', () => {
    render(<DrillControls />);

    expect(screen.getByRole('heading', { name: /Real-time drilling/ })).toBeInTheDocument();
    expect(screen.getByText('Drilling')).toBeInTheDocument();
    expect(screen.getByText(/3,500 ft/)).toBeInTheDocument();
  });

  it('calculates TD from planned trajectory when switched to plan mode', () => {
    useDrilling.setState({ mode: 'plan' });
    render(<DrillControls />);

    // In plan mode, L1 has TD = 5000 ft
    expect(screen.getByText(/5,000 ft/)).toBeInTheDocument();
  });

  it('displays "No plan" when active well has no plan data in plan mode', () => {
    useDrilling.setState({ activeWell: 'L2', mode: 'plan' });
    render(<DrillControls />);

    expect(screen.getByText('No plan')).toBeInTheDocument();
    const playBtn = screen.getByRole('button', { name: /Pause|Resume|Drill again/ });
    expect(playBtn).toBeDisabled();
  });

  it('switches active well when selected from dropdown', () => {
    render(<DrillControls />);

    const select = screen.getByLabelText(/Drilling wellbore/);
    fireEvent.change(select, { target: { value: 'L2' } });

    expect(useDrilling.getState().activeWell).toBe('L2');
  });
});
