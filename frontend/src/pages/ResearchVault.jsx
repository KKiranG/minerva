import React, { useMemo, useState } from 'react';
import { seedUniverse } from '../api';
import useAsyncResource from '../hooks/useAsyncResource';
import { EmptyState, ErrorState, LoadingState, Section, TimelineList } from '../components/Common';
import { asDate } from '../utils/formatters';

export default function ResearchVault({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('MP');
  const [query, setQuery] = useState('');
  const research = useAsyncResource((signal) => api.getResearch({ ticker, signal }), [ticker]);
  const universe = stocks.length ? stocks : seedUniverse;

  const filtered = useMemo(() => {
    const rows = research.data || [];
    const term = query.trim().toLowerCase();
    if (!term) return rows;
    return rows.filter((row) => `${row.title} ${row.note_body} ${row.note_type}`.toLowerCase().includes(term));
  }, [query, research.data]);

  return (
    <Section
      title="Research vault"
      subtitle="Search the note archive returned by the backend."
      action={
        <div className="form-row">
          <select className="toolbar-select" value={ticker} onChange={(event) => setTicker(event.target.value)}>
            {universe.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>
                {stock.ticker}
              </option>
            ))}
          </select>
          <input className="search-input" placeholder="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      }
    >
      {research.status === 'loading' || research.status === 'idle' ? (
        <LoadingState rows={4} />
      ) : research.status === 'error' ? (
        <ErrorState description={research.error} />
      ) : filtered.length ? (
        <TimelineList
          items={filtered.map((note) => ({
            id: note.id,
            title: note.title,
            badge: note.note_type,
            meta: [<span key="ticker">{note.ticker || ticker}</span>, note.source ? <span key="source">{note.source}</span> : null, <span key="date">{asDate(note.created_at)}</span>],
            body: note.note_body
          }))}
        />
      ) : (
        <EmptyState title="No research matches" description="Try a different ticker or search term." />
      )}
    </Section>
  );
}
