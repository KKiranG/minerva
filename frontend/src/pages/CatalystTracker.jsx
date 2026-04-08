import React, { useMemo } from 'react';
import { Badge, Button, EmptyState, LoadingState, PageSection, Select, TimelineList } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import useLocalStorage from '../hooks/useLocalStorage';
import { asDate } from '../utils/formatters';

export default function CatalystTracker({ api, stocks = [] }) {
  const [ticker, setTicker] = useLocalStorage('minerva_catalyst_ticker', 'ALL');
  const [binding, setBinding] = useLocalStorage('minerva_catalyst_binding', 'ALL');
  const [sort, setSort] = useLocalStorage('minerva_catalyst_sort', 'significance_desc');
  const [minSignificance, setMinSignificance] = useLocalStorage('minerva_catalyst_minsig', '0');
  const [viewMode, setViewMode] = useLocalStorage('minerva_catalyst_view', 'list');

  const resource = useAsyncResource(
    (signal) => api.getCatalysts({ ticker: ticker === 'ALL' ? undefined : ticker, limit: 200, signal }),
    [ticker]
  );

  const filtered = useMemo(() => {
    const rows = resource.data || [];
    return rows
      .filter((row) => (binding === 'ALL' ? true : row.binding_status === binding))
      .filter((row) => {
        if (minSignificance === '0') return true;
        if (minSignificance === '5') return Number(row.significance) === 5;
        return Number(row.significance || 0) >= Number(minSignificance);
      })
      .sort((left, right) => {
        if (sort === 'date_asc') return String(left.date || '').localeCompare(String(right.date || ''));
        if (sort === 'date_desc') return String(right.date || '').localeCompare(String(left.date || ''));
        if (sort === 'binding') return String(left.binding_status || '').localeCompare(String(right.binding_status || ''));
        return Number(right.significance || 0) - Number(left.significance || 0);
      });
  }, [binding, minSignificance, resource.data, sort]);

  return (
    <PageSection
      title="Catalyst tracker"
      subtitle="Sort by significance or date, and filter by binding status so the material catalysts stop looking identical to the low-signal ones."
      action={
        <div className="flex flex-wrap gap-2">
          <Select value={ticker} onChange={(event) => setTicker(event.target.value)}>
            <option value="ALL">All tickers</option>
            {stocks.map((stock) => (
              <option key={stock.ticker} value={stock.ticker}>{stock.ticker}</option>
            ))}
          </Select>
          <Select value={binding} onChange={(event) => setBinding(event.target.value)}>
            <option value="ALL">All statuses</option>
            <option value="PROPOSED">PROPOSED</option>
            <option value="ANNOUNCED">ANNOUNCED</option>
            <option value="LOI_SIGNED">LOI_SIGNED</option>
            <option value="CONDITIONAL">CONDITIONAL</option>
            <option value="OBLIGATED">OBLIGATED</option>
            <option value="DISBURSING">DISBURSING</option>
            <option value="COMPLETED">COMPLETED</option>
            <option value="CANCELLED">CANCELLED</option>
          </Select>
          <Select value={minSignificance} onChange={(event) => setMinSignificance(event.target.value)}>
            <option value="0">All significance</option>
            <option value="4">4 and up</option>
            <option value="5">5 only</option>
          </Select>
          <Select value={sort} onChange={(event) => setSort(event.target.value)}>
            <option value="significance_desc">Highest significance</option>
            <option value="date_desc">Newest first</option>
            <option value="date_asc">Oldest first</option>
            <option value="binding">Binding status</option>
          </Select>
          <div className="w-[1px] bg-white/10" />
          <div className="flex bg-white/5 rounded-lg border border-white/10 overflow-hidden">
             <button type="button" onClick={() => setViewMode('list')} className={`px-4 py-1.5 text-xs font-semibold ${viewMode === 'list' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}>List</button>
             <button type="button" onClick={() => setViewMode('board')} className={`px-4 py-1.5 text-xs font-semibold border-l border-white/10 ${viewMode === 'board' ? 'bg-sky-500/20 text-sky-300' : 'text-slate-400 hover:text-white'}`}>Board</button>
          </div>
          <Button type="button" onClick={() => api.downloadCatalystsCsv({ ticker: ticker === 'ALL' ? undefined : ticker, binding_status: binding === 'ALL' ? undefined : binding, min_significance: minSignificance === '0' ? undefined : minSignificance })}>
            Export CSV
          </Button>
        </div>
      }
    >
      {resource.status === 'loading' || resource.status === 'idle' ? (
        <LoadingState type="timeline" items={4} />
      ) : resource.status === 'error' ? (
        <EmptyState title="Catalysts unavailable" description={resource.error} />
      ) : filtered.length ? (
        viewMode === 'list' ? (
          <TimelineList
            items={filtered.map((item) => ({
              id: item.id,
              title: item.title,
              badge: item.binding_status,
              badgeTone: Number(item.significance || 0) >= 4 ? 'warning' : 'neutral',
              meta: [
                <span key="ticker">{item.ticker}</span>,
                <span key="date">{asDate(item.date)}</span>,
                <span key="category">{item.category}</span>,
                <span key="significance">Significance {item.significance ?? '—'}</span>,
              ],
              body: item.description || 'No description stored.',
              footer: (
                <div className="flex flex-wrap gap-2">
                  {item.next_decision_point ? <Badge tone="info">{item.next_decision_point}</Badge> : null}
                  {item.priced_in ? <Badge tone="neutral">Priced in: {item.priced_in}</Badge> : null}
                </div>
              ),
            }))}
          />
        ) : (
          <div className="relative pt-12 pb-8 w-full overflow-x-auto min-h-[400px]">
            {/* Absolute center line mapping chronological horizon */}
            <div className="absolute top-[32px] left-0 h-[2px] w-[5000px] bg-gradient-to-r from-sky-500/20 via-sky-400/50 to-transparent" />
            <div className="flex gap-8 relative px-4 w-max">
               {filtered.map((item, index) => {
                 const isTop = index % 2 === 0;
                 return (
                   <div key={item.id} className="relative w-72 flex flex-col items-center">
                     {/* Connecting node point */}
                     <div className="absolute left-[calc(50%-6px)] top-[27px] w-3 h-3 rounded-full border-[3px] border-[#07121d] z-10 box-content transition-colors" style={{ backgroundColor: Number(item.significance || 0) >= 4 ? '#f43f5e' : '#38bdf8' }} />
                     
                     <div className={`w-full flex-col flex ${isTop ? '-mt-24' : 'mt-20'}`}>
                        <div className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(11,24,38,0.95),rgba(5,12,20,0.9))] p-5 shadow-xl transition-transform hover:-translate-y-1 hover:shadow-sky-500/10">
                           <div className="flex items-center justify-between mb-3">
                              <Badge tone="info">{item.ticker}</Badge>
                              <span className="text-xs font-semibold text-slate-400 tracking-wider uppercase">{asDate(item.date)}</span>
                           </div>
                           <h4 className="text-sm font-bold text-white mb-2 leading-snug">{item.title}</h4>
                           <div className="flex flex-wrap gap-2 mb-3">
                              <Badge tone={Number(item.significance || 0) >= 4 ? 'danger' : 'neutral'}>SIG {item.significance ?? '—'}</Badge>
                              <Badge tone="neutral">{item.binding_status}</Badge>
                           </div>
                           <p className="text-xs text-slate-400 leading-relaxed line-clamp-3">{item.description}</p>
                        </div>
                     </div>
                     {/* Connecting structural stem */}
                     <div className={`absolute left-1/2 w-[2px] bg-white/10 ${isTop ? 'top-[31px] h-20 -translate-y-[calc(100%-8px)]' : 'top-[31px] h-20 translate-y-2'}`} />
                   </div>
                 );
               })}
            </div>
          </div>
        )
      ) : (
        <EmptyState title="No catalysts match" description="Adjust the ticker, significance, or binding filters." />
      )}
    </PageSection>
  );
}
