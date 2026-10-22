import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { beforeEach, describe, expect, it } from 'vitest';
import { useSurveyStore } from '@/features/survey';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import { INITIAL_EVENTS, useEventsStore } from '../model/eventsStore';
import { EventEditor } from './EventEditor';

const renderWithRole = (role: Role) =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <EventEditor />
    </AuthContextProvider>,
  );

describe('<EventEditor>', () => {
  beforeEach(() => {
    useEventsStore.getState().resetToSample();
    useEventsStore.setState({ version: 0 });
    useSurveyStore.setState({ wells: {}, order: ['L1', 'L2'], status: 'ready', error: null });
  });

  describe('role gating', () => {
    it('shows read-only access notice to viewers and hides add and edit/delete controls', () => {
      renderWithRole('Wellbore.Viewer');
      expect(
        screen.getByText(/read-only mode\. ask an admin for the wellbore\.engineer role to edit events/i),
      ).toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /^add event$/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /edit casing shoe/i })).not.toBeInTheDocument();
      expect(screen.queryByRole('button', { name: /delete casing shoe/i })).not.toBeInTheDocument();

      // Events list remains visible and readable for viewers
      expect(screen.getByText('Casing Shoe')).toBeInTheDocument();
      expect(screen.getByText('Good Oil Show')).toBeInTheDocument();
    });

    it('gives full add, edit, and delete controls to engineers', () => {
      renderWithRole('Wellbore.Engineer');
      expect(
        screen.queryByText(/read-only mode\. ask an admin for the wellbore\.engineer role to edit events/i),
      ).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add event$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit casing shoe/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /delete casing shoe/i })).toBeInTheDocument();
    });

    it('gives full controls to admins who inherit engineer permissions', () => {
      renderWithRole('Wellbore.Admin');
      expect(screen.getByRole('button', { name: /^add event$/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /edit casing shoe/i })).toBeInTheDocument();
    });
  });

  describe('adding an event', () => {
    it('adds a valid event successfully through the form', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const mdInput = screen.getByLabelText(/measured depth/i);
      const noteInput = screen.getByLabelText(/note or description/i);
      const typeSelect = screen.getByLabelText(/event type/i);

      await user.selectOptions(typeSelect, 'kick');
      await user.type(mdInput, '4500');
      await user.type(noteInput, '5 bbl kick taken at 4500 ft');

      const submitBtn = screen.getByRole('button', { name: /^add event$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/added event "well kick" at 4,500/i)).toBeInTheDocument();
      expect(useEventsStore.getState().events.some((e) => e.type === 'kick' && e.md === 4500)).toBe(
        true,
      );
    });

    it('shows validation error for invalid measured depth input', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const mdInput = screen.getByLabelText(/measured depth/i);
      await user.type(mdInput, '-50');

      const submitBtn = screen.getByRole('button', { name: /^add event$/i });
      await user.click(submitBtn);

      expect(screen.getByText(/measured depth cannot be negative/i)).toBeInTheDocument();
      expect(useEventsStore.getState().events.some((e) => e.md === -50)).toBe(false);
    });
  });

  describe('editing and cancelling', () => {
    it('loads existing event into form when Edit is clicked and updates it', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const editBtn = screen.getByRole('button', { name: /edit casing shoe/i });
      await user.click(editBtn);

      // Verify form is in edit mode
      expect(screen.getByText(/edit event/i)).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /save changes/i })).toBeInTheDocument();

      const noteInput = screen.getByLabelText(/note or description/i);
      expect(noteInput).toHaveValue(INITIAL_EVENTS[0]!.note);

      await user.clear(noteInput);
      await user.type(noteInput, 'Surface casing set and pressure tested to 1500 psi');

      const saveBtn = screen.getByRole('button', { name: /save changes/i });
      await user.click(saveBtn);

      expect(screen.getByText(/updated event "casing shoe" on l1/i)).toBeInTheDocument();
      expect(
        useEventsStore
          .getState()
          .events.some((e) => e.id === 'ev-1' && e.note?.includes('pressure tested')),
      ).toBe(true);
    });

    it('cancels editing and clears the form when Cancel is clicked', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      await user.click(screen.getByRole('button', { name: /edit casing shoe/i }));
      expect(screen.getByRole('button', { name: /cancel edit/i })).toBeInTheDocument();

      await user.click(screen.getByRole('button', { name: /cancel edit/i }));
      expect(screen.queryByRole('button', { name: /cancel edit/i })).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /^add event$/i })).toBeInTheDocument();
      expect(screen.getByLabelText(/measured depth/i)).toHaveValue(null);
    });
  });

  describe('deleting an event', () => {
    it('requires confirmation before deleting an event', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByText('Casing Shoe')).toBeInTheDocument();

      const deleteBtn = screen.getByRole('button', { name: /delete casing shoe/i });
      await user.click(deleteBtn);

      // Confirm and Cancel buttons appear
      const confirmBtn = screen.getByRole('button', { name: /confirm/i });
      const cancelBtn = screen.getByRole('button', { name: /cancel/i });
      expect(confirmBtn).toBeInTheDocument();
      expect(cancelBtn).toBeInTheDocument();

      // Click Cancel first
      await user.click(cancelBtn);
      expect(screen.queryByRole('button', { name: /confirm/i })).not.toBeInTheDocument();
      expect(useEventsStore.getState().events.some((e) => e.id === 'ev-1')).toBe(true);

      // Click Delete then Confirm
      await user.click(screen.getByRole('button', { name: /delete casing shoe/i }));
      await user.click(screen.getByRole('button', { name: /confirm/i }));

      expect(screen.getByText(/deleted event "casing shoe" on l1/i)).toBeInTheDocument();
      expect(useEventsStore.getState().events.some((e) => e.id === 'ev-1')).toBe(false);
    });
  });

  describe('empty state and filtering', () => {
    it('shows friendly empty state message when no events exist', () => {
      useEventsStore.setState({ events: [], version: 1 });
      renderWithRole('Wellbore.Engineer');

      expect(screen.getByText(/no engineering events recorded\./i)).toBeInTheDocument();
    });

    it('filters events by wellbore', async () => {
      const user = userEvent.setup();
      renderWithRole('Wellbore.Engineer');

      const filterSelect = screen.getByLabelText(/filter events by well/i);
      await user.selectOptions(filterSelect, 'L2');

      // L2 has Normal Fault
      expect(screen.getByText('Fault')).toBeInTheDocument();
      // L1's Casing Shoe should not be visible under L2 filter
      expect(screen.queryByText('Casing Shoe')).not.toBeInTheDocument();
    });
  });
});
