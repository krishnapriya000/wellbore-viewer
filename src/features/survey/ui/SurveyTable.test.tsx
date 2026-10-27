import { fireEvent, render, screen } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { create } from 'zustand';
import { computeSurvey } from '../lib/mcm';
import { useSurveyStore } from '../model/surveyStore';
import { SurveyTable } from './SurveyTable';

function createMockBitStore(initial: { md: number; mode: 'actual' | 'plan' }) {
  return create<{
    md: number;
    mode: 'actual' | 'plan';
    setMode: (m: 'actual' | 'plan') => void;
  }>()((set) => ({
    md: initial.md,
    mode: initial.mode,
    setMode: (mode) => set({ mode }),
  }));
}

describe('<SurveyTable>', () => {
  beforeEach(() => {
    useSurveyStore.setState({
      wells: {
        L1: {
          name: 'L1',
          slot: 0,
          plan: computeSurvey([
            { md: 0, inc: 0, azi: 45 },
            { md: 100, inc: 2, azi: 45 },
            { md: 200, inc: 4, azi: 45 },
          ]),
          actual: computeSurvey([
            { md: 0, inc: 0.5, azi: 45 },
            { md: 100, inc: 2.5, azi: 45 },
          ]),
          junction: 0,
          version: 1,
        },
      },
      order: ['L1'],
      status: 'ready',
      error: null,
    });
  });

  it('renders actual survey stations reached at the given MD', () => {
    const bitStore = createMockBitStore({ md: 150, mode: 'actual' });
    render(<SurveyTable well="L1" bitStore={bitStore} />);

    expect(screen.getByRole('heading', { name: /Survey table/ })).toBeInTheDocument();
    // In actual mode, 2 rows reached: md 0 and md 100
    expect(screen.getAllByText('100.0').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('2.50')).toBeInTheDocument();
  });

  it('renders planned survey stations when in plan mode', () => {
    const bitStore = createMockBitStore({ md: 50, mode: 'plan' });
    render(<SurveyTable well="L1" bitStore={bitStore} />);

    // In plan mode, all 3 plan stations are shown
    expect(screen.getByText('200.0')).toBeInTheDocument();
    expect(screen.getByText('4.00')).toBeInTheDocument();
  });

  it('synchronizes mode toggle with bitStore', () => {
    const bitStore = createMockBitStore({ md: 150, mode: 'actual' });
    render(<SurveyTable well="L1" bitStore={bitStore} />);

    // Click "Plan" button in SurveyTable
    const planButton = screen.getByRole('button', { name: 'Plan' });
    fireEvent.click(planButton);

    expect(bitStore.getState().mode).toBe('plan');
    expect(screen.getByText('200.0')).toBeInTheDocument();

    // Click "Actual" button
    const actualButton = screen.getByRole('button', { name: 'Actual' });
    fireEvent.click(actualButton);

    expect(bitStore.getState().mode).toBe('actual');
    expect(screen.queryByText('200.0')).not.toBeInTheDocument();
  });

  it('displays a friendly empty message when no surveys exist for the selected mode', () => {
    useSurveyStore.setState({
      wells: {
        L2: {
          name: 'L2',
          slot: 1,
          plan: [],
          actual: computeSurvey([
            { md: 0, inc: 0, azi: 160 },
            { md: 100, inc: 2, azi: 160 },
          ]),
          junction: 0,
          version: 1,
        },
      },
      order: ['L2'],
      status: 'ready',
      error: null,
    });

    const bitStore = createMockBitStore({ md: 100, mode: 'plan' });
    render(<SurveyTable well="L2" bitStore={bitStore} />);

    expect(screen.getByText(/No plan surveys for L2/)).toBeInTheDocument();
  });
});
