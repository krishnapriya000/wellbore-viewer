import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useIncidentCategoriesStore } from '../model/incidentCategoriesStore';
import { IncidentSidebarTree } from './IncidentSidebarTree';

describe('IncidentSidebarTree', () => {
  beforeEach(() => {
    useIncidentCategoriesStore.setState({
      expandedFamilyIds: ['wc'],
      selectedFamilyId: 'wc',
      selectedTypeId: null,
      selectedIncidentCode: 'DW-WC-01',
    });
  });

  it('renders all 14 Incident Families with badges and counts', () => {
    render(
      <MemoryRouter>
        <IncidentSidebarTree />
      </MemoryRouter>,
    );

    expect(screen.getByText(/1\. Well-control/i)).toBeInTheDocument();
    expect(screen.getByText(/2\. Lost circulation/i)).toBeInTheDocument();
    expect(screen.getByText(/3\. Hole cleaning/i)).toBeInTheDocument();
    expect(screen.getByText(/14\. Data, model & advisory-system/i)).toBeInTheDocument();
  });

  it('displays severity indicators beside categories', () => {
    render(
      <MemoryRouter>
        <IncidentSidebarTree />
      </MemoryRouter>,
    );

    // Well-control has warning indicator ! 1 and count 3/10
    expect(screen.getByText('3/10')).toBeInTheDocument();
  });

  it('expands to show associated incident types when family is expanded', () => {
    render(
      <MemoryRouter>
        <IncidentSidebarTree />
      </MemoryRouter>,
    );

    // Family 1 is expanded
    expect(screen.getByText(/Potential kick \/ influx/i)).toBeInTheDocument();
    expect(screen.getByText(/Gas influx/i)).toBeInTheDocument();
    expect(screen.getByText(/Swab-induced influx/i)).toBeInTheDocument();
  });

  it('allows clicking an incident type to select it', () => {
    render(
      <MemoryRouter>
        <IncidentSidebarTree />
      </MemoryRouter>,
    );

    const typeItem = screen.getByText(/Gas influx/i);
    fireEvent.click(typeItem);

    const state = useIncidentCategoriesStore.getState();
    expect(state.selectedIncidentCode).toBe('DW-WC-02');
  });

  it('allows clicking the dropdown arrow to expand and collapse a family', () => {
    render(
      <MemoryRouter>
        <IncidentSidebarTree />
      </MemoryRouter>,
    );

    // Well-control is initially expanded in beforeEach
    const collapseBtn = screen.getByRole('button', { name: /Collapse 1\. Well-control/i });
    expect(collapseBtn).toBeInTheDocument();

    // Click collapse arrow button
    fireEvent.click(collapseBtn);

    // Verify it is collapsed in store and UI
    expect(useIncidentCategoriesStore.getState().expandedFamilyIds).not.toContain('wc');

    // Click expand arrow button
    const expandBtn = screen.getByRole('button', { name: /Expand 1\. Well-control/i });
    fireEvent.click(expandBtn);

    // Verify it is re-expanded
    expect(useIncidentCategoriesStore.getState().expandedFamilyIds).toContain('wc');
  });
});
