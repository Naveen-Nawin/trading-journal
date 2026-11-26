import React, { useState, useMemo } from 'react';
import { RotateCcw, Calculator, Target } from 'lucide-react';

const MARKETS = {
  xau: {
    id: 'xau',
    name: 'XAU/USD',
    badge: 'Gold',
    title: 'XAUUSD Profit Calculator',
    sizeLabel: 'Lot Size',
    pointsLabel: 'Points Captured',
    slLabel: 'Stop Loss Points',
    valueLabel: 'Value / Point',
    targetLabel: 'Account Target ($)',
    currency: '$',
    defaultSize: 0.08,
    step: 0.01,
    baseLot: 0.08,
    basePoints: 6.5,
    baseProfit: 54.72,
    type: 'xau',
    footer: '0.08 Lots = $54.72 Profit at 6.5 Points ($8.418 / pt on 0.08)',
    pointShortcuts: [2.5, 5.0, 6.5, 10.0, 15.0, 20.0],
  },
  eurusd: {
    id: 'eurusd',
    name: 'EUR/USD',
    badge: 'Forex Major',
    title: 'EUR/USD Pip & Profit Calculator',
    sizeLabel: 'Lot Size',
    pointsLabel: 'Pips Captured (1 pip = 0.0001)',
    slLabel: 'Stop Loss Pips',
    valueLabel: 'Value / Pip',
    targetLabel: 'Account Target ($)',
    currency: '$',
    defaultSize: 0.10,
    step: 0.01,
    unitsPerLot: 100000,
    pipValuePerLot: 10,
    type: 'forex',
    footer: '1 Standard Lot = $10.00 / Pip • 0.10 Mini Lot = $1.00 / Pip • 0.01 Micro = $0.10 / Pip',
    pointShortcuts: [10, 15, 20, 30, 50, 100],
  },
  gbpusd: {
    id: 'gbpusd',
    name: 'GBP/USD',
    badge: 'Cable / Major',
    title: 'GBP/USD Pip & Profit Calculator',
    sizeLabel: 'Lot Size',
    pointsLabel: 'Pips Captured (1 pip = 0.0001)',
    slLabel: 'Stop Loss Pips',
    valueLabel: 'Value / Pip',
    targetLabel: 'Account Target ($)',
    currency: '$',
    defaultSize: 0.10,
    step: 0.01,
    unitsPerLot: 100000,
    pipValuePerLot: 10,
    type: 'forex',
    footer: '1 Standard Lot = $10.00 / Pip • 0.10 Mini Lot = $1.00 / Pip • 0.01 Micro = $0.10 / Pip',
    pointShortcuts: [10, 15, 25, 40, 60, 100],
  },
  eth: {
    id: 'eth',
    name: 'ETH',
    badge: 'Crypto',
    title: 'ETH/USD Profit Calculator',
    sizeLabel: 'ETH Quantity',
    pointsLabel: 'Points Captured ($)',
    slLabel: 'Stop Loss Points ($)',
    valueLabel: 'Value / Point',
    targetLabel: 'Account Target ($)',
    currency: '$',
    defaultSize: 2.64,
    step: 0.01,
    type: 'eth',
    footer: 'P/L = ETH Quantity × Price Movement ($1 = 1 Point)',
    pointShortcuts: [10, 25, 50, 100, 200],
  },
  nifty: {
    id: 'nifty',
    name: 'NIFTY',
    badge: '1 Lot = 65 Qty',
    title: 'NIFTY Profit Calculator',
    sizeLabel: 'Lot Size',
    pointsLabel: 'Points Captured',
    slLabel: 'Stop Loss Points',
    valueLabel: 'Value / Point',
    targetLabel: 'Account Target (₹)',
    currency: '₹',
    defaultSize: 1,
    step: 1,
    quantityPerLot: 65,
    type: 'index',
    footer: '1 Lot = 65 Quantity • Value / Point = ₹65 per Lot',
    pointShortcuts: [20, 40, 60, 100, 150],
  },
  sensex: {
    id: 'sensex',
    name: 'SENSEX',
    badge: '1 Lot = 20 Qty',
    title: 'SENSEX Profit Calculator',
    sizeLabel: 'Lot Size',
    pointsLabel: 'Points Captured',
    slLabel: 'Stop Loss Points',
    valueLabel: 'Value / Point',
    targetLabel: 'Account Target (₹)',
    currency: '₹',
    defaultSize: 1,
    step: 1,
    quantityPerLot: 20,
    type: 'index',
    footer: '1 Lot = 20 Quantity • Value / Point = ₹20 per Lot',
    pointShortcuts: [50, 100, 200, 300, 500],
  },
};

export const TradingCalculator = ({ isEmbedded = false }) => {
  const [currentMarket, setCurrentMarket] = useState('xau');
  const config = MARKETS[currentMarket];

  const [size, setSize] = useState(config.defaultSize);
  const [points, setPoints] = useState(0);
  const [sl, setSl] = useState(0);
  const [target, setTarget] = useState(1000);

  const handleSelectMarket = (marketKey) => {
    setCurrentMarket(marketKey);
    const newConfig = MARKETS[marketKey];
    setSize(newConfig.defaultSize);
    setPoints(0);
    setSl(0);
    setTarget(1000);
  };

  const resetCalculator = () => {
    setSize(config.defaultSize);
    setPoints(0);
    setSl(0);
    setTarget(1000);
  };

  // Calculations
  const results = useMemo(() => {
    const s = parseFloat(size) || 0;
    const pts = parseFloat(points) || 0;
    const stopLoss = parseFloat(sl) || 0;
    const tgt = parseFloat(target) || 0;

    let quantity = 0;
    let valuePerPoint = 0;
    let profit = 0;
    let loss = 0;

    if (config.type === 'xau') {
      quantity = s;
      valuePerPoint = config.baseProfit / config.basePoints / config.baseLot;
      profit = config.baseProfit * (s / config.baseLot) * (pts / config.basePoints);
      loss = config.baseProfit * (s / config.baseLot) * (stopLoss / config.basePoints);
    } else if (config.type === 'forex') {
      // Forex Standard: 1 standard lot = 100,000 units. Pip value = lot * $10
      quantity = s * config.unitsPerLot;
      valuePerPoint = s * config.pipValuePerLot;
      profit = valuePerPoint * pts;
      loss = valuePerPoint * stopLoss;
    } else if (config.type === 'eth') {
      quantity = s;
      valuePerPoint = quantity;
      profit = quantity * pts;
      loss = quantity * stopLoss;
    } else if (config.type === 'index') {
      quantity = s * config.quantityPerLot;
      valuePerPoint = quantity;
      profit = quantity * pts;
      loss = quantity * stopLoss;
    }

    const rr = stopLoss > 0 ? (pts / stopLoss).toFixed(2) : '0';
    const targetPercentNum = tgt > 0 ? (profit / tgt) * 100 : 0;
    const targetPercent = targetPercentNum.toFixed(2);

    return {
      quantity,
      valuePerPoint,
      profit,
      loss,
      rr,
      targetPercentNum,
      targetPercent,
    };
  }, [currentMarket, config, size, points, sl, target]);

  return (
    <div className={`w-full max-w-3xl mx-auto rounded-2xl border border-border bg-card/90 backdrop-blur-xl shadow-2xl p-5 sm:p-7 space-y-6 animate-rise ${isEmbedded ? 'mt-8' : ''}`}>
      {/* Header bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/80 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
            <Calculator className="w-4 h-4 text-sky-400" />
            <span>Position Size & Profit Engine</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-foreground tracking-tight mt-1 flex items-center gap-2">
            <span>{config.title}</span>
            <span className="text-xs px-2 py-0.5 rounded-md font-mono font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">
              {config.badge}
            </span>
          </h2>
        </div>

        <button
          type="button"
          onClick={resetCalculator}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-border bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground text-xs font-semibold transition cursor-pointer self-start sm:self-auto"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>Reset</span>
        </button>
      </div>

      {/* Market Selector Buttons (6 Tabs) */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-1.5 bg-secondary/30 p-1.5 rounded-xl border border-border/60">
        {Object.keys(MARKETS).map((marketKey) => {
          const m = MARKETS[marketKey];
          const isActive = currentMarket === marketKey;
          return (
            <button
              key={marketKey}
              type="button"
              onClick={() => handleSelectMarket(marketKey)}
              className={`py-2 px-2 rounded-lg text-xs sm:text-sm font-bold font-num transition-all cursor-pointer flex items-center justify-center gap-1 ${
                isActive
                  ? 'bg-sky-400 text-slate-950 shadow-[0_0_15px_rgba(56,189,248,0.4)] font-extrabold'
                  : 'text-muted-foreground hover:text-foreground hover:bg-secondary/60'
              }`}
            >
              <span>{m.name}</span>
            </button>
          );
        })}
      </div>

      {/* Inputs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Size Input */}
        <div className="space-y-1.5 bg-secondary/20 p-3.5 rounded-xl border border-border/60">
          <label className="block text-xs font-bold tracking-wide uppercase text-muted-foreground">
            {config.sizeLabel}
          </label>
          <input
            type="number"
            value={size}
            onChange={(e) => setSize(e.target.value)}
            step={config.step}
            min="0"
            className="w-full bg-secondary/60 text-foreground font-num font-bold text-base border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
          />
        </div>

        {/* Target Input */}
        <div className="space-y-1.5 bg-secondary/20 p-3.5 rounded-xl border border-border/60">
          <label className="block text-xs font-bold tracking-wide uppercase text-muted-foreground">
            {config.targetLabel}
          </label>
          <input
            type="number"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            step="1"
            min="0"
            className="w-full bg-secondary/60 text-foreground font-num font-bold text-base border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition"
          />
        </div>

        {/* Points / Pips Captured */}
        <div className="space-y-1.5 bg-secondary/20 p-3.5 rounded-xl border border-border/60">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold tracking-wide uppercase text-profit">
              {config.pointsLabel || 'Points Captured (Profit)'}
            </label>
            <span className="text-[10px] text-muted-foreground font-mono">gain</span>
          </div>
          <input
            type="number"
            value={points}
            onChange={(e) => setPoints(e.target.value)}
            step="0.01"
            className="w-full bg-secondary/60 text-profit font-num font-bold text-base border border-profit/30 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-profit focus:ring-1 focus:ring-profit transition"
          />
          {/* Quick point shortcuts */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            {config.pointShortcuts.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setPoints(pt)}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-profit/10 hover:bg-profit/20 text-profit border border-profit/20 cursor-pointer transition shrink-0"
              >
                +{pt}
              </button>
            ))}
          </div>
        </div>

        {/* Stop Loss Points / Pips */}
        <div className="space-y-1.5 bg-secondary/20 p-3.5 rounded-xl border border-border/60">
          <div className="flex items-center justify-between">
            <label className="block text-xs font-bold tracking-wide uppercase text-loss">
              {config.slLabel || 'Stop Loss Points (Risk)'}
            </label>
            <span className="text-[10px] text-muted-foreground font-mono">sl distance</span>
          </div>
          <input
            type="number"
            value={sl}
            onChange={(e) => setSl(e.target.value)}
            step="0.01"
            min="0"
            className="w-full bg-secondary/60 text-loss font-num font-bold text-base border border-loss/30 rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-loss focus:ring-1 focus:ring-loss transition"
          />
          {/* Quick SL shortcuts */}
          <div className="flex items-center gap-1.5 pt-1 overflow-x-auto scrollbar-none">
            {config.pointShortcuts.map((pt) => (
              <button
                key={pt}
                type="button"
                onClick={() => setSl(pt)}
                className="px-2 py-0.5 rounded text-[10px] font-mono font-semibold bg-loss/10 hover:bg-loss/20 text-loss border border-loss/20 cursor-pointer transition shrink-0"
              >
                -{pt}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Result Cards (6 Cards Grid) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {/* Card 1: Profit */}
        <div className="bg-secondary/40 border border-profit/30 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-profit/60 transition">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Profit</span>
            <span className="w-2 h-2 rounded-full bg-profit animate-pulse" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-num text-profit truncate">
            {config.currency}{results.profit.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-profit/80 font-mono mt-1">Expected return</div>
        </div>

        {/* Card 2: Loss */}
        <div className="bg-secondary/40 border border-loss/30 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-loss/60 transition">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Loss</span>
            <span className="w-2 h-2 rounded-full bg-loss" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-num text-loss truncate">
            {config.currency}{results.loss.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-[10px] text-loss/80 font-mono mt-1">Maximum risk (SL)</div>
        </div>

        {/* Card 3: Risk : Reward */}
        <div className="bg-secondary/40 border border-amber-500/30 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-amber-500/60 transition">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Risk : Reward</span>
            <span className="w-2 h-2 rounded-full bg-amber-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-num text-amber-400 truncate">
            {results.rr} : 1
          </div>
          <div className="text-[10px] text-amber-400/80 font-mono mt-1">
            {parseFloat(results.rr) >= 2 ? 'Strong R:R Setup' : parseFloat(results.rr) >= 1 ? 'Balanced Setup' : 'Sub-1.0 R:R'}
          </div>
        </div>

        {/* Card 4: Target Completion */}
        <div className="bg-secondary/40 border border-sky-500/30 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-sky-500/60 transition">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Target Progress</span>
            <Target className="w-3.5 h-3.5 text-sky-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-num text-sky-400 truncate">
            {results.targetPercent}%
          </div>
          {/* Mini progress bar */}
          <div className="w-full bg-secondary h-1.5 rounded-full mt-2 overflow-hidden">
            <div
              className="bg-sky-400 h-full rounded-full transition-all duration-300"
              style={{ width: `${Math.min(Math.max(results.targetPercentNum, 0), 100)}%` }}
            />
          </div>
        </div>

        {/* Card 5: Quantity */}
        <div className="bg-secondary/40 border border-purple-500/30 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-purple-500/60 transition">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>Effective Qty</span>
            <span className="w-2 h-2 rounded-full bg-purple-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-num text-purple-400 truncate">
            {config.type === 'eth'
              ? `${results.quantity.toFixed(2)} ETH`
              : config.type === 'forex'
              ? `${results.quantity.toLocaleString()} units`
              : results.quantity.toFixed(2)}
          </div>
          <div className="text-[10px] text-purple-400/80 font-mono mt-1">
            {config.type === 'forex' ? `${size} Standard Lots` : 'Actual position volume'}
          </div>
        </div>

        {/* Card 6: Value Per Point / Pip */}
        <div className="bg-secondary/40 border border-violet-500/30 rounded-xl p-4 flex flex-col justify-between shadow-xs hover:border-violet-500/60 transition">
          <div className="text-muted-foreground text-xs font-bold uppercase tracking-wider flex items-center justify-between">
            <span>{config.valueLabel || 'Value / Point'}</span>
            <span className="w-2 h-2 rounded-full bg-violet-400" />
          </div>
          <div className="mt-2 text-2xl sm:text-3xl font-black font-num text-violet-400 truncate">
            {config.currency}{results.valuePerPoint.toFixed(2)}
          </div>
          <div className="text-[10px] text-violet-400/80 font-mono mt-1">
            {config.type === 'forex' ? 'Per 1.0 pip movement' : 'Per 1.0 point move'}
          </div>
        </div>
      </div>

      {/* Footer Info Badge */}
      <div className="pt-2 border-t border-border/60 flex flex-col sm:flex-row items-center justify-between gap-2 text-xs font-mono text-muted-foreground">
        <div className="flex items-center gap-2">
          <span className="w-2 h-2 rounded-full bg-sky-400 shrink-0" />
          <span>{config.footer}</span>
        </div>
        <div className="text-[11px] text-muted-foreground/80">
          Live Real-time Computation
        </div>
      </div>
    </div>
  );
};
