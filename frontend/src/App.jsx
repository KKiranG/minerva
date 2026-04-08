import React, { useEffect, useMemo, useState } from 'react';
import { api, mockEnabled } from './api';
import { STARTER_UNIVERSE } from './utils/constants';
import Overview from './pages/Overview';
import StockDetail from './pages/StockDetail';
import AnalysisWorkspace from './pages/AnalysisWorkspace';
import AskMinerva from './pages/AskMinerva';
import CatalystTracker from './pages/CatalystTracker';
import TradingJournal from './pages/TradingJournal';
import ResearchVault from './pages/ResearchVault';
import EventCalendar from './pages/EventCalendar';
import useAsyncResource from './hooks/useAsyncResource';
import { Badge, Button, EmptyState, TextInput } from './components/Common';
import { appShellStyle } from './utils/colors';
import { asDateTime, formatTickerLabel } from './utils/formatters';
import { navigate } from './utils/navigation';
import Sidebar from './components/Layout/Sidebar';
import TopBar from './components/Layout/TopBar';
import ErrorBoundary from './components/ErrorBoundary';

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

function NewIdeaModal({ open, onClose, onCreated }) {
  const [form, setForm] = useState({
    ticker: '',
    company_name: '',
    primary_mineral: '',
    value_chain_stage: '',
    country: '',
  });
  const [state, setState] = useState({ status: 'idle', error: null });

  const handleTickerBlur = () => {
    if (!form.ticker) return;
    const term = form.ticker.trim().toUpperCase();
    const resolved = STARTER_UNIVERSE.find((u) => u.ticker === term);
    if (resolved && !form.company_name) {
      setForm((current) => ({ ...current, company_name: resolved.company_name }));
    }
  };

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
            <TextInput placeholder="Ticker" value={form.ticker} onChange={(event) => setForm((current) => ({ ...current, ticker: event.target.value.toUpperCase() }))} onBlur={handleTickerBlur} required />
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

function pageForRoute(route, stocks, onDataChanged) {
  switch (route.page) {
    case 'analysis':
      return <AnalysisWorkspace api={api} stocks={stocks} onIngestComplete={onDataChanged} />;
    case 'ask':
      return <AskMinerva api={api} />;
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
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState(false);
  const stocksState = useAsyncResource((signal) => api.listStocks({ signal }), []);
  const stocks = stocksState.data || [];
  const selectedStock = route.page === 'stock' ? stocks.find((item) => item.ticker === route.ticker) : null;
  const page = useMemo(() => pageForRoute(route, stocks, stocksState.reload), [route, stocks, stocksState.reload]);

  return (
    <div className="min-h-screen p-4 md:p-6" style={appShellStyle}>
      <div className="mx-auto grid max-w-[1600px] gap-6 xl:grid-cols-[300px_minmax(0,1fr)]">
        
        {/* Desktop Sidebar */}
        <div className="hidden xl:block">
          <Sidebar route={route} stocks={stocks} />
        </div>

        {/* Mobile Drawer Overlay */}
        {mobileDrawerOpen && (
          <div className="fixed inset-0 z-50 flex bg-black/80 backdrop-blur-sm xl:hidden">
            <div className="relative w-full max-w-sm shrink-0 overflow-y-auto bg-[#07121d] p-5 shadow-2xl animate-in slide-in-from-left-4">
              <Button type="button" className="absolute right-4 top-4" onClick={() => setMobileDrawerOpen(false)}>Close</Button>
              <Sidebar route={route} stocks={stocks} onNavigate={() => setMobileDrawerOpen(false)} />
            </div>
            <div className="flex-1" onClick={() => setMobileDrawerOpen(false)} />
          </div>
        )}

        <main className="space-y-6">
          <TopBar route={route} selectedStock={selectedStock} onOpenIdea={() => setIdeaOpen(true)} onMenuClick={() => setMobileDrawerOpen(true)} />
          <ErrorBoundary>
            {stocksState.status === 'loading' || stocksState.status === 'idle' ? null : page}
          </ErrorBoundary>
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
          Starter universe reference: {STARTER_UNIVERSE.map((item) => item.ticker).join(', ')}.
        </div>
      ) : null}
    </div>
  );
}
