import React, { useState } from 'react';
import { Button, EmptyState, PageSection, TextInput, Badge } from '../components/Common';
import useAsyncResource from '../hooks/useAsyncResource';

export default function AskMinerva({ api }) {
  const [query, setQuery] = useState('');
  const [searchTrigger, setSearchTrigger] = useState(null);

  const resource = useAsyncResource(async (signal) => {
    if (!searchTrigger) return null;
    return api.getRagContext(searchTrigger, { signal, limit: 10 });
  }, [searchTrigger]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchTrigger(query.trim());
    }
  };

  const copyPrompt = () => {
    if (!resource.data || !resource.data.contexts.length) return;
    const contextsText = resource.data.contexts
      .map((c, i) => `[Context ${i + 1} | ${c.ticker || 'GLOBAL'} | ${c.title}]\n${c.note_body}`)
      .join('\n\n');
    const prompt = `I am researching the following topic: "${searchTrigger}"\n\nPlease analyze the provided MINERVA database notes below to answer my query. If the context does not contain the answer, say "The provided context does not have sufficient information."\n\n--- DATABASE CONTEXTS ---\n\n${contextsText}`;
    navigator.clipboard?.writeText(prompt);
    alert('Prompt copied! Paste it into ChatGPT or Claude.');
  };

  return (
    <PageSection 
      title="Ask MINERVA" 
      subtitle="Search the internal database using FTS5 to extract semantic contexts. Since MINERVA executes no local models, this generates a consolidated RAG prompt you can instantly paste into your frontier model."
    >
      <form onSubmit={handleSearch} className="mb-6 flex gap-3">
        <TextInput 
          value={query} 
          onChange={(e) => setQuery(e.target.value)} 
          placeholder="What do we know about Albemarle's off-take agreements?" 
        />
        <Button type="submit" tone="primary" disabled={!query.trim() || resource.status === 'loading'}>
          Search
        </Button>
      </form>

      {resource.status === 'loading' && (
        <div className="h-40 animate-pulse rounded-3xl bg-white/5 border border-white/10" />
      )}
      
      {resource.status === 'error' && (
        <EmptyState title="Search Failed" description={resource.error} />
      )}
      
      {resource.status === 'success' && resource.data && (
        <div className="space-y-4">
          <div className="flex items-center justify-between rounded-3xl border border-sky-400/20 bg-sky-400/10 p-4">
            <div>
              <div className="text-sm font-semibold tracking-wide text-sky-100 uppercase">Context Extracted</div>
              <div className="text-sm text-sky-200/70 mt-1">Found {resource.data.contexts.length} relevant data points.</div>
            </div>
            <Button type="button" tone="primary" onClick={copyPrompt} disabled={!resource.data.contexts.length}>
              Copy Prompt for ChatGPT
            </Button>
          </div>

          {!resource.data.contexts.length ? (
            <EmptyState title="No relevance found" description="Adjust your query for better FTS matches." />
          ) : (
            <div className="space-y-4">
              {resource.data.contexts.map((ctx, index) => (
                <div key={index} className="rounded-[24px] border border-white/10 bg-[linear-gradient(135deg,rgba(11,24,38,0.95),rgba(5,12,20,0.9))] p-5">
                  <div className="mb-3 flex items-center justify-between">
                     <span className="text-xs uppercase tracking-widest text-slate-400">Match {index + 1}</span>
                     {ctx.ticker && <Badge tone="info">{ctx.ticker}</Badge>}
                  </div>
                  <h4 className="text-lg font-bold text-white mb-2">{ctx.title}</h4>
                  <p className="text-sm text-slate-300 leading-relaxed whitespace-pre-wrap">{ctx.note_body}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
      
      {(!resource.status || resource.status === 'idle') && !searchTrigger && (
        <EmptyState title="Awaiting Query" description="Engine is ready for RAG extraction." />
      )}
    </PageSection>
  );
}
