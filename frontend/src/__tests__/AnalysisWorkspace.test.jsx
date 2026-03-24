import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnalysisWorkspace from '../pages/AnalysisWorkspace';

describe('AnalysisWorkspace', () => {
  it('disables ingest while submission is in flight', async () => {
    let resolveRequest;
    const api = {
      getMinervaFormat: vi.fn(async () => ({ command_text: '/minerva-format', spec_text: '## MINERVA_REPORT' })),
      ingestMinervaReport: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      ),
    };

    render(<AnalysisWorkspace api={api} stocks={[{ ticker: 'MP' }]} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste the full MINERVA markdown document here/i), {
      target: { value: '## MINERVA_REPORT\n### Ticker: MP\n### Date: 2026-03-24\n### Source: test\n\n## DECISION\n| Field | Value |\n|-------|-------|\n| Verdict | BULLISH |' },
    });

    const button = screen.getByRole('button', { name: /Ingest report/i });
    fireEvent.click(button);

    await waitFor(() => expect(api.ingestMinervaReport).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: /Ingesting…/i }).disabled).toBe(true);

    resolveRequest({
      extraction_id: 1,
      parse_status: 'COMPLETE',
      scope: ['MP'],
      reports: [
        {
          run_id: 'RUN_1',
          ticker: 'MP',
          parse_status: 'COMPLETE',
          catalysts_stored: 0,
          events_stored: 0,
          price_snapshot_stored: false,
          decision_stored: true,
          notes_stored: 0,
          failed_sections: [],
        },
      ],
    });

    await waitFor(() => expect(screen.getByText(/Extraction 1 finished with COMPLETE/i)).toBeTruthy());
  });
});
