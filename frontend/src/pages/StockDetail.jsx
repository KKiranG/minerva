import React, { useEffect, useMemo } from 'react';
import {
  Badge,
  Button,
  DataTable,
  DecisionCard,
  EmptyState,
  ExpandableCard,
  FieldList,
  LoadingState,
  PageSection,
  PreBlock,
  TimelineList,
  asCurrency,
  asDate,
  asDateTime,
  asPercent,
  convictionLabel,
  formatTickerLabel,
  verdictTone,
} from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { actionTone, asRelativeDate, countdownLabel, firstReadableLine, parseDate } from '../utils/formatters';

function SectionState({ state, emptyTitle, emptyDescription, children, rows = 4 }) {
  if (state.status === 'loading' || state.status === 'idle') return <LoadingState rows={rows} />;
  if (state.status === 'error') return <EmptyState title="Section unavailable" description={state.error} />;
  if (!state.data || (Array.isArray(state.data) && !state.data.length)) {
    return <EmptyState title={emptyTitle} description={emptyDescription} />;
  }
  return children(state.data);
}

export default function StockDetail({ api, ticker, params }) {
  const stock = useAsyncResource((signal) => api.getStock(ticker, { signal }), [ticker]);
  const price = useAsyncResource((signal) => api.getLatestPrice(ticker, { signal }), [ticker]);
  const history = useAsyncResource((signal) => api.getAnalysisHistory(ticker, { signal }), [ticker]);
  const trail = useAsyncResource((signal) => api.getAnalysisTrail(ticker, { signal }), [ticker]);
  const catalysts = useAsyncResource((signal) => api.getCatalysts({ ticker, signal }), [ticker]);
  const events = useAsyncResource((signal) => api.getEvents({ ticker, signal }), [ticker]);
  const research = useAsyncResource((signal) => api.getResearch({ ticker, signal }), [ticker]);
  const journal = useAsyncResource((signal) => api.getJournal({ ticker, signal }), [ticker]);

  if (stock.status === 'loading' || stock.status === 'idle') return <LoadingState rows={8} />;
  if (stock.status === 'error') return <EmptyState title="Stock unavailable" description={stock.error} />;
  if (!stock.data) return <EmptyState title="Stock not found" description={`No stock record exists for ${ticker}.`} />;

  const data = stock.data;
  const latestRun = history.data?.[0] || null;
  const latestPrice = price.data || null;

  const decision = {
    verdict: latestRun?.final_verdict || data.current_verdict,
    action: latestRun?.final_action || data.current_action,
    conviction: latestRun?.final_conviction ?? data.current_conviction,
    summary: latestRun?.one_line_summary || data.current_thesis,
    currentPrice: latestPrice?.close ?? data.current_price,
    entryLow: latestRun?.entry_low,
    entryHigh: latestRun?.entry_high,
    stop: latestRun?.stop_loss ?? data.current_stop,
    target: latestRun?.target_price ?? data.current_target,
    timeframe: latestRun?.timeframe,
    alertFlag: data.alert_flag,
    openPositionFlag: data.open_position_flag,
  };

  const sortedCatalysts = useMemo(
    () => (catalysts.data || []).slice().sort((a, b) => String(b.date || '').localeCompare(String(a.date || ''))),
    [catalysts.data]
  );
  const sortedEvents = useMemo(
    () =>
      (events.data || [])
        .slice()
        .sort((a, b) => {
          const left = parseDate(a.date)?.getTime() || Number.MAX_SAFE_INTEGER;
          const right = parseDate(b.date)?.getTime() || Number.MAX_SAFE_INTEGER;
          return left - right;
        }),
    [events.data]
  );

  useEffect(() => {
    const panel = params?.get('panel');
    if (!panel) return;
    const target = document.getElementById(`stock-panel-${panel}`);
    if (target) {
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [params, ticker]);

  return (
    <div className="space-y-6">
      <section className="rounded-[30px] border border-white/10 bg-[linear-gradient(135deg,rgba(7,18,29,0.95),rgba(4,10,18,0.9))] p-6 shadow-[0_28px_70px_rgba(0,0,0,0.3)]">
        <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge tone={verdictTone(decision.verdict)}>{decision.verdict || 'No verdict'}</Badge>
              <Badge tone={actionTone(decision.action)}>{decision.action || 'No action'}</Badge>
              <Badge tone={data.open_position_flag ? 'positive' : 'neutral'}>{data.open_position_flag ? 'Open position' : 'Flat'}</Badge>
              {data.alert_flag ? <Badge tone="danger">Alert active</Badge> : null}
            </div>
            <div className="space-y-1">
              <h1 className="text-3xl font-semibold tracking-tight text-white">{formatTickerLabel(data.ticker, data.company_name)}</h1>
              <p className="text-sm leading-6 text-slate-300">
                {data.primary_mineral || 'Unknown mineral'} • {data.value_chain_stage || 'Unknown stage'} • {data.country || 'Unknown geography'}
              </p>
              <p className="max-w-3xl text-sm leading-6 text-slate-300">{data.current_thesis || 'No stock thesis is stored yet.'}</p>
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Current price</div>
              <div className="mt-2 text-2xl font-semibold text-white">{asCurrency(decision.currentPrice)}</div>
            </div>
            <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Last analysis</div>
              <div className="mt-2 text-base font-semibold text-white">{data.last_analysis_date ? asDateTime(data.last_analysis_date) : 'Never'}</div>
              <div className="text-sm text-slate-300">{data.last_analysis_date ? asRelativeDate(data.last_analysis_date) : 'Needs first report'}</div>
            </div>
          </div>
        </div>
      </section>

      <DecisionCard {...decision} />

      <div className="grid gap-6 xl:grid-cols-2">
        <PageSection title="Key levels" subtitle="Latest stored price context and tactical levels.">
          <SectionState state={price} emptyTitle="No price snapshot" emptyDescription={`No price snapshot exists for ${data.ticker}.`}>
            {(snapshot) => (
              <FieldList
                fields={[
                  { label: 'Close', value: asCurrency(snapshot.close ?? data.current_price) },
                  { label: 'Daily change', value: asPercent(snapshot.change_pct) },
                  { label: 'Support 1 / 2', value: `${asCurrency(snapshot.support1)} / ${asCurrency(snapshot.support2)}` },
                  { label: 'Resistance 1 / 2', value: `${asCurrency(snapshot.resistance1)} / ${asCurrency(snapshot.resistance2)}` },
                  { label: '50 / 200 day MA', value: `${asCurrency(snapshot.ma50)} / ${asCurrency(snapshot.ma200)}` },
                  { label: 'ATR14', value: asCurrency(snapshot.atr14) },
                  { label: 'Volume vs avg', value: snapshot.volume_vs_avg ? `${snapshot.volume_vs_avg}x` : '—' },
                  { label: 'Key level note', value: snapshot.key_level || '—' },
                ]}
              />
            )}
          </SectionState>
        </PageSection>

        <PageSection title="Profile and risk" subtitle="Profile state, conviction, and current position context.">
          <FieldList
            fields={[
              { label: 'Exchange', value: data.exchange || '—' },
              { label: 'Revenue status', value: data.revenue_status || '—' },
              { label: 'Current conviction', value: convictionLabel(decision.conviction) },
              { label: 'Current stop', value: asCurrency(data.current_stop) },
              { label: 'Current target', value: asCurrency(data.current_target) },
              { label: 'China dependency', value: data.china_dependency_exposure || '—' },
              { label: 'Dilution risk', value: data.dilution_risk || '—', caption: data.dilution_notes || undefined },
              { label: 'Key risk', value: data.key_risk || '—' },
            ]}
          />
        </PageSection>
      </div>

      <div id="stock-panel-catalysts">
      <PageSection title="Catalyst timeline" subtitle="Sorted catalyst stack with significance and binding context.">
        <SectionState state={catalysts} emptyTitle="No catalysts" emptyDescription={`No catalysts are stored for ${data.ticker}.`}>
          {() => (
            <div className="space-y-3">
              {sortedCatalysts.map((item) => (
                <ExpandableCard
                  key={item.id}
                  title={item.title}
                  subtitle={`${asDate(item.date)} • significance ${item.significance ?? '—'}`}
                  badge={item.binding_status}
                  badgeTone={item.significance >= 4 ? 'warning' : 'neutral'}
                  preview={item.description || 'No catalyst description stored.'}
                  meta={[
                    <span key="category">{item.category}</span>,
                    item.source ? <span key="source">{item.source}</span> : null,
                  ].filter(Boolean)}
                >
                  <FieldList
                    fields={[
                      { label: 'Amount ceiling', value: asCurrency(item.amount_ceiling) },
                      { label: 'Next decision point', value: item.next_decision_point || '—' },
                      { label: 'Priced in', value: item.priced_in || '—' },
                      { label: 'Reversal risk', value: item.reversal_risk || '—' },
                    ]}
                  />
                </ExpandableCard>
              ))}
            </div>
          )}
        </SectionState>
      </PageSection>
      </div>

      <div id="stock-panel-events">
      <PageSection title="Event windows" subtitle="Upcoming events, impact framing, and countdowns.">
        <SectionState state={events} emptyTitle="No events" emptyDescription={`No events are stored for ${data.ticker}.`}>
          {() => (
            <div className="space-y-3">
              {sortedEvents.map((event) => (
                <ExpandableCard
                  key={event.id}
                  title={event.description}
                  subtitle={`${asDate(event.date)} • ${countdownLabel(event.date, event.event_type || 'event')}`}
                  badge={event.event_type}
                  badgeTone={event.impact === 'HIGH' ? 'danger' : event.impact === 'MEDIUM' ? 'warning' : 'neutral'}
                  meta={[
                    <span key="impact">{event.impact || 'UNKNOWN'} impact</span>,
                    <span key="status">{event.status || 'UPCOMING'}</span>,
                  ]}
                >
                  <FieldList
                    fields={[
                      { label: 'Bull case', value: event.bull_case || '—' },
                      { label: 'Bear case', value: event.bear_case || '—' },
                      { label: 'Source', value: event.source || '—' },
                    ]}
                  />
                </ExpandableCard>
              ))}
            </div>
          )}
        </SectionState>
      </PageSection>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <div id="stock-panel-research">
        <PageSection title="Research notes" subtitle="Recent notes generated from ingests, observations, options, and parse failures.">
          <SectionState state={research} emptyTitle="No research notes" emptyDescription={`No notes are stored for ${data.ticker}.`}>
            {(notes) => (
              <TimelineList
                items={notes.slice(0, 10).map((note) => ({
                  id: note.id,
                  title: note.title,
                  badge: note.note_type,
                  badgeTone: note.note_type === 'PARSE_FAILED' ? 'danger' : 'info',
                  meta: [<span key="created">{asDateTime(note.created_at)}</span>, note.category ? <span key="category">{note.category}</span> : null].filter(Boolean),
                  body: firstReadableLine(note.note_body, 'No note body stored.'),
                }))}
              />
            )}
          </SectionState>
        </PageSection>
        </div>

        <div id="stock-panel-journal">
        <PageSection title="Trading journal" subtitle="Open and closed trades with explicit empty-state handling.">
          <SectionState state={journal} emptyTitle="No journal entries" emptyDescription={`No journal entries are stored for ${data.ticker}.`}>
            {(entries) => (
              <DataTable
                rows={entries}
                emptyMessage="No journal entries."
                columns={[
                  { key: 'status', label: 'Status' },
                  { key: 'direction', label: 'Direction' },
                  { key: 'entry_date', label: 'Entry', render: (row) => asDate(row.entry_date) },
                  { key: 'entry_price', label: 'Entry price', render: (row) => asCurrency(row.entry_price) },
                  { key: 'target_price', label: 'Target', render: (row) => asCurrency(row.target_price) },
                  { key: 'pnl_percent', label: 'PnL %', render: (row) => asPercent(row.pnl_percent) },
                ]}
              />
            )}
          </SectionState>
        </PageSection>
        </div>
      </div>

      <div id="stock-panel-history">
      <PageSection title="Decision history" subtitle="Recent run-level decisions for this stock.">
        <SectionState state={history} emptyTitle="No decision history" emptyDescription={`No analysis runs are stored for ${data.ticker}.`}>
          {(runs) => (
            <DataTable
              rows={runs}
              emptyMessage="No runs yet."
              columns={[
                { key: 'started_at', label: 'Started', render: (row) => asDateTime(row.started_at) },
                { key: 'final_verdict', label: 'Verdict' },
                { key: 'final_action', label: 'Action' },
                { key: 'final_conviction', label: 'Conviction', render: (row) => convictionLabel(row.final_conviction) },
                { key: 'one_line_summary', label: 'Summary', render: (row) => row.one_line_summary || '—' },
              ]}
            />
          )}
        </SectionState>
      </PageSection>
      </div>

      <div id="stock-panel-trail">
      <PageSection title="Frontier report trail" subtitle="Raw MINERVA report visibility, parsed sections, and failed-section debugging.">
        <SectionState state={trail} emptyTitle="No report trail" emptyDescription={`No ingested report trail exists for ${data.ticker}.`}>
          {(items) => (
            <div className="space-y-4">
              {items.map((item) => (
                <ExpandableCard
                  key={item.run_id}
                  title={item.summary || item.run_id}
                  subtitle={`${asDateTime(item.started_at)} • ${item.status}`}
                  badge={item.parse_status}
                  badgeTone={item.parse_status === 'COMPLETE' ? 'positive' : item.parse_status === 'PARTIAL' ? 'warning' : 'danger'}
                  preview={item.failed_sections?.length ? `Failed sections: ${item.failed_sections.join(', ')}` : 'All tracked sections parsed without recorded failures.'}
                  meta={[
                    <span key="verdict">{item.verdict || 'No verdict'}</span>,
                    <span key="action">{item.action || 'No action'}</span>,
                    <span key="conviction">{convictionLabel(item.conviction)}</span>,
                  ]}
                >
                  {item.section_names?.length ? (
                    <div className="flex flex-wrap gap-2">
                      {item.section_names.map((section) => (
                        <Badge key={section} tone={item.failed_sections?.includes(section) ? 'danger' : 'info'}>{section}</Badge>
                      ))}
                    </div>
                  ) : null}
                  {item.run_notes ? (
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tripwires</div>
                      <PreBlock>{item.run_notes}</PreBlock>
                    </div>
                  ) : null}
                  {item.raw_report ? (
                    <div className="space-y-2">
                      <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Raw MINERVA report</div>
                      <PreBlock>{item.raw_report}</PreBlock>
                    </div>
                  ) : (
                    <EmptyState title="No raw report stored" description="This run does not include raw report text." />
                  )}
                </ExpandableCard>
              ))}
            </div>
          )}
        </SectionState>
      </PageSection>
      </div>

      <div className="flex justify-end">
        <Button type="button" onClick={() => { window.location.hash = '#/analysis'; }}>
          Ingest another report
        </Button>
      </div>
    </div>
  );
}
