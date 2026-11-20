import { render, screen, fireEvent, act, within } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { MemoryRouter } from 'react-router';
import { useIncidentCategoriesStore } from '@/features/incident-categories';
import { IncidentCategoriesPage } from './IncidentCategoriesPage';

describe('IncidentCategoriesPage - Tile-based Category Hierarchy', () => {
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

  it('renders 14 incident category tiles with DrillWise taxonomy', () => {
    render(
      <MemoryRouter>
        <IncidentCategoriesPage />
      </MemoryRouter>,
    );

    // Breadcrumb title
    expect(screen.getByText(/Categories Overview/i)).toBeInTheDocument();

    // Verify key families are displayed as tiles
    expect(screen.getByText(/^Well-control$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Lost circulation & pressure-window$/i)).toBeInTheDocument();
    expect(screen.getAllByText(/^Hole cleaning, pack-off & stuck-pipe$/i).length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText(/^HSE & environmental$/i)).toBeInTheDocument();
    expect(screen.getByText(/^Data, model & advisory-system$/i)).toBeInTheDocument();
  });

  it('allows complete navigation: Tile -> Sub-issues -> Incident Details -> Back', () => {
    render(
      <MemoryRouter>
        <IncidentCategoriesPage />
      </MemoryRouter>,
    );

    // 1. Click Category Tile (Well-control)
    const wcTile = screen.getByText(/^Well-control$/i);
    fireEvent.click(wcTile);

    // Sub-issues view for Well-control should show its monitored types
    expect(screen.getByText(/Potential kick \/ influx/i)).toBeInTheDocument();
    expect(screen.getByText(/Gas influx/i)).toBeInTheDocument();

    // 2. Click a Sub-Issue (Potential kick / influx)
    const kickIssue = screen.getByText(/Potential kick \/ influx/i);
    fireEvent.click(kickIssue);

    // Detail view
    expect(screen.getByText(/WC-01 Flow-check & Hard Shut-in/i)).toBeInTheDocument();
    expect(screen.getByText(/CONFIDENCE/i)).toBeInTheDocument();
    expect(screen.getByText(/Constraints — Do Not Exceed/i)).toBeInTheDocument();
    expect(screen.getByText(/Escalation Trigger/i)).toBeInTheDocument();

    // 3. Navigate back to Sub-issue List
    const backBtn1 = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn1);
    expect(screen.getByText(/Gas influx/i)).toBeInTheDocument();

    // 4. Navigate back to Category Tiles Overview
    const backBtn2 = screen.getByRole('button', { name: 'Back' });
    fireEvent.click(backBtn2);
    expect(screen.getByText(/^Well-control$/i)).toBeInTheDocument();
  });

  it('renders Warning Prediction lead-time hazard probabilities for 5, 15, 30 and 60 minutes', () => {
    render(
      <MemoryRouter>
        <IncidentCategoriesPage />
      </MemoryRouter>,
    );

    // Navigate to Potential kick / influx (conf = 0.72)
    fireEvent.click(screen.getByText(/^Well-control$/i));
    fireEvent.click(screen.getByText(/Potential kick \/ influx/i));

    // Panel header & GBT tag
    expect(screen.getByText(/Lead-Time Hazard/i)).toBeInTheDocument();
    expect(screen.getByText('GBT')).toBeInTheDocument();
    expect(screen.getByText(/P\(event within horizon\)/i)).toBeInTheDocument();

    // 4 horizons
    expect(screen.getByText('5 min')).toBeInTheDocument();
    expect(screen.getByText('15 min')).toBeInTheDocument();
    expect(screen.getByText('30 min')).toBeInTheDocument();
    expect(screen.getByText('60 min')).toBeInTheDocument();

    // Monotonicity note
    expect(screen.getByText(/Monotone by construction/i)).toBeInTheDocument();

    // Exact hazard values for 0.72 confidence
    expect(screen.getByText('10.7%')).toBeInTheDocument();
    expect(screen.getByText('28.9%')).toBeInTheDocument();
    expect(screen.getByText('49.4%')).toBeInTheDocument();
    expect(screen.getByText('74.4%')).toBeInTheDocument();

    // Est. Lead Time pill (earliest horizon reaching 50%)
    expect(screen.getByText(/Est\. Lead:/i)).toBeInTheDocument();
    expect(screen.getByText('~60 min')).toBeInTheDocument();
  });

  it('updates Warning Prediction probabilities dynamically when confidence changes', () => {
    render(
      <MemoryRouter>
        <IncidentCategoriesPage />
      </MemoryRouter>,
    );

    fireEvent.click(screen.getByText(/^Well-control$/i));
    fireEvent.click(screen.getByText(/Potential kick \/ influx/i));

    // Initial 60 min is 74.4%
    expect(screen.getByText('74.4%')).toBeInTheDocument();

    // Update confidence via interactive slider to 85%
    const slider = screen.getByRole('slider', { name: /Adjust incident confidence/i });
    act(() => {
      fireEvent.change(slider, { target: { value: '85' } });
    });

    // Hazard probabilities for 0.85 confidence:
    // lambda = 0.85^2.4 * 0.05 = 0.0339
    // P(30) = 1 - exp(-0.0339 * 30) = 63.8%
    // P(60) = 1 - exp(-0.0339 * 60) = 86.9%
    expect(screen.getByText('63.8%')).toBeInTheDocument();
    expect(screen.getByText('86.9%')).toBeInTheDocument();
    expect(screen.getAllByText('~30 min').length).toBeGreaterThanOrEqual(1);
  });

  it('renders visible Warning Prediction alert banner and navigates to incident details on click', () => {
    render(
      <MemoryRouter>
        <IncidentCategoriesPage />
      </MemoryRouter>,
    );

    // Alert banner should be rendered with role="alert"
    const alertBanner = screen.getByRole('alert');
    expect(alertBanner).toBeInTheDocument();

    // Verify alert displays predicted incident name, severity, confidence, estimated lead time
    expect(within(alertBanner).getByText('Differential sticking')).toBeInTheDocument();
    expect(within(alertBanner).getByText('CRITICAL')).toBeInTheDocument();
    expect(within(alertBanner).getByText('88%')).toBeInTheDocument();
    expect(within(alertBanner).getByText('~30 min')).toBeInTheDocument();
    expect(within(alertBanner).getByText('Supervisor')).toBeInTheDocument();

    // Clicking the alert navigates directly to the incident details view
    fireEvent.click(alertBanner);

    // Should now be on incident details view
    expect(screen.getByText(/SP-02 Differential Sticking & Spotting Fluid/i)).toBeInTheDocument();
    expect(screen.getByText(/Lead-Time Hazard/i)).toBeInTheDocument();

    // Alert banner remains visible at the top even in incident details view (matching HTML reference)
    expect(screen.getByRole('alert')).toBeInTheDocument();
  });
});
