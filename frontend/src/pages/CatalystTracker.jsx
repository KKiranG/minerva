import React, { useMemo, useState } from 'react';
import { Badge, EmptyState, PageSection, Select, TimelineList } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { asDate } from '../utils/formatters';

export default function CatalystTracker({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('ALL');
  const [binding, setBinding] = useState('ALL');
  const [sort, setSort] = useState('significance_desc');
  const [minSignificance, setMinSignificance] = useState('0');
  const resource = useAsyncResource(
    (signal) => api.getCatalysts({ ticker: ticker === 'ALL' ? undefined : ticker, limit: 200, signal }),
    [ticker]
  );

  const filtered = useMemo(() => {
    const rows = resource.data || [];
    return rows
      .filter((row) => (binding === 'ALL' ? true : row.binding_status === binding))
      .filter((row) => Number(row.significance || 0) >= Number(minSignificance))
      .sort((left, right) => {
        if (sort === 'date_asc') return String(left.date || '').localeCompare(String(right.date || ''));
        if (sort === 'date_desc') return String(right.date || '').localeCompare(String(left.date || ''));
        if (sort === 'binding') return String(left.binding_status || '').localeCompare(String(right.binding_status || ''));
        return Number(right.significance || 0) - Number(left.significance || 0);
      });
  }, [binding, minSignificance, resource.data, sort]);

  return (
    <PageSection
      title="Catalyst tracker"
      subtitle="Sort by significance or date, and filter by binding status so the material catalysts stop looking identical to the low-signal ones."
      action={
        <div className="flex flex-wrap gap-2">
          <Select value={ticker} onChange={(event) => setTicker(event.target.value)}>
            <option value="ALL">All tickers</option>
            {stocks.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>{stock.ticker}</option>
            ))}
          </Select>
          <Select value={binding} onChange={(event) => setBinding(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="PROPOSED">PROPOSED</option>
            <option value="ANNOUNCED">ANNOUNCED</option>
            <option value="LOI_SIGNED">LOI_SIGNED</option>
            <option value="CONDITIONAL">CONDITIONAL</option>
            <option value="OBLIGATED">OBLIGATED</option>
            <option value="DISBURSING">DISBURSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
          <Select value={minSignificance} onChange={(event) => setMinSignificance(event.target.value)}>
            <option value="0">All significance</option>
            <option value="4">4 and up</option>
            <option value="5">5 only</option>
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="significance_desc">Highest significance</option>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="binding">Binding status</option>
          </Select>
        </div>
      }
    >
      {resource.status === 'loading' || resource.status === 'idle' ? (
        <div className="space-y-3">
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
          <div className="h-4 animate-pulse rounded-full bg-white/10" />
        </div>
      ) : resource.status === 'error' ? (
        <EmptyState title="Catalysts unavailable" description={resource.error} />
      ) : filtered.length ? (
        <TimelineList
          items={filtered.map((item) => ({
            id: item.id,
            title: item.title,
            badge: item.binding_status,
            badgeTone: Number(item.significance || 0) >= 4 ? 'warning' : 'neutral',
            meta: [
              <span key="ticker">{item.ticker}</span>,
              <span key="date">{asDate(item.date)}</span>,
              <span key="category">{item.category}</span>,
              <span key="significance">Significance {item.significance ?? '—'}</span>,
            ],
            body: item.description || 'No description stored.',
            footer: (
              <div className="flex flex-wrap gap-2">
                {item.next_decision_point ? <Badge tone="info">{item.next_decision_point}</Badge> : null}
                {item.priced_in ? <Badge tone="neutral">Priced in: {item.priced_in}</Badge> : null}
              </div>
            ),
          }))}
        />
      ) : (
        <EmptyState title="No catalysts match" description="Adjust the ticker, significance, or binding filters." />
      )}
    </PageSection>
  );
}
