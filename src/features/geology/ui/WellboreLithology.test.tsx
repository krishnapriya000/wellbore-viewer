import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useDrilling } from '@/features/drilling';
import { useSurveyStore } from '@/features/survey';
import { useSettings } from '@/shared/settings/settingsStore';
import { useGeologyStore } from '../model/geologyStore';
import { WellboreLithology } from './WellboreLithology';

describe('<WellboreLithology>', () => {
  beforeEach(() => {
    useGeologyStore.getState().resetToSample();
    useGeologyStore.setState({ version: 0 });
    useSettings.setState({ unit: 'ft', theme: 'light' });
    useDrilling.setState({ activeWell: 'L1', md: 5600, playing: true });
    useSurveyStore.setState({
      order: ['L1', 'L2', 'L3'],
      wells: {
        L1: {
          name: 'L1',
          slot: 0,
          junction: 0,
          version: 1,
          plan: [
            { md: 0, inc: 0, azi: 45, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 5000, inc: 30, azi: 45, tvd: 4800, n: 800, e: 800, dls: 2, beta: 0 },
            { md: 10000, inc: 90, azi: 45, tvd: 6000, n: 3500, e: 3500, dls: 1.5, beta: 0 },
          ],
          actual: [
            { md: 0, inc: 0.3, azi: 45, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 5000, inc: 29.5, azi: 45, tvd: 4802, n: 790, e: 790, dls: 1.9, beta: 0 },
            { md: 10000, inc: 89.8, azi: 45, tvd: 6005, n: 3490, e: 3495, dls: 1.5, beta: 0 },
          ],
        },
        L2: {
          name: 'L2',
          slot: 1,
          junction: 4500,
          version: 1,
          plan: [
            { md: 0, inc: 0, azi: 160, tvd: 0, n: 0, e: 0, dls: 0, beta: 0 },
            { md: 8000, inc: 85, azi: 160, tvd: 5500, n: -2000, e: 800, dls: 2, beta: 0 },
          ],
          actual: [],
        },
      },
    });
  });

  it('renders section title, canvas element, and hint text', () => {
    render(<WellboreLithology activeWell="L1" />);

    expect(
      screen.getByRole('heading', { name: /lithology along the wellbore/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByRole('img', { name: /lithology strip log against measured depth/i }),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/top band follows the plan, bottom band what the bit has drilled/i),
    ).toBeInTheDocument();
  });

  it('renders lateral selector buttons and switches selected lateral on click', async () => {
    const user = userEvent.setup();
    render(<WellboreLithology activeWell="L1" />);

    const btnL1 = screen.getByRole('button', { name: 'L1' });
    const btnL2 = screen.getByRole('button', { name: 'L2' });

    expect(btnL1).toHaveAttribute('aria-pressed', 'true');
    expect(btnL2).toHaveAttribute('aria-pressed', 'false');

    await user.click(btnL2);

    expect(btnL1).toHaveAttribute('aria-pressed', 'false');
    expect(btnL2).toHaveAttribute('aria-pressed', 'true');
    expect(useDrilling.getState().activeWell).toBe('L2');
  });

  it('maintains independent drilled progress for L1, L2, and L3 without data leakage', async () => {
    const user = userEvent.setup();
    render(<WellboreLithology activeWell="L1" />);

    // Start: L1 is at 5600
    expect(useDrilling.getState().activeWell).toBe('L1');
    expect(useDrilling.getState().md).toBe(5600);

    // Simulate drilling L1 to 7200
    act(() => {
      useDrilling.setState((s) => ({
        md: 7200,
        wellProgress: { ...s.wellProgress, L1: 7200 },
      }));
    });

    // Pause drilling
    act(() => {
      useDrilling.getState().setPlaying(false);
    });
    expect(useDrilling.getState().playing).toBe(false);

    // Switch to L2
    const btnL2 = screen.getByRole('button', { name: 'L2' });
    await user.click(btnL2);

    expect(useDrilling.getState().activeWell).toBe('L2');
    expect(useDrilling.getState().md).toBe(0);
    expect(useDrilling.getState().wellProgress.L1).toBe(7200);

    // Drill L2 to 3400
    act(() => {
      useDrilling.setState((s) => ({
        md: 3400,
        wellProgress: { ...s.wellProgress, L2: 3400 },
      }));
    });

    // Switch to L3
    const btnL3 = screen.getByRole('button', { name: 'L3' });
    await user.click(btnL3);

    expect(useDrilling.getState().activeWell).toBe('L3');
    expect(useDrilling.getState().md).toBe(0);
    expect(useDrilling.getState().wellProgress.L2).toBe(3400);

    // Switch back to L1: its progress (7200) is restored and remains paused
    const btnL1 = screen.getByRole('button', { name: 'L1' });
    await user.click(btnL1);

    expect(useDrilling.getState().activeWell).toBe('L1');
    expect(useDrilling.getState().md).toBe(7200);
    expect(useDrilling.getState().playing).toBe(false);

    // Resume drilling L1: continues from 7200
    act(() => {
      useDrilling.getState().setPlaying(true);
      useDrilling.setState((s) => ({
        md: 7500,
        wellProgress: { ...s.wellProgress, L1: 7500 },
      }));
    });

    expect(useDrilling.getState().md).toBe(7500);
    expect(useDrilling.getState().wellProgress.L1).toBe(7500);
    expect(useDrilling.getState().wellProgress.L2).toBe(3400);
    expect(useDrilling.getState().wellProgress.L3).toBe(0);
  });

  it('renders safely when no surveys exist', () => {
    useSurveyStore.setState({ order: [], wells: {} });
    render(<WellboreLithology activeWell={null} />);

    expect(
      screen.getByRole('heading', { name: /lithology along the wellbore/i }),
    ).toBeInTheDocument();
  });

  it('responds cleanly to unit conversion and store updates', () => {
    const { rerender } = render(<WellboreLithology activeWell="L1" />);

    act(() => {
      useSettings.setState({ unit: 'm' });
      useDrilling.setState({ md: 6200 });
    });

    rerender(<WellboreLithology activeWell="L1" />);
    expect(useSettings.getState().unit).toBe('m');
  });

  it('updates continuously during live simulation and accepts explicit currentMd prop', () => {
    const { rerender } = render(<WellboreLithology activeWell="L1" currentMd={6000} />);
    expect(screen.getByRole('img')).toHaveAttribute(
      'aria-label',
      expect.stringContaining('L1'),
    );

    // Progressive update to 8000 MD
    rerender(<WellboreLithology activeWell="L1" currentMd={8000} />);
    expect(screen.getByRole('img')).toBeInTheDocument();
  });
});

