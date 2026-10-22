import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSurveyStore } from '@/features/survey';
import { useConstructionStore } from '../model/constructionStore';
import { Schematic } from './Schematic';

describe('<Schematic>', () => {
  beforeEach(() => {
    useConstructionStore.getState().resetToSample();
    useConstructionStore.setState({ version: 0 });
    useSurveyStore.setState({
      wells: {},
      order: ['L1', 'L2'],
      status: 'ready',
      error: null,
    });
  });

  it('renders schematic title, item count badge, and canvas image', () => {
    render(<Schematic activeWell="L1" />);

    expect(screen.getByRole('heading', { name: /well construction schematic/i })).toBeInTheDocument();
    expect(screen.getByText(/9 items/i)).toBeInTheDocument();
    expect(screen.getByRole('img', { name: /well construction schematic for l1/i })).toBeInTheDocument();
  });

  it('allows switching lateral well view when multiple wells exist', async () => {
    const user = userEvent.setup();
    render(<Schematic activeWell="L1" />);

    const l2Btn = screen.getByRole('button', { name: 'L2' });
    expect(l2Btn).toHaveAttribute('aria-pressed', 'false');

    await user.click(l2Btn);
    expect(l2Btn).toHaveAttribute('aria-pressed', 'true');
    expect(screen.getByRole('img', { name: /well construction schematic for l2/i })).toBeInTheDocument();
  });

  it('dynamically displays fit-check warnings banner when items violate engineering checks', () => {
    act(() => {
      useConstructionStore.setState({
        items: [
          {
            id: 'h1',
            kind: 'hole',
            size: 8.5,
            from: 0,
            to: 2000,
            well: 'L1',
            note: '',
          },
          {
            id: 'c1',
            kind: 'casing',
            size: 13.375, // 13.375" casing will not fit an 8.5" hole!
            from: 0,
            to: 2000,
            well: 'L1',
            note: '',
          },
        ],
        version: 1,
      });
    });

    render(<Schematic activeWell="L1" />);
    expect(screen.getByRole('alert')).toBeInTheDocument();
    expect(screen.getByText(/13\.375" casing: 13\.375" casing will not fit a 8\.5" hole/i)).toBeInTheDocument();
  });

  it('handles empty construction data gracefully', () => {
    act(() => {
      useConstructionStore.setState({ items: [], version: 2 });
    });

    render(<Schematic activeWell="L1" />);
    expect(screen.getByText(/0 items/i)).toBeInTheDocument();
    expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    expect(screen.getByRole('img', { name: /well construction schematic for l1/i })).toBeInTheDocument();
  });

  it('updates item count badge when new items are added', () => {
    const { rerender } = render(<Schematic activeWell="L1" />);
    expect(screen.getByText(/9 items/i)).toBeInTheDocument();

    act(() => {
      useConstructionStore.getState().addItem({
        kind: 'hole',
        size: 6.0,
        from: 7200,
        to: 9500,
        well: 'L1',
        note: 'Slender drainhole',
      });
    });

    rerender(<Schematic activeWell="L1" />);
    expect(screen.getByText(/10 items/i)).toBeInTheDocument();
  });
});
