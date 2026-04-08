import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Badge, Button, EmptyState, PageSection, PreBlock, Select, TextArea } from '../components/Common';
import ExtractionList from '../components/ExtractionList';
import RawDocumentViewer from '../components/RawDocumentViewer';
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

const REQUIRED_DECISION_FIELDS = [
  'Verdict',
  'Conviction',
  'Action',
  'Entry Low',
  'Entry High',
  'Stop Loss',
  'Stop Basis',
  'Target',
  'Target Basis',
  'Timeframe',
  'R:R Ratio',
  'Position Size',
  'Summary',
];

const QUICK_REFERENCE = [
  'Required sections: `## MINERVA_REPORT` and `## DECISION`.',
  'Repeat the full structure for multi-stock reports. The parser splits on `## MINERVA_REPORT`.',
  'Use exact DECISION field labels and include `Ticker` in structured table rows.',
  'Recommended sections: `NARRATIVE`, `CATALYSTS`, `PRICE_DATA`, `EVENTS`.',
  'Optional sections: `OPTIONS`, `TRIPWIRES`, `NOTES`.',
];

const splitReports = (rawText) => {
  const matches = [...rawText.matchAll(/^## MINERVA_REPORT\s*$/gm)];
  if (!matches.length) return [];
  return matches.map((match, index) => {
    const start = match.index || 0;
    const end = index + 1 < matches.length ? matches[index + 1].index : rawText.length;
    return rawText.slice(start, end).trim();
  }).filter(Boolean);
};

const sectionBody = (chunk, name) => {
  const escaped = name.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const regex = new RegExp(`^## ${escaped}\\s*$\\n?([\\s\\S]*?)(?=^## [A-Z_]+\\s*$|$)`, 'm');
  return chunk.match(regex)?.[1]?.trim() || '';
};

const parseDecisionFieldNames = (decisionText) =>
  decisionText
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.startsWith('|') && !/^\|\s*-+/.test(line))
    .slice(1)
    .map((line) => line.split('|').map((cell) => cell.trim()).filter(Boolean)[0])
    .filter(Boolean);

const validateRawText = (rawText) => {
  const trimmed = rawText.trim();
  if (!trimmed) {
    return {
      overall: 'EMPTY',
      reportCount: 0,
      tickers: [],
      issues: ['No report text provided.'],
      reports: [],
    };
  }

  const chunks = splitReports(trimmed);
  if (!chunks.length) {
    return {
      overall: 'FAILED',
      reportCount: 0,
      tickers: [],
      issues: ['Missing `## MINERVA_REPORT` header.'],
      reports: [],
    };
  }

  const reports = chunks.map((chunk, index) => {
    const ticker = chunk.match(/^###\s+Ticker:\s*(.+)$/m)?.[1]?.trim() || '';
    const date = chunk.match(/^###\s+Date:\s*(.+)$/m)?.[1]?.trim() || '';
    const source = chunk.match(/^###\s+Source:\s*(.+)$/m)?.[1]?.trim() || '';
    const sectionNames = [...chunk.matchAll(/^##\s+([A-Z_]+)\s*$/gm)].map((match) => match[1]);
    const decisionText = sectionBody(chunk, 'DECISION');
    const decisionFields = parseDecisionFieldNames(decisionText);
    const missingDecisionFields = REQUIRED_DECISION_FIELDS.filter((field) => !decisionFields.includes(field));
    const missingHeaderFields = [
      !ticker ? 'Ticker' : null,
      !date ? 'Date' : null,
      !source ? 'Source' : null,
    ].filter(Boolean);
    const missingSections = ['DECISION'].filter((field) => !sectionNames.includes(field));
    const issues = [
      ...missingHeaderFields.map((field) => `Missing header field: ${field}`),
      ...missingSections.map((field) => `Missing required section: ${field}`),
      ...missingDecisionFields.map((field) => `Missing decision field: ${field}`),
    ];
    return {
      index,
      ticker: ticker || `Report ${index + 1}`,
      date,
      source,
      sectionNames,
      missingHeaderFields,
      missingSections,
      missingDecisionFields,
      issues,
      status: issues.length ? (sectionNames.includes('DECISION') ? 'PARTIAL' : 'FAILED') : 'COMPLETE',
    };
  });

  const issues = reports.flatMap((report) => report.issues.map((issue) => `${report.ticker}: ${issue}`));
  const overall = reports.every((report) => report.status === 'COMPLETE')
    ? 'COMPLETE'
    : reports.some((report) => report.status === 'PARTIAL')
      ? 'PARTIAL'
      : 'FAILED';

  return {
    overall,
    reportCount: reports.length,
    tickers: reports.map((report) => report.ticker),
    issues,
    reports,
  };
};

const buildTemplate = (ticker) => {
  const today = new Date().toISOString().slice(0, 10);
  const symbol = ticker || 'TICKER';
  return `## MINERVA_REPORT
### Ticker: ${symbol}
### Date: ${today}
### Source: combined from: claude, chatgpt, gemini

## NARRATIVE
[Synthesize the multi-model research into one coherent thesis.]

## DECISION
| Field | Value |
|-------|-------|
| Verdict | NEUTRAL |
| Conviction | 3 |
| Action | WATCH |
| Entry Low | $0.00 |
| Entry High | $0.00 |
| Stop Loss | $0.00 |
| Stop Basis | [Why this stop invalidates the setup] |
| Target | $0.00 |
| Target Basis | [Why this target is realistic] |
| Timeframe | [e.g. 1-3 weeks] |
| R:R Ratio | 0.0:1 |
| Position Size | [Standard / Half / None] |
| Summary | [One-sentence decision summary] |

## CATALYSTS
| Date | Ticker | Category | Title | Amount_USD | Binding_Status | Significance | Source |
|------|--------|----------|-------|------------|----------------|-------------|--------|
| ${today} | ${symbol} | OTHER | [Catalyst title] | 0 | ANNOUNCED | 3 | [Source] |

## PRICE_DATA
| Metric | Value |
|--------|-------|
| Close | $0.00 |
| Change % | 0.0% |
| Volume vs Avg | 1.0x |
| 50-day MA | $0.00 |
| 200-day MA | $0.00 |
| Support 1 | $0.00 |
| Resistance 1 | $0.00 |
| ATR(14) | $0.00 |
| Weinstein Stage | 1 |
| Momentum | STEADY |
| Relative Strength | INLINE |
| Key Level Note | [Most important level to watch] |

## EVENTS
| Date | Ticker | Type | Description | Impact | Bull_Case | Bear_Case | Source |
|------|--------|------|-------------|--------|-----------|-----------|--------|
| ${today} | ${symbol} | [EVENT_TYPE] | [Event description] | MEDIUM | [Bull case] | [Bear case] | [Source] |

## OPTIONS
| Ticker | Type | Strike | Expiry | Volume | OI | Notes |
|--------|------|--------|--------|--------|----|-------|
| ${symbol} | CALL | 0 | ${today} | 0 | 0 | No options data available |

## TRIPWIRES
| Type | Description |
|------|-------------|
| INVALIDATES | [What kills the thesis] |
| CONFIRMS | [What increases conviction] |
| WATCH | [What to monitor next] |

## NOTES
[Extra observations, risks, or unresolved conflicts.]`;
};

const toneForStatus = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'COMPLETE') return 'positive';
  if (normalized === 'PARTIAL') return 'warning';
  if (normalized === 'FAILED') return 'danger';
  return 'neutral';
};

export default function AnalysisWorkspace({ api, stocks = [], onIngestComplete }) {
  const formatResource = useAsyncResource((signal) => api.getMinervaFormat({ signal }), []);
  const stockKey = useMemo(() => stocks.map((stock) => stock.ticker).sort().join(','), [stocks]);
  const [rawText, setRawText] = useState('');
  const [state, setState] = useState({ status: 'idle', error: null });
  const [result, setResult] = useState(null);
  const [validation, setValidation] = useState(null);
  const [lastValidatedText, setLastValidatedText] = useState('');
  const [selectedTicker, setSelectedTicker] = useState(stocks[0]?.ticker || 'MP');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [dropActive, setDropActive] = useState(false);
  const [dragCounter, setDragCounter] = useState(0);
  const [historyRefreshToken, setHistoryRefreshToken] = useState(0);
  const [viewerState, setViewerState] = useState(null);
  const fileInputRef = useRef(null);
  const busy = state.status === 'loading' || state.status === 'validating';

  useEffect(() => {
    const interval = setInterval(() => {
      setHistoryRefreshToken((current) => current + 1);
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!stocks.length) return;
    if (stocks.some((stock) => stock.ticker === selectedTicker)) return;
    setSelectedTicker(stocks[0].ticker);
  }, [selectedTicker, stocks]);

  const historyResource = useAsyncResource(async (signal) => {
    if (!stockKey) return [];
    const results = await Promise.allSettled(
      stocks.map((stock) => api.getAnalysisTrail(stock.ticker, { limit: 3, signal }))
    );
    return results
      .flatMap((result) => (result.status === 'fulfilled' ? result.value : []))
      .sort((left, right) => new Date(right.started_at || 0).getTime() - new Date(left.started_at || 0).getTime())
      .slice(0, 12);
  }, [api, stockKey, historyRefreshToken]);

  const knownTickers = useMemo(() => stocks.map((stock) => stock.ticker).join(', ') || 'No tracked stocks yet', [stocks]);
  const needsRevalidation = rawText.trim() && rawText !== lastValidatedText;
  const latestItems = useMemo(() => {
    const currentReports = result?.reports?.map((report) => ({
      ...report,
      summary: report.summary || report.one_line_summary,
      started_at: new Date().toISOString(),
      status: 'INGESTED',
      raw_report: rawText,
      changed_since_last_analysis: false,
    })) || [];
    const deduped = [...currentReports, ...(historyResource.data || [])];
    const seen = new Set();
    return deduped.filter((item) => {
      const key = `${item.run_id}-${item.ticker}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    }).slice(0, 12);
  }, [historyResource.data, rawText, result]);

  const readFile = async (file) => {
    if (!file) return;
    try {
      const text = await file.text();
      setRawText(text);
      setUploadedFileName(file.name);
      setState({ status: 'idle', error: null });
    } catch (error) {
      setState({ status: 'error', error: error.message || 'Failed to read the file.' });
    }
  };

  const openDocument = ({ title, subtitle, content, status, badges }) => {
    setViewerState({ title, subtitle, content, status, badges });
  };

  return (
    <div className="space-y-6">
      <div className="grid gap-6 xl:grid-cols-[1.25fr,0.9fr,1fr]">
        <PageSection
          title="Report input"
          subtitle="Paste, drop, or upload the MINERVA markdown document. Template autofill gives you the exact section scaffold before you send anything to the backend."
        >
          <form
            className="space-y-4"
            aria-busy={state.status === 'loading'}
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
                setHistoryRefreshToken((current) => current + 1);
                setState({ status: 'success', error: null });
              } catch (error) {
                setState({ status: 'error', error: error.message });
              }
            }}
          >
            <div className="grid gap-3 md:grid-cols-[minmax(0,1fr),auto,auto,auto,auto]">
              <Select value={selectedTicker} disabled={busy} onChange={(event) => setSelectedTicker(event.target.value)}>
                {(stocks.length ? stocks : [{ ticker: 'MP' }]).map((stock) => (
                  <option key={stock.ticker} value={stock.ticker}>
                    {stock.ticker}
                  </option>
                ))}
              </Select>
              <Button type="button" disabled={busy} onClick={() => setRawText(buildTemplate(selectedTicker))}>
                Autofill template
              </Button>
              <Button type="button" disabled={busy} onClick={() => setRawText(sampleReport)}>
                Load sample
              </Button>
              <Button type="button" disabled={busy} onClick={() => fileInputRef.current?.click()}>
                Upload file
              </Button>
              <Button
                type="button"
                disabled={busy || (!rawText && !result && !validation)}
                onClick={() => {
                  setRawText('');
                  setUploadedFileName('');
                  setResult(null);
                  setValidation(null);
                  setLastValidatedText('');
                  setState({ status: 'idle', error: null });
                }}
              >
                Clear
              </Button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept=".md,.markdown,.txt,text/markdown,text/plain"
              className="hidden"
              disabled={busy}
              onChange={(event) => readFile(event.target.files?.[0])}
            />

            <div
              className={`rounded-[30px] border border-dashed p-3 transition ${dropActive ? 'border-sky-300/45 bg-sky-300/10' : 'border-white/10 bg-white/[0.03]'}`}
              onDragOver={(event) => {
                event.preventDefault();
                setDropActive(true);
              }}
              onDragEnter={(event) => {
                event.preventDefault();
                setDragCounter((prev) => prev + 1);
                setDropActive(true);
              }}
              onDragLeave={(event) => {
                event.preventDefault();
                setDragCounter((prev) => {
                  const next = Math.max(0, prev - 1);
                  if (next === 0) setDropActive(false);
                  return next;
                });
              }}
              onDrop={(event) => {
                event.preventDefault();
                setDragCounter(0);
                setDropActive(false);
                const file = event.dataTransfer.files?.[0];
                readFile(file);
              }}
            >
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2 px-1">
                <div className="text-sm leading-6 text-slate-300">
                  Known tracked tickers: <span className="font-medium text-white">{knownTickers}</span>
                </div>
                <div className="text-xs uppercase tracking-[0.18em] text-slate-400">
                  {uploadedFileName ? `Loaded ${uploadedFileName}` : 'Drop markdown here'}
                </div>
              </div>
              <TextArea
                value={rawText}
                disabled={busy}
                onChange={(event) => setRawText(event.target.value)}
                placeholder="Paste the full MINERVA markdown document here."
                className="min-h-[420px] border-0 bg-transparent px-2 py-2"
                required
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                {needsRevalidation ? <Badge tone="warning">Draft changed since last validate</Badge> : null}
                {validation ? <Badge tone={toneForStatus(validation.overall)}>{validation.overall}</Badge> : null}
                {result ? <Badge tone={toneForStatus(result.parse_status)}>{result.parse_status}</Badge> : null}
              </div>
              <div className="flex flex-wrap gap-2">
                <Button
                  type="button"
                  disabled={busy || !rawText.trim()}
                  onClick={async () => {
                    setState({ status: 'validating', error: null });
                    try {
                      const nextValidation = api.validateMinervaReport
                        ? await api.validateMinervaReport({
                            raw_text: rawText,
                            mode: 'DELTA',
                            source_model: 'manual-frontier',
                          })
                        : validateRawText(rawText);
                      setValidation(nextValidation);
                      setLastValidatedText(rawText);
                      setState({ status: 'idle', error: null });
                    } catch (error) {
                      setState({ status: 'error', error: error.message || 'Validation failed.' });
                    }
                  }}
                >
                  {state.status === 'validating' ? 'Validating…' : 'Validate'}
                </Button>
                <Button type="submit" tone="primary" disabled={busy || !rawText.trim()}>
                  {state.status === 'loading' ? 'Ingesting…' : 'Ingest report'}
                </Button>
              </div>
            </div>
            {state.error ? <div className="text-sm text-rose-200">{state.error}</div> : null}
          </form>
        </PageSection>

        <PageSection
          title="Validation & reference"
          subtitle="Run validation before ingest to catch missing sections and decision fields. Open the full contract when you need the exact prompt/parser spec."
          action={formatResource.data ? (
            <Button
              type="button"
              onClick={() => openDocument({
                title: 'MINERVA format contract',
                subtitle: 'Full command and format specification returned by the backend.',
                content: `${formatResource.data.command_text}\n\n---\n\n${formatResource.data.spec_text}`,
              })}
            >
              Open full spec
            </Button>
          ) : null}
        >
          <article className="space-y-4 rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
            <div className="space-y-2">
              <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Quick format reference</div>
              <div className="space-y-2 text-sm leading-6 text-slate-300">
                {QUICK_REFERENCE.map((item) => (
                  <div key={item}>{item}</div>
                ))}
              </div>
            </div>
            <div className="rounded-3xl border border-white/10 bg-[#02070d] px-4 py-4">
              <div className="mb-3 text-xs uppercase tracking-[0.2em] text-slate-400">Decision fields</div>
              <div className="flex flex-wrap gap-2">
                {REQUIRED_DECISION_FIELDS.map((field) => (
                  <Badge key={field} tone="info">{field}</Badge>
                ))}
              </div>
            </div>
          </article>

          {validation ? (
            <article className="space-y-4 rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-white">Validation result</div>
                <Badge tone={toneForStatus(validation.overall || validation.parse_status)}>{validation.overall || validation.parse_status}</Badge>
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Reports found</div>
                  <div className="mt-2 text-2xl font-semibold text-white">{validation.reportCount || validation.report_count || 0}</div>
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                  <div className="text-xs uppercase tracking-[0.2em] text-slate-400">Tickers</div>
                  <div className="mt-2 text-sm font-semibold text-white">{(validation.tickers || validation.scope || []).join(', ') || 'None'}</div>
                </div>
              </div>
              <div className="space-y-3">
                {(validation.reports || []).map((report, index) => (
                  <article key={`${report.ticker}-${index}`} className="rounded-2xl border border-white/10 bg-white/5 px-4 py-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="text-sm font-semibold text-white">{report.ticker}</div>
                      <Badge tone={toneForStatus(report.status || report.parse_status)}>{report.status || report.parse_status}</Badge>
                    </div>
                    <div className="mt-2 text-sm leading-6 text-slate-300">
                      {(report.issues || report.missing_sections || report.empty_sections)?.length
                        ? [
                            ...(report.issues || []),
                            ...((report.missing_sections || []).map((item) => `Missing section: ${item}`)),
                            ...((report.empty_sections || []).map((item) => `Empty section: ${item}`)),
                          ].join(' • ')
                        : 'Structure looks ready for ingest.'}
                    </div>
                  </article>
                ))}
              </div>
            </article>
          ) : (
            <EmptyState
              title="No validation run yet"
              description="Use Validate to check report count, required sections, and DECISION fields before ingest."
            />
          )}
        </PageSection>

        <PageSection
          title="Recent ingests"
          subtitle="Latest report runs across tracked stocks, with parse status and direct raw-document access."
        >
          {result ? (
            <article className="mb-4 space-y-3 rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-white">Latest ingest</div>
                <Badge tone={toneForStatus(result.parse_status)}>{result.parse_status}</Badge>
              </div>
              <div className="text-sm leading-6 text-slate-300">
                Extraction {result.extraction_id} finished at {asDateTime(new Date())}. Generated {result.reports.length} run(s).
              </div>
              <div className="flex flex-wrap gap-2">
                {result.reports.map((report) => (
                  <Badge key={report.run_id} tone={toneForStatus(report.parse_status)}>
                    {report.ticker}: {report.parse_status}
                  </Badge>
                ))}
              </div>
              <div>
                <Button
                  type="button"
                  onClick={() => openDocument({
                    title: 'Latest MINERVA report',
                    subtitle: 'Raw document submitted from the Analysis Workspace.',
                    content: rawText,
                    status: result.parse_status,
                    badges: [{ value: `Extraction ${result.extraction_id}` }],
                  })}
                >
                  View latest raw report
                </Button>
              </div>
            </article>
          ) : null}

          <ExtractionList
            items={latestItems}
            loading={historyResource.status === 'loading' || historyResource.status === 'idle'}
            error={historyResource.status === 'error' ? historyResource.error : null}
            emptyDescription="Ingest a report to populate the recent-run history."
            onOpenRaw={(item) => openDocument({
              title: `${item.ticker} raw MINERVA report`,
              subtitle: `${item.run_id} • ${asDateTime(item.started_at)}`,
              content: item.raw_report,
              status: item.parse_status,
              badges: [
                { value: item.action || 'No action' },
                { value: item.verdict || 'No verdict' },
              ],
            })}
          />
        </PageSection>
      </div>

      {result ? (
        <PageSection
          title="Ingest result"
          subtitle={`Extraction ${result.extraction_id} finished with ${result.parse_status}. Review the storage outcomes before moving back to the stock workspace.`}
          action={<Badge tone={toneForStatus(result.parse_status)}>{result.parse_status}</Badge>}
        >
          <div className="grid gap-4 xl:grid-cols-2">
            {result.reports.map((report) => (
              <article key={report.run_id} className="rounded-[26px] border border-white/10 bg-white/[0.035] p-5">
                <div className="flex flex-wrap items-center gap-2">
                  <div className="text-lg font-semibold text-white">{report.ticker}</div>
                  <Badge tone={toneForStatus(report.parse_status)}>{report.parse_status}</Badge>
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
                <div className="mt-4 flex flex-wrap gap-2">
                  <Button
                    type="button"
                    onClick={() => openDocument({
                      title: `${report.ticker} submitted report`,
                      subtitle: `Run ${report.run_id}`,
                      content: rawText,
                      status: report.parse_status,
                    })}
                  >
                    View raw
                  </Button>
                  <Button type="button" tone="primary" onClick={() => { window.location.hash = `#/stocks/${report.ticker}`; }}>
                    Open stock
                  </Button>
                </div>
              </article>
            ))}
          </div>
        </PageSection>
      ) : null}

      <RawDocumentViewer
        open={Boolean(viewerState)}
        title={viewerState?.title}
        subtitle={viewerState?.subtitle}
        content={viewerState?.content}
        status={viewerState?.status}
        badges={viewerState?.badges}
        onClose={() => setViewerState(null)}
      />
    </div>
  );
}
