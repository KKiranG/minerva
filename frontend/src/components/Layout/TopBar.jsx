import React, { useEffect, useState } from 'react';
import { api } from '../../api';
import { Button } from '../Common';
import SearchBox from './SearchBox';
import { asDateTime, formatTickerLabel } from '../../utils/formatters';
import { navigate } from '../../utils/navigation';

export default function TopBar({ route, selectedStock, onOpenIdea, onMenuClick }) {
  const [health, setHealth] = useState(true);
  const [theme, setTheme] = useState(() => document.body.classList.contains('theme-light') ? 'light' : 'dark');

  const toggleTheme = () => {
    if (theme === 'dark') {
      document.body.classList.add('theme-light');
      setTheme('light');
    } else {
      document.body.classList.remove('theme-light');
      setTheme('dark');
    }
  };

  useEffect(() => {
    let active = true;
    const check = async () => {
      try {
        await api.getHealth();
        if (active) setHealth(true);
      } catch {
        if (active) setHealth(false);
      }
    };
    check();
    const interval = setInterval(check, 15000);
    return () => {
      active = false;
      clearInterval(interval);
    };
  }, []);

  return (
    <header className="sticky top-0 z-20 flex flex-col gap-4 rounded-[28px] border border-white/10 bg-[#07121d]/88 px-5 py-4 shadow-[0_18px_45px_rgba(0,0,0,0.24)] backdrop-blur md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-4">
        {onMenuClick && (
          <button type="button" onClick={onMenuClick} className="xl:hidden p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/10 transition">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
        )}
        <div className="space-y-1">
          <div className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
            {route.page === 'stock' ? 'Ticker workspace' : route.page}
          </div>
          <div className="text-2xl font-semibold tracking-tight text-white flex items-center">
            {selectedStock ? formatTickerLabel(selectedStock.ticker, selectedStock.company_name) : 'MINERVA'}
            <div title={health ? 'Synthesizer Backend Live' : 'Backend Disconnected'} className={`ml-4 space-x-1.5 flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider transition-colors duration-500 ${health ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-rose-500/30 bg-rose-500/10 text-rose-400'}`}>
              <span className={`h-1.5 w-1.5 rounded-full ${health ? 'bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(52,211,153,0.8)]' : 'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.8)]'}`} />
              <span>{health ? 'Live' : 'Offline'}</span>
            </div>
          </div>
          <div className="text-sm text-slate-400">{asDateTime(new Date())}</div>
        </div>
      </div>
      <div className="flex flex-col gap-3 md:w-[60%] md:flex-row md:items-center md:justify-end">
        <button type="button" onClick={toggleTheme} className="p-2 text-slate-400 hover:text-white bg-white/5 rounded-xl border border-white/10 transition" title="Toggle Light/Dark Theme">
          {theme === 'dark' ? (
             <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" /></svg>
          ) : (
             <svg className="w-5 h-5 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" /></svg>
          )}
        </button>
        <SearchBox />
        <Button type="button" onClick={() => navigate('#/analysis')}>Import</Button>
        <Button type="button" tone="primary" onClick={onOpenIdea}>New idea</Button>
      </div>
    </header>
  );
}
