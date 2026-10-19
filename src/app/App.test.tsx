import { render, screen, waitFor } from '@testing-library/react';
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

function renderApp(role: Role) {
  vi.stubGlobal('fetch', fetchSamples);
  return render(
    <Providers auth={createMockAuth(role)}>
      <App />
    </Providers>,
  );
}

afterEach(() => {
  vi.unstubAllGlobals();
  useSurveyStore.setState({ wells: {}, order: [], status: 'empty', error: null });
});

describe('<App> integration (mock auth)', () => {
  it('loads the sample wells and starts drilling the first lateral', async () => {
    renderApp('Wellbore.Engineer');
    await waitFor(() =>
      expect(screen.getByRole('combobox', { name: 'Drilling wellbore' })).toHaveValue('L1'),
    );
    expect(screen.getAllByRole('option').map((o) => o.textContent)).toEqual(
      expect.arrayContaining(['L1', 'L2', 'L3']),
    );
    expect(screen.getByText('Local Developer')).toBeInTheDocument();
    expect(await screen.findByLabelText('3D wellbore trajectory view')).toBeInTheDocument();
  });

  it('gives a viewer read-only survey controls', async () => {
    renderApp('Wellbore.Viewer');
    expect(await screen.findByText(/view-only access/)).toBeInTheDocument();
    expect(screen.queryByText('Upload actual')).not.toBeInTheDocument();
  });
});
