import React, { useState } from 'react';
import { seedUniverse } from '../api';
import useAsyncResource from '../hooks/useAsyncResource';
import { Badge, DataTable, EmptyState, ErrorState, LoadingState, Section, TimelineList, actionTone } from '../components/Common';
import { asCurrency, asDate, asPercent } from '../utils/formatters';

export default function TradingJournal({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('MP');
  const journal = useAsyncResource((signal) => api.getJournal({ ticker, signal }), [ticker]);
  const universe = stocks.length ? stocks : seedUniverse;

  return (
    <Section
      title="Trading journal"
      subtitle="Review realised and open trades with entry, stop, target, and PnL context."
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
      {journal.status === 'loading' || journal.status === 'idle' ? (
        <LoadingState rows={4} />
      ) : journal.status === 'error' ? (
        <ErrorState description={journal.error} />
      ) : journal.data?.length ? (
        <div className="stack">
          <div className="panel-grid">
            <article className="metric-card">
              <div className="muted">Entries</div>
              <div className="metric-value">{journal.data.length}</div>
            </article>
            <article className="metric-card">
              <div className="muted">Latest PnL</div>
              <div className="metric-value">{asPercent(journal.data[0]?.pnl_percent)}</div>
            </article>
          </div>
          <DataTable
            rows={journal.data}
            rowKey={(row) => row.id}
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'direction', label: 'Direction', render: (row) => <Badge tone={actionTone(row.direction === 'LONG' ? 'BUY' : 'SELL')}>{row.direction}</Badge> },
              { key: 'entry_date', label: 'Entry date', render: (row) => asDate(row.entry_date) },
              { key: 'entry_price', label: 'Entry', render: (row) => asCurrency(row.entry_price) },
              { key: 'stop_loss', label: 'Stop', render: (row) => asCurrency(row.stop_loss) },
              { key: 'target_price', label: 'Target', render: (row) => asCurrency(row.target_price) },
              { key: 'pnl_percent', label: 'PnL %', render: (row) => asPercent(row.pnl_percent) },
              { key: 'thesis', label: 'Thesis', render: (row) => row.thesis || '—' }
            ]}
          />
          <TimelineList
            items={journal.data.map((row) => ({
              id: row.id,
              title: row.outcome || `${row.ticker} trade`,
              badge: row.status,
              meta: [<span key="ticker">{row.ticker}</span>, <span key="pnl">{asPercent(row.pnl_percent)}</span>],
              body: row.notes || 'No notes provided.',
              footer: `Capital committed: ${asCurrency(row.capital_committed)} | PnL: ${asCurrency(row.pnl_amount)}`
            }))}
          />
        </div>
      ) : (
        <EmptyState title="No journal rows" description={`No journal entries returned for ${ticker}.`} />
      )}
    </Section>
  );
}
