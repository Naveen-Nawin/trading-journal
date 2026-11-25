/**
 * Forex Trading Session Configurations & Colors
 * Each major trading session with distinct color palette, time window and currency focus.
 */

export const SESSIONS_LIST = [
  {
    id: 'London',
    label: 'London',
    sublabel: '08:00 - 16:00 GMT',
    currencies: 'EUR / GBP',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    activeBg: 'bg-sky-500/25 text-sky-200 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    dot: 'bg-sky-400',
  },
  {
    id: 'New York',
    label: 'New York',
    sublabel: '13:00 - 21:00 GMT',
    currencies: 'USD / CAD',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    activeBg: 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    dot: 'bg-emerald-400',
  },
  {
    id: 'Tokyo',
    label: 'Tokyo',
    sublabel: '00:00 - 08:00 GMT',
    currencies: 'JPY / AUD',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    activeBg: 'bg-purple-500/25 text-purple-200 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    dot: 'bg-purple-400',
  },
  {
    id: 'London/NY Overlap',
    label: 'London/NY Overlap',
    sublabel: '13:00 - 16:00 GMT (Peak)',
    currencies: 'High Volatility',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    activeBg: 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    dot: 'bg-cyan-400',
  },
  {
    id: 'Sydney',
    label: 'Sydney',
    sublabel: '21:00 - 05:00 GMT',
    currencies: 'AUD / NZD',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    dot: 'bg-amber-400',
  },
];

export const getSessionConfig = (sessionName) => {
  if (!sessionName) return SESSIONS_LIST[0];
  const normalized = sessionName.trim().toLowerCase();
  
  if (normalized.includes('overlap')) {
    return SESSIONS_LIST[3]; // London/NY Overlap
  }
  if (normalized.includes('london')) {
    return SESSIONS_LIST[0];
  }
  if (normalized.includes('york') || normalized.includes('ny')) {
    return SESSIONS_LIST[1];
  }
  if (normalized.includes('tokyo') || normalized.includes('asia')) {
    return SESSIONS_LIST[2];
  }
  if (normalized.includes('sydney')) {
    return SESSIONS_LIST[4];
  }

  const exact = SESSIONS_LIST.find((s) => s.id.toLowerCase() === normalized || s.label.toLowerCase() === normalized);
  if (exact) return exact;

  return {
    id: sessionName,
    label: sessionName,
    sublabel: '',
    color: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/40',
    activeBg: 'bg-primary/25 text-primary border-primary shadow-xs',
    dot: 'bg-primary',
  };
};
