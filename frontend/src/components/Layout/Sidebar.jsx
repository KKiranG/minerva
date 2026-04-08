import React from 'react';
import { Badge, EmptyState } from '../Common';
import { NAV } from '../../utils/navigation';
import { mockEnabled } from '../../api';

export default function Sidebar({ route, stocks, onNavigate }) {
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
              onClick={onNavigate}
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
                onClick={onNavigate}
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
            description="Run \`python scripts/seed_stocks.py\` or use New idea to create the first tracked stock. MINERVA no longer fills the UI with fake seed data by default."
          />
        )}
        {mockEnabled ? <div className="text-xs uppercase tracking-[0.18em] text-amber-200">Mock fallback enabled by env flag.</div> : null}
      </div>
    </aside>
  );
}
