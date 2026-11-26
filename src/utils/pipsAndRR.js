/**
 * Professional Forex, Crypto, Indices, and Commodities Pip & R:R Calculations
 */

/**
 * Returns the exact pip multiplier and pip size for any given trading pair/instrument.
 * 
 * Rules:
 * - Standard Forex (EURUSD, GBPUSD, USDCAD, etc.): 1 pip = 0.0001 (Multiplier = 10,000)
 * - JPY Forex Pairs (USDJPY, EURJPY, GBPJPY, etc.): 1 pip = 0.01 (Multiplier = 100)
 * - Gold (XAUUSD, GOLD): $0.10 price move = 1.0 pip (Multiplier = 10). $1 move = 10 pips.
 * - Silver (XAGUSD, SILVER): $0.01 move = 1.0 pip (Multiplier = 100).
 * - Crypto (BTCUSD, ETHUSD, SOLUSD, etc.): $1.00 move = 1.0 point/pip (Multiplier = 1)
 * - Indices (US30, NAS100, SPX500, GER30, etc.): 1.0 index point = 1.0 point/pip (Multiplier = 1)
 * - Oil (USOIL, UKOIL, WTI, BRENT): $0.01 move = 1.0 pip (Multiplier = 100)
 */
export const getPairPipDetails = (rawPair = '') => {
  const pair = (rawPair || '').toUpperCase().replace(/[\/\-_ ]/g, '');

  // 1. Gold (XAUUSD, GOLD)
  if (pair.includes('XAU') || pair.includes('GOLD')) {
    return {
      type: 'GOLD',
      multiplier: 10,       // $0.10 change = 1.0 pip. E.g. $10 move = 100 pips
      pipSize: 0.1,
      decimals: 1,
      unitName: 'pips',
      lotUnitSize: 100,     // 1 standard lot = 100 oz of gold ($10 per pip on 1 lot)
    };
  }

  // 2. Silver (XAGUSD, SILVER)
  if (pair.includes('XAG') || pair.includes('SILVER')) {
    return {
      type: 'SILVER',
      multiplier: 100,      // $0.01 change = 1.0 pip
      pipSize: 0.01,
      decimals: 1,
      unitName: 'pips',
      lotUnitSize: 5000,
    };
  }

  // 3. Crypto: Bitcoin, Ethereum, Solana, etc.
  if (
    pair.includes('BTC') ||
    pair.includes('ETH') ||
    pair.includes('SOL') ||
    pair.includes('XRP') ||
    pair.includes('BNB') ||
    pair.includes('DOGE') ||
    pair.includes('ADA')
  ) {
    // For coins with price > $10 (BTC, ETH, SOL, BNB), 1 point = $1
    const isMicroCrypto = pair.includes('XRP') || pair.includes('DOGE') || pair.includes('ADA');
    return {
      type: 'CRYPTO',
      multiplier: isMicroCrypto ? 100 : 1,
      pipSize: isMicroCrypto ? 0.01 : 1.0,
      decimals: isMicroCrypto ? 1 : 1,
      unitName: 'points',
      lotUnitSize: 1,       // 1 lot = 1 coin
    };
  }

  // 4. Indices (US30, NAS100, USTEC, SPX500, US500, GER30, GER40, DAX, UK100, etc.)
  if (
    pair.includes('US30') ||
    pair.includes('DJ30') ||
    pair.includes('DOW') ||
    pair.includes('NAS100') ||
    pair.includes('USTEC') ||
    pair.includes('NDX') ||
    pair.includes('SPX') ||
    pair.includes('US500') ||
    pair.includes('GER30') ||
    pair.includes('GER40') ||
    pair.includes('DAX') ||
    pair.includes('UK100') ||
    pair.includes('JP225') ||
    pair.includes('HK50')
  ) {
    return {
      type: 'INDEX',
      multiplier: 1,        // 1 index point = 1.0 point
      pipSize: 1.0,
      decimals: 1,
      unitName: 'pts',
      lotUnitSize: 1,
    };
  }

  // 5. Commodities: Oil (USOIL, UKOIL, WTI, BRENT, CRUDE)
  if (
    pair.includes('OIL') ||
    pair.includes('WTI') ||
    pair.includes('BRENT') ||
    pair.includes('CRUDE')
  ) {
    return {
      type: 'OIL',
      multiplier: 100,      // $0.01 move = 1.0 pip
      pipSize: 0.01,
      decimals: 1,
      unitName: 'pips',
      lotUnitSize: 1000,    // 1 lot = 1,000 barrels ($10 per pip on 1 lot)
    };
  }

  // 6. JPY Forex Pairs (USDJPY, EURJPY, GBPJPY, AUDJPY, CADJPY, CHFJPY, NZDJPY)
  if (pair.includes('JPY')) {
    return {
      type: 'FOREX_JPY',
      multiplier: 100,      // 0.01 = 1.0 pip (2nd decimal)
      pipSize: 0.01,
      decimals: 1,
      unitName: 'pips',
      lotUnitSize: 100000,  // 1 standard lot = 100,000 units (~$6.5 - $9.5/pip)
    };
  }

  // 7. Standard Forex (EURUSD, GBPUSD, AUDUSD, NZDUSD, USDCAD, USDCHF, etc.)
  return {
    type: 'FOREX_STANDARD',
    multiplier: 10000,      // 0.0001 = 1.0 pip (4th decimal)
    pipSize: 0.0001,
    decimals: 1,
    unitName: 'pips',
    lotUnitSize: 100000,    // 1 standard lot = 100,000 units ($10 per pip on EURUSD)
  };
};

/**
 * Calculates pips accurately based on pair, direction, entry price, and target price (exit, SL, or TP).
 */
export const calculatePipsBetween = (pair = '', direction = 'BUY', startPrice = 0, endPrice = 0) => {
  const start = parseFloat(startPrice);
  const end = parseFloat(endPrice);
  if (isNaN(start) || isNaN(end) || start === 0) return 0;

  const isBuy = (direction || '').toUpperCase() === 'BUY';
  const priceDiff = isBuy ? end - start : start - end;

  const { multiplier, decimals } = getPairPipDetails(pair);
  return parseFloat((priceDiff * multiplier).toFixed(decimals));
};

/**
 * Calculates Planned Risk-to-Reward Ratio (Planned R:R) from Entry, Stop Loss, and Take Profit.
 * 
 * Returns:
 * {
 *   isValid: boolean,
 *   ratio: number | null,         // e.g. 2.5 (meaning 1 : 2.5)
 *   ratioFormatted: string,       // e.g. "1 : 2.50"
 *   riskDistance: number | null,   // raw price distance
 *   riskPips: number | null,       // in pips
 *   rewardDistance: number | null, // raw price distance
 *   rewardPips: number | null,     // in pips
 *   warning: string | null,        // e.g. "Stop Loss is above Entry for BUY"
 * }
 */
export const calculatePlannedRR = (pair = '', direction = 'BUY', entryPrice = '', stopLoss = '', takeProfit = '') => {
  const entry = parseFloat(entryPrice);
  const sl = parseFloat(stopLoss);
  const tp = parseFloat(takeProfit);

  if (isNaN(entry) || entry <= 0) {
    return { isValid: false, ratio: null, ratioFormatted: '-', riskDistance: null, riskPips: null, rewardDistance: null, rewardPips: null, warning: null };
  }

  const isBuy = (direction || '').toUpperCase() === 'BUY';
  const { multiplier, decimals, unitName } = getPairPipDetails(pair);

  let warning = null;
  let riskDistance = null;
  let riskPips = null;
  let rewardDistance = null;
  let rewardPips = null;
  let ratio = null;
  let ratioFormatted = '-';

  // Check Stop Loss
  if (!isNaN(sl) && sl > 0) {
    if (isBuy) {
      if (sl >= entry) {
        warning = 'Stop Loss must be BELOW Entry for a BUY order';
      } else {
        riskDistance = parseFloat((entry - sl).toFixed(5));
        riskPips = parseFloat((riskDistance * multiplier).toFixed(decimals));
      }
    } else {
      // SELL
      if (sl <= entry) {
        warning = 'Stop Loss must be ABOVE Entry for a SELL order';
      } else {
        riskDistance = parseFloat((sl - entry).toFixed(5));
        riskPips = parseFloat((riskDistance * multiplier).toFixed(decimals));
      }
    }
  }

  // Check Take Profit
  if (!isNaN(tp) && tp > 0) {
    if (isBuy) {
      if (tp <= entry) {
        warning = warning || 'Take Profit must be ABOVE Entry for a BUY order';
      } else {
        rewardDistance = parseFloat((tp - entry).toFixed(5));
        rewardPips = parseFloat((rewardDistance * multiplier).toFixed(decimals));
      }
    } else {
      // SELL
      if (tp >= entry) {
        warning = warning || 'Take Profit must be BELOW Entry for a SELL order';
      } else {
        rewardDistance = parseFloat((entry - tp).toFixed(5));
        rewardPips = parseFloat((rewardDistance * multiplier).toFixed(decimals));
      }
    }
  }

  // Calculate Planned R:R if both Risk and Reward distances are valid
  if (riskDistance != null && riskDistance > 0 && rewardDistance != null && rewardDistance > 0) {
    ratio = parseFloat((rewardDistance / riskDistance).toFixed(2));
    ratioFormatted = `1 : ${ratio.toFixed(2)}`;
  }

  return {
    isValid: ratio !== null && ratio > 0 && !warning,
    ratio,
    ratioFormatted,
    riskDistance,
    riskPips,
    rewardDistance,
    rewardPips,
    unitName,
    warning,
  };
};

/**
 * Calculates Realized R-Multiple & Realized Pips when trade is closed.
 * 
 * Returns:
 * {
 *   pips: number | null,
 *   rMultiple: number | null,
 *   rMultipleFormatted: string,
 *   estimatedPnl: number | null,
 * }
 */
export const calculateRealizedTradeStats = (pair = '', direction = 'BUY', entryPrice = '', exitPrice = '', stopLoss = '', lots = 0.1) => {
  const entry = parseFloat(entryPrice);
  const exit = parseFloat(exitPrice);
  const sl = parseFloat(stopLoss);
  const lotNum = parseFloat(lots) || 0.1;

  if (isNaN(entry) || isNaN(exit) || entry <= 0 || exit <= 0) {
    return { pips: null, rMultiple: null, rMultipleFormatted: '-', estimatedPnl: null };
  }

  const isBuy = (direction || '').toUpperCase() === 'BUY';
  const priceDiff = isBuy ? exit - entry : entry - exit;

  const { multiplier, decimals, type, lotUnitSize } = getPairPipDetails(pair);
  const pips = parseFloat((priceDiff * multiplier).toFixed(decimals));

  // R-Multiple calculation
  let rMultiple = null;
  let rMultipleFormatted = '-';

  if (!isNaN(sl) && sl > 0) {
    const riskDistance = isBuy ? entry - sl : sl - entry;
    if (Math.abs(riskDistance) > 0.000001) {
      rMultiple = parseFloat((priceDiff / Math.abs(riskDistance)).toFixed(2));
      rMultipleFormatted = `${rMultiple >= 0 ? '+' : ''}${rMultiple.toFixed(2)}R`;
    }
  }

  // Estimated P&L calculation in USD
  let estimatedPnl = null;
  if (type === 'GOLD') {
    // 1 standard lot = 100 oz. $1 price change = $100 per lot.
    estimatedPnl = parseFloat((priceDiff * 100 * lotNum).toFixed(2));
  } else if (type === 'SILVER') {
    // 1 standard lot = 5000 oz.
    estimatedPnl = parseFloat((priceDiff * 5000 * lotNum).toFixed(2));
  } else if (type === 'CRYPTO') {
    // 1 lot = 1 coin
    estimatedPnl = parseFloat((priceDiff * lotNum).toFixed(2));
  } else if (type === 'INDEX') {
    // 1 lot = $1 per point (standard CFD contract)
    estimatedPnl = parseFloat((priceDiff * lotNum).toFixed(2));
  } else if (type === 'OIL') {
    // 1 lot = 1,000 barrels
    estimatedPnl = parseFloat((priceDiff * 1000 * lotNum).toFixed(2));
  } else {
    // Standard Forex: ~$10 per pip on 1.0 standard lot for USD quote pairs
    estimatedPnl = parseFloat((pips * lotNum * 10).toFixed(2));
  }

  return {
    pips,
    rMultiple,
    rMultipleFormatted,
    estimatedPnl,
  };
};

/**
 * Resolves the accurate, pair-aware effective pips for any trade.
 * If entryPrice and exitPrice exist, calculates the true pips dynamically using pair multipliers.
 * Otherwise falls back to stored trade.pips if valid.
 */
export const getEffectiveTradePips = (trade) => {
  if (!trade) return null;
  const entry = parseFloat(trade.entryPrice);
  const exit = parseFloat(trade.exitPrice);

  if (!isNaN(entry) && !isNaN(exit) && entry > 0 && exit > 0) {
    return calculatePipsBetween(trade.pair, trade.direction, entry, exit);
  }

  if (trade.pips !== undefined && trade.pips !== null && !isNaN(parseFloat(trade.pips))) {
    return parseFloat(trade.pips);
  }

  return null;
};

/**
 * Resolves the accurate, effective R (Planned R:R or Realized R-Multiple) for any trade.
 * - For OPEN trades: calculates Planned R:R if entry, SL, and TP exist.
 * - For CLOSED trades: calculates Realized R-Multiple if entry, exit, and SL exist.
 * - If no SL exists: returns null (displaying '-') because risk was never defined,
 *   filtering out any old fake/mock values (-1.0 or 1.5).
 */
export const getEffectiveTradeRR = (trade) => {
  if (!trade) return { ratio: null, formatted: '-', isPlanned: false };

  const entry = parseFloat(trade.entryPrice);
  const exit = parseFloat(trade.exitPrice);
  const sl = parseFloat(trade.stopLoss);
  const tp = parseFloat(trade.takeProfit);
  const isClosed = trade.status === 'CLOSED' || (trade.status !== 'OPEN' && !isNaN(exit) && exit > 0);

  // 1. Closed Trade with Stop Loss -> Exact Realized R-Multiple
  if (isClosed && !isNaN(entry) && !isNaN(exit) && !isNaN(sl) && entry > 0 && exit > 0 && sl > 0) {
    const isBuy = (trade.direction || '').toUpperCase() === 'BUY';
    const riskDistance = isBuy ? entry - sl : sl - entry;
    const priceDiff = isBuy ? exit - entry : entry - exit;

    if (Math.abs(riskDistance) > 0.000001) {
      const r = parseFloat((priceDiff / Math.abs(riskDistance)).toFixed(2));
      return {
        ratio: r,
        formatted: `${r >= 0 ? '+' : ''}${r.toFixed(2)}R`,
        isPlanned: false,
      };
    }
  }

  // 2. Open Trade with SL and TP -> Planned Risk:Reward Ratio
  if (!isClosed && !isNaN(entry) && entry > 0 && !isNaN(sl) && sl > 0 && !isNaN(tp) && tp > 0) {
    const planned = calculatePlannedRR(trade.pair, trade.direction, entry, sl, tp);
    if (planned.isValid && planned.ratio !== null) {
      return {
        ratio: planned.ratio,
        formatted: planned.ratioFormatted,
        isPlanned: true,
      };
    }
  }

  // 3. User manual rMultiple override (if trade has an explicitly saved valid value,
  // but exclude dummy placeholder values when no SL is set)
  if (trade.rMultiple !== undefined && trade.rMultiple !== null && !isNaN(parseFloat(trade.rMultiple))) {
    const rVal = parseFloat(trade.rMultiple);
    // If no SL was provided and rVal is exactly -1.0 or 1.5 from old OCR/default mock, return null
    if ((isNaN(sl) || sl <= 0) && (rVal === -1 || rVal === 1.5)) {
      return { ratio: null, formatted: '-', isPlanned: false };
    }
    return {
      ratio: rVal,
      formatted: `${rVal >= 0 ? '+' : ''}${rVal.toFixed(2)}R`,
      isPlanned: false,
    };
  }

  return { ratio: null, formatted: '-', isPlanned: false };
};
