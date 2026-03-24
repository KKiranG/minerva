import React, { useMemo, useState } from 'react';
import { EmptyState, ExpandableCard, PageSection, Select } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { asDate, asRelativeDate, countdownLabel, parseDate } from '../utils/formatters';

export default function EventCalendar({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('ALL');
  const resource = useAsyncResource(
    (signal) => api.getEvents({ ticker: ticker === 'ALL' ? undefined : ticker, limit: 200, signal }),
    [ticker]
  );

  const sorted = useMemo(
    () =>
      (resource.data || [])
        .slice()
        .sort((left, right) => (parseDate(left.date)?.getTime() || Number.MAX_SAFE_INTEGER) - (parseDate(right.date)?.getTime() || Number.MAX_SAFE_INTEGER)),
    [resource.data]
  );

  return (
    <PageSection
      title="Event calendar"
      subtitle="Date parsing is normalized here, so countdowns and ordering stay correct even if backend dates vary."
      action={
        <Select value={ticker} onChange={(event) => setTicker(event.target.value)}>
          <option value="ALL">All tickers</option>
          {stocks.map((stock) => <option key={stock.ticker} value={stock.ticker}>{stock.ticker}</option>)}
        </Select>
      }
    >
      {resource.status === 'loading' || resource.status === 'idle' ? (
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : resource.status === 'error' ? (
        <EmptyState title="Calendar unavailable" description={resource.error} />
      ) : sorted.length ? (
        <div className="space-y-3">
          {sorted.map((event) => (
            <ExpandableCard
              key={event.id}
              title={event.description}
              subtitle={`${asDate(event.date)} • ${asRelativeDate(event.date)}`}
              badge={event.event_type || 'EVENT'}
              badgeTone={event.impact === 'HIGH' ? 'danger' : event.impact === 'MEDIUM' ? 'warning' : 'neutral'}
              preview={countdownLabel(event.date, event.event_type || 'event')}
              meta={[
                <span key="ticker">{event.ticker}</span>,
                <span key="impact">{event.impact || 'UNKNOWN'} impact</span>,
                <span key="status">{event.status || 'UPCOMING'}</span>,
              ]}
            >
              <div className="grid gap-3 md:grid-cols-2">
                <div className="rounded-3xl border border-emerald-400/20 bg-emerald-400/10 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-emerald-100">Bull case</div>
                  <p className="text-sm leading-6 text-emerald-50">{event.bull_case || 'No explicit bull-case framing stored yet.'}</p>
                </div>
                <div className="rounded-3xl border border-rose-400/20 bg-rose-400/10 p-4">
                  <div className="mb-2 text-xs uppercase tracking-[0.22em] text-rose-100">Bear case</div>
                  <p className="text-sm leading-6 text-rose-50">{event.bear_case || 'No explicit bear-case framing stored yet.'}</p>
                </div>
              </div>
            </ExpandableCard>
          ))}
        </div>
      ) : (
        <EmptyState title="No events yet" description="No upcoming events matched this filter." />
      )}
    </PageSection>
  );
}
