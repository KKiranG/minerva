import React, { useMemo, useState } from 'react';
import { seedUniverse } from '../api';
import {
  Badge,
  EmptyState,
  ErrorState,
  ExpandableCard,
  FieldList,
  LoadingState,
  Section,
  TimelineList,
  asCurrency,
  convictionLabel,
  entryRangeLabel
} from '../components/Common';

const defaultExtraction = {
  date: new Date().toISOString().slice(0, 10),
  scope: 'MP,UUUU,USAR,UAMY,PPTA,NB,METC,ALM,AXTI',
  mode: 'DELTA',
  source_model: 'qwen3.5:latest',
  raw_text:
    'Critical minerals digest:\n- MP: funding detail expected to tighten the domestic magnet build timeline.\n- UUUU: next processing update will decide whether the buy stays intact.\n- PPTA: financing progress remains the key determinant of follow-through.',
  time_window_start: '',
  time_window_end: '',
  custom_focus: 'Catalysts, key levels, decision changes, and what would invalidate the call.'
};

const defaultAnalysis = {
  ticker: 'MP',
  extraction_id: '',
  mode: 'DELTA',
  notes: 'Focus on decision clarity, downside control, near-term catalysts, and what needs to happen next.'
};

const defaultFrontier = {
  run_id: '',
  ticker: 'MP',
  source_model: 'local-frontier',
  raw_text:
    '### One Line: Constructive strategic-materials setup with visible catalysts.\n### Net Judgment: [BULLISH]\n### Action: [BUY]\n### Conviction: [4]\nEntry Zone: [$30.20 - $32.80]\nStop Loss: [$28.40]\nTarget: [$42.00]\nTimeframe: [3-9 months]',
  merge_with_existing: false
};

const defaultPromptForm = {
  scope: 'MP',
  prompt_type: 'DELTA_EXTRACTION',
  mode: 'DELTA',
  run_id: '',
  focus: 'One-line setup, verdict/action/conviction, key levels, catalyst timing, funding relevance, and invalidation.',
  context: 'Use the latest stock snapshot, catalyst timeline, analysis trail, and journal context.'
};

const safeJson = (value) => {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
};

export default function AnalysisWorkspace({ api, stocks = [] }) {
  const [extractionForm, setExtractionForm] = useState(defaultExtraction);
  const [analysisForm, setAnalysisForm] = useState(defaultAnalysis);
  const [frontierForm, setFrontierForm] = useState(defaultFrontier);
  const [promptForm, setPromptForm] = useState(defaultPromptForm);
  const [extractionResult, setExtractionResult] = useState(null);
  const [runResult, setRunResult] = useState(null);
  const [taskResult, setTaskResult] = useState(null);
  const [frontierResult, setFrontierResult] = useState(null);
  const [promptResult, setPromptResult] = useState(null);
  const [submitState, setSubmitState] = useState({ status: 'idle', error: null });
  const [promptState, setPromptState] = useState({ status: 'idle', error: null });
  const [copyState, setCopyState] = useState('idle');

  const universe = useMemo(() => (stocks.length ? stocks : seedUniverse), [stocks]);

  const withStatus = async (handler) => {
    setSubmitState({ status: 'loading', error: null });
    try {
      const value = await handler();
      setSubmitState({ status: 'success', error: null });
      return value;
    } catch (error) {
      setSubmitState({ status: 'error', error: error?.message || 'Request failed.' });
      throw error;
    }
  };

  const submitExtraction = async (event) => {
    event.preventDefault();
    const payload = await withStatus(() =>
      api.ingestExtraction({
        ...extractionForm,
        extraction_id: undefined
      })
    );
    setExtractionResult(payload);
    setPromptForm((current) => ({
      ...current,
      context: extractionForm.raw_text,
      scope: extractionForm.scope.split(',')[0]?.trim()?.toUpperCase() || current.scope
    }));
  };

  const submitAnalysis = async (event) => {
    event.preventDefault();
    const payload = await withStatus(() =>
      api.createAnalysisRun({
        ...analysisForm,
        extraction_id: analysisForm.extraction_id ? Number(analysisForm.extraction_id) : null
      })
    );
    setRunResult(payload);
    setFrontierForm((current) => ({ ...current, run_id: payload.run_id, ticker: payload.ticker }));
    setPromptForm((current) => ({
      ...current,
      scope: payload.ticker || current.scope,
      run_id: payload.run_id || current.run_id
    }));
  };

  const submitFrontier = async (event) => {
    event.preventDefault();
    const payload = await withStatus(() =>
      api.ingestFrontier({
        ...frontierForm,
        merge_with_existing: Boolean(frontierForm.merge_with_existing)
      })
    );
    setFrontierResult(payload.parsed || payload);
    setRunResult((current) => (current ? { ...current, ...(payload.parsed || {}) } : current));
  };

  const generateTasks = async () => {
    if (!runResult?.run_id) return;
    const payload = await withStatus(() => api.generateAnalysisTasks(runResult.run_id));
    setTaskResult(payload);
  };

  const executeRun = async () => {
    if (!runResult?.run_id) return;
    const payload = await withStatus(() => api.executeAnalysisRun(runResult.run_id));
    setRunResult((current) => ({
      ...(current || {}),
      run: payload.run,
      execution: payload.execution
    }));
  };

  const createPrompt = async (event) => {
    event.preventDefault();
    setPromptState({ status: 'loading', error: null });
    setCopyState('idle');
    try {
      const payload = await api.generatePrompt({
        prompt_type: promptForm.prompt_type,
        mode: promptForm.mode,
        scope: promptForm.scope,
        ticker: promptForm.scope,
        run_id: promptForm.run_id || null,
        focus: promptForm.focus,
        context: promptForm.context
      });
      setPromptResult(payload);
      setPromptState({ status: 'success', error: null });
    } catch (error) {
      setPromptState({ status: 'error', error: error?.message || 'Prompt generation failed.' });
    }
  };

  const copyPrompt = async () => {
    if (!promptResult?.prompt_text) return;
    try {
      await navigator.clipboard.writeText(promptResult.prompt_text);
      setCopyState('copied');
    } catch {
      setCopyState('failed');
    }
  };

  const currentRun = runResult?.run || runResult;
  const frontierData = frontierResult || null;
  const promptNeedsRun = promptForm.prompt_type === 'SENIOR_REVIEW' || promptForm.prompt_type === 'FINAL_OVERSIGHT';

  return (
    <div className="stack">
      <Section title="Analysis workspace" subtitle="Drive the backend pipeline from extraction through frontier ingest.">
        <div className="stack">
          <form className="form-grid" onSubmit={submitExtraction}>
            <div className="row">
              <strong>Extraction ingest</strong>
              <Badge tone="positive">POST /api/extractions/ingest</Badge>
            </div>
            <div className="form-row">
              <input className="text-input" value={extractionForm.date} onChange={(event) => setExtractionForm({ ...extractionForm, date: event.target.value })} />
              <input className="text-input" value={extractionForm.scope} onChange={(event) => setExtractionForm({ ...extractionForm, scope: event.target.value })} />
            </div>
            <div className="form-row">
              <select className="toolbar-select" value={extractionForm.mode} onChange={(event) => setExtractionForm({ ...extractionForm, mode: event.target.value })}>
                <option value="DELTA">DELTA</option>
                <option value="FULL_SCAN">FULL_SCAN</option>
              </select>
              <input className="text-input" value={extractionForm.source_model} onChange={(event) => setExtractionForm({ ...extractionForm, source_model: event.target.value })} />
            </div>
            <textarea className="text-area" value={extractionForm.raw_text} onChange={(event) => setExtractionForm({ ...extractionForm, raw_text: event.target.value })} />
            <div className="form-row">
              <input className="text-input" placeholder="Time window start" value={extractionForm.time_window_start} onChange={(event) => setExtractionForm({ ...extractionForm, time_window_start: event.target.value })} />
              <input className="text-input" placeholder="Time window end" value={extractionForm.time_window_end} onChange={(event) => setExtractionForm({ ...extractionForm, time_window_end: event.target.value })} />
            </div>
            <input className="text-input" placeholder="Custom focus" value={extractionForm.custom_focus} onChange={(event) => setExtractionForm({ ...extractionForm, custom_focus: event.target.value })} />
            <div className="row">
              <span className="helper-text">Keep extraction scope aligned with the current nine-stock review universe.</span>
              <button className="button button-primary" type="submit">Ingest extraction</button>
            </div>
          </form>
          {submitState.status === 'error' ? <ErrorState description={submitState.error} /> : null}
          {submitState.status === 'loading' ? <LoadingState rows={1} /> : null}
          {extractionResult ? (
            <FieldList
              fields={[
                { label: 'Extraction id', value: extractionResult.extraction_id },
                { label: 'Parse status', value: extractionResult.parse_status },
                { label: 'Catalysts extracted', value: extractionResult.counters?.catalysts_extracted ?? '—' },
                { label: 'Events extracted', value: extractionResult.counters?.events_extracted ?? '—' },
                { label: 'Price snapshots', value: extractionResult.counters?.prices_extracted ?? '—' },
                { label: 'Notes created', value: extractionResult.counters?.notes_created ?? '—' }
              ]}
            />
          ) : (
            <EmptyState title="No extraction response yet" description="Submit the extraction form to populate the response panel." />
          )}
        </div>
      </Section>

      <div className="panel-grid">
        <Section title="Analysis run" subtitle="Create a backend analysis run for a selected review-universe ticker.">
          <form className="form-grid" onSubmit={submitAnalysis}>
            <div className="form-row">
              <select className="toolbar-select" value={analysisForm.ticker} onChange={(event) => setAnalysisForm({ ...analysisForm, ticker: event.target.value })}>
                {universe.map((stock) => (
                  <option key={stock.ticker} value={stock.ticker}>
                    {stock.ticker}
                  </option>
                ))}
              </select>
              <input className="text-input" placeholder="Extraction id" value={analysisForm.extraction_id} onChange={(event) => setAnalysisForm({ ...analysisForm, extraction_id: event.target.value })} />
            </div>
            <div className="form-row">
              <select className="toolbar-select" value={analysisForm.mode} onChange={(event) => setAnalysisForm({ ...analysisForm, mode: event.target.value })}>
                <option value="DELTA">DELTA</option>
                <option value="FULL_SCAN">FULL_SCAN</option>
              </select>
              <input className="text-input" placeholder="Notes" value={analysisForm.notes} onChange={(event) => setAnalysisForm({ ...analysisForm, notes: event.target.value })} />
            </div>
            <div className="row">
              <span className="helper-text">Run creation stays aligned with the frontend review universe and current backend routes.</span>
              <button className="button button-primary" type="submit">Create run</button>
            </div>
          </form>
          <div className="row" style={{ marginTop: 14 }}>
            <button className="button" type="button" onClick={generateTasks} disabled={!runResult?.run_id}>
              Generate tasks
            </button>
            <button className="button" type="button" onClick={executeRun} disabled={!runResult?.run_id}>
              Execute run
            </button>
          </div>
          {currentRun ? (
            <FieldList
              fields={[
                { label: 'Run id', value: currentRun.run_id || '—' },
                { label: 'Ticker', value: currentRun.ticker || '—' },
                { label: 'Status', value: currentRun.status || '—' },
                { label: 'Final verdict', value: currentRun.final_verdict || '—' },
                { label: 'Final action', value: currentRun.final_action || '—' },
                { label: 'Final conviction', value: convictionLabel(currentRun.final_conviction) },
                { label: 'Summary', value: currentRun.one_line_summary || '—' },
                { label: 'Frontier review', value: currentRun.frontier_review_status || '—' }
              ]}
            />
          ) : (
            <EmptyState title="No run yet" description="Create an analysis run to unlock generation and execution." />
          )}
        </Section>

        <Section title="Frontier ingest" subtitle="Parse the manual decision memo back into backend fields.">
          <form className="form-grid" onSubmit={submitFrontier}>
            <div className="form-row">
              <input className="text-input" placeholder="Run id" value={frontierForm.run_id} onChange={(event) => setFrontierForm({ ...frontierForm, run_id: event.target.value })} />
              <select className="toolbar-select" value={frontierForm.ticker} onChange={(event) => setFrontierForm({ ...frontierForm, ticker: event.target.value })}>
                {universe.map((stock) => (
                  <option key={stock.ticker} value={stock.ticker}>
                    {stock.ticker}
                  </option>
                ))}
              </select>
            </div>
            <input className="text-input" value={frontierForm.source_model} onChange={(event) => setFrontierForm({ ...frontierForm, source_model: event.target.value })} />
            <textarea className="text-area" value={frontierForm.raw_text} onChange={(event) => setFrontierForm({ ...frontierForm, raw_text: event.target.value })} />
            <label className="row">
              <span className="helper-text">Merge with existing intelligence</span>
              <input
                type="checkbox"
                checked={frontierForm.merge_with_existing}
                onChange={(event) => setFrontierForm({ ...frontierForm, merge_with_existing: event.target.checked })}
              />
            </label>
            <div className="row">
              <span className="helper-text">Entry, stop, target, and conviction should parse from the review memo.</span>
              <button className="button button-primary" type="submit">Ingest frontier</button>
            </div>
          </form>
          {frontierData ? (
            <FieldList
              fields={[
                { label: 'Verdict', value: frontierData.final_verdict || '—' },
                { label: 'Action', value: frontierData.final_action || '—' },
                { label: 'Conviction', value: convictionLabel(frontierData.final_conviction) },
                { label: 'Entry', value: entryRangeLabel(frontierData.entry_low, frontierData.entry_high) },
                { label: 'Stop', value: asCurrency(frontierData.stop_loss) },
                { label: 'Target', value: asCurrency(frontierData.target_price) },
                { label: 'Timeframe', value: frontierData.timeframe || '—' },
                { label: 'Summary', value: frontierData.one_line_summary || '—' }
              ]}
            />
          ) : (
            <EmptyState title="No frontier data yet" description="Paste a manual review memo to populate this panel." />
          )}
        </Section>
      </div>

      <Section title="Prompt generator" subtitle="Generate review prompts from the backend prompt endpoints and copy the resulting text.">
        <div className="panel-grid">
          <form className="form-grid" onSubmit={createPrompt}>
            <div className="form-row">
              <select
                className="toolbar-select"
                value={promptForm.scope}
                onChange={(event) => setPromptForm({ ...promptForm, scope: event.target.value })}
                disabled={promptNeedsRun}
              >
                <option value="ALL">ALL</option>
                {universe.map((stock) => (
                  <option key={stock.ticker} value={stock.ticker}>
                    {stock.ticker}
                  </option>
                ))}
              </select>
              <select
                className="toolbar-select"
                value={promptForm.prompt_type}
                onChange={(event) =>
                  setPromptForm({
                    ...promptForm,
                    prompt_type: event.target.value,
                    mode: event.target.value === 'FULL_EXTRACTION' ? 'FULL_SCAN' : promptForm.mode === 'FULL_SCAN' ? 'DELTA' : promptForm.mode
                  })
                }
              >
                <option value="DELTA_EXTRACTION">Delta extraction</option>
                <option value="FULL_EXTRACTION">Full extraction</option>
                <option value="SENIOR_REVIEW">Senior review</option>
                <option value="FINAL_OVERSIGHT">Final oversight</option>
              </select>
            </div>
            <div className="form-row">
              {promptNeedsRun ? (
                <input className="text-input" placeholder="Run id" value={promptForm.run_id} onChange={(event) => setPromptForm({ ...promptForm, run_id: event.target.value })} />
              ) : (
                <>
                  <select className="toolbar-select" value={promptForm.mode} onChange={(event) => setPromptForm({ ...promptForm, mode: event.target.value })}>
                    <option value="DELTA">DELTA</option>
                    <option value="FULL_SCAN">FULL_SCAN</option>
                  </select>
                  <input className="text-input" placeholder="Focus" value={promptForm.focus} onChange={(event) => setPromptForm({ ...promptForm, focus: event.target.value })} />
                </>
              )}
            </div>
            {!promptNeedsRun ? <textarea className="text-area" value={promptForm.context} onChange={(event) => setPromptForm({ ...promptForm, context: event.target.value })} /> : null}
            <div className="row">
              <span className="helper-text">
                The frontend uses `/api/prompts/extraction`, `/api/prompts/senior-review`, and `/api/prompts/final-oversight`, with mock fallback only if the backend is unavailable.
              </span>
              <button className="button button-primary" type="submit" disabled={promptNeedsRun && !promptForm.run_id}>
                Generate prompt
              </button>
            </div>
          </form>

          <div className="grid gap-4">
            {promptState.status === 'loading' ? <LoadingState rows={2} /> : null}
            {promptState.status === 'error' ? <ErrorState description={promptState.error} /> : null}
            {promptResult ? (
              <ExpandableCard
                title="Generated prompt"
                subtitle={promptResult.prompt_type || promptForm.prompt_type}
                badge={promptResult.source_path || 'Backend'}
                badgeTone={String(promptResult.source_path || '').startsWith('mock://') ? 'warning' : 'positive'}
                defaultOpen
                preview="Prompt text is ready to copy into a review run, agent task, or manual memo."
              >
                <div className="space-y-4">
                  <textarea className="text-area" readOnly value={promptResult.prompt_text || ''} />
                  <div className="row">
                    <div className="helper-text">
                      {copyState === 'copied' ? 'Prompt copied to clipboard.' : copyState === 'failed' ? 'Clipboard copy failed in this environment.' : 'Use copy to move the prompt into your runbook or tool of choice.'}
                    </div>
                    <button className="button" type="button" onClick={copyPrompt}>
                      Copy text
                    </button>
                  </div>
                </div>
              </ExpandableCard>
            ) : (
              <EmptyState title="No prompt generated yet" description="Generate a prompt to preview the backend or fallback output here." />
            )}
          </div>
        </div>
      </Section>

      <div className="panel-grid">
        <Section title="Task files" subtitle="Generated task artifacts from the analysis run.">
          {taskResult ? (
            <TimelineList
              items={Object.entries(taskResult.task_files || taskResult).map(([key, value]) => ({
                id: key,
                title: `Task ${key}`,
                body: typeof value === 'string' ? value : safeJson(value)
              }))}
            />
          ) : (
            <EmptyState title="No tasks yet" description="Generate tasks from a created run to see filenames here." />
          )}
        </Section>

        <Section title="Execution summary" subtitle="Specialist and review output from the run.">
          {currentRun?.execution ? (
            <TimelineList
              items={[
                {
                  title: 'Specialists',
                  body: currentRun.execution.specialists?.map((item) => `${item.agent}: ${item.parse_status}`).join(' | ') || 'No specialist results.'
                },
                {
                  title: 'Review',
                  body: currentRun.execution.review?.consistency || 'No consistency note returned.',
                  footer: currentRun.execution.review?.synthesis || null
                }
              ]}
            />
          ) : (
            <EmptyState title="No execution output" description="Execute the run to show the specialist review summary." />
          )}
        </Section>
      </div>
    </div>
  );
}
