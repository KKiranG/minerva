import React, { useEffect, useState } from 'react';

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

  if (!open) return null;

  const resolvedStatus = remoteState.parseStatus || status;
  const resolvedContent = documentId ? remoteState.content : content;
  const loading = documentId && remoteState.status === 'loading';

  return (
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
          <Button type="button" onClick={onClose}>
            Close
          </Button>
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
            <PreBlock>{resolvedContent}</PreBlock>
          ) : (
            <div className="rounded-3xl border border-white/10 bg-white/[0.035] px-5 py-6 text-sm leading-6 text-slate-300">
              {emptyMessage}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
