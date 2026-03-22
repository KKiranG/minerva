import React, { useEffect, useMemo, useState } from 'react';
import { api, seedUniverse } from './api';
import { asDateTime, formatTickerLabel } from './utils/formatters';
import Overview from './pages/Overview';
import StockDetail from './pages/StockDetail';
import AnalysisWorkspace from './pages/AnalysisWorkspace';
import CatalystTracker from './pages/CatalystTracker';
import TradingJournal from './pages/TradingJournal';
import ResearchVault from './pages/ResearchVault';
import EventCalendar from './pages/EventCalendar';
import { Badge } from './components/Common';
import useAsyncResource from './hooks/useAsyncResource';

const DEFAULT_TICKER = 'MP';

const NAV = [
  { label: 'Overview', hash: '#/overview' },
  { label: 'Analysis', hash: '#/analysis' },
  { label: 'Catalysts', hash: '#/catalysts' },
  { label: 'Journal', hash: '#/journal' },
  { label: 'Research', hash: '#/research' },
  { label: 'Calendar', hash: '#/calendar' }
];

const parseRoute = () => {
  const hash = window.location.hash || '';
  const path = hash.replace(/^#\/?/, '/');
  const segments = path.split('/').filter(Boolean);
  if (!segments.length) return { page: 'stock', ticker: DEFAULT_TICKER };
  if (segments[0] === 'overview') return { page: 'overview' };
  if (segments[0] === 'analysis') return { page: 'analysis' };
  if (segments[0] === 'catalysts') return { page: 'catalysts' };
  if (segments[0] === 'journal') return { page: 'journal' };
  if (segments[0] === 'research') return { page: 'research' };
  if (segments[0] === 'calendar') return { page: 'calendar' };
  if (segments[0] === 'stocks' && segments[1]) return { page: 'stock', ticker: segments[1].toUpperCase() };
  return { page: 'stock', ticker: DEFAULT_TICKER };
};

const useRoute = () => {
  const [route, setRoute] = useState(parseRoute);
  useEffect(() => {
    if (!window.location.hash) {
      window.location.hash = `#/stocks/${DEFAULT_TICKER}`;
    }
    const onHashChange = () => setRoute(parseRoute());
    window.addEventListener('hashchange', onHashChange);
    return () => window.removeEventListener('hashchange', onHashChange);
  }, []);
  return route;
};

const TopBar = ({ route, selectedStock }) => (
  <header className="topbar">
    <div className="topbar-copy">
      <div className="muted">
        {route.page === 'stock'
          ? 'Ticker workspace'
          : route.page.charAt(0).toUpperCase() + route.page.slice(1)}
      </div>
      <strong>
        {selectedStock ? formatTickerLabel(selectedStock.ticker, selectedStock.company_name) : 'MINERVA'}
      </strong>
      <div className="helper-text">{asDateTime(new Date())}</div>
    </div>
    <div className="topbar-actions">
      <input className="toolbar-input" placeholder="Search symbols, catalysts, or notes" aria-label="Search" />
      <button className="button">Import</button>
      <button className="button button-primary">New idea</button>
    </div>
  </header>
);

const Sidebar = ({ route, stocks }) => (
  <aside className="sidebar">
    <div className="brand">
      <div className="brand-mark" />
      <div className="brand-copy">
        <h1>MINERVA</h1>
        <p>Critical minerals decision desk</p>
      </div>
    </div>

    <nav className="nav-group" aria-label="Primary">
      {NAV.map((item) => (
        <a key={item.hash} href={item.hash} className={`nav-link ${route.page === item.label.toLowerCase() ? 'active' : ''}`}>
          <span>{item.label}</span>
          <span className="muted">&gt;</span>
        </a>
      ))}
    </nav>

    <div className="sidebar-footer stack">
      <div className="row">
        <strong>Seeded tickers</strong>
        <Badge tone="positive">{stocks.length || 0}</Badge>
      </div>
      <div className="ticker-chip-row">
        {(stocks.length ? stocks : seedUniverse).map((stock) => (
          <a key={stock.ticker} className={`ticker-chip ${route.page === 'stock' && route.ticker === stock.ticker ? 'active' : ''}`} href={`#/stocks/${stock.ticker}`}>
            <span>{stock.ticker}</span>
            {stock.company_name ? <span className="muted">{stock.company_name}</span> : null}
          </a>
        ))}
      </div>
      <p className="helper-text">Real backend first, mock fallback only when fetch fails.</p>
    </div>
  </aside>
);

const Shell = ({ route, stocks, children, selectedStock }) => (
  <div className="app-shell">
    <Sidebar route={route} stocks={stocks} />
    <main className="content">
      <TopBar route={route} selectedStock={selectedStock} />
      <div className="workspace">{children}</div>
    </main>
  </div>
);

const pageForRoute = (route, stocks) => {
  switch (route.page) {
    case 'overview':
      return <Overview api={api} stocks={stocks} />;
    case 'analysis':
      return <AnalysisWorkspace api={api} stocks={stocks} />;
    case 'catalysts':
      return <CatalystTracker api={api} stocks={stocks} />;
    case 'journal':
      return <TradingJournal api={api} stocks={stocks} />;
    case 'research':
      return <ResearchVault api={api} stocks={stocks} />;
    case 'calendar':
      return <EventCalendar api={api} stocks={stocks} />;
    case 'stock':
    default:
      return <StockDetail api={api} ticker={route.ticker} stocks={stocks} />;
  }
};

export default function App() {
  const route = useRoute();
  const stocksState = useAsyncResource(() => api.listStocks(), []);
  const stocks = stocksState.data || [];
  const universe = stocks.length ? stocks : seedUniverse;
  const selectedStock = route.page === 'stock' ? universe.find((stock) => stock.ticker === route.ticker) : null;
  const page = useMemo(() => pageForRoute(route, universe), [route, universe]);

  return <Shell route={route} stocks={universe} selectedStock={selectedStock}>{page}</Shell>;
}
