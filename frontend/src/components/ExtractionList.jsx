import React from 'react';

import { Badge, Button, EmptyState } from './Common';
import { asDateTime, convictionLabel } from '../utils/formatters';

const statusTone = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'COMPLETE') return 'positive';
  if (normalized === 'PARTIAL') return 'warning';
  if (normalized === 'FAILED') return 'danger';
  return 'neutral';
};

export default function ExtractionList({
  items = [],
  loading = false,
  error = null,
  emptyTitle = 'No ingests yet',
  emptyDescription = 'Ingested reports will appear here.',
  onOpenRaw,
}) {
  if (loading) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 4 }).map((_, index) => (
          <div key={index} className="h-20 animate-pulse rounded-[24px] border border-white/10 bg-white/[0.035]" />
        ))}
      </div>
    );
  }

  if (error) {
    return <EmptyState title="Ingest history unavailable" description={error} />;
  }

  if (!items.length) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <article key={`${item.run_id}-${item.ticker}`} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-4">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold tracking-tight text-white">{item.ticker}</div>
                <Badge tone={statusTone(item.parse_status)}>{item.parse_status || 'UNKNOWN'}</Badge>
                {item.changed_since_last_analysis ? <Badge tone="info">Changed</Badge> : null}
                {item.failed_sections?.length ? <Badge tone="danger">{item.failed_sections.length} failed section{item.failed_sections.length === 1 ? '' : 's'}</Badge> : null}
              </div>
              <div className="text-sm leading-6 text-slate-300">
                {item.summary || 'No decision summary stored for this ingest.'}
              </div>
              <div className="flex flex-wrap gap-2 text-xs uppercase tracking-[0.18em] text-slate-400">
                <span>{asDateTime(item.started_at)}</span>
                <span>{item.action || 'No action'}</span>
                <span>{convictionLabel(item.conviction)}</span>
                <span>{item.status || 'Unknown status'}</span>
              </div>
              {item.failed_sections?.length ? (
                <div className="text-sm leading-6 text-rose-100">
                  Failed: {item.failed_sections.join(', ')}
                </div>
              ) : (
                <div className="text-sm leading-6 text-emerald-100">All tracked sections parsed without recorded failures.</div>
              )}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button
                type="button"
                onClick={() => onOpenRaw?.(item)}
                disabled={!item.raw_report}
              >
                View raw
              </Button>
              <Button type="button" tone="primary" onClick={() => { window.location.hash = `#/stocks/${item.ticker}`; }}>
                Open stock
              </Button>
            </div>
          </div>
        </article>
      ))}
    </div>
  );
}
