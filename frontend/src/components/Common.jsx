import React from 'react';
import { panelStyle, toneClasses } from '../utils/colors';
import {
  actionTone,
  asCurrency,
  asDate,
  asDateTime,
  asPercent,
  convictionLabel,
  entryRangeLabel,
  formatTickerLabel,
  verdictTone,
} from '../utils/formatters';

const basePanel = 'rounded-3xl border p-5 shadow-[0_18px_45px_rgba(0,0,0,0.22)]';

export const PageSection = ({ title, subtitle, action, children }) => (
  <section className={`${basePanel} space-y-4`} style={panelStyle}>
    <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
      <div className="space-y-1">
        <h2 className="text-lg font-semibold tracking-tight text-white">{title}</h2>
        {subtitle ? <p className="text-sm leading-6 text-slate-300">{subtitle}</p> : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
    {children}
  </section>
);

export const Badge = ({ children, tone = 'neutral', onClick, className = '', ...props }) => (
  <span 
    className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold uppercase tracking-[0.2em] transition ${toneClasses[tone] || toneClasses.neutral} ${onClick ? 'cursor-pointer hover:brightness-110' : ''} ${className}`}
    onClick={onClick}
    {...props}
  >
    {children}
  </span>
);

export const Button = ({ children, tone = 'secondary', className = '', ...props }) => {
  const tones = {
    primary: 'border-sky-300/20 bg-sky-300/15 text-sky-50 hover:bg-sky-300/20',
    secondary: 'border-white/10 bg-white/5 text-slate-100 hover:bg-white/10',
    danger: 'border-rose-300/20 bg-rose-300/10 text-rose-100 hover:bg-rose-300/15',
  };
  return (
    <button
      className={`inline-flex items-center justify-center rounded-2xl border px-4 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-55 ${tones[tone] || tones.secondary} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export const TextInput = React.forwardRef(({ className = '', ...props }, ref) => (
  <input
    ref={ref}
    className={`w-full rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/35 focus:bg-white/[0.075] ${className}`}
    {...props}
  />
));

export const TextArea = ({ className = '', ...props }) => (
  <textarea
    className={`min-h-[180px] w-full rounded-3xl border border-white/10 bg-white/5 px-4 py-3 text-sm leading-6 text-white outline-none transition placeholder:text-slate-500 focus:border-sky-300/35 focus:bg-white/[0.075] ${className}`}
    {...props}
  />
);

export const Select = ({ className = '', children, ...props }) => (
  <select
    className={`rounded-2xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm text-white outline-none transition focus:border-sky-300/35 focus:bg-white/[0.075] ${className}`}
    {...props}
  >
    {children}
  </select>
);

export const LoadingState = ({ type = 'list', items = 3 }) => {
  if (type === 'card') {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className={`${basePanel} h-28 animate-pulse bg-white/5 border-white/5`} style={panelStyle} />
        ))}
      </div>
    );
  }
  if (type === 'table') {
    return (
      <div className="overflow-hidden rounded-3xl border border-white/10">
        <div className="h-10 bg-white/5 border-b border-white/10" />
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className="h-14 animate-pulse border-b border-white/5 bg-white/[0.02]" />
        ))}
      </div>
    );
  }
  if (type === 'timeline') {
    return (
      <div className="space-y-4">
        {Array.from({ length: items }).map((_, index) => (
          <div key={index} className={`${basePanel} animate-pulse border-white/5 bg-white/[0.035] space-y-3`} style={panelStyle}>
            <div className="flex gap-2">
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="h-4 w-16 rounded-full bg-white/10" />
            </div>
            <div className="h-3 w-1/4 rounded bg-white/10" />
            <div className="h-3 w-5/6 rounded bg-white/5 mt-4" />
            <div className="h-3 w-4/6 rounded bg-white/5" />
          </div>
        ))}
      </div>
    );
  }
  return (
    <div className={`${basePanel} space-y-3`} style={panelStyle}>
      {Array.from({ length: items }).map((_, index) => (
        <div key={index} className="h-4 animate-pulse rounded-full bg-white/10" />
      ))}
    </div>
  );
};

export const EmptyState = ({ title, description, action }) => (
  <div className={`${basePanel} space-y-3 text-center`} style={panelStyle}>
    <div className="text-lg font-semibold text-white">{title}</div>
    <p className="mx-auto max-w-2xl text-sm leading-6 text-slate-300">{description}</p>
    {action ? <div className="pt-1">{action}</div> : null}
  </div>
);

export const ErrorState = ({ title = 'Something went wrong', description, retry }) => (
  <div className={`${basePanel} space-y-3`} style={panelStyle}>
    <div className="text-lg font-semibold text-white">{title}</div>
    <p className="text-sm leading-6 text-slate-300">{description || 'The request failed. Check the backend and try again.'}</p>
    {retry ? <div>{retry}</div> : null}
  </div>
);

export const MetricCard = ({ label, value, caption, tone }) => (
  <article className={`${basePanel} space-y-2`} style={panelStyle}>
    <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{label}</div>
    <div className="text-2xl font-semibold tracking-tight text-white">{value}</div>
    {caption ? <Badge tone={tone || 'neutral'}>{caption}</Badge> : null}
  </article>
);

export const ConvictionDots = ({ value = 0, max = 5, showLabel = true }) => {
  const score = Math.max(0, Math.min(Number(value) || 0, max));
  return (
    <div className="flex items-center gap-3">
      <div className="flex items-center gap-1.5" aria-label={`Conviction ${score} out of ${max}`}>
        {Array.from({ length: max }).map((_, index) => (
          <span
            key={index}
            className={`h-2.5 w-2.5 rounded-full ${index < score ? 'bg-sky-300 shadow-[0_0_14px_rgba(125,211,252,0.55)]' : 'bg-white/10'}`}
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
  openPositionFlag,
}) => {
  const referencePrice = Number(currentPrice ?? entryHigh ?? entryLow);
  const upside = Number(target) - referencePrice;
  const downside = referencePrice - Number(stop);
  const rrValue = upside > 0 && downside > 0 ? (upside / downside) : 0;
  const rr = rrValue > 0 ? `${rrValue.toFixed(1)}x` : '—';
  const rrTone = rrValue >= 3 ? 'positive' : rrValue >= 1 ? 'info' : 'warning';
  return (
    <article className="rounded-[30px] border border-sky-300/15 bg-[linear-gradient(135deg,rgba(11,24,38,0.96),rgba(5,12,20,0.92))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.32)]">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            <Badge tone={verdictTone(verdict)}>{verdict || 'No verdict'}</Badge>
            <Badge tone={actionTone(action)}>{action || 'No action'}</Badge>
            <Badge tone={openPositionFlag ? 'positive' : 'neutral'}>{openPositionFlag ? 'Open position' : 'Flat'}</Badge>
            {alertFlag ? <Badge tone="danger">Alert active</Badge> : null}
          </div>
          <div className="space-y-2">
            <div className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200/70">Current decision</div>
            <h1 className="text-3xl font-semibold tracking-tight text-white">{action || 'Watch'} with defined risk</h1>
            <p className="max-w-3xl text-sm leading-6 text-slate-300">{summary || 'No decision summary is stored yet.'}</p>
          </div>
          <ConvictionDots value={conviction} />
        </div>
        <div className="grid min-w-[270px] gap-3 sm:grid-cols-2">
          <MetricCard label="Current price" value={asCurrency(currentPrice)} />
          <MetricCard label="Entry zone" value={entryRangeLabel(entryLow, entryHigh)} />
          <MetricCard label="Stop / target" value={`${asCurrency(stop)} / ${asCurrency(target)}`} />
          <MetricCard label="Timeframe / R:R" value={timeframe || '—'} caption={rr} tone={rrTone} />
        </div>
      </div>
    </article>
  );
};

export const ExpandableCard = ({ title, subtitle, meta = [], badge, badgeTone = 'neutral', preview, children, defaultOpen = false }) => {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <article className={`${basePanel} space-y-4`} style={panelStyle}>
      <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-white">{title}</div>
            {badge ? <Badge tone={badgeTone}>{badge}</Badge> : null}
          </div>
          {subtitle ? <p className="text-sm text-slate-300">{subtitle}</p> : null}
          {meta.length ? <div className="flex flex-wrap gap-2 text-sm text-slate-400">{meta}</div> : null}
        </div>
        <Button type="button" onClick={() => setOpen((current) => !current)}>
          {open ? 'Collapse' : 'Expand'}
        </Button>
      </div>
      {preview ? <p className="text-sm leading-6 text-slate-300">{preview}</p> : null}
      {open ? <div className="space-y-3 text-sm leading-6 text-slate-200">{children}</div> : null}
    </article>
  );
};

export const FieldList = ({ fields = [] }) => (
  <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
    {fields.map((field) => (
      <article key={field.label} className={`${basePanel} space-y-2`} style={panelStyle}>
        <div className="text-xs uppercase tracking-[0.2em] text-slate-400">{field.label}</div>
        <div className="text-base font-semibold text-white">{field.value}</div>
        {field.caption ? <p className="text-sm leading-6 text-slate-300">{field.caption}</p> : null}
      </article>
    ))}
  </div>
);

export const DataTable = ({ rows = [], columns = [], emptyMessage = 'No rows yet.' }) => {
  if (!rows.length) return <EmptyState title="Nothing to show" description={emptyMessage} />;
  return (
    <div className="overflow-hidden rounded-3xl border border-white/10">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-white/10 text-sm text-slate-200">
          <thead className="bg-white/5 text-left text-xs uppercase tracking-[0.22em] text-slate-400">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className="px-4 py-3 font-medium">{column.label}</th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10 bg-white/[0.03]">
            {rows.map((row, index) => (
              <tr key={row.id || index} className="align-top">
                {columns.map((column) => (
                  <td key={column.key} className="px-4 py-3 text-sm leading-6 text-slate-200">
                    {column.render ? column.render(row, index) : row[column.key]}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const TimelineList = ({ items = [], emptyTitle = 'Nothing here yet', emptyDescription = 'No records were returned.' }) => {
  if (!items.length) return <EmptyState title={emptyTitle} description={emptyDescription} />;
  return (
    <div className="space-y-3">
      {items.map((item, index) => (
        <article key={item.id || index} className={`${basePanel} space-y-2`} style={panelStyle}>
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold text-white">{item.title}</div>
            {item.badge ? <Badge tone={item.badgeTone || 'neutral'}>{item.badge}</Badge> : null}
          </div>
          {item.meta ? <div className="flex flex-wrap gap-2 text-sm text-slate-400">{item.meta}</div> : null}
          {item.body ? <div className="text-sm leading-6 text-slate-200">{item.body}</div> : null}
          {item.footer ? <div className="text-sm leading-6 text-slate-300">{item.footer}</div> : null}
        </article>
      ))}
    </div>
  );
};

export const PreBlock = ({ children }) => (
  <pre className="overflow-x-auto rounded-3xl border border-white/10 bg-[#02070d] p-4 text-xs leading-6 text-slate-200">
    <code>{children}</code>
  </pre>
);

export const KeyValueInline = ({ label, value }) => (
  <div className="flex flex-col gap-1 rounded-2xl border border-white/10 bg-white/5 px-3 py-2">
    <span className="text-[11px] uppercase tracking-[0.2em] text-slate-400">{label}</span>
    <span className="text-sm text-white">{value}</span>
  </div>
);

export { actionTone, asCurrency, asDate, asDateTime, asPercent, convictionLabel, entryRangeLabel, formatTickerLabel, verdictTone };
