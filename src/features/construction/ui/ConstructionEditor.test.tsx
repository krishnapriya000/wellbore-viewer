import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSurveyStore } from '@/features/survey';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import {
  INITIAL_CONSTRUCTION_ITEMS,
  useConstructionStore,
} from '../model/constructionStore';
import { ConstructionEditor } from './ConstructionEditor';

const renderWithRole = (role: Role) =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <ConstructionEditor />
    </AuthContextProvider>,
  );

describe('<ConstructionEditor>', () => {
  beforeEach(() => {
    useConstructionStore.getState().resetToSample();
    useConstructionStore.setState({ version: 0 });
    useSurveyStore.setState({ wells: {}, order: ['L1', 'L2'], status: 'ready', error: null });
  });

  describe('role gating', () => {
    it('shows read-only access notice to viewers and hides add and edit/delete controls', () => {
      renderWithRole('Wellbore.Viewer');
      expect(
        screen.getByText(
          /read-only mode\. ask an admin for the wellbore\.engineer role to edit well construction/i,
        ),
      ).toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /^add construction item$/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /edit 17\.5 inch hole/i }),
      ).not.toBeInTheDocument();
      expect(
        screen.queryByRole('button', { name: /delete 17\.5 inch hole/i }),
      ).not.toBeInTheDocument();

      // Construction items remain visible and readable for viewers
      expect(screen.getByText(/17\.5" Hole/i)).toBeInTheDocument();
      expect(screen.getByText(/13\.375" Casing/i)).toBeInTheDocument();
    });

    it('gives full add, edit, and delete controls to engineers', () => {
      renderWithRole('Wellbore.Engineer');
      expect(
        screen.queryByText(
          /read-only mode\. ask an admin for the wellbore\.engineer role to edit well construction/i,
        ),
      ).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^add construction item$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /edit 17\.5 inch hole/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /delete 17\.5 inch hole/i }),
      ).toBeInTheDocument();
    });

    it('gives full controls to admins who inherit engineer permissions', () => {
      renderWithRole('Wellbore.Admin');
      expect(
        screen.getByRole('button', { name: /^add construction item$/i }),
      ).toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /edit 17\.5 inch hole/i }),
      ).toBeInTheDocument();
    });
  });

  describe('adding a construction item', () => {
    it('adds a valid hole section successfully through the form', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const fromInput = screen.getByLabelText(/from depth/i);
      const toInput = screen.getByLabelText(/to depth/i);
      const noteInput = screen.getByLabelText(/construction remarks/i);

      await user.type(fromInput, '7200');
      await user.type(toInput, '9500');
      await user.type(noteInput, 'Deep exploratory hole');

      const submitBtn = screen.getByRole('button', { name: /^add construction item$/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/added hole section \(12\.25"\) from 7,200/i),
      ).toBeInTheDocument();
      expect(
        useConstructionStore
          .getState()
          .items.some((i) => i.kind === 'hole' && i.from === 7200 && i.to === 9500),
      ).toBe(true);
    });

    it('shows validation error when To depth is shallower than From depth', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const fromInput = screen.getByLabelText(/from depth/i);
      const toInput = screen.getByLabelText(/to depth/i);

      await user.type(fromInput, '5000');
      await user.type(toInput, '2000');

      const submitBtn = screen.getByRole('button', { name: /^add construction item$/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/to depth must be deeper than from depth/i),
      ).toBeInTheDocument();
      expect(
        useConstructionStore.getState().items.some((i) => i.from === 5000 && i.to === 2000),
      ).toBe(false);
    });

    it('displays fit-check warning when adding casing incompatible with hole size', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const kindSelect = screen.getByLabelText(/construction item type/i);
      await user.selectOptions(kindSelect, 'casing');

      const sizeSelect = screen.getByLabelText(/casing or cement size in inches/i);
      await user.selectOptions(sizeSelect, '16');

      const fromInput = screen.getByLabelText(/from depth/i);
      const toInput = screen.getByLabelText(/to depth/i);

      // Section covered by hole-2 (size 12.25)
      await user.type(fromInput, '1500');
      await user.type(toInput, '3000');

      const submitBtn = screen.getByRole('button', { name: /^add construction item$/i });
      await user.click(submitBtn);

      expect(
        screen.getByText(/fit-check warning: 16" casing will not fit a 12\.25" hole/i),
      ).toBeInTheDocument();
    });
  });

  describe('editing and cancelling', () => {
    it('loads existing item into form when Edit is clicked and updates it', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const editBtn = screen.getByRole('button', { name: /edit 17\.5 inch hole/i });
      await user.click(editBtn);

      expect(screen.getByText(/edit construction item/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

      const noteInput = screen.getByLabelText(/construction remarks/i);
      expect(noteInput).toHaveValue(INITIAL_CONSTRUCTION_ITEMS[0]!.note);

      await user.clear(noteInput);
      await user.type(noteInput, 'Modified surface conductor note');

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveBtn);

      expect(screen.getByText(/updated hole section \(17\.5"\) on all/i)).toBeInTheDocument();
      expect(
        useConstructionStore
          .getState()
          .items.some((i) => i.id === 'hole-1' && i.note?.includes('Modified surface')),
      ).toBe(true);
    });

    it('cancels editing and clears the form when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      await user.click(screen.getByRole('button', { name: /edit 17\.5 inch hole/i }));
      expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel edit/i }));
      expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument();
      expect(
        screen.getByRole('button', { name: /^add construction item$/i }),
      ).toBeInTheDocument();
      expect(screen.getByLabelText(/from depth/i)).toHaveValue(null);
    });
  });

  describe('deleting an item', () => {
    it('requires confirmation before deleting an item', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByText(/17\.5" Hole/i)).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /delete 17\.5 inch hole/i });
      await user.click(deleteBtn);

      // Confirm and Cancel buttons appear
      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(confirmBtn).toBeInTheDocument();
      expect(cancelBtn).toBeInTheDocument();

      // Click Cancel first
      await user.click(cancelBtn);
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
      expect(useConstructionStore.getState().items.some((i) => i.id === 'hole-1')).toBe(true);

      // Click Delete then Confirm
      await user.click(screen.getByRole('button', { name: /delete 17\.5 inch hole/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      expect(screen.getByText(/deleted hole \(17\.5"\) on all/i)).toBeInTheDocument();
      expect(useConstructionStore.getState().items.some((i) => i.id === 'hole-1')).toBe(false);
    });
  });

  describe('filtering and empty states', () => {
    it('filters items by kind (hole, casing, cement)', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      // Click Hole filter
      await user.click(screen.getByRole('button', { name: /^hole \(/i }));
      expect(screen.getByText(/17\.5" Hole/i)).toBeInTheDocument();
      expect(screen.queryByText(/13\.375" Casing/i)).not.toBeInTheDocument();

      // Click Casing filter
      await user.click(screen.getByRole('button', { name: /^casing \(/i }));
      expect(screen.getByText(/13\.375" Casing/i)).toBeInTheDocument();
      expect(screen.queryByText(/17\.5" Hole/i)).not.toBeInTheDocument();
    });

    it('shows empty state message when no items match', () => {
      useConstructionStore.setState({ items: [], version: 1 });
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByText(/no construction items defined/i)).toBeInTheDocument();
    });
  });
});
