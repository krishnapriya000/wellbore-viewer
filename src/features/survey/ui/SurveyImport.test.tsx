import * as XLSX from 'xlsx';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it } from 'vitest';
import { AuthContextProvider, createMockAuthService, type Role } from '@/shared/auth';
import type { Station } from '../lib/types';
import { useSurveyStore } from '../model/surveyStore';
import { SurveyImport } from './SurveyImport';

const renderAs = (
  role: Role,
  activeWell: string = 'L1',
  props?: {
    onLoaded?: (kind: 'plan' | 'actual', wells: Map<string, Station[]>) => void;
    onLoadSample?: () => void;
  },
) =>
  render(
    <AuthContextProvider service={createMockAuthService(role)}>
      <SurveyImport activeWell={activeWell} {...props} />
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

describe('<SurveyImport> file uploads', () => {
  beforeEach(() => {
    useSurveyStore.setState({ wells: {}, order: [], status: 'empty', error: null });
  });

  it('uploads a plan CSV and updates the store with success message', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L1');
    const planInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const csvContent = 'MD,Inc,Azi\n0,0,45\n100,2,45\n200,4,45';
    const file = new File([csvContent], 'plan.csv', { type: 'text/csv' });

    fireEvent.change(planInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Plan loaded: L1/)).toBeInTheDocument();
    });

    const well = useSurveyStore.getState().wells['L1'];
    expect(well).toBeDefined();
    expect(well!.plan).toHaveLength(3);
  });

  it('uploads an actual XLSX and updates the store', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L2');
    const actualInput = container.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.aoa_to_sheet([
      ['MD', 'Inc', 'Azi'],
      [0, 0, 160],
      [100, 2, 160],
    ]);
    XLSX.utils.book_append_sheet(wb, ws, 'Sheet1');
    const ab = XLSX.write(wb, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer;
    const file = new File([ab], 'actual.xlsx', {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    fireEvent.change(actualInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Actual loaded: L2/)).toBeInTheDocument();
    });

    const well = useSurveyStore.getState().wells['L2'];
    expect(well).toBeDefined();
    expect(well!.actual).toHaveLength(2);
  });

  it('handles ACTUAL-only upload when no corresponding PLAN survey exists', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L3');
    const actualInput = container.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;

    const csvContent = 'MD,Inc,Azi\n0,0.5,290\n100,3.0,290\n200,6.0,290';
    const file = new File([csvContent], 'actual.csv', { type: 'text/csv' });

    fireEvent.change(actualInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Actual loaded: L3/)).toBeInTheDocument();
    });

    const well = useSurveyStore.getState().wells['L3'];
    expect(well).toBeDefined();
    expect(well!.actual).toHaveLength(3);
    expect(well!.plan).toHaveLength(0); // Works completely fine with no plan
  });

  it('notifies onLoaded callback with parsed wells and streams from surface', async () => {
    let loadedKind = '';
    let loadedWells: Map<string, unknown> | null = null;
    const { container } = renderAs('Wellbore.Engineer', 'L1', {
      onLoaded: (kind, wells) => {
        loadedKind = kind;
        loadedWells = wells;
      },
    });

    const actualInput = container.querySelectorAll('input[type="file"]')[1] as HTMLInputElement;
    const csvContent = 'Well,MD,Inc,Azi\nL1,0,0,45\nL1,100,1,45\nL2,0,0,160\nL2,100,2,160';
    const file = new File([csvContent], 'actual.csv', { type: 'text/csv' });

    fireEvent.change(actualInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(loadedKind).toBe('actual');
      expect(loadedWells?.has('L1')).toBe(true);
      expect(loadedWells?.has('L2')).toBe(true);
      expect(screen.getByText(/streaming from surface/)).toBeInTheDocument();
    });
  });

  it('displays a validation error when uploading an invalid file format', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L1');
    const planInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['binary junk'], 'survey.pdf', { type: 'application/pdf' });
    fireEvent.change(planInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Unsupported file format/)).toBeInTheDocument();
    });
  });

  it('displays a validation error when uploading an empty file', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L1');
    const planInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File([], 'empty.csv', { type: 'text/csv' });
    fireEvent.change(planInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/The survey file is empty/)).toBeInTheDocument();
    });
  });

  it('displays validation errors when columns are missing', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L1');
    const planInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['MD,Inc\n0,0\n100,2'], 'bad.csv', { type: 'text/csv' });
    fireEvent.change(planInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/Missing required column/)).toBeInTheDocument();
    });
  });

  it('displays skipped row info when partial rows have errors', async () => {
    const { container } = renderAs('Wellbore.Engineer', 'L1');
    const planInput = container.querySelector('input[type="file"]') as HTMLInputElement;

    const file = new File(['MD,Inc,Azi\n0,0,45\n100,invalid,45\n200,3,45'], 'partial.csv', { type: 'text/csv' });
    fireEvent.change(planInput, { target: { files: [file] } });

    await waitFor(() => {
      expect(screen.getByText(/row\(s\) skipped — first: row 3/)).toBeInTheDocument();
    });
  });
});

