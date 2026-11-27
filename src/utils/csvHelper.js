/**
 * RFC-4180 Compliant CSV Serializer and Parser for Forex Trade Journal
 * Handles:
 * - Proper escaping of quotes (" -> "") and enclosing fields with quotes
 * - Multiline notes with newlines (\r\n and \n)
 * - Commas, semicolons, unicode, and special characters inside quotes
 * - Tolerant header mapping (supports various broker/export column naming)
 * - Safe numeric, boolean, date, and array parsing
 */

const CSV_COLUMNS = [
  'id',
  'pair',
  'direction',
  'session',
  'lots',
  'entryPrice',
  'exitPrice',
  'stopLoss',
  'takeProfit',
  'pnl',
  'pips',
  'rMultiple',
  'date',
  'time',
  'status',
  'setupTag',
  'followedPlan',
  'emotion',
  'notes',
  'tags',
];

/**
 * Escapes a single field value according to RFC-4180.
 */
export const escapeCSVField = (val) => {
  if (val === null || val === undefined) return '';
  let str = String(val);
  // If string contains comma, double quote, newline, or carriage return, enclose in quotes and escape quotes
  if (/[",\r\n]/.test(str) || /^\s|\s$/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

/**
 * Serializes an array of trade objects into an RFC-4180 compliant CSV string.
 */
export const serializeTradesToCSV = (trades = []) => {
  if (!Array.isArray(trades) || trades.length === 0) {
    return CSV_COLUMNS.join(',');
  }

  const rows = trades.map((t) => {
    return [
      escapeCSVField(t.id || ''),
      escapeCSVField((t.pair || 'XAUUSD').toUpperCase()),
      escapeCSVField((t.direction || 'BUY').toUpperCase()),
      escapeCSVField(t.session || ''),
      escapeCSVField(t.lots != null ? t.lots : ''),
      escapeCSVField(t.entryPrice != null ? t.entryPrice : ''),
      escapeCSVField(t.exitPrice != null ? t.exitPrice : ''),
      escapeCSVField(t.stopLoss != null ? t.stopLoss : ''),
      escapeCSVField(t.takeProfit != null ? t.takeProfit : ''),
      escapeCSVField(t.pnl != null ? t.pnl : ''),
      escapeCSVField(t.pips != null ? t.pips : ''),
      escapeCSVField(t.rMultiple != null ? t.rMultiple : ''),
      escapeCSVField(t.date || ''),
      escapeCSVField(t.time || ''),
      escapeCSVField((t.status || (t.exitPrice != null || t.pnl != null ? 'CLOSED' : 'OPEN')).toUpperCase()),
      escapeCSVField(t.setupTag || ''),
      escapeCSVField(t.followedPlan ? 'yes' : 'no'),
      escapeCSVField(t.emotion || ''),
      escapeCSVField(t.notes || ''),
      escapeCSVField(Array.isArray(t.tags) ? t.tags.join(';') : (t.tags || '')),
    ].join(',');
  });

  return [CSV_COLUMNS.join(','), ...rows].join('\r\n');
};

/**
 * Robust RFC-4180 CSV tokenizer and table parser.
 * Properly parses fields containing commas, double quotes, and embedded newlines.
 */
export const parseRawCSV = (csvText = '') => {
  if (!csvText || typeof csvText !== 'string') return [];

  const text = csvText.replace(/^\uFEFF/, ''); // Strip UTF-8 BOM if present
  const rows = [];
  let currentRow = [];
  let currentField = '';
  let insideQuotes = false;
  let i = 0;
  const len = text.length;

  while (i < len) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (insideQuotes) {
      if (char === '"') {
        if (nextChar === '"') {
          // Escaped quote ("")
          currentField += '"';
          i += 2;
          continue;
        } else {
          // Closing quote
          insideQuotes = false;
          i++;
          continue;
        }
      } else {
        currentField += char;
        i++;
        continue;
      }
    } else {
      if (char === '"') {
        insideQuotes = true;
        i++;
        continue;
      } else if (char === ',') {
        currentRow.push(currentField);
        currentField = '';
        i++;
        continue;
      } else if (char === '\r') {
        if (nextChar === '\n') {
          currentRow.push(currentField);
          currentField = '';
          rows.push(currentRow);
          currentRow = [];
          i += 2;
          continue;
        } else {
          currentRow.push(currentField);
          currentField = '';
          rows.push(currentRow);
          currentRow = [];
          i++;
          continue;
        }
      } else if (char === '\n') {
        currentRow.push(currentField);
        currentField = '';
        rows.push(currentRow);
        currentRow = [];
        i++;
        continue;
      } else {
        currentField += char;
        i++;
        continue;
      }
    }
  }

  // Push final field/row if anything remains
  if (currentField.length > 0 || currentRow.length > 0) {
    currentRow.push(currentField);
    rows.push(currentRow);
  }

  // Filter out any completely empty rows
  return rows.filter((r) => r.some((field) => field.trim().length > 0));
};

/**
 * Maps raw CSV header names to standard model property names.
 */
const normalizeHeader = (raw = '') => {
  const clean = raw.toLowerCase().replace(/[^a-z0-9]/g, '');
  if (['id', 'tradeid'].includes(clean)) return 'id';
  if (['pair', 'symbol', 'instrument', 'ticker', 'asset'].includes(clean)) return 'pair';
  if (['direction', 'type', 'side', 'action', 'order'].includes(clean)) return 'direction';
  if (['session', 'market_session'].includes(clean)) return 'session';
  if (['lots', 'lot', 'volume', 'size', 'contracts', 'qty'].includes(clean)) return 'lots';
  if (['entryprice', 'openprice', 'entry', 'open'].includes(clean)) return 'entryPrice';
  if (['exitprice', 'closeprice', 'exit', 'close'].includes(clean)) return 'exitPrice';
  if (['stoploss', 'sl'].includes(clean)) return 'stopLoss';
  if (['takeprofit', 'tp'].includes(clean)) return 'takeProfit';
  if (['pnl', 'profit', 'netprofit', 'netpnl', 'pl'].includes(clean)) return 'pnl';
  if (['pips', 'pip', 'points', 'pts'].includes(clean)) return 'pips';
  if (['rmultiple', 'r', 'rr', 'ratio'].includes(clean)) return 'rMultiple';
  if (['date', 'opendate', 'tradedate'].includes(clean)) return 'date';
  if (['time', 'opentime', 'tradetime'].includes(clean)) return 'time';
  if (['status', 'state'].includes(clean)) return 'status';
  if (['setuptag', 'setup', 'tag', 'strategy'].includes(clean)) return 'setupTag';
  if (['followedplan', 'plan', 'followed'].includes(clean)) return 'followedPlan';
  if (['emotion', 'sentiment', 'psychology'].includes(clean)) return 'emotion';
  if (['notes', 'comments', 'comment', 'description', 'memo'].includes(clean)) return 'notes';
  if (['tags', 'labels'].includes(clean)) return 'tags';
  return clean;
};

/**
 * Parses CSV text into normalized trade objects.
 */
export const parseTradesFromCSV = (csvText = '') => {
  const table = parseRawCSV(csvText);
  if (table.length < 2) {
    return [];
  }

  const rawHeaders = table[0];
  const fieldKeys = rawHeaders.map(normalizeHeader);

  // If none of the fundamental headers exist, this is not a valid trading CSV
  if (!fieldKeys.includes('pair') && !fieldKeys.includes('entryPrice') && !fieldKeys.includes('lots')) {
    return [];
  }

  const parsedTrades = [];

  for (let r = 1; r < table.length; r++) {
    const rowValues = table[r];
    const rowObj = {};

    fieldKeys.forEach((key, idx) => {
      rowObj[key] = rowValues[idx] !== undefined ? rowValues[idx].trim() : '';
    });

    // Pair
    const pair = (rowObj.pair || 'XAUUSD').toUpperCase().replace(/[/\-_ ]/g, '') || 'XAUUSD';

    // Direction (Normalize BUY/SELL, LONG/SHORT)
    let direction = (rowObj.direction || 'BUY').toUpperCase();
    if (direction.includes('SHORT') || direction === 'S') direction = 'SELL';
    if (direction.includes('LONG') || direction === 'L') direction = 'BUY';
    if (direction !== 'SELL') direction = 'BUY';

    // Lots
    const lots = parseFloat(rowObj.lots);
    const parsedLots = !isNaN(lots) && lots > 0 ? lots : 0.01;

    // Entry Price
    const entry = parseFloat(rowObj.entryPrice);
    const parsedEntry = !isNaN(entry) ? entry : 0;

    // Exit Price
    const exit = rowObj.exitPrice !== '' ? parseFloat(rowObj.exitPrice) : null;
    const parsedExit = exit !== null && !isNaN(exit) ? exit : null;

    // Stop Loss & Take Profit
    const sl = rowObj.stopLoss !== '' ? parseFloat(rowObj.stopLoss) : null;
    const tp = rowObj.takeProfit !== '' ? parseFloat(rowObj.takeProfit) : null;

    // P&L
    let pnl = null;
    if (rowObj.pnl !== '') {
      const p = parseFloat(rowObj.pnl);
      if (!isNaN(p)) pnl = p;
    }

    // Pips
    let pips = null;
    if (rowObj.pips !== '') {
      const pi = parseFloat(rowObj.pips);
      if (!isNaN(pi)) pips = pi;
    }

    // R-Multiple
    let rMultiple = null;
    if (rowObj.rMultiple !== '') {
      const rm = parseFloat(rowObj.rMultiple);
      if (!isNaN(rm)) rMultiple = rm;
    }

    // Status (if exitPrice or pnl exists, default CLOSED, otherwise OPEN)
    let status = (rowObj.status || '').toUpperCase();
    if (status !== 'OPEN' && status !== 'CLOSED') {
      status = parsedExit !== null || pnl !== null ? 'CLOSED' : 'OPEN';
    }

    // Date
    let date = rowObj.date || '';
    if (!date) {
      date = new Date().toISOString().slice(0, 10);
    } else {
      // Clean date format YYYY-MM-DD or DD/MM/YYYY
      if (date.includes('/')) {
        const parts = date.split('/');
        if (parts.length === 3) {
          if (parts[2].length === 4) {
            // DD/MM/YYYY or MM/DD/YYYY -> normalize to YYYY-MM-DD
            date = `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
          }
        }
      }
    }

    // Time
    const time = rowObj.time || '';

    // Session
    const session = rowObj.session || 'London';

    // Followed Plan
    const fpStr = (rowObj.followedPlan || '').toLowerCase();
    const followedPlan = fpStr === 'yes' || fpStr === 'true' || fpStr === '1' || fpStr === 'y';

    // Tags
    let tags = [];
    if (rowObj.tags) {
      if (rowObj.tags.startsWith('[') && rowObj.tags.endsWith(']')) {
        try {
          tags = JSON.parse(rowObj.tags);
        } catch {
          tags = rowObj.tags.split(';').map((t) => t.trim()).filter(Boolean);
        }
      } else {
        tags = rowObj.tags.split(';').map((t) => t.trim()).filter(Boolean);
      }
    }

    parsedTrades.push({
      id: rowObj.id || `tr-import-${Date.now()}-${r}`,
      pair,
      direction,
      session,
      lots: parsedLots,
      entryPrice: parsedEntry,
      exitPrice: parsedExit,
      stopLoss: sl !== null && !isNaN(sl) ? sl : null,
      takeProfit: tp !== null && !isNaN(tp) ? tp : null,
      pnl,
      pips,
      rMultiple,
      date,
      time,
      status,
      setupTag: rowObj.setupTag || 'trend',
      followedPlan,
      emotion: rowObj.emotion || 'calm',
      notes: rowObj.notes || '',
      tags,
      screenshot: '',
      exitScreenshot: null,
    });
  }

  return parsedTrades;
};
