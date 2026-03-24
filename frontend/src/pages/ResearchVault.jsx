import React, { useMemo, useState } from 'react';
import { EmptyState, PageSection, Select, TextInput, TimelineList } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { asDateTime, firstReadableLine } from '../utils/formatters';

export default function ResearchVault({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  const resource = useAsyncResource(
    (signal) =>
      api.getResearch({
        ticker: ticker === 'ALL' ? undefined : ticker,
        category: category === 'ALL' ? undefined : category,
        date_from: dateFrom || undefined,
        date_to: dateTo || undefined,
        signal,
      }),
    [ticker, category, dateFrom, dateTo]
  );

  const categories = useMemo(() => {
    const values = new Set((resource.data || []).map((item) => item.category).filter(Boolean));
    return ['ALL', ...Array.from(values)];
  }, [resource.data]);

  const filtered = useMemo(() => {
    const term = query.trim().toLowerCase();
    if (!term) return resource.data || [];
    return (resource.data || []).filter((row) =>
      `${row.title} ${row.note_body} ${row.note_type} ${row.category || ''}`.toLowerCase().includes(term)
    );
  }, [query, resource.data]);

  return (
    <PageSection
      title="Research vault"
      subtitle="Filter by ticker, category, and date range so the archive stays usable as it grows."
      action={
        <div className="grid gap-2 md:grid-cols-5">
          <Select value={ticker} onChange={(event) => setTicker(event.target.value)}>
            <option value="ALL">All tickers</option>
            {stocks.map((stock) => <option key={stock.ticker} value={stock.ticker}>{stock.ticker}</option>)}
          </Select>
          <Select value={category} onChange={(event) => setCategory(event.target.value)}>
            {categories.map((item) => <option key={item} value={item}>{item}</option>)}
          </Select>
          <TextInput type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)} />
          <TextInput type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)} />
          <TextInput placeholder="Search notes" value={query} onChange={(event) => setQuery(event.target.value)} />
        </div>
      }
    >
      {resource.status === 'loading' || resource.status === 'idle' ? (
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : resource.status === 'error' ? (
        <EmptyState title="Research unavailable" description={resource.error} />
      ) : filtered.length ? (
        <TimelineList
          items={filtered.map((note) => ({
            id: note.id,
            title: note.title,
            badge: note.note_type,
            badgeTone: note.note_type === 'PARSE_FAILED' ? 'danger' : 'info',
            meta: [
              <span key="ticker">{note.ticker || 'GLOBAL'}</span>,
              note.category ? <span key="category">{note.category}</span> : null,
              <span key="date">{asDateTime(note.created_at)}</span>,
            ].filter(Boolean),
            body: firstReadableLine(note.note_body),
          }))}
        />
      ) : (
        <EmptyState title="No research matches" description="Try a different ticker, date range, category, or search term." />
      )}
    </PageSection>
  );
}
