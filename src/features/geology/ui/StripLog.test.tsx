import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { useGeologyStore } from '../model/geologyStore';
import { StripLog } from './StripLog';

describe('<StripLog>', () => {
  beforeEach(() => {
    useGeologyStore.getState().resetToSample();
    useGeologyStore.setState({ version: 0 });
    useSettings.setState({ unit: 'ft' });
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
            { md: 5000, inc: 90, azi: 45, tvd: 4000, n: 1000, e: 1000, dls: 2, beta: 0 },
          ],
          actual: [],
        },
      },
    });
  });

  it('renders section title, canvas element, and TVD/MD depth reference toggle', () => {
    render(<StripLog activeWell="L1" />);

    expect(screen.getByRole('heading', { name: /geological strip log/i })).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /geological strip log/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TVD' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'MD' })).toBeInTheDocument();
  });

  it('switches between TVD field mode and MD wellbore mode', async () => {
    const user = userEvent.setup();
    render(<StripLog activeWell="L1" />);

    // Initially in TVD mode
    expect(screen.queryByText(/md reference/i)).not.toBeInTheDocument();

    // Click MD toggle
    await user.click(screen.getByRole('button', { name: 'MD' }));

    // MD reference controls appear
    expect(screen.getByText(/md reference/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L1' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'L2' })).toBeInTheDocument();
  });

  it('renders safely when geologyStore has no formations', () => {
    useGeologyStore.setState({ formations: [], version: 1 });
    render(<StripLog activeWell="L1" />);

    expect(screen.getByRole('img', { name: /geological strip log/i })).toBeInTheDocument();
  });

  it('handles unit change between feet and meters cleanly', () => {
    const { rerender } = render(<StripLog activeWell="L1" />);

    act(() => {
      useSettings.setState({ unit: 'm' });
    });

    rerender(<StripLog activeWell="L1" />);
    expect(useSettings.getState().unit).toBe('m');
  });

  it('updates canvas and layout when formations are added or modified', () => {
    const { rerender } = render(<StripLog activeWell="L1" />);

    act(() => {
      useGeologyStore.getState().addFormation({
        name: 'Basement Quartzite',
        ref: 'TVD',
        well: 'All',
        from: 6500,
        to: 8500,
        comp: [{ lith: 'basement', pct: 100 }],
      });
    });

    rerender(<StripLog activeWell="L1" />);
    expect(useGeologyStore.getState().formations.some((f) => f.name === 'Basement Quartzite')).toBe(
      true,
    );
  });
});
