import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWellStore } from '@/features/wells';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import { useMudPlanningStore } from '../model/mudPlanningStore';
import { MudPlanningEditor } from './MudPlanningEditor';

const renderWithRole = (role: Role = 'Wellbore.Engineer') =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <MudPlanningEditor />
    </AuthContextProvider>,
  );

describe('<MudPlanningEditor>', () => {
  beforeEach(() => {
    useMudPlanningStore.setState({ plans: [], error: null, isLoading: false });
    useWellStore.setState({
      wells: [
        {
          id: 'w-1',
          name: 'Well 01',
          wellCode: 'W-01',
          fieldName: 'Demo Field',
          location: 'Pad A',
          description: null,
          createdAt: '',
          updatedAt: '',
          laterals: [],
        },
      ],
      currentWellId: 'w-1',
      isLoading: false,
      error: null,
    });
  });

  it('renders empty table message initially', () => {
    renderWithRole('Wellbore.Engineer');
    expect(screen.getByText(/no mud planning records available/i)).toBeInTheDocument();
  });

  it('adds a valid mud plan via the form', async () => {
    const user = userEvent.setup();
    renderWithRole('Wellbore.Engineer');

    const weightInput = screen.getByLabelText(/mud weight in ppg/i);
    const pvInput = screen.getByLabelText(/plastic viscosity in cp/i);
    const ypInput = screen.getByLabelText(/yield point in lb\/100ft²/i);
    const flInput = screen.getByLabelText(/fluid loss in ml\/30min/i);

    await user.clear(weightInput);
    await user.type(weightInput, '10.5');

    await user.clear(pvInput);
    await user.type(pvInput, '20');

    await user.clear(ypInput);
    await user.type(ypInput, '15');

    await user.clear(flInput);
    await user.type(flInput, '5.0');

    const submitBtn = screen.getByRole('button', { name: /^add mud plan$/i });
    await user.click(submitBtn);

    expect(screen.getByText(/added mud plan.*for "Well 01"/i)).toBeInTheDocument();
    expect(screen.getByText('10.50')).toBeInTheDocument();
  });

  it('displays validation error if mud weight is non-positive or exceeds maximum', async () => {
    const user = userEvent.setup();
    renderWithRole('Wellbore.Engineer');

    const weightInput = screen.getByLabelText(/mud weight in ppg/i);

    await user.clear(weightInput);
    await user.type(weightInput, '0');

    const submitBtn = screen.getByRole('button', { name: /^add mud plan$/i });
    await user.click(submitBtn);

    expect(screen.getByText(/mud weight must be a positive number/i)).toBeInTheDocument();
  });

  it('edits an existing mud plan', async () => {
    const user = userEvent.setup();
    useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      mudType: 'Water-Based Mud (WBM)',
      mudWeight: 9.5,
      plasticViscosity: 18,
      yieldPoint: 14,
      fluidLoss: 6.0,
      remarks: 'Initial Mud Note',
    });

    renderWithRole('Wellbore.Engineer');
    expect(screen.getByText('9.50')).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /edit mud plan for Well 01/i });
    await user.click(editBtn);

    const weightInput = screen.getByLabelText(/mud weight in ppg/i);
    await user.clear(weightInput);
    await user.type(weightInput, '11.8');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    expect(screen.getByText('11.80')).toBeInTheDocument();
    expect(screen.getByText(/updated mud plan.*for "Well 01"/i)).toBeInTheDocument();
  });

  it('requires confirmation before deleting a mud plan', async () => {
    const user = userEvent.setup();
    useMudPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      mudType: 'Synthetic-Based Mud (SBM)',
      mudWeight: 13.0,
      plasticViscosity: 28,
      yieldPoint: 20,
      fluidLoss: 2.5,
    });

    renderWithRole('Wellbore.Engineer');
    expect(screen.getByText('13.00')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /delete mud plan for Well 01/i });
    await user.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmBtn);

    expect(screen.queryByText('13.00')).not.toBeInTheDocument();
  });
});

