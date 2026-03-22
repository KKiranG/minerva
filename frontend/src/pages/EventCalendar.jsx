import React, { useMemo, useState } from 'react';
import { seedUniverse } from '../api';
import useAsyncResource from '../hooks/useAsyncResource';
import { Badge, EmptyState, ErrorState, ExpandableCard, LoadingState, Section } from '../components/Common';
import { asDate, asRelativeDate } from '../utils/formatters';

const impactTone = (impact) => {
  const upper = String(impact || '').toUpperCase();
  if (upper === 'HIGH') return 'danger';
  if (upper === 'MEDIUM') return 'warning';
  return 'neutral';
};

const daysUntilLabel = (value) => {
  if (!value) return 'Date unknown';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const eventDate = new Date(value);
  eventDate.setHours(0, 0, 0, 0);
  const diffDays = Math.round((eventDate.getTime() - today.getTime()) / 86400000);
  if (diffDays === 0) return 'Today';
  if (diffDays > 0) return `${diffDays} day${diffDays === 1 ? '' : 's'} until`;
  const elapsed = Math.abs(diffDays);
  return `${elapsed} day${elapsed === 1 ? '' : 's'} ago`;
};

export default function EventCalendar({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('MP');
  const events = useAsyncResource((signal) => api.getEvents({ ticker, signal }), [ticker]);
  const universe = stocks.length ? stocks : seedUniverse;

  const sorted = useMemo(() => {
    const rows = events.data || [];
    return rows.slice().sort((a, b) => a.date.localeCompare(b.date));
  }, [events.data]);

  return (
    <Section
      title="Event calendar"
      subtitle="Upcoming events, countdowns, and scenario framing for the selected ticker."
      action={
        <select className="toolbar-select" value={ticker} onChange={(event) => setTicker(event.target.value)}>
          {universe.map((stock) => (
            <option key={stock.ticker} value={stock.ticker}>
              {stock.ticker}
            </option>
          ))}
        </select>
      }
    >
      {events.status === 'loading' || events.status === 'idle' ? (
        <LoadingState rows={4} />
      ) : events.status === 'error' ? (
        <ErrorState description={events.error} />
      ) : sorted.length ? (
        <div className="stack">
          {sorted.map((event) => (
            <ExpandableCard
              key={event.id}
              title={event.description}
              subtitle={`${asDate(event.date)} • ${asRelativeDate(event.date)}`}
              badge={event.event_type}
              badgeTone={impactTone(event.impact)}
              preview={`${daysUntilLabel(event.date)} ${event.date ? event.event_type?.toLowerCase() || 'event' : 'event'} window.`}
              meta={[
                <span key="impact">Impact {event.impact || 'UNKNOWN'}</span>,
                <span key="status">{event.status || 'UPCOMING'}</span>,
                event.date_precision ? <span key="precision">Precision {event.date_precision}</span> : null,
                event.source ? <span key="source">{event.source}</span> : null
              ].filter(Boolean)}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="positive">Bull case</Badge>
                    <span className="text-xs uppercase tracking-[0.22em] text-emerald-200/70">{daysUntilLabel(event.date)}</span>
                  </div>
                  <p className="m-0 text-sm leading-6 text-slate-200">{event.bull_case || 'No explicit bull case was stored for this event yet.'}</p>
                </div>
                <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                  <div className="mb-2 flex items-center gap-2">
                    <Badge tone="danger">Bear case</Badge>
                    <span className="text-xs uppercase tracking-[0.22em] text-rose-200/70">{event.impact || 'UNKNOWN'} impact</span>
                  </div>
                  <p className="m-0 text-sm leading-6 text-slate-200">{event.bear_case || 'No explicit bear case was stored for this event yet.'}</p>
                </div>
              </div>
              {event.outcome ? (
                <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-slate-400">Outcome</div>
                  <p className="m-0 text-sm leading-6 text-slate-200">{event.outcome}</p>
                  {event.outcome_date ? <div className="mt-2 text-sm text-slate-400">{asDate(event.outcome_date)}</div> : null}
                </div>
              ) : null}
            </ExpandableCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No events yet" description={`No upcoming events returned for ${ticker}.`} />
      )}
    </Section>
  );
}
