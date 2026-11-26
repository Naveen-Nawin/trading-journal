import React, { useState, useEffect, useRef } from 'react';
import { X, CheckCircle2, ImagePlus } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { calculateRealizedTradeStats, getPairPipDetails } from '../../utils/pipsAndRR';
import { nowTimeFormatted } from '../../utils/formatters';

export const CloseTradeModal = () => {
  const { tradeToClose, setTradeToClose, closeTrade, currency } = useTrading();

  const [exitPrice, setExitPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [rMultiple, setRMultiple] = useState('');
  const [pips, setPips] = useState('');
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [closeTime, setCloseTime] = useState(() => nowTimeFormatted());
  const [notes, setNotes] = useState('');
  const [followedPlan, setFollowedPlan] = useState(true);
  const [exitScreenshot, setExitScreenshot] = useState(null);

  const fileRef = useRef(null);

  useEffect(() => {
    if (tradeToClose) {
      setExitPrice('');
      setPnl('');
      setRMultiple('');
      setPips('');
      setDate(new Date().toISOString().slice(0, 10));
      setCloseTime(nowTimeFormatted());
      setNotes(tradeToClose.notes || '');
      setFollowedPlan(tradeToClose.followedPlan ?? true);
      setExitScreenshot(tradeToClose.exitScreenshot || null);
    }
  }, [tradeToClose]);

  if (!tradeToClose) return null;

  const handleCalc = () => {
    const entry = parseFloat(tradeToClose.entryPrice);
    const exit = parseFloat(exitPrice);
    const sl = parseFloat(tradeToClose.stopLoss);
    const lotNum = parseFloat(tradeToClose.lots) || 0.1;

    if (!isNaN(entry) && !isNaN(exit)) {
      const stats = calculateRealizedTradeStats(
        tradeToClose.pair,
        tradeToClose.direction,
        entry,
        exit,
        sl,
        lotNum
      );

      if (stats.pips !== null) {
        setPips(stats.pips);
      }
      if (stats.rMultiple !== null) {
        setRMultiple(stats.rMultiple);
      }
      if (!pnl && stats.estimatedPnl !== null) {
        setPnl(stats.estimatedPnl);
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    let finalPnl = parseFloat(pnl) || 0;
    if (pips !== null && pips !== undefined && !isNaN(parseFloat(pips)) && parseFloat(pips) !== 0) {
      const pipsVal = parseFloat(pips);
      if (pipsVal < 0 && finalPnl > 0) {
        finalPnl = -Math.abs(finalPnl);
      } else if (pipsVal > 0 && finalPnl < 0) {
        finalPnl = Math.abs(finalPnl);
      }
    }

    closeTrade(tradeToClose.id, {
      exitPrice: parseFloat(exitPrice) || 0,
      pnl: finalPnl,
      rMultiple: rMultiple ? parseFloat(rMultiple) : null,
      pips: pips ? parseFloat(pips) : null,
      date,
      time: closeTime,
      notes: notes.trim(),
      followedPlan,
      exitScreenshot,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-primary" />
            <h2 className="text-foreground font-bold text-base tracking-wide font-num">
              Close Trade: {tradeToClose.pair}
            </h2>
          </div>
          <button
            onClick={() => setTradeToClose(null)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trade summary card */}
        <div className="px-6 py-3 bg-secondary/30 border-b border-border flex items-center justify-between text-xs font-num">
          <div>
            <span className="text-muted-foreground">Direction: </span>
            <span
              className={`font-bold ${
                tradeToClose.direction === 'BUY' ? 'text-profit' : 'text-loss'
              }`}
            >
              {tradeToClose.direction}
            </span>
          </div>
          <div>
            <span className="text-muted-foreground">Entry: </span>
            <span className="text-foreground font-bold">{tradeToClose.entryPrice}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Lots: </span>
            <span className="text-foreground font-bold">{tradeToClose.lots}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Session: </span>
            <span className="text-foreground">{tradeToClose.session}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Exit Price *
              </label>
              <input
                type="number"
                step="any"
                value={exitPrice}
                onChange={(e) => setExitPrice(e.target.value)}
                onBlur={handleCalc}
                placeholder="e.g. 1.0890"
                required
                className="w-full bg-secondary/40 text-foreground font-num text-sm border border-border rounded-xl px-3 py-2.5 focus:border-primary focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Net P&L ({currency === 'INR' ? '₹' : '$'}) *
              </label>
              <input
                type="number"
                step="any"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                placeholder="e.g. 120 or -50"
                required
                className={`w-full bg-secondary/40 font-num font-bold text-sm border rounded-xl px-3 py-2.5 focus:outline-hidden ${
                  pnl > 0
                    ? 'text-profit border-profit/40'
                    : pnl < 0
                    ? 'text-loss border-loss/40'
                    : 'text-foreground border-border'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Exit Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  Exit Time
                </label>
                <span className="text-[10px] text-profit font-mono">IST</span>
              </div>
              <input
                type="time"
                value={closeTime}
                onChange={(e) => setCloseTime(e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                R-Multiple
              </label>
              <input
                type="number"
                step="0.01"
                value={rMultiple}
                onChange={(e) => setRMultiple(e.target.value)}
                placeholder="e.g. 2.5"
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5"
              />
            </div>
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Pips
              </label>
              <input
                type="number"
                step="0.1"
                value={pips}
                onChange={(e) => setPips(e.target.value)}
                placeholder="e.g. 45"
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl px-3 py-2.5"
              />
            </div>
          </div>

          <div>
            <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
              Exit Notes & Reflection
            </label>
            <textarea
              rows="3"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well? Did you hold to TP or panic close?"
              className="w-full bg-secondary/40 text-foreground text-xs border border-border rounded-xl p-3 focus:border-primary focus:outline-hidden"
            />
          </div>

          {/* Exit Chart Screenshot Upload */}
          <div className="space-y-1.5">
            <label className="block text-sky-400 text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
              <span>Exit Chart Screenshot</span>
              <span className="text-[10px] text-muted-foreground font-normal lowercase">optional</span>
            </label>
            {exitScreenshot ? (
              <div className="relative w-full h-24 rounded-xl border border-border overflow-hidden bg-secondary/30">
                <img
                  src={exitScreenshot}
                  alt="Exit Chart"
                  className="w-full h-full object-cover"
                />
                <button
                  type="button"
                  onClick={() => setExitScreenshot(null)}
                  className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-loss text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-loss/90 transition"
                  title="Remove Screenshot"
                >
                  ✕
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border hover:border-sky-400/60 hover:text-foreground rounded-xl px-4 py-4 w-full transition cursor-pointer bg-secondary/20"
              >
                <ImagePlus className="w-4 h-4 text-sky-400" />
                <span>Upload Exit Chart</span>
              </button>
            )}
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const reader = new FileReader();
                  reader.onloadend = () => setExitScreenshot(reader.result);
                  reader.readAsDataURL(file);
                }
              }}
            />
          </div>

          {/* Followed Plan Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-secondary/30 rounded-xl border border-border">
            <div>
              <div className="text-xs font-bold text-foreground">Followed Trading Plan?</div>
              <div className="text-[11px] text-muted-foreground">Honesty protects your discipline</div>
            </div>
            <button
              type="button"
              onClick={() => setFollowedPlan(!followedPlan)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold border transition cursor-pointer ${
                followedPlan
                  ? 'bg-profit/15 text-profit border-profit/40'
                  : 'bg-loss/15 text-loss border-loss/40'
              }`}
            >
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>{followedPlan ? 'YES' : 'NO'}</span>
            </button>
          </div>

          <div className="pt-2 flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTradeToClose(null)}
              className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all duration-150 cursor-pointer hover:shadow-[0_0_15px_rgba(18,213,134,0.35)] active:scale-95"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm Close Trade</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
