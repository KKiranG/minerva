import React, { useState } from 'react';
import { seedUniverse } from '../api';
import useAsyncResource from '../hooks/useAsyncResource';
import { EmptyState, ErrorState, LoadingState, Section, TimelineList, verdictTone } from '../components/Common';
import { asDate, asCompactNumber } from '../utils/formatters';

export default function CatalystTracker({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('MP');
  const catalysts = useAsyncResource((signal) => api.getCatalysts({ ticker, signal }), [ticker]);
  const universe = stocks.length ? stocks : seedUniverse;

  return (
    <Section
      title="Catalyst tracker"
      subtitle="Track upcoming and material catalysts across the current strategic-minerals review universe."
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
      {catalysts.status === 'loading' || catalysts.status === 'idle' ? (
        <LoadingState rows={4} />
      ) : catalysts.status === 'error' ? (
        <ErrorState description={catalysts.error} />
      ) : catalysts.data?.length ? (
        <div className="stack">
          <div className="meta">
            <span>High-significance catalysts: {asCompactNumber(catalysts.data.filter((item) => (item.significance || 0) >= 4).length)}</span>
            <span>Material dates count down to the next update.</span>
          </div>
          <TimelineList
            items={catalysts.data.map((item) => ({
              id: item.id,
              title: item.title,
              badge: item.binding_status,
              badgeTone: verdictTone(item.significance >= 4 ? 'BULLISH' : 'NEUTRAL'),
              meta: [
                <span key="date">{asDate(item.date)}</span>,
                <span key="category">{item.category}</span>,
                item.source ? <span key="source">{item.source}</span> : null
              ],
              body: item.description || '—',
              footer: [
                item.priced_in ? `Priced in: ${item.priced_in}` : null,
                item.next_decision_point ? `Next decision: ${item.next_decision_point}` : null,
                item.reversal_risk ? `Risk: ${item.reversal_risk}` : null
              ]
                .filter(Boolean)
                .join(' | ')
            }))}
          />
        </div>
      ) : (
        <EmptyState title="No catalysts" description={`No catalyst rows returned for ${ticker}.`} />
      )}
    </Section>
  );
}
