import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import { SurveyImport } from './SurveyImport';

const renderAs = (role: Role) =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <SurveyImport activeWell="L1" />
    </AuthContextProvider>,
  );

describe('<SurveyImport> role gating', () => {
  it('hides upload controls from viewers', () => {
    renderAs('Wellbore.Viewer');
    expect(screen.queryByText('Upload plan')).not.toBeInTheDocument();
    expect(screen.getByText(/view-only access/)).toBeInTheDocument();
  });

  it('shows upload and live-survey controls to engineers', () => {
    renderAs('Wellbore.Engineer');
    expect(screen.getByText('Upload plan')).toBeInTheDocument();
    expect(screen.getByRole('form', { name: 'Add live survey' })).toBeInTheDocument();
  });
});
