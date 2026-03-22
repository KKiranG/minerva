import React from 'react';
import useAsyncResource from '../hooks/useAsyncResource';
import {
  Badge,
  ConvictionDots,
  DataTable,
  EmptyState,
  ErrorState,
  LoadingState,
  MetricCard,
  Section,
  Sparkline,
  asCurrency,
  asDate,
  asPercent,
  asRelativeDate,
  verdictTone
} from '../components/Common';

const getDailyChangePct = (row) => row.daily_change_pct ?? row.daily_change_percent ?? null;

const getDailyChangeAmount = (row) => {
  if (row.daily_change_amount !== null && row.daily_change_amount !== undefined) return Number(row.daily_change_amount);
  const pct = Number(getDailyChangePct(row));
  const currentPrice = Number(row.current_price);
  if (Number.isNaN(pct) || Number.isNaN(currentPrice) || pct === -100) return null;
  const previousClose = currentPrice / (1 + pct / 100);
  return currentPrice - previousClose;
};

const signedCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const prefix = Number(value) > 0 ? '+' : '';
  return `${prefix}${asCurrency(value)}`;
};

const changeTone = (value) => {
  if (Number(value) > 0) return 'positive';
  if (Number(value) < 0) return 'danger';
  return 'neutral';
};

const attentionLabel = (row) => {
  if (row.alert_flag) return 'Alert';
  if (row.changed_since_last_analysis) return 'Changed';
  if (row.needs_attention) return 'Watch';
  return 'Clear';
};

const nextEventLabel = (row) => {
  if (!row.next_event_date && !row.next_event_type) return 'No event scheduled';
  if (!row.next_event_date) return row.next_event_type || 'Upcoming event';
  if (!row.next_event_type) return asDate(row.next_event_date);
  return `${row.next_event_type} • ${asDate(row.next_event_date)}`;
};

export default function Overview({ api }) {
  const overview = useAsyncResource(() => api.getDashboardOverview(), []);

  if (overview.status === 'loading' || overview.status === 'idle') return <LoadingState rows={6} />;
  if (overview.status === 'error') return <ErrorState description={overview.error} retry={<button className="button button-primary">Retry</button>} />;

  const rows = overview.data?.stocks || [];
  if (!rows.length) {
    return <EmptyState title="No dashboard data" description="The dashboard will populate after the backend or mock fallback responds." />;
  }

  const alerts = rows.filter((row) => row.alert_flag || row.changed_since_last_analysis).length;
  const activeCatalysts = rows.reduce((sum, row) => sum + Number(row.active_catalyst_count || 0), 0);
  const bullish = rows.filter((row) => String(row.current_verdict || '').toUpperCase() === 'BULLISH').length;
  const openPositions = rows.filter((row) => row.open_position_flag).length;
  const recentlyReviewed = rows.filter((row) => {
    const timestamp = row.last_analysis_date ? new Date(row.last_analysis_date).getTime() : 0;
    return Date.now() - timestamp <= 1000 * 60 * 60 * 72;
  }).length;
  const topTicker = rows[0];
  const sparklineValues = rows.map((row) => Number(row.current_price || 0));

  return (
    <div className="stack">
      <section className="hero">
        <div className="row">
          <div className="stack">
            <Badge tone="positive">Nine-name review universe</Badge>
            <h1 className="page-title">Monitor decision quality across the live strategic-minerals board.</h1>
            <p className="muted">
              The overview now tracks current price, daily change, next event timing, active high-significance catalysts,
              last review freshness, and alert state across MP, UUUU, USAR, UAMY, PPTA, NB, METC, ALM, and AXTI.
            </p>
          </div>
          <div style={{ minWidth: 280 }} className="stack">
            <div className="muted">Universe pulse</div>
            <Sparkline values={sparklineValues} />
            <div className="meta">
              <span>Generated {asDate(overview.data.generated_at)}</span>
              <span>Top priority {topTicker.ticker}</span>
            </div>
          </div>
        </div>

        <div className="metric-grid">
          <MetricCard label="Alert flags" value={alerts} caption="Names needing attention" tone="danger" />
          <MetricCard label="High-significance catalysts" value={activeCatalysts} caption="Active catalyst stack" tone="warning" />
          <MetricCard label="Bullish verdicts" value={bullish} caption="Constructive setups" tone="positive" />
          <MetricCard label="Open positions" value={openPositions} caption="Names with active risk" tone="neutral" />
          <MetricCard label="Reviewed in 72h" value={recentlyReviewed} caption="Fresh analysis cadence" tone="neutral" />
        </div>
      </section>

      <Section title="Decision board" subtitle="Updated overview fields with event timing, catalyst weight, and review freshness.">
        <DataTable
          rows={rows}
          rowKey={(row) => row.ticker}
          emptyMessage="No dashboard rows were returned."
          columns={[
            {
              key: 'ticker',
              label: 'Ticker',
              render: (row) => (
                <a href={`#/stocks/${row.ticker}`} className="flex min-w-[110px] flex-col gap-1">
                  <strong>{row.ticker}</strong>
                  <span className="helper-text">{row.company_name}</span>
                </a>
              )
            },
            {
              key: 'current_price',
              label: 'Current price',
              render: (row) => (
                <div className="stack">
                  <strong>{asCurrency(row.current_price)}</strong>
                  <Badge tone={changeTone(getDailyChangeAmount(row) ?? getDailyChangePct(row))}>
                    {signedCurrency(getDailyChangeAmount(row))} · {asPercent(getDailyChangePct(row))}
                  </Badge>
                </div>
              )
            },
            {
              key: 'decision',
              label: 'Decision',
              render: (row) => (
                <div className="stack">
                  <div className="row">
                    <Badge tone={verdictTone(row.current_verdict)}>{row.current_verdict || '—'}</Badge>
                    <span className="helper-text">{row.current_action || '—'}</span>
                  </div>
                  <ConvictionDots value={row.current_conviction} />
                </div>
              )
            },
            {
              key: 'next_event',
              label: 'Next event',
              render: (row) => (
                <div className="stack">
                  <strong>{row.next_event_type || 'No event'}</strong>
                  <span className="helper-text">
                    {row.next_event_date ? `${asDate(row.next_event_date)} · ${asRelativeDate(row.next_event_date)}` : 'No date set'}
                  </span>
                </div>
              )
            },
            {
              key: 'active_catalyst_count',
              label: 'High-significance catalysts',
              render: (row) => row.active_catalyst_count ?? 0
            },
            {
              key: 'last_analysis_date',
              label: 'Last analysis',
              render: (row) => (
                <div className="stack">
                  <strong>{row.last_analysis_date ? asDate(row.last_analysis_date) : '—'}</strong>
                  <span className="helper-text">{row.last_analysis_date ? asRelativeDate(row.last_analysis_date) : 'Not reviewed'}</span>
                </div>
              )
            },
            {
              key: 'alert_flag',
              label: 'Attention',
              render: (row) => (
                <Badge tone={row.alert_flag ? 'danger' : row.changed_since_last_analysis || row.needs_attention ? 'warning' : 'neutral'}>
                  {attentionLabel(row)}
                </Badge>
              )
            }
          ]}
        />
      </Section>

      <Section title="Focus cards" subtitle="Fast scan cards for the highest-signal names on the board.">
        <div className="catalog-grid">
          {rows.map((row) => (
            <a
              key={row.ticker}
              href={`#/stocks/${row.ticker}`}
              className="workspace-card flex flex-col gap-4 rounded-[24px] border border-white/10 bg-white/[0.04] p-5 transition hover:border-sky-300/30"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="space-y-1">
                  <div className="text-lg font-semibold text-white">{row.ticker}</div>
                  <div className="text-sm text-slate-400">{row.company_name}</div>
                </div>
                <Badge tone={row.alert_flag ? 'danger' : verdictTone(row.current_verdict)}>{row.alert_flag ? 'Alert' : row.current_verdict || '—'}</Badge>
              </div>

              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-2xl font-semibold text-white">{asCurrency(row.current_price)}</div>
                  <div
                    className={`text-sm ${
                      changeTone(getDailyChangeAmount(row) ?? getDailyChangePct(row)) === 'positive'
                        ? 'text-emerald-300'
                        : changeTone(getDailyChangeAmount(row) ?? getDailyChangePct(row)) === 'danger'
                          ? 'text-rose-300'
                          : 'text-slate-300'
                    }`}
                  >
                    {signedCurrency(getDailyChangeAmount(row))} · {asPercent(getDailyChangePct(row))}
                  </div>
                </div>
                <ConvictionDots value={row.current_conviction} />
              </div>

              <div className="grid gap-3 rounded-2xl border border-white/10 bg-black/10 p-4 text-sm text-slate-300">
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Next event</span>
                  <span className="text-right">{nextEventLabel(row)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Catalysts</span>
                  <span>{row.active_catalyst_count || 0} active</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Last analysis</span>
                  <span>{row.last_analysis_date ? asRelativeDate(row.last_analysis_date) : 'Not reviewed'}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Attention</span>
                  <span>{attentionLabel(row)}</span>
                </div>
                <div className="flex items-center justify-between gap-4">
                  <span className="text-slate-400">Position</span>
                  <span>{row.open_position_flag ? 'Open' : 'Flat'}</span>
                </div>
              </div>

              <p className="m-0 text-sm leading-6 text-slate-300">{row.one_line_summary || 'No summary available.'}</p>
            </a>
          ))}
        </div>
      </Section>
    </div>
  );
}
