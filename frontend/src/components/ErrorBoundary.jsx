import React from 'react';

/**
 * ErrorBoundary — catches render-phase exceptions in any child component tree
 * and displays a graceful fallback UI instead of a full white-screen crash.
 *
 * Usage:
 *   <ErrorBoundary>
 *     <SomePageComponent />
 *   </ErrorBoundary>
 */
export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { error: null, info: null };
  }

  static getDerivedStateFromError(error) {
    return { error };
  }

  componentDidCatch(error, info) {
    // Log to console so the developer sees the full stack in DevTools
    console.error('[MINERVA ErrorBoundary caught]', error, info?.componentStack);
    this.setState({ info });
  }

  handleReset = () => {
    this.setState({ error: null, info: null });
  };

  render() {
    const { error, info } = this.state;
    if (!error) return this.props.children;

    return (
      <div className="rounded-[30px] border border-rose-300/20 bg-[#140d0d]/90 p-8 shadow-[0_28px_70px_rgba(0,0,0,0.5)] text-center space-y-4">
        <div className="text-3xl font-semibold tracking-tight text-white">⚠ Something went wrong</div>
        <p className="text-sm leading-6 text-slate-300 max-w-2xl mx-auto">
          {error?.message || 'An unexpected render error occurred.'}
        </p>
        {info?.componentStack ? (
          <details className="text-left">
            <summary className="text-xs uppercase tracking-[0.2em] text-slate-400 cursor-pointer">
              Developer details
            </summary>
            <pre className="mt-2 overflow-x-auto rounded-2xl border border-white/10 bg-[#02070d] p-3 text-[10px] leading-5 text-slate-400 whitespace-pre-wrap">
              {info.componentStack}
            </pre>
          </details>
        ) : null}
        <div className="flex items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={this.handleReset}
            className="inline-flex items-center justify-center rounded-2xl border border-sky-300/20 bg-sky-300/10 px-5 py-2.5 text-sm font-medium text-sky-50 transition hover:bg-sky-300/20"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => { window.location.hash = '#/overview'; this.handleReset(); }}
            className="inline-flex items-center justify-center rounded-2xl border border-white/10 bg-white/5 px-5 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10"
          >
            Go to Overview
          </button>
        </div>
      </div>
    );
  }
}
