import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { McmExplanation } from './McmExplanation';

describe('<McmExplanation>', () => {
  it('renders the Minimum Curvature Method details summary and equations', () => {
    render(<McmExplanation />);

    expect(screen.getByText(/minimum curvature method/i)).toBeInTheDocument();
    expect(screen.getByText(/β\s*=\s*acos/)).toBeInTheDocument();
    expect(screen.getByText(/RF\s*=\s*\(2\/β\)·tan\(β\/2\)/)).toBeInTheDocument();
    expect(screen.getByText(/ΔN\s*=/)).toBeInTheDocument();
    expect(screen.getByText(/ΔE\s*=/)).toBeInTheDocument();
    expect(screen.getByText(/ΔTVD\s*=/)).toBeInTheDocument();
    expect(screen.getByText(/DLS\s*=/)).toBeInTheDocument();
  });

  it('renders the explanatory paragraph describing circular arc trajectory computation', () => {
    render(<McmExplanation />);

    expect(
      screen.getByText(/the bore between surveys is drawn as the exact circular arc the method assumes/i),
    ).toBeInTheDocument();
  });
});

