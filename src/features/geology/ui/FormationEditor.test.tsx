import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import { useGeologyStore } from '../model/geologyStore';
import { FormationEditor } from './FormationEditor';

const renderWithRole = (role: Role) =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <FormationEditor />
    </AuthContextProvider>,
  );

describe('<FormationEditor>', () => {
  beforeEach(() => {
    useGeologyStore.getState().resetToSample();
    useGeologyStore.setState({ version: 0 });
  });

  describe('role gating', () => {
    it('shows view-only access notice to viewers and hides edit controls', () => {
      renderWithRole('Wellbore.Viewer');
      expect(screen.getByText(/read-only mode/i)).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /add interval/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete quaternary fill/i })).not.toBeInTheDocument();

      // Formations list remains readable for viewers
      expect(screen.getByText('Quaternary fill')).toBeInTheDocument();
      expect(screen.getByText('Upper Shale')).toBeInTheDocument();
    });

    it('gives full add and delete controls to engineers', () => {
      renderWithRole('Wellbore.Engineer');
      expect(screen.queryByText(/read-only mode/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add interval$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete quaternary fill/i })).toBeInTheDocument();
      expect(screen.getByText(/lithology mix/i)).toBeInTheDocument();
    });
  });

  describe('adding a formation', () => {
    it('has default input values matching the original HTML implementation', () => {
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByLabelText(/depth reference/i)).toHaveValue('TVD');
      expect(screen.getByLabelText(/from/i)).toHaveValue(6100);
      expect(screen.getByLabelText(/^to/i)).toHaveValue(6140);
      expect(screen.getByLabelText(/formation name/i)).toHaveValue('Coal stringer');
      expect(screen.getByLabelText(/lithology symbol/i)).toHaveValue('coal');
    });

    it('adds a valid formation successfully through the form', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/^to/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Caprock Anhydrite');
      await user.clear(fromInput);
      await user.type(fromInput, '7000');
      await user.clear(toInput);
      await user.type(toInput, '7500');

      const submitBtn = screen.getByRole('button', { name: /^add interval$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/added caprock anhydrite/i)).toBeInTheDocument();
      expect(screen.getByText('Caprock Anhydrite')).toBeInTheDocument();
      expect(useGeologyStore.getState().formations.some((f) => f.name === 'Caprock Anhydrite')).toBe(
        true,
      );
    });

    it('adds multiple formations consecutively without duplicate ID errors', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/^to/i);
      const submitBtn = screen.getByRole('button', { name: /^add interval$/i });

      // Add First Interval
      await user.clear(nameInput);
      await user.type(nameInput, 'Sequential Interval 1');
      await user.clear(fromInput);
      await user.type(fromInput, '8200');
      await user.clear(toInput);
      await user.type(toInput, '8400');
      await user.click(submitBtn);

      expect(screen.getByText(/added sequential interval 1/i)).toBeInTheDocument();
      expect(screen.getByText('Sequential Interval 1')).toBeInTheDocument();

      // Add Second Interval consecutively
      await user.clear(nameInput);
      await user.type(nameInput, 'Sequential Interval 2');
      await user.clear(fromInput);
      await user.type(fromInput, '8400');
      await user.clear(toInput);
      await user.type(toInput, '8600');
      await user.click(submitBtn);

      expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
      expect(screen.getByText(/added sequential interval 2/i)).toBeInTheDocument();
      expect(screen.getByText('Sequential Interval 2')).toBeInTheDocument();

      // Add Third Interval consecutively
      await user.clear(nameInput);
      await user.type(nameInput, 'Sequential Interval 3');
      await user.clear(fromInput);
      await user.type(fromInput, '8600');
      await user.clear(toInput);
      await user.type(toInput, '8800');
      await user.click(submitBtn);

      expect(screen.queryByText(/already exists/i)).not.toBeInTheDocument();
      expect(screen.getByText(/added sequential interval 3/i)).toBeInTheDocument();
      expect(screen.getByText('Sequential Interval 3')).toBeInTheDocument();

      const fms = useGeologyStore.getState().formations;
      const f1 = fms.find((f) => f.name === 'Sequential Interval 1');
      const f2 = fms.find((f) => f.name === 'Sequential Interval 2');
      const f3 = fms.find((f) => f.name === 'Sequential Interval 3');

      expect(f1).toBeDefined();
      expect(f2).toBeDefined();
      expect(f3).toBeDefined();
      expect(f1?.id).not.toBe('temp-id');
      expect(f2?.id).not.toBe('temp-id');
      expect(f3?.id).not.toBe('temp-id');
      expect(f1?.id).not.toBe(f2?.id);
      expect(f2?.id).not.toBe(f3?.id);
    }, 25000);

    it('restores sample formations when "Restore sample" button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      // Add a custom formation
      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/^to/i);
      const submitBtn = screen.getByRole('button', { name: /^add interval$/i });

      await user.clear(nameInput);
      await user.type(nameInput, 'Temporary Custom Layer');
      await user.clear(fromInput);
      await user.type(fromInput, '8200');
      await user.clear(toInput);
      await user.type(toInput, '8400');
      await user.click(submitBtn);

      expect(screen.getByText('Temporary Custom Layer')).toBeInTheDocument();

      // Click restore sample
      const restoreBtn = screen.getByRole('button', { name: /restore sample/i });
      await user.click(restoreBtn);

      expect(screen.getByText(/sample formations restored/i)).toBeInTheDocument();
      expect(screen.queryByText('Temporary Custom Layer')).not.toBeInTheDocument();
    });

    it('shows validation error if To depth is shallower than From depth', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/^to/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Inverted Depths');
      await user.clear(fromInput);
      await user.type(fromInput, '5000');
      await user.clear(toInput);
      await user.type(toInput, '2000');

      const submitBtn = screen.getByRole('button', { name: /^add interval$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/to must be deeper than from/i)).toBeInTheDocument();
      expect(
        useGeologyStore.getState().formations.some((f) => f.name === 'Inverted Depths'),
      ).toBe(false);
    });
  });

  describe('lithology mix and percentages', () => {
    it('validates that lithology composition percentages must total 100%', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/^to/i);
      const pctInput = screen.getByLabelText(/percentage 1/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Partial Mix');
      await user.clear(fromInput);
      await user.type(fromInput, '3000');
      await user.clear(toInput);
      await user.type(toInput, '3500');
      await user.clear(pctInput);
      await user.type(pctInput, '75'); // 75% != 100%

      const submitBtn = screen.getByRole('button', { name: /^add interval$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/must total 100%/i)).toBeInTheDocument();
      expect(useGeologyStore.getState().formations.some((f) => f.name === 'Partial Mix')).toBe(false);
    });

    it('allows configuring multiple lithology percentages totaling 100%', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByLabelText(/from/i);
      const toInput = screen.getByLabelText(/^to/i);
      const pctInput1 = screen.getByLabelText(/percentage 1/i);

      await user.clear(nameInput);
      await user.type(nameInput, 'Interbedded Sand Shale');
      await user.clear(fromInput);
      await user.type(fromInput, '4000');
      await user.clear(toInput);
      await user.type(toInput, '4200');

      // Change first lithology to 70%
      await user.clear(pctInput1);
      await user.type(pctInput1, '70');

      // Add second lithology row (30%)
      const addLithBtn = screen.getByRole('button', { name: /\+ add lithology/i });
      await user.click(addLithBtn);

      const submitBtn = screen.getByRole('button', { name: /^add interval$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/added interbedded sand shale/i)).toBeInTheDocument();
      const added = useGeologyStore.getState().formations.find((f) => f.name === 'Interbedded Sand Shale');
      expect(added).toBeDefined();
      expect(added!.comp).toHaveLength(2);
      expect(added!.comp[0]!.pct).toBe(70);
      expect(added!.comp[1]!.pct).toBe(30);
    });
  });

  describe('editing and deleting', () => {
    it('loads existing formation into form when Edit is clicked and updates it', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const editBtn = screen.getByRole('button', { name: /edit quaternary fill/i });
      await user.click(editBtn);

      // Verify form is in edit mode
      expect(screen.getByText(/edit formation: quaternary fill/i)).toBeInTheDocument();
      const nameInput = screen.getByLabelText(/formation name/i);
      expect(nameInput).toHaveValue('Quaternary fill');

      // Edit name
      await user.clear(nameInput);
      await user.type(nameInput, 'Upper Quaternary');

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveBtn);

      expect(screen.getByText(/updated formation "upper quaternary"/i)).toBeInTheDocument();
      expect(screen.getByText('Upper Quaternary')).toBeInTheDocument();
    });

    it('deletes a formation when the × button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByText('Quaternary fill')).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /delete quaternary fill/i });
      await user.click(deleteBtn);

      expect(screen.getByText(/removed interval/i)).toBeInTheDocument();
      expect(screen.queryByText('Quaternary fill')).not.toBeInTheDocument();
      expect(useGeologyStore.getState().formations.some((f) => f.name === 'Quaternary fill')).toBe(false);
    });
  });

  describe('lithology legend', () => {
    it('displays the 12 USGS lithology pattern legend always visible below table', () => {
      renderWithRole('Wellbore.Viewer');

      const legendRegion = screen.getByRole('region', { name: /usgs lithology patterns legend/i });
      expect(legendRegion).toBeInTheDocument();

      // Check for distinct lithology patterns inside the legend
      expect(within(legendRegion).getByText('Sandstone')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Shale')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Limestone')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Dolomite')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Siltstone')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Coal')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Anhydrite')).toBeInTheDocument();
      expect(within(legendRegion).getByText(/salt/i)).toBeInTheDocument();
      expect(within(legendRegion).getByText('Conglomerate')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Marl')).toBeInTheDocument();
      expect(within(legendRegion).getByText('Chert')).toBeInTheDocument();
      expect(within(legendRegion).getByText(/granite \/ basement/i)).toBeInTheDocument();
    });

    it('displays the hint text explaining TVD and MD intervals', () => {
      renderWithRole('Wellbore.Viewer');
      expect(
        screen.getByText(/tvd intervals are layers across the whole field/i),
      ).toBeInTheDocument();
    });
  });
});
