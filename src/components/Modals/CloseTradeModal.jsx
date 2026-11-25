import React, { useState, useEffect } from 'react';
import { X, CheckCircle2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const CloseTradeModal = () => {
  const { tradeToClose, setTradeToClose, closeTrade, currency } = useTrading();

  const [exitPrice, setExitPrice] = useState('');
  const [pnl, setPnl] = useState('');
  const [rMultiple, setRMultiple] = useState('');
  const [pips, setPips] = useState('');
  const [date, setDate] = useState('2026-11-18');
  const [notes, setNotes] = useState('');
  const [followedPlan, setFollowedPlan] = useState(true);

  useEffect(() => {
    if (tradeToClose) {
      setExitPrice('');
      setPnl('');
      setRMultiple('');
      setPips('');
      setDate('2026-11-18');
      setNotes(tradeToClose.notes || '');
      setFollowedPlan(tradeToClose.followedPlan ?? true);
    }
  }, [tradeToClose]);

  if (!tradeToClose) return null;

  const handleCalc = () => {
    const entry = parseFloat(tradeToClose.entryPrice);
    const exit = parseFloat(exitPrice);
    const sl = parseFloat(tradeToClose.stopLoss);
    const lotNum = parseFloat(tradeToClose.lots) || 0.1;

    if (!isNaN(entry) && !isNaN(exit)) {
      const isBuy = tradeToClose.direction === 'BUY';
      const diff = isBuy ? exit - entry : entry - exit;
      const isJpyOrGold = tradeToClose.pair.includes('JPY') || tradeToClose.pair.includes('XAU');
      const pipMultiplier = isJpyOrGold ? 100 : 10000;
      const calcPips = parseFloat((diff * pipMultiplier).toFixed(1));
      setPips(calcPips);

      if (!pnl) {
        const estPnl = parseFloat((calcPips * lotNum * 10).toFixed(2));
        setPnl(estPnl);
      }

      if (!isNaN(sl) && Math.abs(entry - sl) > 0) {
        const risk = Math.abs(entry - sl);
        const reward = diff;
        setRMultiple(parseFloat((reward / risk).toFixed(2)));
      }
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    closeTrade(tradeToClose.id, {
      exitPrice: parseFloat(exitPrice) || 0,
      pnl: parseFloat(pnl) || 0,
      rMultiple: rMultiple ? parseFloat(rMultiple) : 0,
      pips: pips ? parseFloat(pips) : 0,
      date,
      notes: notes.trim(),
      followedPlan,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#090e14] border border-[#1b2b3b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141f2b] bg-[#0c131c]">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-[#00f098]" />
            <h2 className="text-white font-extrabold text-base tracking-wide">
              Close Trade: {tradeToClose.pair}
            </h2>
          </div>
          <button
            onClick={() => setTradeToClose(null)}
            className="p-1.5 text-[#64748b] hover:text-white rounded-lg hover:bg-[#15212d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Trade summary card */}
        <div className="px-6 py-3 bg-[#0c141f] border-b border-[#141f2b] flex items-center justify-between text-xs font-mono">
          <div>
            <span className="text-[#8092a4]">Direction: </span>
            <span
              className={`font-bold ${
                tradeToClose.direction === 'BUY' ? 'text-[#00f098]' : 'text-[#ff4d4d]'
              }`}
            >
              {tradeToClose.direction}
            </span>
          </div>
          <div>
            <span className="text-[#8092a4]">Entry: </span>
            <span className="text-white font-bold">{tradeToClose.entryPrice}</span>
          </div>
          <div>
            <span className="text-[#8092a4]">Lots: </span>
            <span className="text-white font-bold">{tradeToClose.lots}</span>
          </div>
          <div>
            <span className="text-[#8092a4]">Session: </span>
            <span className="text-white">{tradeToClose.session}</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
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
                className="w-full bg-[#06090d] text-white font-mono text-sm border border-[#16222f] rounded-xl px-3 py-2 focus:border-[#00f098]/60 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Net P&L ({currency === 'INR' ? '₹' : '$'}) *
              </label>
              <input
                type="number"
                step="any"
                value={pnl}
                onChange={(e) => setPnl(e.target.value)}
                placeholder="e.g. 120 or -50"
                required
                className={`w-full bg-[#06090d] font-mono font-bold text-sm border rounded-xl px-3 py-2 focus:outline-hidden ${
                  parseFloat(pnl) >= 0
                    ? 'text-[#00f098] border-[#00f098]/40'
                    : parseFloat(pnl) < 0
                    ? 'text-[#ff4d4d] border-[#ff4d4d]/40'
                    : 'text-white border-[#16222f]'
                }`}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Pips
              </label>
              <input
                type="number"
                step="0.1"
                value={pips}
                onChange={(e) => setPips(e.target.value)}
                placeholder="e.g. 45"
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2 focus:border-[#00f098]/60 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                R-Multiple
              </label>
              <input
                type="number"
                step="0.01"
                value={rMultiple}
                onChange={(e) => setRMultiple(e.target.value)}
                placeholder="e.g. 1.8"
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2 focus:border-[#00f098]/60 focus:outline-hidden"
              />
            </div>

            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Exit Date
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                required
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-1.5 focus:border-[#00f098]/60 focus:outline-hidden"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 cursor-pointer bg-[#070b0f] p-3 rounded-xl border border-[#141f2b]">
              <input
                type="checkbox"
                checked={followedPlan}
                onChange={(e) => setFollowedPlan(e.target.checked)}
                className="rounded accent-[#00f098] cursor-pointer"
              />
              <span className="text-xs text-[#cbd5e1]">
                Did you stick to your trading rules throughout this trade?
              </span>
            </label>
          </div>

          <div>
            <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
              Closing Reflections
            </label>
            <textarea
              rows="2"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="What went well? Did you take profit according to plan?"
              className="w-full bg-[#06090d] text-white text-xs border border-[#16222f] rounded-xl p-3 focus:border-[#00f098]/60 focus:outline-hidden"
            />
          </div>

          <div className="pt-3 border-t border-[#141f2b] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTradeToClose(null)}
              className="px-4 py-2 text-xs font-semibold text-[#8092a4] hover:text-white rounded-xl transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] font-extrabold text-xs rounded-xl shadow-[0_0_15px_rgba(0,240,152,0.3)] transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Close</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

