import React, { useMemo, useState } from 'react';
import { Badge, Button, EmptyState, PageSection, PreBlock, TextArea } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { asDateTime } from '../utils/formatters';

const sampleReport = `## MINERVA_REPORT
### Ticker: MP
### Date: 2026-03-24
### Source: combined from: claude, chatgpt

## NARRATIVE
Domestic magnet execution remains the core thesis, with policy timing still driving the tape.

## DECISION
| Field | Value |
|-------|-------|
| Verdict | BULLISH |
| Conviction | 4 |
| Action | BUY |
| Entry Low | $23.50 |
| Entry High | $24.80 |
| Stop Loss | $20.80 |
| Stop Basis | 2 ATR below entry |
| Target | $30.00 |
| Target Basis | Next resistance at $30 |
| Timeframe | 1-3 weeks |
| R:R Ratio | 1.8:1 |
| Position Size | Standard |
| Summary | Policy tailwinds and confirmed volume still support the setup. |

## CATALYSTS
| Date | Ticker | Category | Title | Amount_USD | Binding_Status | Significance | Source |
|------|--------|----------|-------|------------|----------------|-------------|--------|
| 2026-03-20 | MP | GOV_FUNDING | DoD OSC loan tranche | 150000000 | OBLIGATED | 5 | DoD press release |

## PRICE_DATA
| Metric | Value |
|--------|-------|
| Close | $24.50 |
| Change % | +5.2% |
| Volume vs Avg | 1.8x |
| 50-day MA | $21.87 |
| 200-day MA | $16.90 |
| Support 1 | $22.10 |
| Resistance 1 | $26.80 |
| ATR(14) | $1.85 |
| Momentum | ACCELERATING |
| Relative Strength | LEADING |
| Key Level Note | Testing resistance at $26.80 |

## EVENTS
| Date | Ticker | Type | Description | Impact | Bull_Case | Bear_Case | Source |
|------|--------|------|-------------|--------|-----------|-----------|--------|
| 2026-04-15 | MP | FUNDING_DECISION | DOE follow-up window | HIGH | Award confirms | Delay undermines | DOE calendar |

## TRIPWIRES
| Type | Description |
|------|-------------|
| INVALIDATES | Stop below $20.80 and failed funding follow-through. |
| CONFIRMS | Volume expansion through $26.80. |
| WATCH | DOE timing and any magnet-plant update. |

## NOTES
The setup still depends on policy follow-through rather than just narrative momentum.
`;

export default function AnalysisWorkspace({ api, stocks = [], onIngestComplete }) {
  const formatResource = useAsyncResource((signal) => api.getMinervaFormat({ signal }), []);
  const [rawText, setRawText] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null });
  const [result, setResult] = useState(null);

  const knownTickers = useMemo(() => stocks.map((stock) => stock.ticker).join(', ') || 'No tracked stocks yet', [stocks]);

  return (
    <div className="space-y-6">
      <PageSection
        title="MINERVA ingest workspace"
        subtitle="Paste a v3 MINERVA-formatted frontier report, ingest it once, and inspect the per-run parse/state results. The old task-generation and local-agent execution flow is gone."
      >
        <form
          className="space-y-4"
          onSubmit={async (event) => {
            event.preventDefault();
            setState({ status: 'loading', error: null });
            try {
              const payload = await api.ingestMinervaReport({
                raw_text: rawText,
                mode: 'DELTA',
                source_model: 'manual-frontier',
              });
              setResult(payload);
              onIngestComplete?.();
              setState({ status: 'success', error: null });
            } catch (error) {
              setState({ status: 'error', error: error.message });
            }
          }}
        >
          <div className="flex justify-end">
            <Button type="button" disabled={state.status === 'loading'} onClick={() => setRawText(sampleReport)}>
              Load sample
            </Button>
          </div>

          <TextArea
            value={rawText}
            onChange={(event) => setRawText(event.target.value)}
            placeholder="Paste the full MINERVA markdown document here."
            required
          />

          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="text-sm leading-6 text-slate-300">
              Known tracked tickers: <span className="font-medium text-white">{knownTickers}</span>. The report header `Source` is treated as authoritative during ingest.
            </div>
            <Button type="submit" tone="primary" disabled={state.status === 'loading' || !rawText.trim()}>
              {state.status === 'loading' ? 'Ingesting…' : 'Ingest report'}
            </Button>
          </div>
          {state.error ? <div className="text-sm text-rose-200">{state.error}</div> : null}
        </form>
      </PageSection>

      <PageSection
        title="MINERVA contract"
        subtitle="Use the local `/minerva-format` command to consolidate frontier-model research. The backend parses the resulting markdown against this exact format."
      >
        {formatResource.data ? (
          <div className="grid gap-4 xl:grid-cols-2">
            <article className="space-y-3 rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Claude Code command</div>
              <PreBlock>{formatResource.data.command_text}</PreBlock>
            </article>
            <article className="space-y-3 rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Format specification</div>
              <PreBlock>{formatResource.data.spec_text}</PreBlock>
            </article>
          </div>
        ) : (
          <EmptyState
            title="Format spec unavailable"
            description={formatResource.error || 'The backend did not return the MINERVA format contract.'}
          />
        )}
      </PageSection>

      {result ? (
        <div className="space-y-6">
          <PageSection
            title="Ingest result"
            subtitle={`Extraction ${result.extraction_id} finished with ${result.parse_status}. Generated ${result.reports.length} run(s).`}
            action={<Badge tone={result.parse_status === 'COMPLETE' ? 'positive' : result.parse_status === 'PARTIAL' ? 'warning' : 'danger'}>{result.parse_status}</Badge>}
          >
            <div className="grid gap-4 xl:grid-cols-2">
              {result.reports.map((report) => (
                <article key={report.run_id} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <div className="text-lg font-semibold text-white">{report.ticker}</div>
                    <Badge tone={report.parse_status === 'COMPLETE' ? 'positive' : report.parse_status === 'PARTIAL' ? 'warning' : 'danger'}>
                      {report.parse_status}
                    </Badge>
                  </div>
                  <div className="mt-3 space-y-2 text-sm leading-6 text-slate-300">
                    <div>Run ID: <span className="font-mono text-slate-100">{report.run_id}</span></div>
                    <div>Decision stored: {String(report.decision_stored)}</div>
                    <div>Price stored: {String(report.price_snapshot_stored)}</div>
                    <div>Catalysts stored: {report.catalysts_stored}</div>
                    <div>Events stored: {report.events_stored}</div>
                    <div>Notes stored: {report.notes_stored}</div>
                    <div>Failed sections: {report.failed_sections.length ? report.failed_sections.join(', ') : 'None'}</div>
                  </div>
                  <div className="mt-4">
                    <Button type="button" onClick={() => { window.location.hash = `#/stocks/${report.ticker}`; }}>
                      Open stock
                    </Button>
                  </div>
                </article>
              ))}
            </div>
          </PageSection>

          <PageSection title="Raw report" subtitle={`Stored at ${asDateTime(new Date())}. Use the stock detail trail for parsed sections and failures.`}>
            <PreBlock>{rawText}</PreBlock>
          </PageSection>
        </div>
      ) : (
        <EmptyState
          title="No report ingested yet"
          description="Paste a v3 MINERVA report and ingest it to create extraction and analysis-run records."
        />
      )}
    </div>
  );
}
