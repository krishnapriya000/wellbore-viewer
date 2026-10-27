import { render, screen } from '@testing-library/react';
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
      expect(screen.queryByRole('button', { name: /add formation/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit overburden/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete overburden/i })).not.toBeInTheDocument();

      // Formations list remains readable for viewers
      expect(screen.getByText('Overburden')).toBeInTheDocument();
      expect(screen.getByText('Target Sand')).toBeInTheDocument();
    });

    it('gives full add and edit controls to engineers', () => {
      renderWithRole('Wellbore.Engineer');
      expect(screen.queryByText(/read-only mode/i)).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add formation$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit overburden/i })).toBeInTheDocument();
    });
  });

  describe('adding a formation', () => {
    it('adds a valid formation successfully through the form', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByPlaceholderText(/top depth/i);
      const toInput = screen.getByPlaceholderText(/base depth/i);

      await user.type(nameInput, 'Caprock Anhydrite');
      await user.type(fromInput, '7000');
      await user.type(toInput, '7500');

      const submitBtn = screen.getByRole('button', { name: /^add formation$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/added formation "caprock anhydrite"/i)).toBeInTheDocument();
      expect(screen.getByText('Caprock Anhydrite')).toBeInTheDocument();
      expect(useGeologyStore.getState().formations.some((f) => f.name === 'Caprock Anhydrite')).toBe(
        true,
      );
    });

    it('shows validation error if To depth is shallower than From depth', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByPlaceholderText(/top depth/i);
      const toInput = screen.getByPlaceholderText(/base depth/i);

      await user.type(nameInput, 'Inverted Depths');
      await user.type(fromInput, '5000');
      await user.type(toInput, '2000');

      const submitBtn = screen.getByRole('button', { name: /^add formation$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/to must be deeper than from/i)).toBeInTheDocument();
      expect(
        useGeologyStore.getState().formations.some((f) => f.name === 'Inverted Depths'),
      ).toBe(false);
    });
  });

  describe('editing and cancelling', () => {
    it('loads existing formation into form when Edit is clicked and updates it', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const editBtn = screen.getByRole('button', { name: /edit overburden/i });
      await user.click(editBtn);

      // Verify form is in edit mode
      expect(screen.getByText(/edit formation: overburden/i)).toBeInTheDocument();
      const nameInput = screen.getByLabelText(/formation name/i);
      expect(nameInput).toHaveValue('Overburden');

      // Edit name
      await user.clear(nameInput);
      await user.type(nameInput, 'Upper Overburden');

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveBtn);

      expect(screen.getByText(/updated formation "upper overburden"/i)).toBeInTheDocument();
      expect(screen.getByText('Upper Overburden')).toBeInTheDocument();
    });

    it('cancels editing and clears the form when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      await user.click(screen.getByRole('button', { name: /edit overburden/i }));
      expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel edit/i }));
      expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add formation$/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/formation name/i)).toHaveValue('');
    });
  });

  describe('deleting a formation', () => {
    it('requires confirmation before deleting a formation', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByText('Overburden')).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /delete overburden/i });
      await user.click(deleteBtn);

      // Confirm button appears
      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      expect(confirmBtn).toBeInTheDocument();

      await user.click(confirmBtn);

      expect(screen.getByText(/deleted formation "overburden"/i)).toBeInTheDocument();
      expect(screen.queryByText('Overburden')).not.toBeInTheDocument();
      expect(useGeologyStore.getState().formations.some((f) => f.name === 'Overburden')).toBe(false);
    });
  });

  describe('formation visibility and legend', () => {
    it('displays DEMO / SAMPLE GEOLOGY banner to clearly identify demo stratigraphy', () => {
      renderWithRole('Wellbore.Viewer');
      expect(screen.getByText('DEMO / SAMPLE GEOLOGY')).toBeInTheDocument();
      expect(screen.getByText(/sample stratigraphy loaded for visualization/i)).toBeInTheDocument();
    });

    it('toggles formation visibility when the visibility button is clicked', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const toggleBtn = screen.getByRole('button', { name: /hide overburden/i });
      expect(toggleBtn).toHaveAttribute('aria-pressed', 'true');

      await user.click(toggleBtn);

      // Now hidden
      expect(useGeologyStore.getState().formations.find((f) => f.id === 'fm-1')?.visible).toBe(false);
      expect(screen.getByRole('button', { name: /show overburden/i })).toHaveAttribute('aria-pressed', 'false');
    });

    it('expands and collapses the USGS lithology pattern legend with 12 patterns', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Viewer');

      const legendToggle = screen.getByRole('button', { name: /show usgs lithology legend/i });
      expect(screen.queryByRole('region', { name: /usgs lithology patterns legend/i })).not.toBeInTheDocument();

      await user.click(legendToggle);

      const legendRegion = screen.getByRole('region', { name: /usgs lithology patterns legend/i });
      expect(legendRegion).toBeInTheDocument();

      // Check for distinct lithology patterns
      expect(screen.getByText('Sandstone')).toBeInTheDocument();
      expect(screen.getByText('Shale')).toBeInTheDocument();
      expect(screen.getByText('Limestone')).toBeInTheDocument();
      expect(screen.getByText('Dolomite')).toBeInTheDocument();
      expect(screen.getByText('Siltstone')).toBeInTheDocument();
      expect(screen.getByText('Coal')).toBeInTheDocument();
      expect(screen.getByText('Anhydrite')).toBeInTheDocument();
      expect(screen.getByText(/salt/i)).toBeInTheDocument();
      expect(screen.getByText('Conglomerate')).toBeInTheDocument();
      expect(screen.getByText('Marl')).toBeInTheDocument();
      expect(screen.getByText('Chert')).toBeInTheDocument();
      expect(screen.getByText('Basement')).toBeInTheDocument();

      // Collapse legend
      await user.click(screen.getByRole('button', { name: /hide lithology legend/i }));
      expect(screen.queryByRole('region', { name: /usgs lithology patterns legend/i })).not.toBeInTheDocument();
    });

    it('validates that lithology composition percentages must total 100%', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const nameInput = screen.getByLabelText(/formation name/i);
      const fromInput = screen.getByPlaceholderText(/top depth/i);
      const toInput = screen.getByPlaceholderText(/base depth/i);
      const pctInput = screen.getByLabelText(/percentage 1/i);

      await user.type(nameInput, 'Partial Mix');
      await user.type(fromInput, '3000');
      await user.type(toInput, '3500');
      await user.clear(pctInput);
      await user.type(pctInput, '75'); // 75% != 100%

      const submitBtn = screen.getByRole('button', { name: /^add formation$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/must total 100%/i)).toBeInTheDocument();
      expect(useGeologyStore.getState().formations.some((f) => f.name === 'Partial Mix')).toBe(false);
    });
  });
});
