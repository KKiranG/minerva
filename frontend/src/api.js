const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
const ENABLE_MOCKS = import.meta.env.VITE_MINERVA_ENABLE_MOCKS === '1';

const STARTER_UNIVERSE = [
  { ticker: 'MP', company_name: 'MP Materials' },
  { ticker: 'UUUU', company_name: 'Energy Fuels' },
  { ticker: 'USAR', company_name: 'USA Rare Earth' },
  { ticker: 'TMRC', company_name: 'Texas Mineral Resources' },
  { ticker: 'LAC', company_name: 'Lithium Americas' },
  { ticker: 'PLL', company_name: 'Piedmont Lithium' },
  { ticker: 'ALB', company_name: 'Albemarle' },
  { ticker: 'LYSCF', company_name: 'Lynas Rare Earths' },
  { ticker: 'NIOBF', company_name: 'Niobay Metals' },
];

const mockDomain = {
  overview: { generated_at: '2026-03-24T00:00:00Z', stocks: [] },
  stocks: [],
};

const buildQuery = (params = {}) => {
  const search = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value === undefined || value === null || value === '') return;
    search.set(key, String(value));
  });
  const query = search.toString();
  return query ? `?${query}` : '';
};

async function request(path, { method = 'GET', body, signal } = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    method,
    signal,
    headers: body ? { 'Content-Type': 'application/json' } : undefined,
    body: body ? JSON.stringify(body) : undefined,
  });
  const contentType = response.headers.get('content-type') || '';
  const payload = contentType.includes('application/json') ? await response.json() : await response.text();
  if (!response.ok) {
    const detail = typeof payload === 'string' ? payload : payload?.detail || payload?.message || 'Request failed.';
    throw new Error(detail);
  }
  return payload;
}

async function requestWithMock(path, options, resolver) {
  if (ENABLE_MOCKS) {
    try {
      return await request(path, options);
    } catch {
      return resolver();
    }
  }
  return request(path, options);
}

export const api = {
  listStocks: ({ limit = 200, offset = 0, q, signal } = {}) =>
    requestWithMock(`/api/stocks${buildQuery({ limit, offset, q })}`, { signal }, () => mockDomain.stocks),

  createStock: (payload, options = {}) => request('/api/stocks', { method: 'POST', body: payload, signal: options.signal }),

  getStock: (ticker, options = {}) => request(`/api/stocks/${encodeURIComponent(String(ticker).toUpperCase())}`, { signal: options.signal }),

  getOverview: (options = {}) =>
    requestWithMock('/api/dashboard/overview', { signal: options.signal }, () => mockDomain.overview),

  getCatalysts: ({ ticker, limit = 200, offset = 0, binding_status, min_significance, sort, signal } = {}) =>
    request(`/api/catalysts${buildQuery({ ticker, limit, offset, binding_status, min_significance, sort })}`, { signal }),

  deleteCatalyst: (id) => request(`/api/catalysts/${id}`, { method: 'DELETE' }),

  getEvents: ({ ticker, limit = 200, offset = 0, status, date_from, date_to, signal } = {}) =>
    request(`/api/events${buildQuery({ ticker, limit, offset, status, date_from, date_to })}`, { signal }),

  deleteEvent: (id) => request(`/api/events/${id}`, { method: 'DELETE' }),

  getPrices: ({ ticker, limit = 120, offset = 0, signal } = {}) =>
    request(`/api/prices${buildQuery({ ticker, limit, offset })}`, { signal }),

  getLatestPrice: (ticker, options = {}) =>
    request(`/api/prices/latest${buildQuery({ ticker })}`, { signal: options.signal }),

  deletePrice: (id) => request(`/api/prices/${id}`, { method: 'DELETE' }),

  getResearch: ({ ticker, category, note_type, date_from, date_to, limit = 200, offset = 0, signal } = {}) =>
    request(`/api/research${buildQuery({ ticker, category, note_type, date_from, date_to, limit, offset })}`, { signal }),

  deleteResearch: (id) => request(`/api/research/${id}`, { method: 'DELETE' }),

  getJournal: ({ ticker, status, limit = 200, offset = 0, signal } = {}) =>
    request(`/api/journal${buildQuery({ ticker, status, limit, offset })}`, { signal }),

  deleteJournal: (id) => request(`/api/journal/${id}`, { method: 'DELETE' }),

  getAnalysisHistory: (ticker, { limit = 24, offset = 0, signal } = {}) =>
    request(`/api/analysis/history${buildQuery({ ticker, limit, offset })}`, { signal }),

  getAnalysisTrail: (ticker, { limit = 12, offset = 0, signal } = {}) =>
    request(`/api/analysis/trail${buildQuery({ ticker, limit, offset })}`, { signal }),

  createAnalysisRun: (payload, options = {}) =>
    request('/api/analysis/runs', { method: 'POST', body: payload, signal: options.signal }),

  ingestMinervaReport: (payload, options = {}) =>
    request('/api/analysis/ingest', { method: 'POST', body: payload, signal: options.signal }),

  ingestRunReport: (runId, payload, options = {}) =>
    request(`/api/analysis/runs/${encodeURIComponent(runId)}/ingest`, { method: 'POST', body: payload, signal: options.signal }),

  getMinervaFormat: ({ signal } = {}) =>
    request('/api/prompts/minerva-format', { signal }),

  search: ({ q, limit = 10, signal }) =>
    requestWithMock(`/api/search${buildQuery({ q, limit })}`, { signal }, () => ({
      query: q,
      results: STARTER_UNIVERSE.filter((item) => item.ticker.includes(String(q || '').toUpperCase())).map((item) => ({
        type: 'stock',
        ticker: item.ticker,
        title: item.ticker,
        subtitle: item.company_name,
        href: `#/stocks/${item.ticker}`,
      })),
    })),
};

export const starterUniverse = STARTER_UNIVERSE;
export const mockEnabled = ENABLE_MOCKS;
