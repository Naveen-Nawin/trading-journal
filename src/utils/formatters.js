// Currency and metric formatting utilities

// Real market rate as of today (~93.51 INR / USD)
export let LIVE_USD_TO_INR_RATE = 93.51;

export const setLiveExchangeRate = (rate) => {
  if (rate && !isNaN(rate) && rate > 0) {
    LIVE_USD_TO_INR_RATE = parseFloat(rate);
  }
};

export const getLiveExchangeRate = () => LIVE_USD_TO_INR_RATE;

export const formatCurrency = (amount, currency = 'USD', customRate = null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '-';

  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rate = customRate || LIVE_USD_TO_INR_RATE;

  if (currency === 'INR') {
    const inrValue = absAmount * rate;
    const formatted = inrValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `-₹${formatted}` : `+₹${formatted}`;
  } else {
    const formatted = absAmount.toLocaleString('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
    return isNegative ? `-$${formatted}` : `+$${formatted}`;
  }
};

export const formatCurrencyRaw = (amount, currency = 'USD', showPlus = false, customRate = null) => {
  if (amount === undefined || amount === null || isNaN(amount)) return '-';
  const isNegative = amount < 0;
  const absAmount = Math.abs(amount);
  const rate = customRate || LIVE_USD_TO_INR_RATE;

  let prefix = '';
  if (isNegative) {
    prefix = '-';
  } else if (showPlus && amount > 0) {
    prefix = '+';
  }

  if (currency === 'INR') {
    const inrValue = absAmount * rate;
    return `${prefix}₹${inrValue.toLocaleString('en-IN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `${prefix}$${absAmount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatR = (r) => {
  if (r === undefined || r === null || isNaN(r)) return '-';
  const num = parseFloat(r);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(2)}R`;
};

export const formatPips = (pips) => {
  if (pips === undefined || pips === null || isNaN(pips)) return '-';
  const num = parseFloat(pips);
  const prefix = num > 0 ? '+' : '';
  return `${prefix}${num.toFixed(1)}`;
};

export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  // Avoid UTC timezone shift when parsing YYYY-MM-DD strings
  let date;
  if (typeof dateStr === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [y, m, d] = dateStr.split('-').map(Number);
    date = new Date(y, m - 1, d);
  } else {
    date = new Date(dateStr);
  }
  if (isNaN(date.getTime())) return dateStr;

  const day = String(date.getDate()).padStart(2, '0');
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = monthNames[date.getMonth()];
  const year = String(date.getFullYear()).slice(-2);

  return `${day} ${month} ${year}`;
};

/**
 * Returns current local time in HH:mm 24-hr format (e.g. "14:35")
 * Compatible with HTML5 <input type="time" />
 */
export const nowTimeFormatted = () => {
  const d = new Date();
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  return `${hours}:${minutes}`;
};

/**
 * Formats a time string (e.g. "14:30" or "14:30:00") into 12-hour AM/PM display (e.g. "2:30 PM")
 */
export const formatTimeDisplay = (timeStr) => {
  if (!timeStr) return '';
  if (typeof timeStr !== 'string') return String(timeStr);
  if (timeStr.includes('AM') || timeStr.includes('PM')) return timeStr;

  const parts = timeStr.split(':');
  if (parts.length >= 2) {
    const hours = parseInt(parts[0], 10);
    const minutes = parts[1];
    if (!isNaN(hours)) {
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const h12 = hours % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }
  }
  return timeStr;
};

/**
 * Converts a time string (e.g. "14:30", "06:30:00", "4:10 PM", "11:30 AM") into total seconds from start of day.
 */
export const parseTimeToSeconds = (timeStr) => {
  if (!timeStr) return 0;
  const trimmed = String(timeStr).trim();
  const isPM = /pm/i.test(trimmed);
  const isAM = /am/i.test(trimmed);
  const clean = trimmed.replace(/\s*(am|pm)/i, '');
  const parts = clean.split(':').map((p) => parseInt(p, 10) || 0);
  let hours = parts[0] || 0;
  const minutes = parts[1] || 0;
  const seconds = parts[2] || 0;

  if (isPM && hours < 12) hours += 12;
  if (isAM && hours === 12) hours = 0;

  return hours * 3600 + minutes * 60 + seconds;
};

/**
 * Returns a sortable unix timestamp (in milliseconds) for any trade
 * by accurately combining its execution Date and Time.
 */
export const getTradeTimestamp = (trade) => {
  if (!trade) return 0;
  const dateStr = trade.date || trade.opened_at || trade.closed_at;
  let dateMs = 0;
  if (dateStr) {
    const cleanDate = String(dateStr).slice(0, 10);
    const d = new Date(cleanDate);
    if (!isNaN(d.getTime())) {
      dateMs = d.getTime();
    }
  }

  const timeSecs = parseTimeToSeconds(trade.time || trade.opened_time || trade.exit_time);
  const totalMs = dateMs + timeSecs * 1000;

  // Tie-breaker precision from ID timestamp if available
  if (trade.id && typeof trade.id === 'string') {
    const match = trade.id.match(/(?:tr|ocr)-(\d{10,13})/);
    if (match) {
      const idTime = parseInt(match[1], 10);
      return totalMs > 0 ? totalMs * 1000 + (idTime % 1000) : idTime;
    }
  }

  return totalMs;
};

/**
 * Compares two trades in chronological descending order:
 * Newest trades at the top (upside), oldest/least trades at the bottom (below).
 */
export const compareTradesDescending = (a, b) => {
  const timeA = getTradeTimestamp(a);
  const timeB = getTradeTimestamp(b);
  if (timeA !== timeB) {
    return timeB - timeA;
  }
  if (a.id && b.id) {
    return String(b.id).localeCompare(String(a.id));
  }
  return 0;
};
