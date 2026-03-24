import React, { useMemo, useState } from 'react';
import { Badge, Button, EmptyState, PageSection, Select, TextInput } from '../components/Common';
import RawDocumentViewer from '../components/RawDocumentViewer';
import useAsyncResource from '../hooks/useAsyncResource';
import { asDateTime, firstReadableLine } from '../utils/formatters';

export default function ResearchVault({ api, stocks = [] }) {
  const [tab, setTab] = useState('notes');
  const [ticker, setTicker] = useState('ALL');
  const [category, setCategory] = useState('ALL');
  const [query, setQuery] = useState('');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');
  const [selectedNote, setSelectedNote] = useState(null);

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
  const templates = useAsyncResource((signal) => api.getPromptTemplates({ signal }), []);

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
        <div className="space-y-2">
          <div className="flex flex-wrap gap-2">
            <Button type="button" tone={tab === 'notes' ? 'primary' : 'secondary'} onClick={() => setTab('notes')}>Notes</Button>
            <Button type="button" tone={tab === 'templates' ? 'primary' : 'secondary'} onClick={() => setTab('templates')}>Prompt templates</Button>
          </div>
          {tab === 'notes' ? (
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
          ) : null}
        </div>
      }
    >
      {tab === 'templates' ? (
        templates.status === 'loading' || templates.status === 'idle' ? (
          <div className="space-y-3">
            <div className="h-4 animate-pulse rounded-full bg-white/10" />
            <div className="h-4 animate-pulse rounded-full bg-white/10" />
          </div>
        ) : templates.status === 'error' ? (
          <EmptyState title="Templates unavailable" description={templates.error} />
        ) : (
          <div className="space-y-3">
            {(templates.data || []).map((template) => (
              <article key={template.slug} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                  <div className="space-y-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-base font-semibold text-white">{template.title}</div>
                      <Badge tone="info">{template.prompt_type}</Badge>
                    </div>
                    <div className="text-sm leading-6 text-slate-200">{firstReadableLine(template.content)}</div>
                  </div>
                  <Button type="button" onClick={() => navigator.clipboard?.writeText(template.content)}>
                    Copy template
                  </Button>
                </div>
              </article>
            ))}
          </div>
        )
      ) : resource.status === 'loading' || resource.status === 'idle' ? (
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : resource.status === 'error' ? (
        <EmptyState title="Research unavailable" description={resource.error} />
      ) : filtered.length ? (
        <div className="space-y-3">
          {filtered.map((note) => (
            <article key={note.id} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-base font-semibold text-white">{note.title}</div>
                    <Badge tone={note.note_type === 'PARSE_FAILED' ? 'danger' : 'info'}>{note.note_type}</Badge>
                    {note.category ? <Badge tone="neutral">{note.category}</Badge> : null}
                  </div>
                  <div className="flex flex-wrap gap-2 text-sm text-slate-400">
                    <span>{note.ticker || 'GLOBAL'}</span>
                    <span>{asDateTime(note.created_at)}</span>
                  </div>
                  <div className="text-sm leading-6 text-slate-200">{firstReadableLine(note.note_body)}</div>
                </div>
                <div className="shrink-0">
                  <div className="flex flex-wrap gap-2">
                    <Button type="button" onClick={() => setSelectedNote({ ...note, viewerMode: 'note' })}>
                      Open full note
                    </Button>
                    {note.extraction_id ? (
                      <Button type="button" onClick={() => setSelectedNote({ ...note, viewerMode: 'report' })}>
                        View source report
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            </article>
          ))}
          <RawDocumentViewer
            api={api}
            open={Boolean(selectedNote)}
            title={selectedNote?.title || 'Research note'}
            subtitle={selectedNote ? `${selectedNote.ticker || 'GLOBAL'} • ${asDateTime(selectedNote.created_at)}` : ''}
            content={selectedNote?.viewerMode === 'report' ? null : selectedNote?.note_body}
            documentId={selectedNote?.viewerMode === 'report' ? selectedNote?.extraction_id : undefined}
            status={selectedNote?.viewerMode === 'report' ? undefined : (selectedNote?.note_type === 'PARSE_FAILED' ? 'FAILED' : undefined)}
            badges={selectedNote?.category ? [{ value: selectedNote.category }] : []}
            onClose={() => setSelectedNote(null)}
            emptyMessage="This note does not include body text."
          />
        </div>
      ) : (
        <EmptyState title="No research matches" description="Try a different ticker, date range, category, or search term." />
      )}
    </PageSection>
  );
}
