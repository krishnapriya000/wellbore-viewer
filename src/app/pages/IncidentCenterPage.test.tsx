import { render, screen, fireEvent } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useIncidentCategoriesStore } from '@/features/incident-categories';
import { IncidentCenterPage } from './IncidentCenterPage';

describe('IncidentCenterPage - Tile Overview, Sub-Issues and Incident Details Navigation', () => {
  beforeEach(() => {
    useIncidentCategoriesStore.setState({
      isLoading: false,
      error: null,
      selectedFamilyId: null,
      selectedTypeId: null,
      selectedIncidentCode: null,
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
    expect(screen.getByText(/Families Monitored/i)).toBeInTheDocument();
  });

  it('renders all 14 incident families as tiles in the main content area', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    // Verify key families are rendered as tiles
    expect(screen.getByText(/^Well-control$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Lost circulation & pressure-window$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Hole cleaning, pack-off & stuck-pipe$/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/^Bit, BHA, drilling-mechanics & vibration$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Data, model & advisory-system$/i)).toBeInTheDocument();
  });

  it('each tile shows category name, total monitored sub-issues, open count, and severity', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    // Well-control has 10 monitored sub-issues and open count
    expect(screen.getAllByText(/open of 10 monitored/i).length).toBeGreaterThan(0);
    // Severity badge is rendered
    expect(screen.getAllByText(/WARNING/i).length).toBeGreaterThan(0);
  });

  it('clicking a category tile navigates to the sub-issues list for that category', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    const wcTile = screen.getByText(/^Well-control$/i);
    fireEvent.click(wcTile);

    // Should now display sub-issues of Well-control
    expect(screen.getByText(/10 sub-issues monitored/i)).toBeInTheDocument();
    expect(screen.getByText(/Potential kick \/ influx/i)).toBeInTheDocument();
    expect(screen.getByText(/Gas influx/i)).toBeInTheDocument();
    expect(screen.getByText(/Swab-induced influx/i)).toBeInTheDocument();
    expect(screen.getByText(/Back to Overview/i)).toBeInTheDocument();
  });

  it('clicking a sub-issue navigates to its incident detail view with full technical advisory', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    // Click Well-control tile
    const wcTile = screen.getByText(/^Well-control$/i);
    fireEvent.click(wcTile);

    // Click "Potential kick / influx" sub-issue card
    const kickCard = screen.getByText(/Potential kick \/ influx/i);
    fireEvent.click(kickCard);

    // Detail view should show confidence, evidence, recommended actions, constraints, escalation, SOP and owner
    expect(screen.getByText(/CONFIDENCE/i)).toBeInTheDocument();
    expect(screen.getAllByText(/72/)[0]).toBeInTheDocument(); // 72% confidence
    expect(screen.getByText(/Real-time Evidence/i)).toBeInTheDocument();
    expect(screen.getByText(/Flow-out 4.1% above flow-in for 6 min/i)).toBeInTheDocument();
    expect(screen.getByText(/Recommended Action/i)).toBeInTheDocument();
    expect(screen.getByText(/WC-01 Flow-check & Hard Shut-in/i)).toBeInTheDocument();
    expect(screen.getByText(/Constraints — Do Not Exceed/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalation Trigger/i)).toBeInTheDocument();
    expect(screen.getByText(/Likely Causes \(Ranked Posterior\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead-Time Hazard/i)).toBeInTheDocument();
  });

  it('provides navigation breadcrumbs and Back actions across all 3 levels', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage />
      </MemoryRouter>,
    );

    // 1. Overview -> Family
    fireEvent.click(screen.getByText(/^Well-control$/i));
    expect(screen.getByText(/10 sub-issues monitored/i)).toBeInTheDocument();

    // 2. Family -> Incident Detail
    fireEvent.click(screen.getByText(/Potential kick \/ influx/i));
    expect(screen.getByText(/Recommended Action/i)).toBeInTheDocument();

    // 3. Back from Incident Detail -> Family Sub-issues
    const backBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn);
    expect(screen.getByText(/10 sub-issues monitored/i)).toBeInTheDocument();

    // 4. Back from Family Sub-issues -> Category Tiles Overview
    const backToTilesBtn = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backToTilesBtn);
    expect(screen.getAllByText(/open of 10 monitored/i).length).toBeGreaterThan(0);
  });

  it('allows toggling to Data Table view and acknowledging an advisory', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage initialViewMode="table" />
      </MemoryRouter>,
    );

    // Column headers should be present in Data Table mode
    expect(screen.getByRole('columnheader', { name: /INCIDENT/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /CURRENT STATE/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /SEVERITY/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /CONF\./i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /REAL-TIME EVIDENCE/i })).toBeInTheDocument();
    expect(screen.getByRole('columnheader', { name: /RECOMMENDED ACTIONS/i })).toBeInTheDocument();

    const ackBtn = screen.getByRole('button', { name: /Acknowledge Advisory/i });
    expect(ackBtn).toBeInTheDocument();
    fireEvent.click(ackBtn);

    expect(screen.getByRole('button', { name: /✓ Advisory Acknowledged/i })).toBeInTheDocument();
  });

  it('renders Warning Prediction alert in Data Table view and navigates to incident details on click', () => {
    render(
      <MemoryRouter>
        <IncidentCenterPage initialViewMode="table" />
      </MemoryRouter>,
    );

    // Alert banner should be rendered in table view
    const alertBanner = screen.getByRole('alert');
    expect(alertBanner).toBeInTheDocument();
    expect(alertBanner).toHaveTextContent(/Differential sticking/i);
    expect(alertBanner).toHaveTextContent(/88%/);
    expect(alertBanner).toHaveTextContent(/~30 min/);

    // Clicking alert switches to tiles view and opens incident details
    fireEvent.click(alertBanner);

    // Should navigate to incident details
    expect(screen.getByText(/SP-02 Differential Sticking & Spotting Fluid/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead-Time Hazard/i)).toBeInTheDocument();
  });
});
