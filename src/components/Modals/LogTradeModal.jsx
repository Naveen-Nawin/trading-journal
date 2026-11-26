import React, { useState, useRef, useEffect } from 'react';
import { X, ImagePlus, Camera, Sparkles, Lock, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { SESSIONS_LIST, isSessionActiveNow, getCurrentLiveSessionId } from '../../utils/sessionConfig';
import { calculatePlannedRR, calculateRealizedTradeStats, getPairPipDetails } from '../../utils/pipsAndRR';
import { nowTimeFormatted, formatTimeDisplay } from '../../utils/formatters';

const SESSIONS = [
  { value: 'London', label: 'London' },
  { value: 'New York', label: 'New York' },
  { value: 'Tokyo', label: 'Tokyo' },
  { value: 'London/NY Overlap', label: 'London/NY Overlap' },
  { value: 'Sydney', label: 'Sydney' },
];

const EMOTIONS = [
  'calm',
  'anxious',
  'confident',
  'fomo',
  'revenge',
  'hesitant',
  'bored',
  'disciplined',
];

const DEFAULT_TAGS = [
  'breakout',
  'trend',
  'reversal',
  'range',
  'news',
  'scalp',
  'swing',
  's/r',
  'supply/demand',
  'fibonacci',
];

const todayFormatted = () => {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

export const LogTradeModal = () => {
  const {
    isLogTradeOpen,
    setIsLogTradeOpen,
    logTrade,
    rules,
    currency,
    setIsScanModalOpen,
    todayTradesCount,
    isDailyLocked,
    isDailyWarning,
    triggerDisciplineAlert,
  } = useTrading();

  const [pair, setPair] = useState('XAUUSD');
  const [direction, setDirection] = useState('buy'); // 'buy' or 'sell'
  const [lots, setLots] = useState('');
  const [entryPrice, setEntryPrice] = useState('');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [session, setSession] = useState(() => getCurrentLiveSessionId());
  const [isClosed, setIsClosed] = useState(false);
  const [exitPrice, setExitPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [closedAt, setClosedAt] = useState(todayFormatted());
  const [emotion, setEmotion] = useState('calm');
  const [openedAt, setOpenedAt] = useState(todayFormatted());
  const [entryTime, setEntryTime] = useState(() => nowTimeFormatted());
  const [exitTime, setExitTime] = useState(() => nowTimeFormatted());
  const [tags, setTags] = useState(['breakout']);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [exitPreview, setExitPreview] = useState(null);
  const [followedPlan, setFollowedPlan] = useState(false);

  const fileRef = useRef(null);
  const exitFileRef = useRef(null);

  // Live Pair-Aware Pips & R:R calculations
  const plannedRR = calculatePlannedRR(pair, direction, entryPrice, stopLoss, takeProfit);
  const realizedStats = calculateRealizedTradeStats(pair, direction, entryPrice, exitPrice, stopLoss, lots);
  const pipDetails = getPairPipDetails(pair);

  useEffect(() => {
    if (isLogTradeOpen) {
      if (isDailyLocked) {
        triggerDisciplineAlert('lock', todayTradesCount);
      } else if (isDailyWarning) {
        triggerDisciplineAlert('warning', todayTradesCount);
      }
      setPair('XAUUSD');
      setDirection('buy');
      setLots('');
      setEntryPrice('');
      setStopLoss('');
      setTakeProfit('');
      setSession(getCurrentLiveSessionId());
      setIsClosed(false);
      setExitPrice('');
      setPnl('');
      setClosedAt(todayFormatted());
      setEmotion('calm');
      setOpenedAt(todayFormatted());
      setEntryTime(nowTimeFormatted());
      setExitTime(nowTimeFormatted());
      setTags(['breakout']);
      setCustomTag('');
      setNotes('');
      setPreview(null);
      setExitPreview(null);
      setFollowedPlan(false);
    }
  }, [isLogTradeOpen, isDailyLocked, isDailyWarning]);

  if (!isLogTradeOpen) return null;

  const activeRulesCount = rules.filter((r) => r.active).length;

  const toggleTag = (tag) => {
    setTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleCustomTagKeyDown = (e) => {
    if (e.key === 'Enter' && customTag.trim()) {
      e.preventDefault();
      const clean = customTag.trim().toLowerCase();
      if (!tags.includes(clean)) {
        setTags((prev) => [...prev, clean]);
      }
      setCustomTag('');
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const clearFile = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  const clearExitFile = () => {
    setExitPreview(null);
    if (exitFileRef.current) exitFileRef.current.value = '';
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    if (isDailyLocked) {
      triggerDisciplineAlert('lock', todayTradesCount);
      return;
    }

    if (!pair.trim() || entryPrice === '' || lots === '') return;

    let pipsNum = null;
    let rNum = null;
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);

    if (isClosed && !isNaN(entry) && !isNaN(exit)) {
      pipsNum = realizedStats.pips;
      rNum = realizedStats.rMultiple;
    } else if (!isClosed && plannedRR.ratio !== null) {
      rNum = plannedRR.ratio;
    }

    const tradeData = {
      pair: pair.trim().toUpperCase(),
      direction: direction.toUpperCase(),
      session,
      lots: parseFloat(lots) || 0.1,
      entryPrice: entry,
      exitPrice: isClosed && exitPrice ? parseFloat(exitPrice) : null,
      stopLoss: stopLoss ? parseFloat(stopLoss) : null,
      takeProfit: takeProfit ? parseFloat(takeProfit) : null,
      pnl: isClosed && pnl !== '' ? parseFloat(pnl) : null,
      rMultiple: rNum,
      pips: pipsNum,
      date: isClosed ? closedAt : openedAt,
      time: isClosed && exitTime ? exitTime : entryTime,
      opened_time: entryTime,
      exit_time: isClosed && exitTime ? exitTime : null,
      opened_at: openedAt,
      closed_at: isClosed ? closedAt : null,
      status: isClosed ? 'CLOSED' : 'OPEN',
      setupTag: tags[0] || 'general',
      tags,
      emotion,
      followedPlan,
      notes: notes.trim(),
      screenshot: preview || '',
      exitScreenshot: isClosed ? (exitPreview || '') : '',
    };

    logTrade(tradeData);
    setIsLogTradeOpen(false);
  };

  const allTagOptions = Array.from(new Set([...DEFAULT_TAGS, ...tags]));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-[620px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-6 text-foreground animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-3">
            <h2 className="text-foreground font-bold text-lg tracking-tight font-num">
              {isDailyLocked ? '🔒 Log Trade Locked' : 'Log a Trade'}
            </h2>
            {!isDailyLocked && (
              <button
                type="button"
                onClick={() => {
                  setIsLogTradeOpen(false);
                  setIsScanModalOpen(true);
                }}
                className="flex items-center gap-1.5 px-2.5 py-1 bg-profit/15 hover:bg-profit/25 text-profit border border-profit/40 hover:border-profit/70 rounded-lg text-[11px] font-bold font-num transition shadow-xs cursor-pointer"
              >
                <Camera className="w-3 h-3" />
                <span>Scan MT4/MT5 Screenshot</span>
              </button>
            )}
          </div>
          <button
            type="button"
            onClick={() => setIsLogTradeOpen(false)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isDailyLocked ? (
          <div className="p-8 text-center space-y-6 bg-[#12080a]">
            <div className="w-20 h-20 mx-auto rounded-3xl bg-loss/20 text-loss border border-loss/50 flex items-center justify-center animate-pulse shadow-[0_0_30px_rgba(239,68,68,0.35)]">
              <Lock className="w-10 h-10 stroke-[2.5]" />
            </div>

            <div className="space-y-2">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider bg-loss/20 text-loss border border-loss/40">
                🔒 Daily Limit Reached (5/5 Trades)
              </span>
              <h3 className="text-2xl font-black text-foreground">
                Log Trade is Strictly Locked
              </h3>
            </div>

            <div className="p-4 rounded-xl border border-loss/40 bg-loss/10 text-red-200 space-y-1">
              <p className="text-base sm:text-lg font-bold tracking-wide">
                “Emotions control cheysuko! Trades enduku enter avutunavuu think cheysuko!”
              </p>
              <p className="text-xs text-muted-foreground font-mono">
                (Control your emotions! Think carefully: why are you entering trades?)
              </p>
            </div>

            <p className="text-sm text-muted-foreground max-w-md mx-auto leading-relaxed">
              You have already logged <span className="text-foreground font-bold font-num">{todayTradesCount} trades today</span>. 
              Whether in profit or loss, new trade logging is locked for the rest of today to protect your capital and psychology. Step away from the charts!
            </p>

            <button
              type="button"
              onClick={() => setIsLogTradeOpen(false)}
              className="w-full py-3.5 px-4 rounded-xl font-bold text-sm bg-loss hover:bg-loss/90 text-white shadow-lg hover:shadow-[0_0_20px_rgba(239,68,68,0.5)] transition cursor-pointer active:scale-95"
            >
              Step Away From Charts (Close)
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[84vh] overflow-y-auto">
            {isDailyWarning && (
              <div className="p-3.5 rounded-xl border border-amber-500/60 bg-amber-500/10 text-amber-200 flex items-start gap-3 shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-pulse">
                <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
                <div className="text-xs space-y-1">
                  <p className="font-bold text-amber-300 text-sm">
                    ⚠️ Emotions control cheysuko! Trades enduku enter avutunavuu think cheysuko!
                  </p>
                  <p className="text-muted-foreground text-[11px] leading-relaxed">
                    You have already logged <span className="font-bold text-amber-200 font-num">{todayTradesCount} trades today</span> ({todayTradesCount}/5 max limit). 
                    Whether in profit or loss, stop and evaluate your psychology before taking another trade!
                  </p>
                </div>
              </div>
            )}
          {/* Row 1: Pair, Direction, Lots */}
          <div className="grid grid-cols-12 gap-3">
            {/* Pair */}
            <div className="col-span-12 sm:col-span-4 space-y-1.5">
              <label className="block text-muted-foreground text-xs font-medium">
                Pair
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                placeholder="XAUUSD"
                required
                className="w-full bg-secondary/40 text-profit font-bold text-sm font-num border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-primary tracking-wide"
              />
              <div className="flex items-center gap-1.5 pt-1 flex-wrap">
                {[
                  { label: 'GOLD', value: 'XAUUSD' },
                  { label: 'EURUSD', value: 'EURUSD' },
                  { label: 'GBPUSD', value: 'GBPUSD' },
                  { label: 'US100', value: 'US100' },
                  { label: 'US30', value: 'US30' },
                  { label: 'BTC', value: 'BTCUSD' },
                ].map((item) => {
                  const isSelected = pair === item.value || pair === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setPair(item.value);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-num font-bold rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-profit/20 text-profit border-profit/60 shadow-[0_0_8px_rgba(18,213,134,0.25)]'
                          : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                      }`}
                    >
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Direction */}
            <div className="col-span-12 sm:col-span-5 space-y-1.5">
              <label className="block text-muted-foreground text-xs font-medium">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('buy')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 font-num cursor-pointer ${
                    direction === 'buy'
                      ? 'bg-profit/15 text-profit border-profit/60 shadow-[0_0_12px_rgba(18,213,134,0.2)]'
                      : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  <span>▲</span> BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('sell')}
                  className={`py-2.5 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 font-num cursor-pointer ${
                    direction === 'sell'
                      ? 'bg-loss/15 text-loss border-loss/60 shadow-[0_0_12px_rgba(239,68,68,0.2)]'
                      : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground'
                  }`}
                >
                  <span>▼</span> SELL
                </button>
              </div>
            </div>

            {/* Lots */}
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <label className="block text-muted-foreground text-xs font-medium">
                Lots
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                placeholder="e.g. 0.50"
                required
                className="w-full bg-secondary/40 text-foreground font-num text-sm border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Row 2: Entry Price, Stop Loss, Take Profit */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-muted-foreground text-xs font-medium">
                Entry price
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="e.g. 2740.00"
                required
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-loss text-xs font-medium">
                Stop loss (SL)
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="optional"
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-loss/35 rounded-xl px-3 py-2.5 placeholder-muted-foreground/50 focus:outline-hidden focus:border-loss"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-profit text-xs font-medium">
                Take profit (TP)
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="optional"
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-profit/35 rounded-xl px-3 py-2.5 placeholder-muted-foreground/50 focus:outline-hidden focus:border-profit"
              />
            </div>
          </div>

          {/* Pair-Aware Live R:R & Pip Analytics Card */}
          {(plannedRR.riskPips !== null || plannedRR.rewardPips !== null || plannedRR.warning) && (
            <div className="p-3 rounded-xl border border-border/80 bg-secondary/30 backdrop-blur-xs space-y-1.5 animate-rise">
              {plannedRR.warning ? (
                <div className="flex items-center gap-2 text-xs text-amber-400 font-medium">
                  <AlertTriangle className="w-4 h-4 shrink-0 animate-bounce" />
                  <span>{plannedRR.warning}</span>
                </div>
              ) : (
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs font-num">
                  <div className="flex items-center gap-3">
                    {plannedRR.riskPips !== null && (
                      <span className="text-loss flex items-center gap-1">
                        <span>Risk (SL):</span>
                        <strong className="font-bold">-{plannedRR.riskPips} {plannedRR.unitName}</strong>
                      </span>
                    )}
                    {plannedRR.rewardPips !== null && (
                      <span className="text-profit flex items-center gap-1">
                        <span>Reward (TP):</span>
                        <strong className="font-bold">+{plannedRR.rewardPips} {plannedRR.unitName}</strong>
                      </span>
                    )}
                  </div>
                  {plannedRR.ratio !== null && (
                    <div className="flex items-center gap-1.5">
                      <span className="text-muted-foreground text-[11px] font-sans">Planned R:R:</span>
                      <span
                        className={`px-2 py-0.5 rounded-lg font-bold text-xs shadow-xs ${
                          plannedRR.ratio >= 2
                            ? 'bg-profit/20 text-profit border border-profit/40 glow-green'
                            : plannedRR.ratio >= 1
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
                            : 'bg-loss/20 text-loss border border-loss/40'
                        }`}
                      >
                        {plannedRR.ratioFormatted} RR
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Row 2b: Trading Session (Color-Coded Interactive Selection with IST Timings) */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-secondary/20">
            <div className="flex items-center justify-between">
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                Trading Session (IST Timings)
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Selected: <span className="font-bold text-foreground">{session}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-0.5">
              {SESSIONS_LIST.map((item) => {
                const isSelected = session === item.id || session === item.label;
                const isLive = isSessionActiveNow(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSession(item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? item.activeBg
                        : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot} ${isSelected ? 'animate-pulse' : 'opacity-80'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isLive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-profit/20 text-profit border border-profit/40 animate-pulse">
                          Live IST
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono mt-1.5 flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground/80">{item.istTime}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Row 3: Trade Closed? Switch */}
          <div className="rounded-xl border border-border bg-secondary/20 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-foreground">
                Trade closed?
              </span>
              <button
                type="button"
                onClick={() => setIsClosed(!isClosed)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isClosed ? 'bg-primary' : 'bg-secondary'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-md transition duration-200 ease-in-out ${
                    isClosed ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Expanded fields when closed */}
            {isClosed && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-border/60">
                <div className="space-y-1.5">
                  <label className="block text-muted-foreground text-xs font-medium">
                    Exit price
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="optional"
                    className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5 placeholder-muted-foreground/50 focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-muted-foreground text-xs font-medium">
                    P&L ({currency === 'INR' ? '₹' : 'USD'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={pnl}
                    onChange={(e) => setPnl(e.target.value)}
                    placeholder="e.g. 145.50 or -80"
                    required={isClosed}
                    className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5 placeholder-muted-foreground/50 focus:outline-hidden focus:border-primary"
                  />
                </div>

                {/* Realized Stats & Auto P&L helper */}
                {realizedStats.pips !== null && (
                  <div className="col-span-2 p-2.5 rounded-xl border border-border/80 bg-secondary/30 flex flex-wrap items-center justify-between gap-2 text-xs font-num animate-rise">
                    <div className="flex items-center gap-3">
                      <span className={`font-bold ${realizedStats.pips >= 0 ? 'text-profit' : 'text-loss'}`}>
                        {realizedStats.pips >= 0 ? '+' : ''}{realizedStats.pips} {pipDetails.unitName}
                      </span>
                      {realizedStats.rMultiple !== null && (
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[11px] ${
                          realizedStats.rMultiple >= 0
                            ? 'bg-profit/20 text-profit border border-profit/35'
                            : 'bg-loss/20 text-loss border border-loss/35'
                        }`}>
                          {realizedStats.rMultipleFormatted} Multiple
                        </span>
                      )}
                    </div>
                    {realizedStats.estimatedPnl !== null && pnl === '' && (
                      <button
                        type="button"
                        onClick={() => setPnl(String(realizedStats.estimatedPnl))}
                        className="text-[11px] text-primary hover:underline font-bold cursor-pointer"
                      >
                        Auto-fill est. P&L: ${realizedStats.estimatedPnl}
                      </button>
                    )}
                  </div>
                )}
                <div className="space-y-1.5">
                  <label className="block text-muted-foreground text-xs font-medium">
                    Close date
                  </label>
                  <input
                    type="date"
                    value={closedAt}
                    onChange={(e) => setClosedAt(e.target.value)}
                    className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-primary"
                  />
                </div>
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-muted-foreground text-xs font-medium">
                      Close time
                    </label>
                    <span className="text-[10px] text-profit font-mono">IST</span>
                  </div>
                  <input
                    type="time"
                    value={exitTime}
                    onChange={(e) => setExitTime(e.target.value)}
                    className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5 focus:outline-hidden focus:border-primary"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Emotion at entry & Open date & Entry time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="space-y-1.5">
              <label className="block text-muted-foreground text-xs font-medium">
                Emotion at entry
              </label>
              <div className="relative">
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full appearance-none bg-secondary/40 text-foreground text-xs border border-border rounded-xl px-3.5 py-2.5 pr-8 focus:outline-hidden focus:border-primary cursor-pointer capitalize"
                >
                  {EMOTIONS.map((em) => (
                    <option key={em} value={em} className="capitalize">
                      {em}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-muted-foreground text-xs font-medium">
                Open date
              </label>
              <input
                type="date"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-primary"
              />
            </div>

            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <label className="block text-muted-foreground text-xs font-medium">
                  Entry time (Auto)
                </label>
                <span className="text-[10px] text-profit font-mono">IST</span>
              </div>
              <input
                type="time"
                value={entryTime}
                onChange={(e) => setEntryTime(e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-primary"
              />
            </div>
          </div>

          {/* Row 5: Setup tags */}
          <div className="space-y-2">
            <label className="block text-muted-foreground text-xs font-medium">
              Setup tags
            </label>
            <div className="flex flex-wrap gap-1.5">
              {allTagOptions.map((t) => {
                const active = tags.includes(t);
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => toggleTag(t)}
                    className={`px-3 py-1 rounded-full text-[11px] font-num border transition-all cursor-pointer ${
                      active
                        ? 'bg-profit/15 border-profit/60 text-profit'
                        : 'bg-secondary/40 border-border text-muted-foreground hover:text-foreground hover:border-border/80'
                    }`}
                  >
                    {t}
                  </button>
                );
              })}
            </div>
            <input
              type="text"
              value={customTag}
              onChange={(e) => setCustomTag(e.target.value)}
              onKeyDown={handleCustomTagKeyDown}
              placeholder="Type a custom tag + Enter"
              className="w-full bg-secondary/40 text-xs text-foreground placeholder-muted-foreground/50 border border-border rounded-xl px-3.5 py-2.5 focus:outline-hidden focus:border-primary"
            />
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1.5">
            <label className="block text-muted-foreground text-xs font-medium">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did you take this trade? What did you see? What would you do differently?"
              className="w-full bg-secondary/40 text-xs text-foreground placeholder-muted-foreground/50 border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary leading-relaxed resize-y"
            />
          </div>

          {/* Row 7: Chart screenshots (Entry & Exit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-profit text-xs font-medium flex items-center justify-between">
                <span>Entry Chart screenshot</span>
                <span className="text-[10px] text-muted-foreground">optional</span>
              </label>
              {preview ? (
                <div className="relative w-fit">
                  <img
                    src={preview}
                    alt="Entry Chart preview"
                    className="h-24 rounded-xl border border-border object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-loss text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-loss/90"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border hover:border-profit/60 hover:text-foreground rounded-xl px-4 py-3.5 w-full transition cursor-pointer bg-secondary/20"
                >
                  <ImagePlus className="w-4 h-4 text-profit" />
                  <span>Attach Entry Chart</span>
                </button>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileChange}
              />
            </div>

            {isClosed && (
              <div className="space-y-1.5">
                <label className="block text-sky-400 text-xs font-medium flex items-center justify-between">
                  <span>Exit Chart screenshot</span>
                  <span className="text-[10px] text-muted-foreground">optional</span>
                </label>
                {exitPreview ? (
                  <div className="relative w-fit">
                    <img
                      src={exitPreview}
                      alt="Exit Chart preview"
                      className="h-24 rounded-xl border border-border object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearExitFile}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-loss text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-loss/90"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => exitFileRef.current?.click()}
                    className="flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border hover:border-sky-400/60 hover:text-foreground rounded-xl px-4 py-3.5 w-full transition cursor-pointer bg-secondary/20"
                  >
                    <ImagePlus className="w-4 h-4 text-sky-400" />
                    <span>Attach Exit Chart</span>
                  </button>
                )}
                <input
                  ref={exitFileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      const reader = new FileReader();
                      reader.onloadend = () => {
                        setExitPreview(reader.result);
                      };
                      reader.readAsDataURL(file);
                    }
                  }}
                />
              </div>
            )}
          </div>

          {/* Row 8: Followed my trading plan */}
          <div className="flex items-center justify-between rounded-xl border border-border bg-secondary/30 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-foreground block">
                Followed my trading plan
              </span>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                Plan: {activeRulesCount} active rules
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFollowedPlan(!followedPlan)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                followedPlan ? 'bg-primary' : 'bg-secondary'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-md transition duration-200 ease-in-out ${
                  followedPlan ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setIsLogTradeOpen(false)}
              className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl bg-secondary/50 border border-border hover:bg-secondary transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all duration-150 cursor-pointer hover:shadow-[0_0_15px_rgba(18,213,134,0.35)] active:scale-95"
            >
              Log trade
            </button>
          </div>
        </form>
        )}
      </div>
    </div>
  );
};
