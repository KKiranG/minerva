import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import Overview from '../pages/Overview';

describe('Overview', () => {
  it('renders clickable stock rows that use the v3 daily_change_pct field', async () => {
    const api = {
      getOverview: async () => ({
        generated_at: '2026-03-24T00:00:00Z',
        stocks: [
          {
            ticker: 'MP',
            company_name: 'MP Materials',
            current_price: 24.5,
            daily_change_pct: 5.2,
            current_verdict: 'BULLISH',
            current_action: 'BUY',
            current_conviction: 4,
            one_line_summary: 'Constructive setup.',
            active_catalyst_count: 1,
            next_event_date: '2026-04-15',
            next_event_type: 'FUNDING_DECISION',
            last_analysis_date: '2026-03-24T09:00:00Z',
            open_position_flag: false,
            needs_attention: false,
            alert_flag: true,
            changed_since_last_analysis: true,
          },
        ],
      }),
    };

    render(<Overview api={api} stocks={[]} />);

    const link = await screen.findByRole('link', { name: /MP/i });
    expect(link.getAttribute('href')).toBe('#/stocks/MP');
    expect(screen.getByText(/\+5.2%/i)).toBeTruthy();
    expect(screen.getByText(/Last analysis/i)).toBeTruthy();
  });
});
