import React, { useMemo, useState } from 'react';
import { EmptyState, ExpandableCard, PageSection, Select, LoadingState, Button } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';
import { asDate, asRelativeDate, countdownLabel, parseDate } from '../utils/formatters';

export default function EventCalendar({ api, stocks = [] }) {
  const [ticker, setTicker] = useState('ALL');
  const [currentDate, setCurrentDate] = useState(() => {
    const d = new Date();
    return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1));
  });

  const resource = useAsyncResource(
    (signal) => api.getEvents({ ticker: ticker === 'ALL' ? undefined : ticker, limit: 500, signal }),
    [ticker]
  );

  const events = useMemo(() => {
    return (resource.data || [])
      .slice()
      .sort((a, b) => (parseDate(a.date)?.getTime() || 0) - (parseDate(b.date)?.getTime() || 0));
  }, [resource.data]);

  const year = currentDate.getUTCFullYear();
  const month = currentDate.getUTCMonth();

  const prevMonth = () => setCurrentDate(new Date(Date.UTC(year, month - 1, 1)));
  const nextMonth = () => setCurrentDate(new Date(Date.UTC(year, month + 1, 1)));
  const todayMonth = () => {
    const d = new Date();
    setCurrentDate(new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), 1)));
  };

  const daysInMonth = new Date(Date.UTC(year, month + 1, 0)).getUTCDate();
  const startDayOfWeek = new Date(Date.UTC(year, month, 1)).getUTCDay(); // 0-6 (Sun-Sat)

  const monthLabels = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

  const buildCalendarGrid = () => {
    const grid = [];
    let dayCounter = 1;
    // 6 rows to cover maximum possible month overlap
    for (let r = 0; r < 6; r++) {
      const row = [];
      for (let c = 0; c < 7; c++) {
        if (r === 0 && c < startDayOfWeek) {
          row.push(null);
        } else if (dayCounter > daysInMonth) {
          row.push(null);
        } else {
          const cellDate = new Date(Date.UTC(year, month, dayCounter));
          const dayStr = cellDate.toISOString().split('T')[0];
          const todaysEvents = events.filter(e => {
            const eDate = parseDate(e.date);
            return eDate && eDate.toISOString().split('T')[0] === dayStr;
          });
          row.push({ day: dayCounter, date: cellDate, events: todaysEvents, dateStr: dayStr });
          dayCounter++;
        }
      }
      grid.push(row);
      if (dayCounter > daysInMonth) break;
    }
    return grid;
  };

  return (
    <PageSection
      title="Event calendar"
      subtitle="Interactive month-grid mapping event horizons across tracked entities."
      action={
        <div className="flex gap-2">
          <Select value={ticker} onChange={(event) => setTicker(event.target.value)}>
            <option value="ALL">All tickers</option>
            {stocks.map((stock) => <option key={stock.ticker} value={stock.ticker}>{stock.ticker}</option>)}
          </Select>
        </div>
      }
    >
      {resource.status === 'loading' || resource.status === 'idle' ? (
        <LoadingState type="card" items={7} />
      ) : resource.status === 'error' ? (
        <EmptyState title="Calendar unavailable" description={resource.error} />
      ) : (
        <div className="space-y-6">
          <div className="flex items-center justify-between rounded-3xl border border-white/10 bg-white/5 px-6 py-4">
            <div className="text-xl font-bold tracking-tight text-white">{monthLabels[month]} {year}</div>
            <div className="flex gap-2">
               <Button type="button" onClick={prevMonth}>&larr; Prev</Button>
               <Button type="button" onClick={todayMonth}>Current</Button>
               <Button type="button" onClick={nextMonth}>Next &rarr;</Button>
            </div>
          </div>

          <div className="rounded-3xl border border-white/10 overflow-hidden bg-[linear-gradient(135deg,rgba(11,24,38,0.96),rgba(5,12,20,0.92))]">
            <div className="grid grid-cols-7 border-b border-white/10 bg-white/5">
               {dayLabels.map(day => (
                 <div key={day} className="px-3 py-3 text-center text-xs font-bold uppercase tracking-wider text-slate-400 border-r border-white/5 last:border-r-0">
                   {day}
                 </div>
               ))}
            </div>
            {buildCalendarGrid().map((row, r) => (
              <div key={r} className="grid grid-cols-7 min-h-[140px] border-b border-white/5 last:border-b-0">
                {row.map((cell, c) => {
                  if (!cell) return <div key={c} className="border-r border-white/5 bg-black/20 last:border-r-0" />;
                  
                  const isToday = new Date().toISOString().split('T')[0] === cell.dateStr;
                  return (
                    <div key={c} className={`border-r border-white/5 p-2 last:border-r-0 transition hover:bg-white/5 ${isToday ? 'bg-sky-500/5' : ''}`}>
                      <div className={`mb-2 flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${isToday ? 'bg-sky-500 text-white' : 'text-slate-400'}`}>
                        {cell.day}
                      </div>
                      <div className="space-y-1.5 flex flex-col items-center sm:items-stretch">
                        {cell.events.map(ev => {
                          const isHigh = ev.impact === 'HIGH';
                          return (
                            <div key={ev.id} title={ev.description} className={`truncate rounded px-1.5 py-1 text-[10px] uppercase tracking-wider font-semibold cursor-pointer transition ${isHigh ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30' : 'bg-white/10 text-slate-300'}`}>
                              {ev.ticker} - {ev.event_type}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}
          </div>

          {!events.length && (
            <EmptyState title="No events stored" description="Currently tracking no events for this selection." />
          )}
        </div>
      )}
    </PageSection>
  );
}
