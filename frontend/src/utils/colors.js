export const palette = {
  bg: '#041018',
  bgElevated: '#081521',
  panel: 'rgba(10, 21, 33, 0.84)',
  panelSoft: 'rgba(15, 27, 41, 0.76)',
  line: 'rgba(148, 163, 184, 0.18)',
  lineStrong: 'rgba(125, 211, 252, 0.2)',
  text: '#e2e8f0',
  muted: '#94a3b8',
  accent: '#7dd3fc',
  accentSoft: 'rgba(125, 211, 252, 0.12)',
  success: '#86efac',
  warning: '#fde68a',
  danger: '#fda4af',
};

export const appShellStyle = {
  backgroundColor: palette.bg,
  backgroundImage: [
    'radial-gradient(circle at top left, rgba(34, 211, 238, 0.12), transparent 34%)',
    'radial-gradient(circle at top right, rgba(56, 189, 248, 0.1), transparent 28%)',
    'linear-gradient(180deg, rgba(4, 16, 24, 1), rgba(3, 9, 16, 1))',
  ].join(', '),
  color: palette.text,
};

export const panelStyle = {
  background: `linear-gradient(180deg, ${palette.panel}, ${palette.panelSoft})`,
  borderColor: palette.line,
};

export const toneClasses = {
  neutral: 'border-white/10 bg-white/5 text-slate-100',
  positive: 'border-emerald-400/20 bg-emerald-400/10 text-emerald-100',
  warning: 'border-amber-300/20 bg-amber-300/10 text-amber-100',
  danger: 'border-rose-300/20 bg-rose-300/10 text-rose-100',
  info: 'border-sky-300/20 bg-sky-300/10 text-sky-100',
};

export const toneByVerdict = {
  BULLISH: 'positive',
  BEARISH: 'danger',
  NEUTRAL: 'warning',
};

export const toneByAction = {
  BUY: 'positive',
  SELL: 'danger',
  HOLD: 'neutral',
  WATCH: 'warning',
  AVOID: 'danger',
};
