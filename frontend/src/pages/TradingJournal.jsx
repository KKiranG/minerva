import React, { useMemo, useState } from 'react';
import { DataTable, EmptyState, MetricCard, PageSection, Select } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { asCurrency, asPercent } from '../utils/formatters';

export default function TradingJournal({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('ALL');
  const resource = useAsyncResource(
    (signal) => api.getJournal({ ticker: ticker === 'ALL' ? undefined : ticker, limit: 200, signal }),
    [ticker]
  );

  const latest = useMemo(() => (resource.data || [])[0] || null, [resource.data]);

  return (
    <PageSection
      title="Trading journal"
      subtitle="Explicit empty states replace the old silent summary placeholders when no journal data exists."
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
        <EmptyState title="Journal unavailable" description={resource.error} />
      ) : resource.data?.length ? (
        <div className="space-y-6">
          <div className="grid gap-4 md:grid-cols-3">
            <MetricCard label="Entries" value={resource.data.length} />
            <MetricCard label="Latest PnL" value={latest ? asPercent(latest.pnl_percent) : 'No entry yet'} />
            <MetricCard label="Latest outcome" value={latest?.outcome || 'No outcome yet'} />
          </div>
          <DataTable
            rows={resource.data}
            columns={[
              { key: 'ticker', label: 'Ticker' },
              { key: 'status', label: 'Status' },
              { key: 'direction', label: 'Direction' },
              { key: 'entry_price', label: 'Entry', render: (row) => asCurrency(row.entry_price) },
              { key: 'target_price', label: 'Target', render: (row) => asCurrency(row.target_price) },
              { key: 'stop_loss', label: 'Stop', render: (row) => asCurrency(row.stop_loss) },
              { key: 'pnl_percent', label: 'PnL %', render: (row) => asPercent(row.pnl_percent) },
            ]}
          />
        </div>
      ) : (
        <EmptyState title="No journal entries" description="There are no trading-journal rows for this filter yet." />
      )}
    </PageSection>
  );
}
