import React, { useMemo } from 'react';
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import useAsyncResource from '../hooks/useAsyncResource';
import { api } from '../api';
import { asCurrency } from '../utils/formatters';
import { EmptyState, LoadingState, PageSection } from './Common';

export default function StockChart({ ticker }) {
  const resource = useAsyncResource((signal) => api.getPrices({ ticker, limit: 120, signal }), [ticker]);

  const data = useMemo(() => {
    if (!resource.data || !Array.isArray(resource.data)) return [];
    return [...resource.data]
      .sort((a, b) => String(a.date).localeCompare(String(b.date)))
      .map((item) => ({
        date: item.date,
        close: Number(item.close),
      }))
      .filter((item) => !Number.isNaN(item.close));
  }, [resource.data]);

  const latestPrice = data.length ? data[data.length - 1].close : null;
  const firstPrice = data.length ? data[0].close : null;
  const isPositive = latestPrice >= firstPrice;

  if (resource.status === 'loading' || resource.status === 'idle') {
    return <LoadingState type="card" items={1} />;
  }
  if (resource.error) {
    return <EmptyState title="Price data unavailable" description={resource.error} />;
  }
  if (!data.length) {
    return <EmptyState title="No pricing data" description={`There are no historical prices loaded for ${ticker}.`} />;
  }

  return (
    <PageSection title="Price Action (120D)" subtitle="Visual reconstruction of closing price history for the selected ticker.">
      <div className="h-64 w-full rounded-3xl border border-white/10 bg-[#06101a] p-4 pr-6 pt-6">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="colorClose" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0.3} />
                <stop offset="95%" stopColor={isPositive ? '#10b981' : '#f43f5e'} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" vertical={false} />
            <XAxis
              dataKey="date"
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              tickMargin={8}
              tickFormatter={(val) => val.substring(5)} // Show MM-DD
              minTickGap={30}
            />
            <YAxis
              domain={['auto', 'auto']}
              stroke="rgba(255,255,255,0.2)"
              tick={{ fill: 'rgba(255,255,255,0.4)', fontSize: 11 }}
              tickFormatter={(val) => `$${val}`}
              width={50}
            />
            <Tooltip
              contentStyle={{ backgroundColor: '#0f172a', borderColor: 'rgba(255,255,255,0.1)', borderRadius: '16px', fontSize: '13px' }}
              itemStyle={{ color: '#fff' }}
              formatter={(value) => [asCurrency(value), 'Close']}
              labelStyle={{ color: '#94a3b8', marginBottom: '6px' }}
            />
            <Area
              type="monotone"
              dataKey="close"
              stroke={isPositive ? '#34d399' : '#fb7185'}
              strokeWidth={2}
              fillOpacity={1}
              fill="url(#colorClose)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </PageSection>
  );
}
