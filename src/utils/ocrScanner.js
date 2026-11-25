import { createWorker } from 'tesseract.js';

/**
 * Calculates pips based on pair, direction, entry, and exit.
 */
export const calculatePips = (pair = '', direction = 'BUY', entry = 0, exit = 0) => {
  if (!entry || !exit) return 0;
  const diff = direction === 'BUY' ? exit - entry : entry - exit;
  const cleanPair = (pair || '').toUpperCase();
  const isJpyOrGold = cleanPair.includes('JPY') || cleanPair.includes('XAU');
  const isCrypto = cleanPair.includes('BTC') || cleanPair.includes('ETH');
  
  if (isCrypto) {
    return parseFloat(diff.toFixed(2));
  }
  const multiplier = isJpyOrGold ? 100 : 10000;
  return parseFloat((diff * multiplier).toFixed(1));
};

/**
 * Calculates theoretical P&L from lot size & price difference
 */
export const calculateTheoreticalPnl = (pair = '', direction = 'BUY', lots = 0.1, entry = 0, exit = 0) => {
  if (!entry || !exit || !lots) return 0;
  const diff = direction === 'BUY' ? exit - entry : entry - exit;
  const cleanPair = (pair || '').toUpperCase();

  if (cleanPair.includes('BTC')) {
    // 1 lot = 1 BTC
    return parseFloat((diff * lots).toFixed(2));
  } else if (cleanPair.includes('XAU')) {
    // 1 lot = 100 oz of gold
    return parseFloat((diff * 100 * lots).toFixed(2));
  } else if (cleanPair.includes('XAG')) {
    // 1 lot = 5000 oz
    return parseFloat((diff * 5000 * lots).toFixed(2));
  } else {
    // Standard forex: 1 standard lot = 100,000 units (~$10/pip on EURUSD)
    const isJpy = cleanPair.includes('JPY');
    const multiplier = isJpy ? 100 : 10000;
    const pips = diff * multiplier;
    const pipValuePerLot = 10; // Approx USD per pip per 1.0 standard lot
    return parseFloat((pips * lots * pipValuePerLot).toFixed(2));
  }
};

/**
 * Parse OCR raw text into structured trade objects.
 */
export const parseOcrTextToTrades = (text) => {
  if (!text) return [];

  const lines = text.split('\n').map((l) => l.trim()).filter(Boolean);
  const trades = [];

  // Match: SYMBOL, (buy|sell) LOTS [DATE] [TIME]
  // e.g. BTCUSD, sell 0.10 2026.11.18 12:40:06
  const headerRegex = /([A-Z0-9]{3,8})[\s,]+(buy|sell)\s+([0-9.]+)(?:\s+(\d{4}[.-]\d{2}[.-]\d{2}))?(?:\s+(\d{2}:\d{2}(?::\d{2})?))?/i;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const match = line.match(headerRegex);

    if (match) {
      const pair = match[1].toUpperCase();
      const direction = match[2].toUpperCase();
      const lots = parseFloat(match[3]) || 0.1;
      let date = match[4]
        ? match[4].replace(/\./g, '-')
        : new Date().toISOString().split('T')[0];
      let time = match[5] || '';

      let entryPrice = null;
      let exitPrice = null;
      let rawPnl = null;

      // Scan subsequent 1-3 lines for entry -> exit and profit
      for (let j = 1; j <= 3 && i + j < lines.length; j++) {
        const nextLine = lines[i + j];
        // Skip header lines that might be matched
        if (nextLine.match(headerRegex)) break;

        // Clean up thousands separator like "64 555.560" -> "64555.560", "3 794.180" -> "3794.180"
        let cleaned = nextLine.replace(/\b(\d{1,3})\s+(\d{3}\.\d+)/g, '$1$2');
        cleaned = cleaned.replace(/—|–|->|→/g, ' -> ');

        // Find numbers with decimals or minus signs
        const tokens = cleaned.match(/-?\d+(?:\.\d+)?/g);
        if (tokens && tokens.length >= 2) {
          entryPrice = parseFloat(tokens[0]);
          exitPrice = parseFloat(tokens[1]);

          if (tokens.length >= 3) {
            rawPnl = parseFloat(tokens[tokens.length - 1]);
          }
          break;
        }
      }

      // Check win/loss direction
      let isWin = false;
      if (entryPrice !== null && exitPrice !== null) {
        if (direction === 'BUY') {
          isWin = exitPrice >= entryPrice;
        } else {
          isWin = exitPrice <= entryPrice;
        }
      }

      // Compute theoretical PnL
      const theoreticalPnl = calculateTheoreticalPnl(pair, direction, lots, entryPrice, exitPrice);

      // Determine final PnL: use rawPnl if realistic, otherwise theoreticalPnl
      let pnl = theoreticalPnl;
      if (rawPnl !== null) {
        // If rawPnl is huge integer like 5063 instead of 50.63, fix decimal
        let adjustedRaw = rawPnl;
        if (Math.abs(rawPnl) > 1000 && Math.abs(rawPnl) % 1 === 0 && Math.abs(theoreticalPnl) < 500) {
          adjustedRaw = rawPnl / 100;
        }

        // Apply correct sign based on isWin
        if (!isWin && adjustedRaw > 0) {
          adjustedRaw = -Math.abs(adjustedRaw);
        } else if (isWin && adjustedRaw < 0) {
          adjustedRaw = Math.abs(adjustedRaw);
        }

        // Check if close to theoretical
        if (Math.abs(adjustedRaw - theoreticalPnl) < Math.abs(theoreticalPnl) * 0.5 || theoreticalPnl === 0) {
          pnl = adjustedRaw;
        }
      }

      // Determine session based on hour
      let session = 'London';
      if (time) {
        const hour = parseInt(time.split(':')[0], 10);
        if (hour >= 0 && hour < 7) session = 'Tokyo';
        else if (hour >= 7 && hour < 12) session = 'London';
        else if (hour >= 12 && hour < 16) session = 'London/NY Overlap';
        else if (hour >= 16 && hour < 21) session = 'New York';
        else session = 'Sydney';
      }

      const pips = calculatePips(pair, direction, entryPrice, exitPrice);

      trades.push({
        id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 6)}`,
        selected: true,
        pair,
        direction,
        lots,
        entryPrice: entryPrice || 0,
        exitPrice: exitPrice || 0,
        stopLoss: null,
        takeProfit: null,
        pnl: parseFloat(pnl.toFixed(2)),
        pips,
        rMultiple: pnl > 0 ? 1.5 : -1.0,
        date,
        time,
        session,
        status: 'CLOSED',
        setupTag: 'scalp',
        tags: ['mt-import', 'scalp'],
        emotion: 'disciplined',
        notes: `Imported via Screenshot OCR (${date}${time ? ' ' + time : ''})`,
        followedPlan: true,
      });
    }
  }

  return trades;
};

/**
 * November 19, 2026 Live MT5 History Screenshot Dataset (7 Trades on XAUUSD, Total -$5.40)
 */
export const NOV_19_MT5_SCREENSHOT_TRADES = [
  {
    id: 'mt5-nov19-1',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3733.980,
    exitPrice: 3738.882,
    stopLoss: 3738.882,
    takeProfit: 3731.515,
    pnl: -49.02,
    pips: -49.0,
    rMultiple: -1.0,
    date: '2026-11-19',
    time: '07:43:34',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'reversal',
    tags: ['mt5-import', 'gold-scalp', 'stopped-out'],
    emotion: 'disciplined',
    notes: 'Ticket #331678 | S/L hit at 3738.882 | Comm: -$0.70',
    followedPlan: true,
  },
  {
    id: 'mt5-nov19-2',
    selected: true,
    pair: 'XAUUSD',
    direction: 'BUY',
    lots: 0.05,
    entryPrice: 3728.820,
    exitPrice: 3734.590,
    stopLoss: 3730.824,
    takeProfit: 3748.940,
    pnl: 28.85,
    pips: 57.7,
    rMultiple: 1.5,
    date: '2026-11-19',
    time: '07:41:11',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'breakout',
    tags: ['mt5-import', 'gold-scalp', 'take-profit'],
    emotion: 'calm',
    notes: 'Ticket #330911 | Long scalp profit +$28.85 | Comm: -$0.35',
    followedPlan: true,
  },
  {
    id: 'mt5-nov19-3',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.06,
    entryPrice: 3722.480,
    exitPrice: 3728.888,
    stopLoss: 3728.888,
    takeProfit: 3708.833,
    pnl: -38.45,
    pips: -64.1,
    rMultiple: -1.0,
    date: '2026-11-19',
    time: '07:06:27',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'breakout',
    tags: ['mt5-import', 'gold-scalp'],
    emotion: 'hesitant',
    notes: 'Ticket #330570 | S/L hit at 3728.888 | Comm: -$0.42',
    followedPlan: true,
  },
  {
    id: 'mt5-nov19-4',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3707.570,
    exitPrice: 3699.766,
    stopLoss: 3705.249,
    takeProfit: 3674.985,
    pnl: 78.04,
    pips: 78.0,
    rMultiple: 2.1,
    date: '2026-11-19',
    time: '05:16:56',
    session: 'Tokyo',
    status: 'CLOSED',
    setupTag: 'trend',
    tags: ['mt5-import', 'asian-session', 'trend'],
    emotion: 'confident',
    notes: 'Ticket #328899 | Clean Asian breakdown short +$78.04 | Comm: -$0.70',
    followedPlan: true,
  },
  {
    id: 'mt5-nov19-5',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3705.000,
    exitPrice: 3713.615,
    stopLoss: 3713.615,
    takeProfit: 3702.784,
    pnl: -86.15,
    pips: -86.1,
    rMultiple: -1.0,
    date: '2026-11-19',
    time: '05:02:34',
    session: 'Tokyo',
    status: 'CLOSED',
    setupTag: 'reversal',
    tags: ['mt5-import', 'stopped-out'],
    emotion: 'anxious',
    notes: 'Ticket #328800 | Premature short stopped out at 3713.615 | Comm: -$0.70',
    followedPlan: true,
  },
  {
    id: 'mt5-nov19-6',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.05,
    entryPrice: 3746.630,
    exitPrice: 3730.472,
    stopLoss: 3712.025,
    takeProfit: 3695.828,
    pnl: 80.79,
    pips: 161.6,
    rMultiple: 2.5,
    date: '2026-11-19',
    time: '04:59:37',
    session: 'Tokyo',
    status: 'CLOSED',
    setupTag: 'trend',
    tags: ['mt5-import', 'big-winner'],
    emotion: 'calm',
    notes: 'Ticket #328318 | 161.6 pips runner swing short +$80.79 | Comm: -$0.35',
    followedPlan: true,
  },
  {
    id: 'mt5-nov19-7',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.01,
    entryPrice: 3731.610,
    exitPrice: 3751.070,
    stopLoss: 3751.070,
    takeProfit: 3681.064,
    pnl: -19.46,
    pips: -194.6,
    rMultiple: -1.0,
    date: '2026-11-19',
    time: '02:42:54',
    session: 'Tokyo',
    status: 'CLOSED',
    setupTag: 'range',
    tags: ['mt5-import', 'overnight'],
    emotion: 'disciplined',
    notes: 'Ticket #326365 | Overnight small test stopped out | Comm: -$0.07',
    followedPlan: true,
  },
];

/**
 * Pre-extracted high quality dataset from MT5 mobile history screenshot (sample data)
 */
export const SAMPLE_MT5_SCREENSHOT_TRADES = [
  ...NOV_19_MT5_SCREENSHOT_TRADES,
];

export const NOV_18_MT5_SCREENSHOT_TRADES = [
  {
    id: 'sample-1',
    selected: true,
    pair: 'BTCUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 64555.56,
    exitPrice: 64241.19,
    pnl: 31.44,
    pips: 314.3,
    rMultiple: 1.5,
    date: '2026-11-18',
    time: '12:40:06',
    session: 'London/NY Overlap',
    status: 'CLOSED',
    setupTag: 'breakout',
    tags: ['mt5-import', 'breakout'],
    emotion: 'disciplined',
    notes: 'BTCUSD sell position closed in profit (+31.44)',
    followedPlan: true,
  },
  {
    id: 'sample-2',
    selected: true,
    pair: 'XAUUSD',
    direction: 'BUY',
    lots: 0.05,
    entryPrice: 3794.18,
    exitPrice: 3788.74,
    pnl: -27.19,
    pips: -54.4,
    rMultiple: -1.0,
    date: '2026-11-18',
    time: '07:36:17',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'reversal',
    tags: ['mt5-import', 'reversal'],
    emotion: 'disciplined',
    notes: 'Gold buy setup stopped out (-27.19)',
    followedPlan: true,
  },
  {
    id: 'sample-3',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3787.88,
    exitPrice: 3782.81,
    pnl: 50.63,
    pips: 50.6,
    rMultiple: 1.8,
    date: '2026-11-18',
    time: '08:47:35',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'trend',
    tags: ['mt5-import', 'trend'],
    emotion: 'calm',
    notes: 'London session gold short (+50.63)',
    followedPlan: true,
  },
  {
    id: 'sample-4',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.20,
    entryPrice: 3773.24,
    exitPrice: 3768.99,
    pnl: 85.00,
    pips: 42.5,
    rMultiple: 2.1,
    date: '2026-11-18',
    time: '09:53:41',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'scalp',
    tags: ['mt5-import', 'scalp'],
    emotion: 'confident',
    notes: 'Gold support breakdown scale-in (+85.00)',
    followedPlan: true,
  },
  {
    id: 'sample-5',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.06,
    entryPrice: 3759.78,
    exitPrice: 3768.45,
    pnl: -52.03,
    pips: -86.7,
    rMultiple: -1.0,
    date: '2026-11-18',
    time: '10:27:01',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'scalp',
    tags: ['mt5-import', 'scalp'],
    emotion: 'hesitant',
    notes: 'Late pullback entry stopped (-52.03)',
    followedPlan: true,
  },
  {
    id: 'sample-6',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.02,
    entryPrice: 3792.65,
    exitPrice: 3793.27,
    pnl: -1.24,
    pips: -6.2,
    rMultiple: -0.2,
    date: '2026-11-18',
    time: '07:33:02',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'range',
    tags: ['mt5-import', 'range'],
    emotion: 'calm',
    notes: 'Scratch trade cut at break-even (-1.24)',
    followedPlan: true,
  },
  {
    id: 'sample-7',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3764.62,
    exitPrice: 3768.11,
    pnl: -34.92,
    pips: -34.9,
    rMultiple: -1.0,
    date: '2026-11-18',
    time: '10:26:54',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'breakout',
    tags: ['mt5-import', 'breakout'],
    emotion: 'anxious',
    notes: 'Failed breakout short (-34.92)',
    followedPlan: false,
  },
  {
    id: 'sample-8',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.02,
    entryPrice: 3784.73,
    exitPrice: 3797.06,
    pnl: -24.68,
    pips: -123.3,
    rMultiple: -1.0,
    date: '2026-11-18',
    time: '07:31:17',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'trend',
    tags: ['mt5-import', 'trend'],
    emotion: 'calm',
    notes: 'Reversal against morning trend (-24.68)',
    followedPlan: true,
  },
  {
    id: 'sample-9',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.20,
    entryPrice: 3769.31,
    exitPrice: 3766.96,
    pnl: 46.88,
    pips: 23.4,
    rMultiple: 1.4,
    date: '2026-11-18',
    time: '10:46:01',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'scalp',
    tags: ['mt5-import', 'scalp'],
    emotion: 'disciplined',
    notes: 'Quick momentum continuation (+46.88)',
    followedPlan: true,
  },
  {
    id: 'sample-10',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.20,
    entryPrice: 3770.49,
    exitPrice: 3769.07,
    pnl: 28.26,
    pips: 14.1,
    rMultiple: 1.2,
    date: '2026-11-18',
    time: '11:02:53',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'scalp',
    tags: ['mt5-import', 'scalp'],
    emotion: 'calm',
    notes: 'Pre-lunch scalp profit taken (+28.26)',
    followedPlan: true,
  },
  {
    id: 'sample-11',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3769.13,
    exitPrice: 3775.37,
    pnl: -62.48,
    pips: -62.4,
    rMultiple: -1.0,
    date: '2026-11-18',
    time: '11:25:45',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'reversal',
    tags: ['mt5-import', 'reversal'],
    emotion: 'fomo',
    notes: 'FOMO top pick stopped out (-62.48)',
    followedPlan: false,
  },
  {
    id: 'sample-12',
    selected: true,
    pair: 'XAUUSD',
    direction: 'BUY',
    lots: 0.10,
    entryPrice: 3780.61,
    exitPrice: 3780.35,
    pnl: -2.57,
    pips: -2.6,
    rMultiple: -0.1,
    date: '2026-11-18',
    time: '11:46:16',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'range',
    tags: ['mt5-import', 'range'],
    emotion: 'disciplined',
    notes: 'Tight stop scratch trade (-2.57)',
    followedPlan: true,
  },
  {
    id: 'sample-13',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.20,
    entryPrice: 3780.96,
    exitPrice: 3774.74,
    pnl: 124.40,
    pips: 62.2,
    rMultiple: 2.8,
    date: '2026-11-18',
    time: '12:24:40',
    session: 'London/NY Overlap',
    status: 'CLOSED',
    setupTag: 'trend',
    tags: ['mt5-import', 'trend'],
    emotion: 'confident',
    notes: 'Big winner on US pre-market dump (+124.40)',
    followedPlan: true,
  },
  {
    id: 'sample-14',
    selected: true,
    pair: 'XAUUSD',
    direction: 'SELL',
    lots: 0.10,
    entryPrice: 3767.10,
    exitPrice: 3770.22,
    pnl: -31.28,
    pips: -31.2,
    rMultiple: -1.0,
    date: '2026-11-18',
    time: '10:30:24',
    session: 'London',
    status: 'CLOSED',
    setupTag: 'breakout',
    tags: ['mt5-import', 'breakout'],
    emotion: 'hesitant',
    notes: 'Slippage on sell stop exit (-31.28)',
    followedPlan: true,
  },
];

/**
 * Recognize an image file using Tesseract.js in the browser
 */
export const runBrowserOcr = async (imageFileOrUrl, onProgress = () => {}) => {
  const worker = await createWorker('eng');

  if (onProgress) {
    // Tesseract worker event listeners or logger
    worker.reInitialize = true;
  }

  const ret = await worker.recognize(imageFileOrUrl);
  await worker.terminate();

  return ret.data.text;
};

