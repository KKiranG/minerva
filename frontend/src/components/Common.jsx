import React from 'react';
import {
  actionTone,
  asCurrency,
  asDate,
  asDateTime,
  asRelativeDate,
  asPercent,
  convictionLabel,
  entryRangeLabel,
  formatTickerLabel,
  yesNo,
  verdictTone
} from '../utils/formatters';

export const Section = ({ title, subtitle, action, children }) => (
  <section className="panel">
    <div className="section-header">
      <div>
        <h2 className="section-title">{title}</h2>
        {subtitle ? <p className="section-subtitle">{subtitle}</p> : null}
      </div>
      {action ? <div>{action}</div> : null}
    </div>
    {children}
  </section>
);

export const MetricCard = ({ label, value, caption, tone = 'neutral' }) => (
  <article className="metric-card">
    <div className="muted">{label}</div>
    <div className="metric-value">{value}</div>
    {caption ? <div className={`chip chip-${tone}`}>{caption}</div> : null}
  </article>
);

export const Badge = ({ children, tone = 'neutral' }) => <span className={`badge badge-${tone}`}>{children}</span>;

export const ConvictionDots = ({ value = 0, max = 5, showLabel = true }) => {
  const score = Math.max(0, Math.min(Number(value) || 0, max));
  const tone = score >= 4 ? 'positive' : score >= 3 ? 'warning' : 'neutral';
  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1" aria-label={`Conviction ${score} out of ${max}`}>
        {Array.from({ length: max }).map((_, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full transition ${
              index < score
                ? tone === 'positive'
                  ? 'bg-emerald-300 shadow-[0_0_14px_rgba(110,231,183,0.4)]'
                  : 'bg-amber-300 shadow-[0_0_14px_rgba(252,211,77,0.35)]'
                : 'bg-white/10'
            }`}
          />
        ))}
      </div>
      {showLabel ? <span className="text-sm text-slate-300">{convictionLabel(score)}</span> : null}
    </div>
  );
};

export const DecisionCard = ({
  verdict,
  action,
  conviction,
  summary,
  currentPrice,
  entryLow,
  entryHigh,
  stop,
  target,
  timeframe,
  alertFlag,
  openPositionFlag
}) => {
  const referencePrice = Number(currentPrice ?? entryHigh ?? entryLow);
  const upside = Number(target) - referencePrice;
  const downside = referencePrice - Number(stop);
  const riskReward = upside > 0 && downside > 0 ? `${(upside / downside).toFixed(1)}x` : '—';

  return (
    <article className="rounded-[28px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(14,26,40,0.96),rgba(7,12,21,0.95))] p-6 shadow-[0_18px_50px_rgba(0,0,0,0.26)]">
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <Badge tone={verdictTone(verdict)}>{verdict || 'Unknown verdict'}</Badge>
            <Badge tone={actionTone(action)}>{action || 'Unknown action'}</Badge>
            {alertFlag ? <Badge tone="danger">Alert active</Badge> : null}
            <Badge tone={openPositionFlag ? 'positive' : 'neutral'}>{openPositionFlag ? 'Position open' : 'Flat'}</Badge>
          </div>
          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/70">Decision card</p>
            <div className="text-3xl font-semibold tracking-tight text-white">{action || 'Watch'} with disciplined downside</div>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">{summary || 'No decision memo available yet.'}</p>
          </div>
          <ConvictionDots value={conviction} />
        </div>

        <div className="grid min-w-[250px] gap-3 sm:grid-cols-2 lg:w-[340px]">
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Current price</div>
            <div className="mt-2 text-2xl font-semibold text-white">{asCurrency(currentPrice)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Entry zone</div>
            <div className="mt-2 text-lg font-semibold text-white">{entryRangeLabel(entryLow, entryHigh)}</div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Stop / target</div>
            <div className="mt-2 text-sm font-medium text-white">
              {asCurrency(stop)} / {asCurrency(target)}
            </div>
          </div>
          <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
            <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Risk / reward</div>
            <div className="mt-2 text-lg font-semibold text-white">{riskReward}</div>
            <div className="text-sm text-slate-400">{timeframe || 'No timeframe set'}</div>
          </div>
        </div>
      </div>
    </article>
  );
};

export const ExpandableCard = ({
  title,
  subtitle,
  badge,
  badgeTone = 'neutral',
  meta,
  preview,
  children,
  defaultOpen = false
}) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <article className="rounded-[24px] border border-white/10 bg-white/[0.035] p-5 shadow-[0_14px_28px_rgba(0,0,0,0.18)]">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <strong className="text-base text-white">{title}</strong>
              {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
            </div>
            {subtitle ? <div className="text-sm text-slate-300">{subtitle}</div> : null}
            {meta ? <div className="flex flex-wrap gap-2 text-sm text-slate-400">{meta}</div> : null}
          </div>
          <button className="button" type="button" onClick={() => setOpen((current) => !current)}>
            {open ? 'Collapse' : 'Expand'}
          </button>
        </div>
        {preview ? <p className="m-0 text-sm leading-6 text-slate-300">{preview}</p> : null}
        {open ? <div className="space-y-3 text-sm leading-6 text-slate-200">{children}</div> : null}
      </div>
    </article>
  );
};

export const EmptyState = ({ title, description, action }) => (
  <div className="state-card empty-state">
    <div className="stack">
      <strong>{title}</strong>
      <p className="muted">{description}</p>
      {action ? <div>{action}</div> : null}
    </div>
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', description, retry }) => (
  <div className="state-card error-state">
    <div className="stack">
      <strong>{title}</strong>
      <p className="muted">{description || 'Try again or use the mock fallback.'}</p>
      {retry ? <div>{retry}</div> : null}
    </div>
  </div>
);

export const LoadingState = ({ rows = 4 }) => (
  <div className="state-card stack">
    {Array.from({ length: rows }).map((_, index) => (
      <div key={index} className="skeleton" style={{ height: 18, borderRadius: 10 }} />
    ))}
  </div>
);

export const DataTable = ({ columns = [], rows = [], loading = false, error, emptyMessage = 'No records yet.', rowKey = (row, index) => index }) => {
  if (loading) return <LoadingState rows={4} />;
  if (error) return <ErrorState description={error} />;
  if (!rows.length) return <EmptyState title="Nothing to show" description={emptyMessage} />;
  return (
    <table className="table">
      <thead>
        <tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr>
      </thead>
      <tbody>
        {rows.map((row, index) => (
          <tr key={rowKey(row, index)}>
            {columns.map((column) => (
              <td key={column.key}>{column.render ? column.render(row, index) : row[column.key]}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  );
};

export const Sparkline = ({ values = [] }) => {
  const gradientId = React.useId();
  if (!values.length) {
    return <div className="sparkline skeleton" style={{ borderRadius: 16 }} />;
  }

  const min = Math.min(...values);
  const max = Math.max(...values);
  const width = 320;
  const height = 72;
  const range = max - min || 1;
  const points = values
    .map((value, index) => {
      const x = (index / Math.max(values.length - 1, 1)) * width;
      const y = height - ((value - min) / range) * (height - 8) - 4;
      return `${x},${y}`;
    })
    .join(' ');

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="sparkline" preserveAspectRatio="none" aria-hidden="true">
      <defs>
        <linearGradient id={gradientId} x1="0" x2="1">
          <stop offset="0%" stopColor="var(--color-primary)" />
          <stop offset="100%" stopColor="var(--color-accentB)" />
        </linearGradient>
      </defs>
      <polyline points={points} style={{ stroke: `url(#${gradientId})` }} />
    </svg>
  );
};

export const DecisionStrip = ({ verdict, action, conviction, currentPrice, stop, target, entryLow, entryHigh }) => (
  <div className="decision-grid">
    <article className="metric-card">
      <div className="muted">Verdict</div>
      <div className="metric-value">{verdict || '—'}</div>
      <Badge tone={verdictTone(verdict)}>{verdict || 'Unknown'}</Badge>
    </article>
    <article className="metric-card">
      <div className="muted">Action</div>
      <div className="metric-value">{action || '—'}</div>
      <Badge tone={actionTone(action)}>{action || 'Unknown'}</Badge>
    </article>
    <article className="metric-card">
      <div className="muted">Conviction</div>
      <div className="metric-value">{convictionLabel(conviction)}</div>
    </article>
    <article className="metric-card">
      <div className="muted">Entry</div>
      <div className="metric-value">{entryRangeLabel(entryLow, entryHigh) === '—' ? asCurrency(currentPrice) : entryRangeLabel(entryLow, entryHigh)}</div>
    </article>
    <article className="metric-card">
      <div className="muted">Stop</div>
      <div className="metric-value">{asCurrency(stop)}</div>
    </article>
    <article className="metric-card">
      <div className="muted">Target</div>
      <div className="metric-value">{asCurrency(target)}</div>
    </article>
  </div>
);

export const GovernmentFundingTable = ({ rows = [], loading = false, error, emptyMessage = 'No government funding rows were returned.' }) => {
  if (loading) return <LoadingState rows={4} />;
  if (error) return <ErrorState description={error} />;
  if (!rows.length) return <EmptyState title="No funding items" description={emptyMessage} />;

  const toneForStatus = (status) => {
    const upper = String(status || '').toUpperCase();
    if (['OBLIGATED', 'DISBURSING', 'COMPLETED'].includes(upper)) return 'positive';
    if (['ANNOUNCED', 'LOI_SIGNED'].includes(upper)) return 'warning';
    if (upper === 'CONDITIONAL') return 'warning';
    if (upper === 'PROPOSED') return 'neutral';
    if (upper === 'CANCELLED') return 'danger';
    return 'neutral';
  };

  return (
    <DataTable
      rows={rows}
      rowKey={(row) => row.id || `${row.program}-${row.announced_date}`}
      columns={[
        { key: 'program', label: 'Program' },
        { key: 'agency', label: 'Agency' },
        { key: 'announced_date', label: 'Announced', render: (row) => asDate(row.announced_date) },
        { key: 'amount_ceiling', label: 'Ceiling', render: (row) => asCurrency(row.amount_ceiling) },
        { key: 'amount_obligated', label: 'Obligated', render: (row) => asCurrency(row.amount_obligated) },
        { key: 'amount_disbursed', label: 'Disbursed', render: (row) => asCurrency(row.amount_disbursed) },
        { key: 'status', label: 'Status', render: (row) => <Badge tone={toneForStatus(row.status)}>{row.status || '—'}</Badge> },
        {
          key: 'next_milestone',
          label: 'Next milestone',
          render: (row) => (
            <div className="stack">
              <strong>{row.next_milestone || '—'}</strong>
              {row.notes ? <span className="helper-text">{row.notes}</span> : null}
            </div>
          )
        }
      ]}
    />
  );
};

export const FieldList = ({ fields = [] }) => (
  <div className="field-list">
    {fields.length ? (
      fields.map((field) => (
        <article className="card" key={field.label}>
          <div className="muted">{field.label}</div>
          <strong>{field.value}</strong>
          {field.caption ? <p className="helper-text">{field.caption}</p> : null}
        </article>
      ))
    ) : (
      <EmptyState title="No fields" description="There are no metrics to show yet." />
    )}
  </div>
);

export const TickerChips = ({ tickers = [], activeTicker, onPick, label }) => (
  <div className="stack">
    {label ? <div className="muted">{label}</div> : null}
    <div className="ticker-chip-row">
      {tickers.length ? (
        tickers.map((ticker) => (
          <button
            key={ticker.ticker || ticker}
            className={`ticker-chip ${String(activeTicker || '').toUpperCase() === String(ticker.ticker || ticker).toUpperCase() ? 'active' : ''}`}
            onClick={() => onPick?.(ticker.ticker || ticker)}
            type="button"
          >
            <span>{ticker.ticker || ticker}</span>
            {ticker.company_name ? <span className="muted">{ticker.company_name}</span> : null}
          </button>
        ))
      ) : (
        <EmptyState title="No tickers" description="The ticker list is empty." />
      )}
    </div>
  </div>
);

export const MetaLine = ({ ticker, companyName, changedAt, nextEvent, note }) => (
  <div className="meta">
    <span>{formatTickerLabel(ticker, companyName)}</span>
    {changedAt ? <span>Updated {asDateTime(changedAt)}</span> : null}
    {nextEvent ? <span>Next event {asDate(nextEvent)}</span> : null}
    {note ? <span>{yesNo(note)}</span> : null}
  </div>
);

export const TimelineList = ({ items = [], emptyTitle = 'Nothing here yet', emptyDescription = 'No records were returned.' }) => {
  if (!items.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="timeline">
      {items.map((item, index) => (
        <article className="timeline-item" key={item.id || item.title || index}>
          {item.title ? (
            <div className="row">
              <strong>{item.title}</strong>
              {item.badge ? <Badge tone={item.badgeTone || 'neutral'}>{item.badge}</Badge> : null}
            </div>
          ) : null}
          {item.meta ? <div className="meta">{item.meta}</div> : null}
          {item.body ? (React.isValidElement(item.body) ? <div>{item.body}</div> : <p>{item.body}</p>) : null}
          {item.footer ? (React.isValidElement(item.footer) ? <div className="helper-text">{item.footer}</div> : <p className="helper-text">{item.footer}</p>) : null}
        </article>
      ))}
    </div>
  );
};

export const SmartState = ({ state, loadingRows = 4, errorTitle = 'Something went wrong', errorDescription, emptyTitle, emptyDescription, children, retry }) => {
  if (state.status === 'loading' || state.status === 'idle') return <LoadingState rows={loadingRows} />;
  if (state.status === 'error') return <ErrorState title={errorTitle} description={errorDescription || state.error} retry={retry} />;
  if (!state.data || (Array.isArray(state.data) && !state.data.length)) {
    return <EmptyState title={emptyTitle || 'Nothing to show'} description={emptyDescription || 'No data returned.'} />;
  }
  return children(state.data);
};

export {
  asCurrency,
  asDate,
  asDateTime,
  asRelativeDate,
  asPercent,
  actionTone,
  verdictTone,
  convictionLabel,
  entryRangeLabel,
  formatTickerLabel
};
