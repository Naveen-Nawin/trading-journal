/**
 * Forex Trading Session Configurations & IST Timings
 * Exact IST timings:
 * - Sydney: 3:30 AM – 12:30 PM IST
 * - Tokyo (Asian): 5:30 AM – 2:30 PM IST
 * - London (European): 1:30 PM – 10:30 PM IST
 * - New York (North American): 6:30 PM – 3:30 AM IST
 * - London/NY Overlap: 6:30 PM – 10:30 PM IST (Peak Volatility)
 */

export const SESSIONS_LIST = [
  {
    id: 'Sydney',
    label: 'Sydney',
    shortLabel: 'Sydney',
    region: 'Pacific',
    istTime: '3:30 AM – 12:30 PM IST',
    gmtTime: '21:00 – 06:00 GMT',
    currencies: 'AUD / NZD',
    color: 'text-amber-400',
    bg: 'bg-amber-500/15',
    border: 'border-amber-500/40',
    activeBg: 'bg-amber-500/25 text-amber-200 border-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.35)]',
    dot: 'bg-amber-400',
  },
  {
    id: 'Tokyo',
    label: 'Tokyo (Asian)',
    shortLabel: 'Tokyo',
    region: 'Asian',
    istTime: '5:30 AM – 2:30 PM IST',
    gmtTime: '00:00 – 09:00 GMT',
    currencies: 'JPY / AUD',
    color: 'text-purple-400',
    bg: 'bg-purple-500/15',
    border: 'border-purple-500/40',
    activeBg: 'bg-purple-500/25 text-purple-200 border-purple-400 shadow-[0_0_12px_rgba(168,85,247,0.35)]',
    dot: 'bg-purple-400',
  },
  {
    id: 'London',
    label: 'London (European)',
    shortLabel: 'London',
    region: 'European',
    istTime: '1:30 PM – 10:30 PM IST',
    gmtTime: '08:00 – 17:00 GMT',
    currencies: 'EUR / GBP',
    color: 'text-sky-400',
    bg: 'bg-sky-500/15',
    border: 'border-sky-500/40',
    activeBg: 'bg-sky-500/25 text-sky-200 border-sky-400 shadow-[0_0_12px_rgba(56,189,248,0.35)]',
    dot: 'bg-sky-400',
  },
  {
    id: 'New York',
    label: 'New York (North American)',
    shortLabel: 'New York',
    region: 'North American',
    istTime: '6:30 PM – 3:30 AM IST',
    gmtTime: '13:00 – 22:00 GMT',
    currencies: 'USD / CAD',
    color: 'text-emerald-400',
    bg: 'bg-emerald-500/15',
    border: 'border-emerald-500/40',
    activeBg: 'bg-emerald-500/25 text-emerald-200 border-emerald-400 shadow-[0_0_12px_rgba(16,185,129,0.35)]',
    dot: 'bg-emerald-400',
  },
  {
    id: 'London/NY Overlap',
    label: 'London/NY Overlap',
    shortLabel: 'Overlap',
    region: 'High Volatility',
    istTime: '6:30 PM – 10:30 PM IST',
    gmtTime: '13:00 – 17:00 GMT',
    currencies: 'Peak Volume',
    color: 'text-cyan-400',
    bg: 'bg-cyan-500/15',
    border: 'border-cyan-500/40',
    activeBg: 'bg-cyan-500/25 text-cyan-200 border-cyan-400 shadow-[0_0_12px_rgba(6,182,212,0.35)]',
    dot: 'bg-cyan-400',
  },
];

export const isSessionActiveNow = (sessionId) => {
  try {
    const now = new Date();
    // UTC offset for IST is +5.5 hours
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utcTime + 3600000 * 5.5);
    const totalMinutes = istDate.getHours() * 60 + istDate.getMinutes();

    if (sessionId === 'Sydney') {
      return totalMinutes >= 210 && totalMinutes <= 750; // 3:30 AM to 12:30 PM
    }
    if (sessionId === 'Tokyo') {
      return totalMinutes >= 330 && totalMinutes <= 870; // 5:30 AM to 2:30 PM
    }
    if (sessionId === 'London') {
      return totalMinutes >= 810 && totalMinutes <= 1350; // 1:30 PM to 10:30 PM
    }
    if (sessionId === 'New York') {
      return totalMinutes >= 1110 || totalMinutes <= 210; // 6:30 PM to 3:30 AM
    }
    if (sessionId === 'London/NY Overlap') {
      return totalMinutes >= 1110 && totalMinutes <= 1350; // 6:30 PM to 10:30 PM
    }
    return false;
  } catch {
    return false;
  }
};

export const getSessionConfig = (sessionName) => {
  if (!sessionName) return SESSIONS_LIST[2]; // Default London
  const normalized = sessionName.trim().toLowerCase();

  if (normalized.includes('overlap')) {
    return SESSIONS_LIST[4];
  }
  if (normalized.includes('sydney')) {
    return SESSIONS_LIST[0];
  }
  if (normalized.includes('tokyo') || normalized.includes('asian') || normalized.includes('asia')) {
    return SESSIONS_LIST[1];
  }
  if (normalized.includes('london') || normalized.includes('european') || normalized.includes('europe')) {
    return SESSIONS_LIST[2];
  }
  if (normalized.includes('york') || normalized.includes('ny') || normalized.includes('american') || normalized.includes('america')) {
    return SESSIONS_LIST[3];
  }

  const exact = SESSIONS_LIST.find((s) => s.id.toLowerCase() === normalized || s.label.toLowerCase() === normalized);
  if (exact) return exact;

  return {
    id: sessionName,
    label: sessionName,
    shortLabel: sessionName,
    istTime: '',
    color: 'text-primary',
    bg: 'bg-primary/15',
    border: 'border-primary/40',
    activeBg: 'bg-primary/25 text-primary border-primary shadow-xs',
    dot: 'bg-primary',
  };
};
