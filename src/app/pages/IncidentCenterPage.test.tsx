import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useIncidentCategoriesStore } from '@/features/incident-categories';
import { IncidentCenterPage } from './IncidentCenterPage';

describe('IncidentCenterPage', () => {
  beforeEach(() => {
    useIncidentCategoriesStore.setState({
      isLoading: false,
      error: null,
      selectedFamilyId: 'wc',
      selectedTypeId: null,
      selectedIncidentCode: 'DW-WC-01',
      acknowledgedCodes: [],
    });
  });

  it('renders Incident Center header and global KPI summary metrics', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('heading', { level: 1, name: /Incident Center/i })).toBeInTheDocument();
    expect(screen.getByText(/Active critical/i)).toBeInTheDocument();
    expect(screen.getByText(/Active warning/i)).toBeInTheDocument();
    expect(screen.getByText(/Active advisory/i)).toBeInTheDocument();
    expect(screen.getByText(/Median ack latency/i)).toBeInTheDocument();
    expect(screen.getByText(/Alerts last hour/i)).toBeInTheDocument();
  });

  it('renders table columns matching DrillWise specifications', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getByRole('columnheader', { name: /INCIDENT/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /CURRENT STATE/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /SEVERITY/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /CONF\./i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /REAL-TIME EVIDENCE/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /LIKELY CAUSES/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /RECOMMENDED ACTIONS/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /CONSTRAINTS/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /ESCALATION TRIGGER/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /OWNER/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /STATUS/i })).toBeInTheDocument();
  });

  it('displays incident rows with code, state and evidence', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getAllByText(/Potential kick \/ influx/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText('DW-WC-01').length).toBeGreaterThan(0);
  });

  it('renders Evidence & Procedure side panel with parameter sparklines', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    expect(screen.getByText(/SURFACE TORQUE/i)).toBeInTheDocument();
    expect(screen.getByText(/23,800/i)).toBeInTheDocument();
    expect(screen.getByText(/ft-lbf/i)).toBeInTheDocument();
  });

  it('allows acknowledging an advisory', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    const ackBtn = screen.getByRole('button', { name: /Acknowledge Advisory/i });
    expect(ackBtn).toBeInTheDocument();
    fireEvent.click(ackBtn);

    expect(screen.getByRole('button', { name: /✓ Advisory Acknowledged/i })).toBeInTheDocument();
  });
});
