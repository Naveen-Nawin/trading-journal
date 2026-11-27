/**
 * Backup and Restore Helper for Forex Trading Journal
 * Handles:
 * - Version 2.0 / Version 1.0 / Direct Array backup schemas
 * - Multi-account data isolation and ID re-mapping (Account A -> Account B)
 * - Preventing primary key collisions in shared databases (SQLite & Supabase)
 * - De-duplication detection using deterministic trade signatures
 * - Complete preservation of chart screenshots, rules, tags, and settings
 */

/**
 * Generates a unique trade signature based on core trade properties
 * to accurately detect duplicates during merge/append imports.
 */
export const getTradeSignature = (trade = {}) => {
  const date = (trade.date || '').slice(0, 10);
  const time = (trade.time || '').trim();
  const pair = (trade.pair || '').toUpperCase().replace(/[/\-_ ]/g, '');
  const dir = (trade.direction || '').toUpperCase();
  const entry = parseFloat(trade.entryPrice || 0).toFixed(5);
  const lots = parseFloat(trade.lots || 0).toFixed(2);
  const pnl = trade.pnl !== null && trade.pnl !== undefined ? parseFloat(trade.pnl).toFixed(2) : 'null';
  return `${date}#${time}#${pair}#${dir}#${entry}#${lots}#${pnl}`;
};

/**
 * Validates and normalizes backup JSON content.
 * Accepts:
 * - Version 2.0 object: { version: '2.0', trades: [...], rules: [...], settings: {...} }
 * - Version 1.0 object: { version: '1.0', trades: [...] }
 * - Bare array: [ trade1, trade2, ... ]
 */
export const validateBackupJSON = (content) => {
  let parsed = null;
  if (typeof content === 'string') {
    try {
      parsed = JSON.parse(content);
    } catch (err) {
      return {
        valid: false,
        error: `Invalid JSON syntax: ${err.message}`,
        trades: [],
        rules: [],
        settings: {},
      };
    }
  } else if (content && typeof content === 'object') {
    parsed = content;
  } else {
    return {
      valid: false,
      error: 'Empty or invalid backup payload.',
      trades: [],
      rules: [],
      settings: {},
    };
  }

  let version = '1.0';
  let rawTrades = [];
  let rawRules = [];
  let settings = {};

  if (Array.isArray(parsed)) {
    rawTrades = parsed;
  } else if (parsed && typeof parsed === 'object') {
    version = parsed.version || '1.0';
    rawTrades = Array.isArray(parsed.trades) ? parsed.trades : [];
    rawRules = Array.isArray(parsed.rules) ? parsed.rules : [];
    settings = parsed.settings || {};
    if (parsed.currency) settings.currency = parsed.currency;
    if (parsed.theme) settings.theme = parsed.theme;
  }

  // Filter out any non-object entries
  const validTrades = rawTrades.filter((t) => t && typeof t === 'object' && (t.pair || t.entryPrice != null));
  const validRules = rawRules.filter((r) => r && typeof r === 'object' && r.text);

  const isBackupStructure =
    Array.isArray(parsed) ||
    (parsed && typeof parsed === 'object' && (Array.isArray(parsed.trades) || Array.isArray(parsed.rules) || parsed.version));

  if (!isBackupStructure) {
    return {
      valid: false,
      error: 'Invalid backup structure. Expected trades array or versioned backup object.',
      trades: [],
      rules: [],
      settings: {},
    };
  }

  return {
    valid: true,
    version,
    trades: validTrades,
    rules: validRules,
    settings,
    totalRecords: validTrades.length,
    rulesCount: validRules.length,
    hasImages: validTrades.some((t) => Boolean(t.screenshot || t.exitScreenshot)),
  };
};

/**
 * Prepares trades for restoration into a target account:
 * - Generates guaranteed-unique IDs so they NEVER collide with Account A in SQLite or Supabase
 * - Re-maps user_id to targetUserId
 * - Sanitizes numeric and string values
 */
export const prepareTradesForAccount = (trades = [], targetUserId = null, options = { generateNewIds: true }) => {
  const timestamp = Date.now();

  return trades.map((t, idx) => {
    // Generate fresh safe ID if requested or if collision could occur
    let newId = t.id;
    if (options.generateNewIds || !newId || newId.startsWith('ocr-') || newId.startsWith('sample-')) {
      const rand = Math.random().toString(36).substring(2, 7);
      newId = `tr_${timestamp}_${idx}_${rand}`;
    }

    const direction = (t.direction || 'BUY').toUpperCase();
    const lots = parseFloat(t.lots) || 0.1;
    const entryPrice = parseFloat(t.entryPrice) || 0;
    const exitPrice = t.exitPrice !== null && t.exitPrice !== undefined && t.exitPrice !== '' ? parseFloat(t.exitPrice) : null;
    const stopLoss = t.stopLoss !== null && t.stopLoss !== undefined && t.stopLoss !== '' ? parseFloat(t.stopLoss) : null;
    const takeProfit = t.takeProfit !== null && t.takeProfit !== undefined && t.takeProfit !== '' ? parseFloat(t.takeProfit) : null;
    const pnl = t.pnl !== null && t.pnl !== undefined && t.pnl !== '' ? parseFloat(t.pnl) : null;
    const pips = t.pips !== null && t.pips !== undefined && t.pips !== '' ? parseFloat(t.pips) : null;
    const rMultiple = t.rMultiple !== null && t.rMultiple !== undefined && t.rMultiple !== '' ? parseFloat(t.rMultiple) : null;

    let status = (t.status || '').toUpperCase();
    if (status !== 'OPEN' && status !== 'CLOSED') {
      status = exitPrice !== null || pnl !== null ? 'CLOSED' : 'OPEN';
    }

    return {
      id: newId,
      user_id: targetUserId || t.user_id || t.userId || null,
      userId: targetUserId || t.userId || t.user_id || null,
      pair: (t.pair || 'XAUUSD').toUpperCase().replace(/[/\-_ ]/g, '') || 'XAUUSD',
      direction,
      lots,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      pnl,
      pips,
      rMultiple,
      date: t.date || new Date().toISOString().slice(0, 10),
      time: t.time || '',
      session: t.session || 'London',
      status,
      setupTag: t.setupTag || 'trend',
      followedPlan: Boolean(t.followedPlan),
      emotion: t.emotion || 'calm',
      notes: t.notes || '',
      tags: Array.isArray(t.tags) ? t.tags : [],
      screenshot: t.screenshot || '',
      exitScreenshot: t.exitScreenshot || null,
    };
  });
};

/**
 * Filters out duplicate trades during an Append/Merge operation.
 */
export const deduplicateTrades = (existingTrades = [], incomingTrades = []) => {
  const existingSignatures = new Set(existingTrades.map(getTradeSignature));
  const uniqueIncoming = [];
  let duplicatesSkipped = 0;

  for (const t of incomingTrades) {
    const sig = getTradeSignature(t);
    if (existingSignatures.has(sig)) {
      duplicatesSkipped++;
    } else {
      existingSignatures.add(sig);
      uniqueIncoming.push(t);
    }
  }

  return {
    unique: uniqueIncoming,
    uniqueTrades: uniqueIncoming,
    duplicatesSkipped,
  };
};

/**
 * Creates a comprehensive Version 2.0 full backup object.
 */
export const createFullBackupData = (trades = [], rules = [], currency = 'USD', theme = 'dark') => {
  return {
    version: '2.0',
    app: 'pipdesk',
    exportedAt: new Date().toISOString(),
    tradesCount: trades.length,
    rulesCount: rules.length,
    settings: {
      currency,
      theme,
    },
    trades: trades,
    rules: rules,
  };
};
