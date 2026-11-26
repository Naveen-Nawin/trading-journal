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
  const date = new Date(dateStr);
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
