/**
 * Forex Trading Session Configurations & IST Timings
 * Exact IST timings as requested:
 * - Sydney: 3:30 AM – 12:30 PM IST
 * - Tokyo (Asian): 5:30 AM – 2:30 PM IST
 * - London (European): 1:30 PM – 10:30 PM IST
 * - New York (North American): 6:30 PM – 3:30 AM IST
 * - London/NY Overlap: 6:30 PM – 10:30 PM IST (Peak Volume Window)
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

/**
 * Returns the exact single current active trading session based on Indian Standard Time (IST).
 * Full 24-hour cycle coverage:
 * - 03:30 AM – 05:30 AM IST (210 to 330 mins): Sydney
 * - 05:30 AM – 01:30 PM IST (330 to 810 mins): Tokyo (Asian)
 * - 01:30 PM – 06:30 PM IST (810 to 1110 mins): London (European)
 * - 06:30 PM – 03:30 AM IST (1110 to 1440 and 0 to 210 mins): New York (North American)
 */
export const getCurrentLiveSessionId = () => {
  try {
    const now = new Date();
    // UTC offset for IST is +5.5 hours (+330 minutes)
    const utcTime = now.getTime() + now.getTimezoneOffset() * 60000;
    const istDate = new Date(utcTime + 3600000 * 5.5);
    const totalMinutes = istDate.getHours() * 60 + istDate.getMinutes();

    // 03:30 AM to 05:30 AM IST (210 to 330 mins)
    if (totalMinutes >= 210 && totalMinutes < 330) {
      return 'Sydney';
    }
    // 05:30 AM to 01:30 PM IST (330 to 810 mins)
    if (totalMinutes >= 330 && totalMinutes < 810) {
      return 'Tokyo';
    }
    // 01:30 PM to 06:30 PM IST (810 to 1110 mins)
    if (totalMinutes >= 810 && totalMinutes < 1110) {
      return 'London';
    }
    // 06:30 PM to 10:30 PM IST (1110 to 1350 mins) - London / New York Overlap
    if (totalMinutes >= 1110 && totalMinutes < 1350) {
      return 'London/NY Overlap';
    }
    // 10:30 PM to 03:30 AM IST (1350 to 1440 mins OR 0 to 210 mins) - New York Solo
    if (totalMinutes >= 1350 || totalMinutes < 210) {
      return 'New York';
    }

    return 'New York';
  } catch {
    return 'New York';
  }
};

/**
 * Checks whether the given session is the currently active live session.
 * Exactly ONE session can be true at any moment.
 */
export const isSessionActiveNow = (sessionId) => {
  const currentLive = getCurrentLiveSessionId();
  return sessionId === currentLive;
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
