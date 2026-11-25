import React, { useState, useRef, useEffect } from 'react';
import { X, ImagePlus, Camera, Sparkles } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

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
  } = useTrading();

  const [pair, setPair] = useState('XAUUSD');
  const [direction, setDirection] = useState('buy'); // 'buy' or 'sell'
  const [lots, setLots] = useState('0.50');
  const [entryPrice, setEntryPrice] = useState('2740.00');
  const [stopLoss, setStopLoss] = useState('');
  const [takeProfit, setTakeProfit] = useState('');
  const [session, setSession] = useState('London');
  const [isClosed, setIsClosed] = useState(false);
  const [exitPrice, setExitPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [closedAt, setClosedAt] = useState(todayFormatted());
  const [emotion, setEmotion] = useState('calm');
  const [openedAt, setOpenedAt] = useState(todayFormatted());
  const [tags, setTags] = useState(['breakout']);
  const [customTag, setCustomTag] = useState('');
  const [notes, setNotes] = useState('');
  const [preview, setPreview] = useState(null);
  const [exitPreview, setExitPreview] = useState(null);
  const [followedPlan, setFollowedPlan] = useState(false);

  const fileRef = useRef(null);
  const exitFileRef = useRef(null);

  useEffect(() => {
    if (isLogTradeOpen) {
      setPair('XAUUSD');
      setDirection('buy');
      setLots('0.50');
      setEntryPrice('2740.00');
      setStopLoss('');
      setTakeProfit('');
      setSession('London');
      setIsClosed(false);
      setExitPrice('');
      setPnl('');
      setClosedAt(todayFormatted());
      setEmotion('calm');
      setOpenedAt(todayFormatted());
      setTags(['breakout']);
      setCustomTag('');
      setNotes('');
      setPreview(null);
      setExitPreview(null);
      setFollowedPlan(false);
    }
  }, [isLogTradeOpen]);

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

    if (!pair.trim() || entryPrice === '') return;

    let pipsNum = null;
    let rNum = null;
    const entry = parseFloat(entryPrice);
    const exit = parseFloat(exitPrice);
    const sl = parseFloat(stopLoss);

    if (isClosed && !isNaN(entry) && !isNaN(exit)) {
      const diff = direction === 'buy' ? exit - entry : entry - exit;
      const isJpyOrGold = pair.includes('JPY') || pair.includes('XAU');
      const pipMultiplier = isJpyOrGold ? 100 : 10000;
      pipsNum = parseFloat((diff * pipMultiplier).toFixed(1));

      if (!isNaN(sl) && Math.abs(entry - sl) > 0) {
        rNum = parseFloat((diff / Math.abs(entry - sl)).toFixed(2));
      }
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-[620px] bg-[#0c1015] border border-[#1b2533] rounded-2xl shadow-2xl overflow-hidden my-6 text-[#e2e8f0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#172230]">
          <div className="flex items-center gap-3">
            <h2 className="text-white font-bold text-lg tracking-tight font-sans">
              Log a Trade
            </h2>
            <button
              type="button"
              onClick={() => {
                setIsLogTradeOpen(false);
                setIsScanModalOpen(true);
              }}
              className="flex items-center gap-1.5 px-2.5 py-1 bg-[#0e271f] hover:bg-[#13372b] text-[#00f098] border border-[#00f098]/40 hover:border-[#00f098]/70 rounded-lg text-[11px] font-bold font-mono transition shadow-xs cursor-pointer"
            >
              <Camera className="w-3 h-3" />
              <span>Scan MT4/MT5 Screenshot</span>
            </button>
          </div>
          <button
            type="button"
            onClick={() => setIsLogTradeOpen(false)}
            className="text-[#64748b] hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[84vh] overflow-y-auto">
          {/* Row 1: Pair, Direction, Lots */}
          <div className="grid grid-cols-12 gap-3">
            {/* Pair */}
            <div className="col-span-12 sm:col-span-4 space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Pair
              </label>
              <input
                type="text"
                value={pair}
                onChange={(e) => setPair(e.target.value.toUpperCase())}
                placeholder="XAUUSD"
                required
                className="w-full bg-[#080d12] text-[#00f098] font-bold text-sm font-mono border border-[#1e2c3d] rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-[#00f098]/70 tracking-wide"
              />
              <div className="flex items-center gap-1.5 pt-1">
                {[
                  { label: 'GOLD', value: 'XAUUSD', defaultPrice: '2740.00' },
                  { label: 'BTC', value: 'BTCUSD', defaultPrice: '96500.00' },
                  { label: 'ETH', value: 'ETHUSD', defaultPrice: '3450.00' },
                ].map((item) => {
                  const isSelected = pair === item.value || pair === item.label;
                  return (
                    <button
                      key={item.label}
                      type="button"
                      onClick={() => {
                        setPair(item.value);
                        setEntryPrice(item.defaultPrice);
                      }}
                      className={`px-2 py-0.5 text-[10px] font-mono font-bold rounded border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-[#00f098]/20 text-[#00f098] border-[#00f098]/60 shadow-[0_0_8px_rgba(0,240,152,0.25)]'
                          : 'bg-[#0b1219] text-[#64748b] border-[#182635] hover:text-[#94a3b8]'
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
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Direction
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setDirection('buy')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 font-mono ${
                    direction === 'buy'
                      ? 'bg-[#0e271f] text-[#00f098] border-[#00f098]/60 shadow-[0_0_12px_rgba(0,240,152,0.18)]'
                      : 'bg-[#080d12] text-[#64748b] border-[#1e2c3d] hover:text-[#94a3b8]'
                  }`}
                >
                  <span>▲</span> BUY
                </button>
                <button
                  type="button"
                  onClick={() => setDirection('sell')}
                  className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all flex items-center justify-center gap-1 font-mono ${
                    direction === 'sell'
                      ? 'bg-[#291318] text-[#ff4d4d] border-[#ff4d4d]/60 shadow-[0_0_12px_rgba(255,77,77,0.18)]'
                      : 'bg-[#080d12] text-[#64748b] border-[#1e2c3d] hover:text-[#94a3b8]'
                  }`}
                >
                  <span>▼</span> SELL
                </button>
              </div>
            </div>

            {/* Lots */}
            <div className="col-span-12 sm:col-span-3 space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Lots
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={lots}
                onChange={(e) => setLots(e.target.value)}
                required
                className="w-full bg-[#080d12] text-white font-mono text-sm border border-[#1e2c3d] rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-[#00f098]/70"
              />
            </div>
          </div>

          {/* Row 2: Entry Price, Stop Loss, Take Profit, Session */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Entry price
              </label>
              <input
                type="number"
                step="any"
                value={entryPrice}
                onChange={(e) => setEntryPrice(e.target.value)}
                placeholder="1.0850"
                required
                className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#00f098]/70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Stop loss
              </label>
              <input
                type="number"
                step="any"
                value={stopLoss}
                onChange={(e) => setStopLoss(e.target.value)}
                placeholder="optional"
                className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 placeholder-[#546577] focus:outline-hidden focus:border-[#00f098]/70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Take profit
              </label>
              <input
                type="number"
                step="any"
                value={takeProfit}
                onChange={(e) => setTakeProfit(e.target.value)}
                placeholder="optional"
                className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 placeholder-[#546577] focus:outline-hidden focus:border-[#00f098]/70"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Session
              </label>
              <div className="relative">
                <select
                  value={session}
                  onChange={(e) => setSession(e.target.value)}
                  className="w-full appearance-none bg-[#080d12] text-white text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 pr-8 focus:outline-hidden focus:border-[#00f098]/70 cursor-pointer"
                >
                  {SESSIONS.map((s) => (
                    <option key={s.value} value={s.value}>
                      {s.label}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[10px]">
                  ▼
                </span>
              </div>
            </div>
          </div>

          {/* Row 3: Trade Closed? Switch */}
          <div className="rounded-xl border border-[#1e2c3d] bg-[#080d12]/60 p-3.5 space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-white font-sans">
                Trade closed?
              </span>
              <button
                type="button"
                onClick={() => setIsClosed(!isClosed)}
                className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                  isClosed ? 'bg-[#00f098]' : 'bg-[#1e2c3d]'
                }`}
              >
                <span
                  className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#080d12] shadow-md transition duration-200 ease-in-out ${
                    isClosed ? 'translate-x-4' : 'translate-x-0'
                  }`}
                />
              </button>
            </div>

            {/* Expanded fields when closed */}
            {isClosed && (
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-[#1a2636]">
                <div className="space-y-1.5">
                  <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                    Exit price
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={exitPrice}
                    onChange={(e) => setExitPrice(e.target.value)}
                    placeholder="optional"
                    className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 placeholder-[#546577] focus:outline-hidden focus:border-[#00f098]/70"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                    P&L ({currency === 'INR' ? '₹' : 'USD'})
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={pnl}
                    onChange={(e) => setPnl(e.target.value)}
                    placeholder="e.g. 145.50 or -80"
                    required={isClosed}
                    className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 placeholder-[#546577] focus:outline-hidden focus:border-[#00f098]/70"
                  />
                </div>
                <div className="col-span-2 space-y-1.5">
                  <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                    Close date
                  </label>
                  <input
                    type="date"
                    value={closedAt}
                    onChange={(e) => setClosedAt(e.target.value)}
                    className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3 py-2 focus:outline-hidden focus:border-[#00f098]/70"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Row 4: Emotion at entry & Open date */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Emotion at entry
              </label>
              <div className="relative">
                <select
                  value={emotion}
                  onChange={(e) => setEmotion(e.target.value)}
                  className="w-full appearance-none bg-[#080d12] text-white text-xs border border-[#1e2c3d] rounded-xl px-3.5 py-2.5 pr-8 focus:outline-hidden focus:border-[#00f098]/70 cursor-pointer capitalize"
                >
                  {EMOTIONS.map((em) => (
                    <option key={em} value={em} className="capitalize">
                      {em}
                    </option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-[#64748b] text-[10px]">
                  ▼
                </span>
              </div>
            </div>

            <div className="space-y-1.5">
              <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                Open date
              </label>
              <input
                type="date"
                value={openedAt}
                onChange={(e) => setOpenedAt(e.target.value)}
                className="w-full bg-[#080d12] text-white font-mono text-xs border border-[#1e2c3d] rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-[#00f098]/70"
              />
            </div>
          </div>

          {/* Row 5: Setup tags */}
          <div className="space-y-2">
            <label className="block text-[#94a3b8] text-xs font-medium font-sans">
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
                    className={`px-3 py-1 rounded-full text-[11px] font-mono border transition-all ${
                      active
                        ? 'bg-[#00f098]/15 border-[#00f098]/60 text-[#00f098]'
                        : 'bg-[#080d12] border-[#1e2c3d] text-[#8092a4] hover:text-white hover:border-[#2a3c52]'
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
              className="w-full bg-[#080d12] text-xs text-white placeholder-[#546577] border border-[#1e2c3d] rounded-xl px-3.5 py-2 focus:outline-hidden focus:border-[#00f098]/70"
            />
          </div>

          {/* Row 6: Notes */}
          <div className="space-y-1.5">
            <label className="block text-[#94a3b8] text-xs font-medium font-sans">
              Notes
            </label>
            <textarea
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Why did you take this trade? What did you see? What would you do differently?"
              className="w-full bg-[#080d12] text-xs text-white placeholder-[#546577] border border-[#1e2c3d] rounded-xl p-3 focus:outline-hidden focus:border-[#00f098]/70 leading-relaxed resize-y"
            />
          </div>

          {/* Row 7: Chart screenshots (Entry & Exit) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-[#00f098] text-xs font-medium font-sans flex items-center justify-between">
                <span>Entry Chart screenshot</span>
                <span className="text-[10px] text-[#64748b]">optional</span>
              </label>
              {preview ? (
                <div className="relative w-fit">
                  <img
                    src={preview}
                    alt="Entry Chart preview"
                    className="h-24 rounded-xl border border-[#1e2c3d] object-cover"
                  />
                  <button
                    type="button"
                    onClick={clearFile}
                    className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ff4d4d] text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-[#dc2626]"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-[#8092a4] border border-dashed border-[#1e2c3d] hover:border-[#00f098]/50 hover:text-white rounded-xl px-4 py-3.5 w-full transition cursor-pointer"
                >
                  <ImagePlus className="w-4 h-4 text-[#00f098]" />
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
                <label className="block text-[#38bdf8] text-xs font-medium font-sans flex items-center justify-between">
                  <span>Exit Chart screenshot</span>
                  <span className="text-[10px] text-[#64748b]">optional</span>
                </label>
                {exitPreview ? (
                  <div className="relative w-fit">
                    <img
                      src={exitPreview}
                      alt="Exit Chart preview"
                      className="h-24 rounded-xl border border-[#1e2c3d] object-cover"
                    />
                    <button
                      type="button"
                      onClick={clearExitFile}
                      className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#ff4d4d] text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-[#dc2626]"
                    >
                      ✕
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => exitFileRef.current?.click()}
                    className="flex items-center justify-center gap-2 text-xs text-[#8092a4] border border-dashed border-[#1e2c3d] hover:border-[#38bdf8]/50 hover:text-white rounded-xl px-4 py-3.5 w-full transition cursor-pointer"
                  >
                    <ImagePlus className="w-4 h-4 text-[#38bdf8]" />
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
          <div className="flex items-center justify-between rounded-xl border border-[#1e2c3d] bg-[#080d12]/50 px-4 py-3">
            <div>
              <span className="text-sm font-medium text-white block font-sans">
                Followed my trading plan
              </span>
              <p className="text-[11px] text-[#64748b] mt-0.5 font-sans">
                Plan: {activeRulesCount} active rules
              </p>
            </div>
            <button
              type="button"
              onClick={() => setFollowedPlan(!followedPlan)}
              className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                followedPlan ? 'bg-[#00f098]' : 'bg-[#1e2c3d]'
              }`}
            >
              <span
                className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#080d12] shadow-md transition duration-200 ease-in-out ${
                  followedPlan ? 'translate-x-4' : 'translate-x-0'
                }`}
              />
            </button>
          </div>

          {/* Footer Actions */}
          <div className="flex justify-end gap-2.5 pt-2 border-t border-[#172230]">
            <button
              type="button"
              onClick={() => setIsLogTradeOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8092a4] hover:text-white rounded-xl bg-[#080d12] border border-[#1e2c3d] hover:bg-[#121c27] transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-5 py-2 bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,152,0.3)] transition"
            >
              Log trade
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
