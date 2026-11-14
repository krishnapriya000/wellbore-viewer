import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useWellStore } from '@/features/wells';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import { useWellPlanningStore } from '../model/wellPlanningStore';
import { WellPlanningEditor } from './WellPlanningEditor';

const renderWithRole = (role: Role = 'Wellbore.Engineer') =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <WellPlanningEditor />
    </AuthContextProvider>,
  );

describe('<WellPlanningEditor>', () => {
  beforeEach(() => {
    useWellPlanningStore.setState({ plans: [], error: null, isLoading: false });
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
    expect(screen.getByText(/no well planning records available/i)).toBeInTheDocument();
  });

  it('adds a valid well plan via the form', async () => {
    const user = userEvent.setup();
    renderWithRole('Wellbore.Engineer');

    const objInput = screen.getByLabelText(/target objective/i);
    const mdInput = screen.getByLabelText(/target depth md/i);
    const tvdInput = screen.getByLabelText(/target depth tvd/i);

    await user.clear(objInput);
    await user.type(objInput, 'Sandstone B payzone');

    await user.clear(mdInput);
    await user.type(mdInput, '14000');

    await user.clear(tvdInput);
    await user.type(tvdInput, '7500');

    const submitBtn = screen.getByRole('button', { name: /^add well plan$/i });
    await user.click(submitBtn);

    expect(screen.getByText(/added well plan for "Well 01"/i)).toBeInTheDocument();
    expect(screen.getByText('Sandstone B payzone')).toBeInTheDocument();
  });

  it('displays validation error if TVD exceeds MD', async () => {
    const user = userEvent.setup();
    renderWithRole('Wellbore.Engineer');

    const objInput = screen.getByLabelText(/target objective/i);
    const mdInput = screen.getByLabelText(/target depth md/i);
    const tvdInput = screen.getByLabelText(/target depth tvd/i);

    await user.type(objInput, 'Deep Gas Target');
    await user.type(mdInput, '6000');
    await user.type(tvdInput, '8000');

    const submitBtn = screen.getByRole('button', { name: /^add well plan$/i });
    await user.click(submitBtn);

    expect(screen.getByText(/target depth tvd cannot exceed target depth md/i)).toBeInTheDocument();
  });

  it('edits an existing well plan', async () => {
    const user = userEvent.setup();
    useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      targetDepthMd: 12000,
      targetDepthTvd: 7000,
      targetInclination: 85,
      targetAzimuth: 50,
      plannedKickoffDepth: 3500,
      targetObjective: 'Initial Formation Target',
    });

    renderWithRole('Wellbore.Engineer');
    expect(screen.getByText('Initial Formation Target')).toBeInTheDocument();

    const editBtn = screen.getByRole('button', { name: /edit plan for Well 01/i });
    await user.click(editBtn);

    const objInput = screen.getByLabelText(/target objective/i);
    await user.clear(objInput);
    await user.type(objInput, 'Revised Formation Target');

    const saveBtn = screen.getByRole('button', { name: /save changes/i });
    await user.click(saveBtn);

    expect(screen.getByText('Revised Formation Target')).toBeInTheDocument();
    expect(screen.getByText(/updated well plan for "Well 01"/i)).toBeInTheDocument();
  });

  it('requires confirmation before deleting a plan', async () => {
    const user = userEvent.setup();
    useWellPlanningStore.getState().addPlan({
      wellId: 'w-1',
      wellName: 'Well 01',
      targetDepthMd: 10000,
      targetDepthTvd: 6000,
      targetInclination: 90,
      targetAzimuth: 45,
      plannedKickoffDepth: 3000,
      targetObjective: 'Target To Delete',
    });

    renderWithRole('Wellbore.Engineer');
    expect(screen.getByText('Target To Delete')).toBeInTheDocument();

    const deleteBtn = screen.getByRole('button', { name: /delete plan for Well 01/i });
    await user.click(deleteBtn);

    const confirmBtn = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmBtn);

    expect(screen.queryByText('Target To Delete')).not.toBeInTheDocument();
  });
});

