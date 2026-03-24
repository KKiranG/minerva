import React, { useEffect, useMemo, useState } from 'react';
import { api, mockEnabled, starterUniverse } from './api';
import Overview from './pages/Overview';
import StockDetail from './pages/StockDetail';
import AnalysisWorkspace from './pages/AnalysisWorkspace';
import CatalystTracker from './pages/CatalystTracker';
import TradingJournal from './pages/TradingJournal';
import ResearchVault from './pages/ResearchVault';
import EventCalendar from './pages/EventCalendar';
import useAsyncResource from './hooks/useAsyncResource';
import { Badge, Button, EmptyState, TextInput } from './components/Common';
import { appShellStyle } from './utils/colors';
import { asDateTime, formatTickerLabel } from './utils/formatters';

const NAV = [
  { label: 'Overview', hash: '#/overview' },
  { label: 'Analysis', hash: '#/analysis' },
  { label: 'Catalysts', hash: '#/catalysts' },
  { label: 'Research', hash: '#/research' },
  { label: 'Calendar', hash: '#/calendar' },
  { label: 'Journal', hash: '#/journal' },
];

const parseRoute = () => {
  const rawHash = window.location.hash || '#/overview';
  const hash = rawHash.replace(/^#/, '');
  const [path, queryString = ''] = hash.split('?');
  const params = new URLSearchParams(queryString);
  const segments = path.replace(/^\/+/, '').split('/').filter(Boolean);
  if (!segments.length || segments[0] === 'overview') return { page: 'overview', params };
  if (segments[0] === 'analysis') return { page: 'analysis', params };
  if (segments[0] === 'catalysts') return { page: 'catalysts', params };
  if (segments[0] === 'research') return { page: 'research', params };
  if (segments[0] === 'calendar') return { page: 'calendar', params };
  if (segments[0] === 'journal') return { page: 'journal', params };
  if (segments[0] === 'stocks' && segments[1]) return { page: 'stock', ticker: segments[1].toUpperCase(), params };
  return { page: 'overview', params };
};

const navigate = (hash) => {
  window.location.hash = hash;
};

const useRoute = () => {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    if (!window.location.hash) navigate('#/overview');
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
};

function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      setOpen(false);
      return undefined;
    }
    const controller = new AbortController();
    const timeout = setTimeout(async () => {
      setLoading(true);
      try {
        const payload = await api.search({ q: query.trim(), limit: 8, signal: controller.signal });
        setResults(payload.results || []);
        setOpen(true);
      } catch {
        setResults([]);
        setOpen(true);
      } finally {
        setLoading(false);
      }
    }, 180);
    return () => {
      clearTimeout(timeout);
      controller.abort();
    };
  }, [query]);

  return (
    <div className="relative w-full max-w-xl">
      <TextInput
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search tickers, catalysts, or notes"
        aria-label="Search"
        onFocus={() => setOpen(Boolean(results.length))}
      />
      {open ? (
        <div className="absolute left-0 right-0 top-[calc(100%+0.5rem)] z-30 overflow-hidden rounded-3xl border border-white/10 bg-[#06101a]/95 shadow-[0_24px_60px_rgba(0,0,0,0.35)] backdrop-blur">
          {loading ? (
            <div className="px-4 py-3 text-sm text-slate-300">Searching…</div>
          ) : results.length ? (
            results.map((result) => (
              <button
                key={`${result.type}-${result.id || result.ticker}-${result.title}`}
                className="flex w-full items-start justify-between gap-4 border-b border-white/5 px-4 py-3 text-left transition hover:bg-white/5"
                type="button"
                onClick={() => {
                  navigate(result.href);
                  setOpen(false);
                  setQuery('');
                }}
              >
                <div className="space-y-1">
                  <div className="text-sm font-semibold text-white">{result.title}</div>
                  {result.subtitle ? <div className="text-xs uppercase tracking-[0.18em] text-slate-400">{result.subtitle}</div> : null}
                </div>
                <Badge tone="info">{result.type}</Badge>
              </button>
            ))
          ) : (
            <div className="px-4 py-3 text-sm text-slate-300">No matches found.</div>
          )}
        </div>
      ) : null}
    </div>
  );
}

function NewIdeaModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    ticker: '',
    company_name: '',
    primary_mineral: '',
    value_chain_stage: '',
    country: '',
  });
  const [state, setState] = useState({ status: 'idle', error: null });

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div className="w-full max-w-xl rounded-[30px] border border-white/10 bg-[#07121d] p-6 shadow-[0_30px_80px_rgba(0,0,0,0.45)]">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div className="space-y-1">
            <h2 className="text-xl font-semibold text-white">Create tracked stock</h2>
            <p className="text-sm leading-6 text-slate-300">This replaces the old dead “New idea” button with a real tracked-stock workflow.</p>
          </div>
          <Button type="button" onClick={onClose}>Close</Button>
        </div>
        <form
          className="space-y-3"
          onSubmit={async (event) => {
            event.preventDefault();
            setState({ status: 'loading', error: null });
            try {
              const created = await api.createStock({
                ...form,
                ticker: form.ticker.toUpperCase(),
                secondary_minerals: [],
              });
              setState({ status: 'success', error: null });
              onCreated(created);
              setForm({ ticker: '', company_name: '', primary_mineral: '', value_chain_stage: '', country: '' });
            } catch (error) {
              setState({ status: 'error', error: error.message });
            }
          }}
        >
          <div className="grid gap-3 md:grid-cols-2">
            <TextInput placeholder="Ticker" value={form.ticker} onChange={(event) => setForm((current) => ({ ...current, ticker: event.target.value }))} required />
            <TextInput placeholder="Company name" value={form.company_name} onChange={(event) => setForm((current) => ({ ...current, company_name: event.target.value }))} required />
            <TextInput placeholder="Primary mineral" value={form.primary_mineral} onChange={(event) => setForm((current) => ({ ...current, primary_mineral: event.target.value }))} />
            <TextInput placeholder="Value-chain stage" value={form.value_chain_stage} onChange={(event) => setForm((current) => ({ ...current, value_chain_stage: event.target.value }))} />
            <TextInput placeholder="Country" value={form.country} onChange={(event) => setForm((current) => ({ ...current, country: event.target.value }))} />
          </div>
          {state.error ? <div className="text-sm text-rose-200">{state.error}</div> : null}
          <div className="flex justify-end">
            <Button type="submit" tone="primary" disabled={state.status === 'loading'}>
              {state.status === 'loading' ? 'Creating…' : 'Create stock'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

function TopBar({ route, selectedStock, onOpenIdea }) {
  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#07121d]/88 px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="space-y-1">
        <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
          {route.page === 'stock' ? 'Ticker workspace' : route.page}
        </div>
        <div className="text-2xl font-semibold tracking-tight text-white">
          {selectedStock ? formatTickerLabel(selectedStock.ticker, selectedStock.company_name) : 'MINERVA'}
        </div>
        <div className="text-sm text-slate-400">{asDateTime(new Date())}</div>
      </div>
      <div className="flex flex-col gap-3 md:w-[60%] md:flex-row md:items-center md:justify-end">
        <SearchBox />
        <Button type="button" onClick={() => navigate('#/analysis')}>Import</Button>
        <Button type="button" tone="primary" onClick={onOpenIdea}>New idea</Button>
      </div>
    </header>
  );
}

function Sidebar({ route, stocks }) {
  return (
    <aside className="space-y-5 rounded-[30px] border border-white/10 bg-[#07121d]/88 p-5 shadow-[0_24px_60px_rgba(0,0,0,0.22)] backdrop-blur">
      <div className="space-y-2">
        <div className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 text-sm font-semibold tracking-[0.24em] text-sky-100">
          M
        </div>
        <div>
          <h1 className="text-2xl font-semibold tracking-tight text-white">MINERVA</h1>
          <p className="text-sm leading-6 text-slate-300">Frontier-first intelligence desk for critical-minerals equities.</p>
        </div>
      </div>

      <nav className="space-y-2" aria-label="Primary">
        {NAV.map((item) => {
          const active = route.page === item.label.toLowerCase();
          return (
            <a
              key={item.hash}
              href={item.hash}
              className={`flex items-center justify-between rounded-2xl border px-4 py-3 text-sm transition ${active ? 'border-sky-300/25 bg-sky-300/10 text-white' : 'border-white/5 bg-white/[0.03] text-slate-300 hover:bg-white/5'}`}
            >
              <span>{item.label}</span>
              <span className="text-slate-500">{'>'}</span>
            </a>
          );
        })}
      </nav>

      <div className="space-y-3 rounded-[24px] border border-white/10 bg-white/[0.035] p-4">
        <div className="flex items-center justify-between">
          <div className="text-xs uppercase tracking-[0.22em] text-slate-400">Tracked stocks</div>
          <Badge tone="info">{stocks.length}</Badge>
        </div>
        {stocks.length ? (
          <div className="space-y-2">
            {stocks.slice(0, 14).map((stock) => (
              <a
                key={stock.ticker}
                href={`#/stocks/${stock.ticker}`}
                className={`flex items-center justify-between rounded-2xl border px-3 py-2.5 text-sm transition ${route.page === 'stock' && route.ticker === stock.ticker ? 'border-sky-300/25 bg-sky-300/10 text-white' : 'border-white/5 bg-white/[0.03] text-slate-300 hover:bg-white/5'}`}
              >
                <span>{stock.ticker}</span>
                <span className="truncate pl-3 text-xs uppercase tracking-[0.18em] text-slate-500">{stock.current_action || 'TRACKED'}</span>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState
            title="Database is empty"
            description="Run `python scripts/seed_stocks.py` or use New idea to create the first tracked stock. MINERVA no longer fills the UI with fake seed data by default."
          />
        )}
        {mockEnabled ? <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Mock fallback enabled by env flag.</div> : null}
      </div>
    </aside>
  );
}

function pageForRoute(route, stocks, onDataChanged) {
  switch (route.page) {
    case 'analysis':
      return <AnalysisWorkspace api={api} stocks={stocks} onIngestComplete={onDataChanged} />;
    case 'catalysts':
      return <CatalystTracker api={api} stocks={stocks} />;
    case 'research':
      return <ResearchVault api={api} stocks={stocks} />;
    case 'calendar':
      return <EventCalendar api={api} stocks={stocks} />;
    case 'journal':
      return <TradingJournal api={api} stocks={stocks} />;
    case 'stock':
      return <StockDetail api={api} ticker={route.ticker} stocks={stocks} params={route.params} />;
    case 'overview':
    default:
      return <Overview api={api} stocks={stocks} />;
  }
}

export default function App() {
  const route = useRoute();
  const [ideaOpen, setIdeaOpen] = useState(false);
  const stocksState = useAsyncResource((signal) => api.listStocks({ signal }), []);
  const stocks = stocksState.data || [];
  const selectedStock = route.page === 'stock' ? stocks.find((item) => item.ticker === route.ticker) : null;
  const page = useMemo(() => pageForRoute(route, stocks, stocksState.reload), [route, stocks, stocksState.reload]);

  return (
    <div className="min-h-screen p-4 md:p-6" style={appShellStyle}>
      <div className="mx-auto grid max-w-[1600px] gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        <Sidebar route={route} stocks={stocks} />
        <main className="space-y-6">
          <TopBar route={route} selectedStock={selectedStock} onOpenIdea={() => setIdeaOpen(true)} />
          {stocksState.status === 'loading' || stocksState.status === 'idle' ? null : page}
        </main>
      </div>
      <NewIdeaModal
        open={ideaOpen}
        onClose={() => setIdeaOpen(false)}
        onCreated={(stock) => {
          setIdeaOpen(false);
          stocksState.reload();
          navigate(`#/stocks/${stock.ticker}`);
        }}
      />
      {!stocks.length && stocksState.status === 'success' ? (
        <div className="mx-auto mt-6 max-w-[1600px] rounded-[28px] border border-white/10 bg-[#07121d]/88 p-5 text-sm leading-6 text-slate-300">
          Starter universe reference: {starterUniverse.map((item) => item.ticker).join(', ')}.
        </div>
      ) : null}
    </div>
  );
}
