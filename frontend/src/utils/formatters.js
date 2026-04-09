import { toneByAction, toneByVerdict } from './colors';

export const parseDate = (value) => {
  if (!value) return null;
  if (value instanceof Date) return value;
  let str = String(value);
  // If format is SQLite standard "YYYY-MM-DD HH:MM:SS", parse as UTC
  if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}/.test(str)) {
    str = str.replace(' ', 'T');
    if (!str.endsWith('Z') && !str.includes('+')) str += 'Z';
  }
  const date = new Date(str);
  return Number.isNaN(date.getTime()) ? null : date;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
  maximumFractionDigits: 2,
});

export const asCurrency = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return currencyFormatter.format(Number(value));
};

export const asPercent = (value, { signed = true } = {}) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  const number = Number(value);
  const absolute = `${Math.abs(number).toFixed(1)}%`;
  if (!signed) return absolute;
  if (number === 0) return '0.0%';
  return `${number > 0 ? '+' : '-'}${absolute}`;
};

const dateFormatter = new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

export const asDate = (value) => {
  const date = parseDate(value);
  if (!date) return '—';
  return dateFormatter.format(date);
};

const dateTimeFormatter = new Intl.DateTimeFormat('en-US', {
  month: 'short',
  day: 'numeric',
  year: 'numeric',
  hour: 'numeric',
  minute: '2-digit',
});

export const asDateTime = (value) => {
  const date = parseDate(value);
  if (!date) return '—';
  return dateTimeFormatter.format(date);
};

export const asRelativeDate = (value) => {
  const date = parseDate(value);
  if (!date) return '—';
  const diffMinutes = Math.round((date.getTime() - Date.now()) / 60000);
  const abs = Math.abs(diffMinutes);
  if (abs < 60) return `${abs}m ${diffMinutes >= 0 ? 'ahead' : 'ago'}`;
  const hours = Math.round(abs / 60);
  if (hours < 24) return `${hours}h ${diffMinutes >= 0 ? 'ahead' : 'ago'}`;
  const days = Math.round(abs / 1440);
  return `${days}d ${diffMinutes >= 0 ? 'ahead' : 'ago'}`;
};

export const countdownLabel = (value, noun = 'event') => {
  const date = parseDate(value);
  if (!date) return 'Date unknown.';
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  date.setHours(0, 0, 0, 0);
  const diff = Math.round((date.getTime() - today.getTime()) / 86400000);
  const cleanNoun = String(noun || 'event').toLowerCase();
  if (diff === 0) return `${cleanNoun} is today.`;
  if (diff > 0) return `${diff} day${diff === 1 ? '' : 's'} until ${cleanNoun}.`;
  const elapsed = Math.abs(diff);
  return `${elapsed} day${elapsed === 1 ? '' : 's'} since ${cleanNoun}.`;
};

const compactNumberFormatter = new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 });

export const asCompactNumber = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return compactNumberFormatter.format(Number(value));
};

export const convictionLabel = (value) => {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return `${Number(value)}/5`;
};

export const entryRangeLabel = (low, high) => {
  if (low === null || low === undefined || high === null || high === undefined) return '—';
  return `${asCurrency(low)} - ${asCurrency(high)}`;
};

export const firstReadableLine = (value, fallback = 'No summary stored.') => {
  if (!value) return fallback;
  const line = String(value).split('\n').find((item) => item.trim());
  return line ? line.trim() : fallback;
};

export const formatTickerLabel = (ticker, companyName) => (companyName ? `${ticker} | ${companyName}` : ticker || '—');

export const verdictTone = (value) => toneByVerdict[String(value || '').toUpperCase()] || 'neutral';
export const actionTone = (value) => toneByAction[String(value || '').toUpperCase()] || 'neutral';
