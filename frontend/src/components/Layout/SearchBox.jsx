import React, { useState, useEffect, useRef } from 'react';
import { api } from '../../api';
import { Badge, TextInput } from '../Common';
import { navigate } from '../../utils/navigation';

export default function SearchBox() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (event) => {
      // Cmd+K or Ctrl+K
      if ((event.metaKey || event.ctrlKey) && event.key === 'k') {
        event.preventDefault();
        inputRef.current?.focus();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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
        ref={inputRef}
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
