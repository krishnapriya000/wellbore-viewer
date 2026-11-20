import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useSurveyStore } from '@/features/survey';
import { createMockAuth, type Role } from '@/shared/auth';
import { sampleCsv } from '@/test/fixtures';
import { App } from './App';
import { Providers } from './Providers';

// WebGL is not available in jsdom; the 3D view is covered by Playwright in CI.
vi.mock('@/features/viewer', () => ({
  Viewport: () => <section aria-label="3D wellbore trajectory view" />,
}));

const fetchSamples = (async (url: string) =>
  new Response(sampleCsv(String(url).includes('plan') ? 'plan' : 'actual'))) as unknown as typeof fetch;

function renderApp(role: Role, initialPath = '/trajectory') {
  vi.stubGlobal('fetch', fetchSamples);
  return render(
    <Providers auth={createMockAuth(role)}>
      <App initialPath={initialPath} />
    </Providers>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  useSurveyStore.setState({ wells: {}, order: [], status: 'empty', error: null });
});

describe('<App> integration (mock auth)', () => {
  it('renders common navigation sidebar with all 7 modules', () => {
    renderApp('Wellbore.Engineer', '/');
    expect(screen.getByRole('navigation', { name: '' })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Incident Center/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Incident Categories/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Trajectory & Real-Time/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Lithology/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /DDR/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Wellbore Geometry/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /Admin/i })).toBeInTheDocument();
  });

  it('renders Incident Center on root path', () => {
    renderApp('Wellbore.Engineer', '/');
    expect(screen.getByRole('heading', { name: /Incident Center/i })).toBeInTheDocument();
  });

  it('loads the sample wells and starts drilling the first lateral in trajectory view', async () => {
    renderApp('Wellbore.Engineer', '/trajectory');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Drilling wellbore' })).toHaveValue('L1'),
    );
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
      expect.arrayContaining(['L1', 'L2', 'L3']),
    );
    expect(screen.getByText('Local Developer')).toBeInTheDocument();
    expect(await screen.findByLabelText('3D wellbore trajectory view')).toBeInTheDocument();
  });

  it('gives a viewer read-only survey controls in trajectory view', async () => {
    renderApp('Wellbore.Viewer', '/trajectory');
    expect(await screen.findByText(/view-only access/)).toBeInTheDocument();
    expect(screen.queryByText('Upload actual')).not.toBeInTheDocument();
  });

  it('allows navigating across modules using sidebar links', async () => {
    const user = userEvent.setup();
    renderApp('Wellbore.Engineer', '/');

    // Start at Incident Center
    expect(screen.getByRole('heading', { name: /Incident Center/i })).toBeInTheDocument();

    // Navigate to Lithology
    await user.click(screen.getByRole('link', { name: /Lithology/i }));
    expect(await screen.findByRole('heading', { name: /Lithology & Stratigraphy/i })).toBeInTheDocument();

    // Navigate to Wellbore Geometry
    await user.click(screen.getByRole('link', { name: /Wellbore Geometry/i }));
    expect(await screen.findByRole('heading', { name: /Wellbore Geometry & Construction/i })).toBeInTheDocument();

    // Navigate to DDR
    await user.click(screen.getByRole('link', { name: /DDR/i }));
    expect(await screen.findByRole('heading', { name: /Daily Drilling Report/i })).toBeInTheDocument();

    // Navigate to Admin
    await user.click(screen.getByRole('link', { name: /Admin/i }));
    expect(await screen.findByRole('heading', { name: /Administration & Diagnostics/i })).toBeInTheDocument();
  });
});
