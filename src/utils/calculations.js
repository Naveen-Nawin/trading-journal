// Statistical calculations for Forex Journal

export const calculateStats = (trades = []) => {
  const closedTrades = trades
    .filter((t) => t.status === 'CLOSED' && typeof t.pnl === 'number')
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const openTrades = trades.filter((t) => t.status === 'OPEN');

  const closedCount = closedTrades.length;
  const openCount = openTrades.length;
  const totalCount = trades.length;

  if (closedCount === 0) {
    return {
      totalCount,
      closedCount,
      openCount,
      netPnl: 0,
      grossProfit: 0,
      grossLoss: 0,
      winRate: 0,
      winCount: 0,
      lossCount: 0,
      avgWin: 0,
      avgLoss: 0,
      profitFactor: 0,
      avgRMultiple: 0,
      planComplianceRate: 0,
      bestTrade: 0,
      worstTrade: 0,
      maxDrawdown: 0,
      equityCurve: [{ date: 'Start', pnl: 0, cumPnl: 0 }],
      pairBreakdown: [],
      sessionBreakdown: [],
      setupBreakdown: [],
    };
  }

  let grossProfit = 0;
  let grossLoss = 0;
  let winCount = 0;
  let lossCount = 0;
  let totalR = 0;
  let rCount = 0;
  let planFollowedCount = 0;
  let bestTrade = 0;
  let worstTrade = 0;

  // Running cumulative equity
  let cumPnl = 0;
  let peak = 0;
  let maxDrawdown = 0;

  const equityCurve = [
    { date: '10-05', pnl: 0, cumPnl: 0 }
  ];

  closedTrades.forEach((trade) => {
    const pnl = trade.pnl || 0;
    cumPnl += pnl;

    if (pnl > 0) {
      grossProfit += pnl;
      winCount++;
      if (pnl > bestTrade) bestTrade = pnl;
    } else if (pnl < 0) {
      grossLoss += pnl; // will be negative
      lossCount++;
      if (pnl < worstTrade) worstTrade = pnl;
    }

    if (typeof trade.rMultiple === 'number' && !isNaN(trade.rMultiple)) {
      totalR += trade.rMultiple;
      rCount++;
    }

    if (trade.followedPlan) {
      planFollowedCount++;
    }

    // Drawdown calculation
    if (cumPnl > peak) {
      peak = cumPnl;
    }
    const currentDrawdown = cumPnl - peak; // negative or 0
    if (currentDrawdown < maxDrawdown) {
      maxDrawdown = currentDrawdown;
    }

    const d = new Date(trade.date);
    const dateLabel = !isNaN(d.getTime())
      ? `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
      : trade.date;

    equityCurve.push({
      date: dateLabel,
      fullDate: trade.date,
      pnl,
      cumPnl,
      pair: trade.pair,
    });
  });

  const netPnl = grossProfit + grossLoss;
  const winRate = closedCount > 0 ? (winCount / closedCount) * 100 : 0;
  const avgWin = winCount > 0 ? grossProfit / winCount : 0;
  const avgLoss = lossCount > 0 ? grossLoss / lossCount : 0;
  const profitFactor = Math.abs(grossLoss) > 0 ? grossProfit / Math.abs(grossLoss) : grossProfit > 0 ? 99 : 0;
  const avgRMultiple = rCount > 0 ? totalR / rCount : 0;
  const planComplianceRate = closedCount > 0 ? (planFollowedCount / closedCount) * 100 : 0;

  // Pair Breakdown
  const pairMap = {};
  closedTrades.forEach((t) => {
    const pair = t.pair || 'Other';
    if (!pairMap[pair]) {
      pairMap[pair] = { name: pair, count: 0, wins: 0, pnl: 0 };
    }
    pairMap[pair].count++;
    if (t.pnl > 0) pairMap[pair].wins++;
    pairMap[pair].pnl += t.pnl || 0;
  });

  const pairBreakdown = Object.values(pairMap).map((item) => ({
    ...item,
    winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
  })).sort((a, b) => b.pnl - a.pnl);

  // Session Breakdown
  const sessionMap = {};
  closedTrades.forEach((t) => {
    const session = (t.session || 'London').toLowerCase();
    const key = session.includes('overlap') ? 'overlap' : session;
    if (!sessionMap[key]) {
      sessionMap[key] = { name: key, count: 0, wins: 0, pnl: 0 };
    }
    sessionMap[key].count++;
    if (t.pnl > 0) sessionMap[key].wins++;
    sessionMap[key].pnl += t.pnl || 0;
  });

  const sessionBreakdown = Object.values(sessionMap).map((item) => ({
    ...item,
    winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
  })).sort((a, b) => b.pnl - a.pnl);

  // Setup Tag Breakdown
  const setupMap = {};
  closedTrades.forEach((t) => {
    const tag = (t.setupTag || 'other').toLowerCase();
    if (!setupMap[tag]) {
      setupMap[tag] = { name: tag, count: 0, wins: 0, pnl: 0 };
    }
    setupMap[tag].count++;
    if (t.pnl > 0) setupMap[tag].wins++;
    setupMap[tag].pnl += t.pnl || 0;
  });

  const setupBreakdown = Object.values(setupMap).map((item) => ({
    ...item,
    winRate: item.count > 0 ? (item.wins / item.count) * 100 : 0,
  })).sort((a, b) => b.pnl - a.pnl);

  return {
    totalCount,
    closedCount,
    openCount,
    netPnl,
    grossProfit,
    grossLoss,
    winRate,
    winCount,
    lossCount,
    avgWin,
    avgLoss,
    profitFactor,
    avgRMultiple,
    planComplianceRate,
    bestTrade: bestTrade === -Infinity ? 0 : bestTrade,
    worstTrade: worstTrade === Infinity ? 0 : worstTrade,
    maxDrawdown,
    equityCurve,
    pairBreakdown,
    sessionBreakdown,
    setupBreakdown,
  };
};

// Calendar calculations for a specific month & year
export const calculateCalendarMonth = (trades = [], year, month) => {
  // month: 0-indexed (0 for Jan, 10 for Nov)
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = (new Date(year, month, 1).getDay() + 6) % 7; // 0 for Monday, 6 for Sunday

  const dailyMap = {};
  let monthTotalPnl = 0;
  let bestDayPnl = 0;
  let worstDayPnl = 0;
  let activeTradingDays = 0;

  trades
    .filter((t) => t.status === 'CLOSED')
    .forEach((t) => {
      const d = new Date(t.date);
      if (!isNaN(d.getTime())) {
        const tYear = d.getFullYear();
        const tMonth = d.getMonth();
        const dayNum = d.getDate();

        if (tYear === year && tMonth === month) {
          if (!dailyMap[dayNum]) {
            dailyMap[dayNum] = { day: dayNum, pnl: 0, count: 0, trades: [] };
          }
          dailyMap[dayNum].pnl += t.pnl || 0;
          dailyMap[dayNum].count += 1;
          dailyMap[dayNum].trades.push(t);
        }
      }
    });

  // Calculate day-level stats
  Object.values(dailyMap).forEach((dayData) => {
    activeTradingDays++;
    monthTotalPnl += dayData.pnl;
    if (dayData.pnl > bestDayPnl) bestDayPnl = dayData.pnl;
    if (dayData.pnl < worstDayPnl) worstDayPnl = dayData.pnl;
  });

  return {
    daysInMonth,
    firstDayIndex,
    dailyMap,
    monthTotalPnl,
    bestDayPnl,
    worstDayPnl,
    activeTradingDays,
  };
};

