import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import ResearchVault from '../pages/ResearchVault';

describe('ResearchVault', () => {
  it('opens the full note body in the raw document viewer', async () => {
    const api = {
      getResearch: async () => ([
        {
          id: 1,
          ticker: 'MP',
          title: 'Narrative note',
          note_type: 'NARRATIVE',
          category: 'FRONTIER_REPORT',
          note_body: 'Full raw note body for review.',
          created_at: '2026-03-25T09:00:00Z',
        },
      ]),
    };

    render(<ResearchVault api={api} stocks={[{ ticker: 'MP' }]} />);

    await waitFor(() => expect(screen.getByText(/Narrative note/i)).toBeTruthy());
    fireEvent.click(screen.getByRole('button', { name: /Open full note/i }));

    expect(screen.getAllByText(/Narrative note/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Full raw note body for review./i).length).toBeGreaterThan(0);
  });
});
