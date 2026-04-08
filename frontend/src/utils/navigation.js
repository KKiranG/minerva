export const NAV = [
  { label: 'Overview', hash: '#/overview' },
  { label: 'Analysis', hash: '#/analysis' },
  { label: 'Catalysts', hash: '#/catalysts' },
  { label: 'Research', hash: '#/research' },
  { label: 'Calendar', hash: '#/calendar' },
  { label: 'Journal', hash: '#/journal' },
  { label: 'Ask', hash: '#/ask' },
];

export const navigate = (hash) => {
  window.location.hash = hash;
};
