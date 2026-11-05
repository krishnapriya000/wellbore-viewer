import * as XLSX from 'xlsx';
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
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
    onLiveStationAdded?: (well: string) => void;
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

describe('<SurveyImport> live survey addition with well selection', () => {
  beforeEach(() => {
    useSurveyStore.setState({ wells: {}, order: [], status: 'empty', error: null });
    useSurveyStore.getState().setActual(
      new Map([
        [
          'L1',
          [
            { md: 0, inc: 0, azi: 45 },
            { md: 100, inc: 1, azi: 45 },
          ],
        ],
        [
          'L2',
          [
            { md: 0, inc: 0, azi: 160 },
            { md: 100, inc: 2, azi: 160 },
          ],
        ],
        [
          'L3',
          [
            { md: 0, inc: 0, azi: 290 },
            { md: 100, inc: 3, azi: 290 },
          ],
        ],
      ]),
    );
  });

  it('renders Well selection dropdown containing L1, L2, L3 and survey inputs', () => {
    renderAs('Wellbore.Engineer', 'L1');
    const wellSelect = screen.getByRole('combobox', { name: 'Well' });
    expect(wellSelect).toBeInTheDocument();
    const options = within(wellSelect)
      .getAllByRole('option')
      .map((o) => o.textContent);
    expect(options).toEqual(expect.arrayContaining(['L1', 'L2', 'L3']));

    expect(screen.getByLabelText(/md ft/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/inc °/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/azi °/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /add live survey/i })).toBeInTheDocument();
  });

  it('adds live survey station to L2 when L2 is selected without updating L1 or L3', async () => {
    let notifiedWell = '';
    renderAs('Wellbore.Engineer', 'L1', {
      onLiveStationAdded: (w) => {
        notifiedWell = w;
      },
    });

    const wellSelect = screen.getByRole('combobox', { name: 'Well' });
    fireEvent.change(wellSelect, { target: { value: 'L2' } });

    const mdInput = screen.getByLabelText(/md ft/i);
    const incInput = screen.getByLabelText(/inc °/i);
    const aziInput = screen.getByLabelText(/azi °/i);

    fireEvent.change(mdInput, { target: { value: '250' } });
    fireEvent.change(incInput, { target: { value: '5.5' } });
    fireEvent.change(aziInput, { target: { value: '162' } });

    const submitBtn = screen.getByRole('button', { name: /add live survey/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Queued L2 @ 250/)).toBeInTheDocument();
    });

    const store = useSurveyStore.getState();
    expect(store.wells['L2']!.actual).toHaveLength(3);
    expect(store.wells['L2']!.actual[2]!.md).toBe(250);
    expect(store.wells['L1']!.actual).toHaveLength(2); // L1 unchanged
    expect(store.wells['L3']!.actual).toHaveLength(2); // L3 unchanged
    expect(notifiedWell).toBe('L2');
  });

  it('adds live survey station to L3 when L3 is selected', async () => {
    renderAs('Wellbore.Engineer', 'L1');

    const wellSelect = screen.getByRole('combobox', { name: 'Well' });
    fireEvent.change(wellSelect, { target: { value: 'L3' } });

    const mdInput = screen.getByLabelText(/md ft/i);
    const incInput = screen.getByLabelText(/inc °/i);
    const aziInput = screen.getByLabelText(/azi °/i);

    fireEvent.change(mdInput, { target: { value: '300' } });
    fireEvent.change(incInput, { target: { value: '8.0' } });
    fireEvent.change(aziInput, { target: { value: '295' } });

    const submitBtn = screen.getByRole('button', { name: /add live survey/i });
    fireEvent.click(submitBtn);

    await waitFor(() => {
      expect(screen.getByText(/Queued L3 @ 300/)).toBeInTheDocument();
    });

    const store = useSurveyStore.getState();
    expect(store.wells['L3']!.actual).toHaveLength(3);
    expect(store.wells['L3']!.actual[2]!.md).toBe(300);
    expect(store.wells['L1']!.actual).toHaveLength(2);
    expect(store.wells['L2']!.actual).toHaveLength(2);
  });
});

