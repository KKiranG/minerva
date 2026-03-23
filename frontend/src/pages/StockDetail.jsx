import React, { useMemo } from 'react';
import useAsyncResource from '../hooks/useAsyncResource';
import {
  Badge,
  DataTable,
  DecisionCard,
  EmptyState,
  ErrorState,
  ExpandableCard,
  FieldList,
  GovernmentFundingTable,
  LoadingState,
  Section,
  Sparkline,
  asCurrency,
  asDate,
  asDateTime,
  asPercent,
  convictionLabel,
  formatTickerLabel,
  verdictTone,
  actionTone
} from '../components/Common';
import { asCompactNumber, asRelativeDate } from '../utils/formatters';

const firstReadableLine = (value, fallback = 'No summary available.') => {
  if (!value) return fallback;
  const line = String(value)
    .split('\n')
    .map((item) => item.trim())
    .find((item) => item && !item.startsWith('#') && !item.startsWith('|'));
  return line || fallback;
};

const significanceTone = (value) => {
  if (Number(value) >= 5) return 'danger';
  if (Number(value) >= 4) return 'warning';
  return 'neutral';
};

const governmentFundingFromCatalysts = (rows = []) =>
  rows
    .filter((row) => String(row.category || '').startsWith('GOV_'))
    .map((row) => ({
      id: row.id,
      agency: row.source || 'Government',
      program: row.title,
      announced_date: row.date,
      amount_ceiling: row.amount_ceiling,
      amount_obligated: row.amount_obligated,
      amount_disbursed: row.amount_disbursed,
      status: row.binding_status,
      next_milestone: row.next_decision_point,
      notes: row.notes
    }));

const normalizeTrail = (rows = []) =>
  rows.map((item, index) => ({
    id: item.id || `${item.run_id || 'trail'}-${index}`,
    agent_name: item.agent_name || item.owner || item.title || 'Analysis',
    agent_kind: item.agent_kind || item.stage || 'analysis',
    created_at: item.created_at || null,
    verdict: item.verdict || item.run_verdict || null,
    action: item.action || item.run_action || null,
    conviction: item.conviction || item.run_conviction || null,
    parse_status: item.parse_status || 'COMPLETE',
    headline: item.headline || item.title || item.agent_name || 'Analysis update',
    summary: item.summary || firstReadableLine(item.raw_markdown || item.note_body || ''),
    raw_markdown: item.raw_markdown || item.note_body || '',
    parsed_json: item.parsed_json || null
  }));

export default function StockDetail({ api, ticker }) {
  const stock = useAsyncResource((signal) => api.getStock(ticker, { signal }), [ticker]);
  const latestPrice = useAsyncResource((signal) => api.getLatestPrice(ticker, { signal }), [ticker]);
  const history = useAsyncResource((signal) => api.getAnalysisHistory(ticker, { signal }), [ticker]);
  const trail = useAsyncResource((signal) => api.getAnalysisTrail(ticker, { signal }), [ticker]);
  const catalysts = useAsyncResource((signal) => api.getCatalysts({ ticker, signal }), [ticker]);
  const events = useAsyncResource((signal) => api.getEvents({ ticker, signal }), [ticker]);
  const research = useAsyncResource((signal) => api.getResearch({ ticker, signal }), [ticker]);
  const journal = useAsyncResource((signal) => api.getJournal({ ticker, signal }), [ticker]);

  const data = stock.data;
  const currentCatalysts = useMemo(() => (catalysts.data || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))), [catalysts.data]);
  const currentEvents = useMemo(() => (events.data || []).slice().sort((a, b) => String(a.date || '').localeCompare(String(b.date || ''))), [events.data]);
  const currentTrail = useMemo(() => normalizeTrail(trail.data || []), [trail.data]);
  const currentHistory = history.data || [];

  const governmentFundingRows = useMemo(() => {
    const fromCatalysts = governmentFundingFromCatalysts(currentCatalysts);
    if (fromCatalysts.length) return fromCatalysts;
    return Array.isArray(data?.government_funding) ? data.government_funding : [];
  }, [currentCatalysts, data?.government_funding]);

  const convictionSeries = useMemo(() => {
    const runs = currentHistory
      .slice()
      .reverse()
      .map((run) => Number(run.final_conviction))
      .filter((value) => !Number.isNaN(value));
    if (runs.length) return runs;
    return currentTrail
      .slice()
      .reverse()
      .map((item) => Number(item.conviction))
      .filter((value) => !Number.isNaN(value));
  }, [currentHistory, currentTrail]);

  if (stock.status === 'loading' || stock.status === 'idle') return <LoadingState rows={6} />;
  if (stock.status === 'error') return <ErrorState description={stock.error} retry={<button className="button button-primary">Retry</button>} />;
  if (!data) {
    return <EmptyState title="Stock not found" description={`We could not load ${ticker}. Try another seeded ticker like MP or UUUU.`} />;
  }

  const currentTicker = data.ticker || ticker;
  const currentResearch = research.data || [];
  const currentJournal = journal.data || [];
  const latestRun = currentHistory[0] || null;
  const priceSnapshot = latestPrice.data || null;

  const decision = {
    verdict: latestRun?.final_verdict || data.current_verdict,
    action: latestRun?.final_action || data.current_action,
    conviction: latestRun?.final_conviction ?? data.current_conviction,
    summary: latestRun?.one_line_summary || data.current_thesis,
    currentPrice: priceSnapshot?.close ?? data.current_price,
    entryLow: latestRun?.entry_low ?? data.entry_low,
    entryHigh: latestRun?.entry_high ?? data.entry_high,
    stop: latestRun?.stop_loss ?? data.current_stop,
    target: latestRun?.target_price ?? data.current_target,
    timeframe: latestRun?.timeframe ?? data.timeframe,
    alertFlag: data.alert_flag,
    openPositionFlag: data.open_position_flag
  };

  return (
    <div className="stack">
      <section className="hero">
        <div className="row">
          <div className="stack">
            <div className="meta">
              <Badge tone={verdictTone(decision.verdict)}>{decision.verdict || '—'}</Badge>
              <Badge tone={actionTone(decision.action)}>{decision.action || '—'}</Badge>
              <Badge tone={data.open_position_flag ? 'positive' : 'neutral'}>{data.open_position_flag ? 'Open position' : 'Flat'}</Badge>
              {data.alert_flag ? <Badge tone="danger">Alert active</Badge> : null}
            </div>
            <h1 className="page-title">{formatTickerLabel(currentTicker, data.company_name)}</h1>
            <p className="muted">
              {data.primary_mineral || 'Unknown mineral'} | {data.value_chain_stage || 'Unknown stage'} | {data.country || 'Unknown geography'}
            </p>
            <p className="muted">{data.current_thesis || 'No thesis summary is stored yet.'}</p>
          </div>

          <div className="stack" style={{ minWidth: 320 }}>
            <div className="metric-value">{asCurrency(decision.currentPrice)}</div>
            <Sparkline values={convictionSeries.length ? convictionSeries : [Number(decision.conviction || 0)]} />
            <div className="meta">
              <span>Last analysis {data.last_analysis_date ? asDateTime(data.last_analysis_date) : '—'}</span>
              <span>Last full {data.last_full_analysis ? asDateTime(data.last_full_analysis) : '—'}</span>
            </div>
          </div>
        </div>
      </section>

      <DecisionCard
        verdict={decision.verdict}
        action={decision.action}
        conviction={decision.conviction}
        summary={decision.summary}
        currentPrice={decision.currentPrice}
        entryLow={decision.entryLow}
        entryHigh={decision.entryHigh}
        stop={decision.stop}
        target={decision.target}
        timeframe={decision.timeframe}
        alertFlag={decision.alertFlag}
        openPositionFlag={decision.openPositionFlag}
      />

      <div className="panel-grid">
        <Section title="Key levels" subtitle="Latest price snapshot, support/resistance map, and tactical tape context.">
          {latestPrice.status === 'loading' || latestPrice.status === 'idle' ? (
            <LoadingState rows={4} />
          ) : priceSnapshot ? (
            <FieldList
              fields={[
                { label: 'Current price', value: asCurrency(priceSnapshot.close ?? data.current_price) },
                { label: 'Support 1 / 2', value: `${asCurrency(priceSnapshot.support1)} / ${asCurrency(priceSnapshot.support2)}` },
                { label: 'Resistance 1 / 2', value: `${asCurrency(priceSnapshot.resistance1)} / ${asCurrency(priceSnapshot.resistance2)}` },
                { label: 'Open / high / low', value: `${asCurrency(priceSnapshot.open)} / ${asCurrency(priceSnapshot.high)} / ${asCurrency(priceSnapshot.low)}` },
                { label: 'Daily change', value: asPercent(priceSnapshot.change_pct) },
                { label: 'Relative volume', value: priceSnapshot.relative_volume ? `${Number(priceSnapshot.relative_volume).toFixed(2)}x` : '—' },
                { label: 'ATR14', value: priceSnapshot.atr14 ? asPercent(priceSnapshot.atr14) : '—' },
                { label: 'Key level', value: priceSnapshot.key_level || '—' }
              ]}
            />
          ) : (
            <EmptyState title="No price snapshot" description={`No latest price snapshot was returned for ${currentTicker}.`} />
          )}
        </Section>

        <Section title="Fundamentals and risk" subtitle="Profile, balance-sheet shorthand, dilution risk, and core pressure points.">
          <FieldList
            fields={[
              { label: 'Exchange', value: data.exchange || '—' },
              { label: 'Market cap', value: asCompactNumber(data.market_cap) },
              { label: 'Enterprise value', value: asCompactNumber(data.enterprise_value) },
              { label: 'Shares outstanding', value: asCompactNumber(data.shares_outstanding) },
              { label: 'Revenue status', value: data.revenue_status || '—' },
              { label: 'Cash / debt', value: `${data.cash_position_approx || '—'} / ${data.debt_position_approx || '—'}` },
              { label: 'Dilution risk', value: data.dilution_risk || '—', caption: data.dilution_notes || null },
              { label: 'China dependency', value: data.china_dependency_exposure || '—' },
              { label: 'Competitive position', value: data.competitive_position || '—' },
              { label: 'Key risk', value: data.key_risk || '—' }
            ]}
          />
        </Section>
      </div>

      <Section title="Conviction history" subtitle="Recent conviction path from stored runs and analysis trail items.">
        {convictionSeries.length ? (
          <div className="stack">
            <Sparkline values={convictionSeries} />
            <div className="grid gap-3 md:grid-cols-3">
              {currentHistory.slice(0, 3).map((run) => (
                <div key={run.run_id} className="rounded-2xl border border-white/10 bg-white/[0.035] p-4">
                  <div className="text-xs uppercase tracking-[0.22em] text-slate-400">{asRelativeDate(run.started_at)}</div>
                  <div className="mt-2 text-lg font-semibold text-white">{convictionLabel(run.final_conviction)}</div>
                  <div className="text-sm text-slate-300">{run.final_verdict || 'No verdict'} / {run.final_action || 'No action'}</div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState title="No conviction history" description="Execute a run or ingest a frontier review to start building conviction history." />
        )}
      </Section>

      <Section title="Catalyst timeline" subtitle="Material catalysts, funding milestones, and next decision points for this ticker.">
        {catalysts.status === 'loading' || catalysts.status === 'idle' ? (
          <LoadingState rows={4} />
        ) : catalysts.status === 'error' ? (
          <ErrorState description={catalysts.error} />
        ) : currentCatalysts.length ? (
          <div className="stack">
            {currentCatalysts.map((catalyst, index) => (
              <ExpandableCard
                key={catalyst.id}
                title={catalyst.title}
                subtitle={`${catalyst.category} • ${asDate(catalyst.date)}`}
                badge={catalyst.binding_status}
                badgeTone={significanceTone(catalyst.significance)}
                defaultOpen={index === 0}
                preview={catalyst.description || catalyst.notes || 'No catalyst description was stored.'}
                meta={[
                  <span key="sig">Significance {catalyst.significance ?? '—'}</span>,
                  catalyst.priced_in ? <span key="priced">{`Priced in: ${catalyst.priced_in}`}</span> : null,
                  catalyst.timeline_to_next_effect ? <span key="timeline">{catalyst.timeline_to_next_effect}</span> : null,
                  catalyst.probability_materialising ? <span key="prob">{catalyst.probability_materialising}</span> : null
                ].filter(Boolean)}
              >
                <FieldList
                  fields={[
                    { label: 'Next decision point', value: catalyst.next_decision_point || '—' },
                    { label: 'Reversal risk', value: catalyst.reversal_risk || '—' },
                    { label: 'Funding ceiling', value: asCurrency(catalyst.amount_ceiling) },
                    { label: 'Funding obligated', value: asCurrency(catalyst.amount_obligated) },
                    { label: 'Funding disbursed', value: asCurrency(catalyst.amount_disbursed) }
                  ]}
                />
              </ExpandableCard>
            ))}
          </div>
        ) : (
          <EmptyState title="No catalysts" description={`No catalyst rows were returned for ${currentTicker}.`} />
        )}
      </Section>

      <Section title="Analysis trail" subtitle="Collapsible agent and reviewer outputs for the most recent work on this ticker.">
        {trail.status === 'loading' || trail.status === 'idle' ? (
          <LoadingState rows={4} />
        ) : trail.status === 'error' ? (
          <ErrorState description={trail.error} />
        ) : currentTrail.length ? (
          <div className="stack">
            {currentTrail.map((item, index) => (
              <ExpandableCard
                key={item.id}
                title={item.headline}
                subtitle={`${item.agent_name} • ${item.created_at ? asDateTime(item.created_at) : 'No timestamp'}`}
                badge={item.verdict || item.parse_status}
                badgeTone={item.verdict ? verdictTone(item.verdict) : item.parse_status === 'FAILED' ? 'danger' : 'neutral'}
                defaultOpen={index === 0}
                preview={item.summary}
                meta={[
                  <span key="kind">{item.agent_kind}</span>,
                  item.action ? <span key="action">{item.action}</span> : null,
                  item.conviction ? <span key="conviction">{convictionLabel(item.conviction)}</span> : null
                ].filter(Boolean)}
              >
                {item.raw_markdown ? (
                  <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-6 text-slate-200">
                    {item.raw_markdown}
                  </pre>
                ) : item.parsed_json ? (
                  <pre className="m-0 overflow-x-auto whitespace-pre-wrap rounded-2xl border border-white/10 bg-black/25 p-4 text-xs leading-6 text-slate-200">
                    {JSON.stringify(item.parsed_json, null, 2)}
                  </pre>
                ) : (
                  <p className="m-0 text-sm text-slate-300">No raw output was stored for this trail item.</p>
                )}
              </ExpandableCard>
            ))}
          </div>
        ) : (
          <EmptyState title="No analysis trail yet" description={`No stored agent outputs were returned for ${currentTicker}.`} />
        )}
      </Section>

      <Section title="Government funding" subtitle="Government-linked catalysts tracked separately for faster materiality review.">
        <GovernmentFundingTable rows={governmentFundingRows} emptyMessage={`No government-linked catalysts were returned for ${currentTicker}.`} />
      </Section>

      <div className="panel-grid">
        <Section title="Upcoming events" subtitle="Scenario checkpoints and watch windows.">
          {events.status === 'loading' || events.status === 'idle' ? (
            <LoadingState rows={3} />
          ) : events.status === 'error' ? (
            <ErrorState description={events.error} />
          ) : currentEvents.length ? (
            <div className="stack">
              {currentEvents.map((event) => (
                <ExpandableCard
                  key={event.id}
                  title={event.description}
                  subtitle={`${event.event_type} • ${asDate(event.date)}`}
                  badge={event.impact || 'UNKNOWN'}
                  badgeTone={String(event.impact || '').toUpperCase() === 'HIGH' ? 'danger' : String(event.impact || '').toUpperCase() === 'MEDIUM' ? 'warning' : 'neutral'}
                  preview={event.bull_case || event.description}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <div className="rounded-2xl border border-emerald-400/15 bg-emerald-400/5 p-4">
                      <div className="mb-2 text-xs uppercase tracking-[0.22em] text-emerald-200/70">Bull case</div>
                      <p className="m-0 text-sm leading-6 text-slate-200">{event.bull_case || 'No explicit bull case stored.'}</p>
                    </div>
                    <div className="rounded-2xl border border-rose-400/15 bg-rose-400/5 p-4">
                      <div className="mb-2 text-xs uppercase tracking-[0.22em] text-rose-200/70">Bear case</div>
                      <p className="m-0 text-sm leading-6 text-slate-200">{event.bear_case || 'No explicit bear case stored.'}</p>
                    </div>
                  </div>
                </ExpandableCard>
              ))}
            </div>
          ) : (
            <EmptyState title="No upcoming events" description={`There are no events for ${currentTicker}.`} />
          )}
        </Section>

        <Section title="Research notes" subtitle="Recent research, extraction notes, and sentiment carry-over.">
          {research.status === 'loading' || research.status === 'idle' ? (
            <LoadingState rows={3} />
          ) : research.status === 'error' ? (
            <ErrorState description={research.error} />
          ) : currentResearch.length ? (
            <div className="stack">
              {currentResearch.map((note) => (
                <ExpandableCard
                  key={note.id}
                  title={note.title}
                  subtitle={`${note.note_type || 'NOTE'} • ${note.created_at ? asDateTime(note.created_at) : 'No timestamp'}`}
                  badge={note.category || note.note_type || 'NOTE'}
                  badgeTone="neutral"
                  preview={firstReadableLine(note.key_takeaway || note.note_body, 'No note summary stored.')}
                >
                  <p className="m-0 text-sm leading-6 text-slate-200">{note.note_body}</p>
                </ExpandableCard>
              ))}
            </div>
          ) : (
            <EmptyState title="No research notes" description={`No notes were returned for ${currentTicker}.`} />
          )}
        </Section>
      </div>

      <Section title="Trading journal" subtitle="Open and recent journal entries tied to this ticker.">
        {journal.status === 'loading' || journal.status === 'idle' ? (
          <LoadingState rows={3} />
        ) : journal.status === 'error' ? (
          <ErrorState description={journal.error} />
        ) : currentJournal.length ? (
          <DataTable
            rows={currentJournal}
            rowKey={(row) => row.id}
            columns={[
              { key: 'status', label: 'Status' },
              { key: 'direction', label: 'Direction' },
              { key: 'entry_date', label: 'Entry date', render: (row) => asDate(row.entry_date) },
              { key: 'entry_price', label: 'Entry', render: (row) => asCurrency(row.entry_price) },
              { key: 'stop_loss', label: 'Stop', render: (row) => asCurrency(row.stop_loss) },
              { key: 'target_price', label: 'Target', render: (row) => asCurrency(row.target_price) },
              { key: 'pnl_percent', label: 'PnL %', render: (row) => asPercent(row.pnl_percent) },
              { key: 'planned_timeframe', label: 'Timeframe', render: (row) => row.planned_timeframe || '—' },
              { key: 'thesis', label: 'Thesis', render: (row) => row.thesis || '—' }
            ]}
          />
        ) : (
          <EmptyState title="No journal entries" description={`No trading journal rows were returned for ${currentTicker}.`} />
        )}
      </Section>
    </div>
  );
}
