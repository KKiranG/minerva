import React from 'react';
import { Badge, EmptyState, LoadingState, MetricCard, PageSection } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { actionTone, asCurrency, asDate, asPercent, convictionLabel, verdictTone } from '../utils/formatters';

export default function Overview({ api }) {
  const overview = useAsyncResource((signal) => api.getOverview({ signal }), []);

  if (overview.status === 'loading' || overview.status === 'idle') return <LoadingState rows={6} />;
  if (overview.status === 'error') {
    return <EmptyState title="Dashboard unavailable" description={overview.error} />;
  }

  const rows = overview.data?.stocks || [];
  if (!rows.length) {
    return (
      <EmptyState
        title="No dashboard data yet"
        description="Seed the stock universe or create a tracked stock, then ingest a MINERVA report to populate the overview."
      />
    );
  }

  const alerts = rows.filter((row) => row.alert_flag).length;
  const attention = rows.filter((row) => row.needs_attention).length;
  const openPositions = rows.filter((row) => row.open_position_flag).length;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <MetricCard label="Alert flags" value={alerts} caption={alerts ? 'Active' : 'Clear'} tone={alerts ? 'danger' : 'positive'} />
        <MetricCard label="Needs attention" value={attention} caption={attention ? 'Review queue' : 'Fresh'} tone={attention ? 'warning' : 'positive'} />
        <MetricCard label="Open positions" value={openPositions} caption={openPositions ? 'Managed' : 'Flat'} tone={openPositions ? 'info' : 'neutral'} />
      </div>

      <PageSection
        title="Which stocks need attention"
        subtitle="Rows are fully clickable. Verdict, conviction, alert state, catalysts, and next events all route directly into the stock workspace."
      >
        <div className="space-y-3">
          {rows.map((stock) => (
            <a
              key={stock.ticker}
              href={`#/stocks/${stock.ticker}`}
              className="block rounded-[28px] border border-white/10 bg-white/[0.035] p-5 transition hover:border-sky-300/20 hover:bg-white/[0.055]"
            >
              <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
                <div className="space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-xl font-semibold tracking-tight text-white">{stock.ticker}</div>
                    <div className="text-sm text-slate-300">{stock.company_name}</div>
                    <Badge tone={verdictTone(stock.current_verdict)}>{stock.current_verdict || 'No verdict'}</Badge>
                    <Badge tone={actionTone(stock.current_action)}>{stock.current_action || 'No action'}</Badge>
                    {stock.alert_flag ? <Badge tone="danger">Alert</Badge> : null}
                    {stock.needs_attention ? <Badge tone="warning">Needs attention</Badge> : null}
                    {stock.changed_since_last_analysis ? <Badge tone="info">Changed</Badge> : null}
                  </div>
                  <p className="max-w-3xl text-sm leading-6 text-slate-300">{stock.one_line_summary || 'No one-line summary stored yet.'}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:min-w-[420px] xl:grid-cols-3">
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Price</div>
                    <div className="mt-2 text-lg font-semibold text-white">{asCurrency(stock.current_price)}</div>
                    <div className="text-sm text-slate-300">{asPercent(stock.daily_change_pct)}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Conviction</div>
                    <div className="mt-2 text-lg font-semibold text-white">{convictionLabel(stock.current_conviction)}</div>
                    <div className="text-sm text-slate-300">{stock.open_position_flag ? 'Open position' : 'No position'}</div>
                  </div>
                  <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Catalysts / next event</div>
                    <div className="mt-2 text-lg font-semibold text-white">{stock.active_catalyst_count}</div>
                    <div className="text-sm text-slate-300">{stock.next_event_date ? `${asDate(stock.next_event_date)} • ${stock.next_event_type || 'Event'}` : 'No event scheduled'}</div>
                  </div>
                </div>
              </div>
            </a>
          ))}
        </div>
      </PageSection>
    </div>
  );
}
