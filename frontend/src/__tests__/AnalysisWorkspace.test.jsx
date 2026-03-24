import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import AnalysisWorkspace from '../pages/AnalysisWorkspace';

describe('AnalysisWorkspace', () => {
  it('disables ingest while submission is in flight and shows the latest result', async () => {
    let resolveRequest;
    const api = {
      getMinervaFormat: vi.fn(async () => ({ command_text: '/minerva-format', spec_text: '## MINERVA_REPORT' })),
      getAnalysisTrail: vi.fn(async () => []),
      ingestMinervaReport: vi.fn(
        () =>
          new Promise((resolve) => {
            resolveRequest = resolve;
          })
      ),
    };

    render(<AnalysisWorkspace api={api} stocks={[{ ticker: 'MP' }]} />);

    fireEvent.change(screen.getByPlaceholderText(/Paste the full MINERVA markdown document here/i), {
      target: { value: '## MINERVA_REPORT\n### Ticker: MP\n### Date: 2026-03-24\n### Source: test\n\n## DECISION\n| Field | Value |\n|-------|-------|\n| Verdict | BULLISH |\n| Conviction | 4 |\n| Action | BUY |\n| Entry Low | $10 |\n| Entry High | $11 |\n| Stop Loss | $9 |\n| Stop Basis | support break |\n| Target | $15 |\n| Target Basis | breakout extension |\n| Timeframe | 1-3 weeks |\n| R:R Ratio | 2:1 |\n| Position Size | Standard |\n| Summary | Test summary |' },
    });

    const button = screen.getByRole('button', { name: /Ingest report/i });
    fireEvent.click(button);

    await waitFor(() => expect(api.ingestMinervaReport).toHaveBeenCalledTimes(1));
    expect(screen.getByRole('button', { name: /Ingesting…/i }).disabled).toBe(true);
    expect(screen.getAllByRole('button', { name: /Validate/i })[0].disabled).toBe(true);

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
    expect(screen.getByRole('button', { name: /View latest raw report/i })).toBeTruthy();
  });

  it('validates, autofills a template, clears the editor, and opens raw history documents', async () => {
    const api = {
      getMinervaFormat: vi.fn(async () => ({ command_text: '/minerva-format', spec_text: '## MINERVA_REPORT' })),
      getAnalysisTrail: vi.fn(async () => ([
        {
          run_id: 'RUN_2',
          ticker: 'MP',
          started_at: '2026-03-24T10:00:00Z',
          parse_status: 'PARTIAL',
          status: 'COMPLETE',
          summary: 'Historical report',
          action: 'WATCH',
          conviction: 3,
          raw_report: '## MINERVA_REPORT\n### Ticker: MP',
          failed_sections: ['PRICE_DATA'],
          changed_since_last_analysis: true,
        },
      ])),
      ingestMinervaReport: vi.fn(),
      validateMinervaReport: vi.fn(async () => ({
        valid: true,
        parse_status: 'COMPLETE',
        report_count: 1,
        scope: ['MP'],
        reports: [
          {
            ticker: 'MP',
            parse_status: 'COMPLETE',
            missing_sections: [],
            empty_sections: [],
          },
        ],
      })),
    };

    render(<AnalysisWorkspace api={api} stocks={[{ ticker: 'MP' }]} />);

    fireEvent.click(screen.getAllByRole('button', { name: /Autofill template/i })[0]);
    expect(screen.getByDisplayValue(/### Ticker: MP/i)).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: /Validate/i })[0]);
    await waitFor(() => expect(screen.getByText(/Validation result/i)).toBeTruthy());
    expect(screen.getByText(/Reports found/i)).toBeTruthy();
    expect(screen.getByText(/^1$/)).toBeTruthy();

    await waitFor(() => expect(screen.getByText(/Historical report/i)).toBeTruthy());
    fireEvent.click(screen.getAllByRole('button', { name: /View raw/i })[0]);
    expect(screen.getByText(/MP raw MINERVA report/i)).toBeTruthy();

    fireEvent.click(screen.getAllByRole('button', { name: /Close/i })[0]);
    fireEvent.click(screen.getAllByRole('button', { name: /^Clear$/i })[0]);
    expect(screen.getAllByPlaceholderText(/Paste the full MINERVA markdown document here/i)[0].value).toBe('');
  });
});
