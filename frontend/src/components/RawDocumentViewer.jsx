import React, { useEffect, useState } from 'react';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge, Button, PreBlock } from './Common';

const toneForStatus = (value) => {
  const normalized = String(value || '').toUpperCase();
  if (normalized === 'COMPLETE') return 'positive';
  if (normalized === 'PARTIAL') return 'warning';
  if (normalized === 'FAILED') return 'danger';
  return 'neutral';
};

export default function RawDocumentViewer({
  api,
  open,
  title,
  subtitle,
  content,
  documentId,
  status,
  badges = [],
  emptyMessage = 'No document content is available.',
  onClose,
}) {
  const [remoteState, setRemoteState] = useState({ status: 'idle', content: null, parseStatus: null, error: null });
  const [viewRaw, setViewRaw] = useState(false);

  useEffect(() => {
    if (!open) return undefined;
    const onKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  useEffect(() => {
    if (!open || !documentId || !api?.getExtraction) {
      setRemoteState({ status: 'idle', content: null, parseStatus: null, error: null });
      return undefined;
    }
    let active = true;
    setRemoteState({ status: 'loading', content: null, parseStatus: null, error: null });
    api
      .getExtraction(documentId)
      .then((payload) => {
        if (!active) return;
        setRemoteState({
          status: 'success',
          content: payload?.raw_text || '',
          parseStatus: payload?.parse_status || null,
          error: null,
        });
      })
      .catch((error) => {
        if (!active) return;
        setRemoteState({
          status: 'error',
          content: null,
          parseStatus: null,
          error: error.message || 'Failed to load the raw document.',
        });
      });
    return () => {
      active = false;
    };
  }, [api, documentId, open]);

  const resolvedStatus = remoteState.parseStatus || status;
  const resolvedContent = documentId ? remoteState.content : content;
  const loading = documentId && remoteState.status === 'loading';

  return (
    open && (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4 py-6 backdrop-blur-sm">
      <div className="max-h-[90vh] w-full max-w-5xl overflow-hidden rounded-[32px] border border-white/10 bg-[#07121d] shadow-[0_35px_90px_rgba(0,0,0,0.45)]">
        <div className="flex flex-col gap-4 border-b border-white/10 px-6 py-5 md:flex-row md:items-start md:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold tracking-tight text-white">{title}</h2>
              {resolvedStatus ? <Badge tone={toneForStatus(resolvedStatus)}>{resolvedStatus}</Badge> : null}
              {badges.map((badge) => (
                <Badge key={`${badge.label}-${badge.value}`} tone={badge.tone || 'neutral'}>
                  {badge.label ? `${badge.label}: ${badge.value}` : badge.value}
                </Badge>
              ))}
            </div>
            {subtitle ? <p className="max-w-3xl text-sm leading-6 text-slate-300">{subtitle}</p> : null}
          </div>
          <div className="flex shrink-0 items-start gap-2 hidden md:flex">
            {resolvedContent ? (
              <Button type="button" tone={viewRaw ? 'primary' : 'secondary'} onClick={() => setViewRaw(!viewRaw)}>
                {viewRaw ? 'Raw txt' : 'Rich txt'}
              </Button>
            ) : null}
            <Button type="button" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
        <div className="max-h-[calc(90vh-110px)] overflow-y-auto px-6 py-5">
          {loading ? (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-6 text-sm leading-6 text-slate-300">
              Loading raw document…
            </div>
          ) : remoteState.error ? (
            <div className="rounded-3xl border border-rose-400/20 bg-rose-500/10 px-5 py-6 text-sm leading-6 text-rose-100">
              {remoteState.error}
            </div>
          ) : resolvedContent ? (
            viewRaw ? (
               <PreBlock>{resolvedContent}</PreBlock>
            ) : (
               <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={{
                    h1: ({node, ...props}) => <h1 className="mt-6 mb-4 text-2xl font-semibold text-white tracking-tight" {...props} />,
                    h2: ({node, ...props}) => <h2 className="mt-8 mb-4 text-xl font-medium text-white tracking-tight" {...props} />,
                    h3: ({node, ...props}) => <h3 className="mt-6 mb-3 text-lg font-medium text-white" {...props} />,
                    p: ({node, ...props}) => <p className="mb-4 leading-7 text-slate-300" {...props} />,
                    ul: ({node, ...props}) => <ul className="mb-4 list-disc space-y-1 pl-5 text-slate-300" {...props} />,
                    ol: ({node, ...props}) => <ol className="mb-4 list-decimal space-y-1 pl-5 text-slate-300" {...props} />,
                    li: ({node, ...props}) => <li {...props} />,
                    code: ({node, inline, className, children, ...props}) => {
                      const match = /language-(\w+)/.exec(className || '');
                      return !inline ? (
                        <pre className="mb-5 overflow-x-auto rounded-[20px] border border-white/10 bg-[#02070d] p-5"><code className="font-mono text-sm leading-relaxed text-sky-200" {...props}>{children}</code></pre>
                      ) : (
                        <code className="rounded bg-white/10 px-1.5 py-0.5 font-mono text-[13px] text-sky-100" {...props}>{children}</code>
                      )
                    },
                    table: ({node, ...props}) => <div className="mb-6 overflow-x-auto rounded-[24px] border border-white/10"><table className="w-full text-left text-sm text-slate-300" {...props} /></div>,
                    thead: ({node, ...props}) => <thead className="bg-white/[0.04]" {...props} />,
                    th: ({node, ...props}) => <th className="border-b border-white/10 px-4 py-3 font-medium uppercase tracking-[0.15em] text-slate-400" {...props} />,
                    td: ({node, ...props}) => <td className="border-b border-white/5 px-4 py-3" {...props} />,
                    a: ({node, ...props}) => <a className="text-sky-400 underline decoration-sky-400/30 transition hover:decoration-sky-400" target="_blank" rel="noreferrer" {...props} />,
                  }}
               >
                  {resolvedContent}
               </ReactMarkdown>
            )
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-6 text-sm leading-6 text-slate-300">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
    )
  );
}
