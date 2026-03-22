const safeDate = (value) => {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
};

export const asCurrency = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: options.maximumFractionDigits ?? 2
  }).format(value);
};

export const asNumber = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', options).format(value);
};

export const asCompactNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 1
  }).format(value);
};

export const asPercent = (value, options = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const digits = options.maximumFractionDigits ?? 1;
  const absolute = `${Math.abs(Number(value)).toFixed(digits)}%`;
  if (options.signed === false) return absolute;
  if (Number(value) === 0) return '0.0%';
  return `${value > 0 ? '+' : '-'}${absolute}`;
};

export const asDate = (value, options = {}) => {
  const date = safeDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    ...options
  }).format(date);
};

export const asDateTime = (value, options = {}) => {
  const date = safeDate(value);
  if (!date) return '—';
  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    ...options
  }).format(date);
};

export const asRelativeDate = (value) => {
  const date = safeDate(value);
  if (!date) return '—';
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const abs = Math.abs(diffMinutes);
  if (abs < 60) return `${abs}m ${diffMinutes >= 0 ? 'ahead' : 'ago'}`;
  const hours = Math.round(abs / 60);
  if (hours < 24) return `${hours}h ${diffMinutes >= 0 ? 'ahead' : 'ago'}`;
  const days = Math.round(abs / 1440);
  return `${days}d ${diffMinutes >= 0 ? 'ahead' : 'ago'}`;
};

export const verdictTone = (verdict) => {
  switch (String(verdict || '').toUpperCase()) {
    case 'BULLISH':
      return 'positive';
    case 'BEARISH':
      return 'danger';
    default:
      return 'warning';
  }
};

export const actionTone = (action) => {
  switch (String(action || '').toUpperCase()) {
    case 'BUY':
      return 'positive';
    case 'SELL':
      return 'danger';
    case 'AVOID':
      return 'danger';
    case 'WATCH':
      return 'warning';
    default:
      return 'neutral';
  }
};

export const convictionLabel = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${value}/5`;
};

export const yesNo = (value) => (value ? 'Yes' : 'No');

export const entryRangeLabel = (low, high) => {
  if (low === null || low === undefined || high === null || high === undefined) return '—';
  return `${asCurrency(low)} - ${asCurrency(high)}`;
};

export const compactText = (value, fallback = '—') => {
  if (!value && value !== 0) return fallback;
  return String(value);
};

export const formatTickerLabel = (ticker, companyName) => {
  if (!ticker) return '—';
  return companyName ? `${ticker} | ${companyName}` : ticker;
};
