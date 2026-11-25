import React from 'react';
import { X, Calendar } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw, formatR, formatPips } from '../../utils/formatters';

export const DayTradesModal = () => {
  const { calendarDayModal, setCalendarDayModal, currency } = useTrading();

  if (!calendarDayModal.isOpen) return null;

  const { dateStr, trades, dayPnl } = calendarDayModal;
  const isProfit = dayPnl >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-lg bg-[#090e14] border border-[#1b2b3b] rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141f2b] bg-[#0c131c]">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[#00f098]" />
            <h2 className="text-white font-extrabold text-base tracking-wide">
              Trades for {dateStr}
            </h2>
          </div>
          <button
            onClick={() => setCalendarDayModal({ isOpen: false, day: null, dateStr: '', trades: [] })}
            className="p-1.5 text-[#64748b] hover:text-white rounded-lg hover:bg-[#15212d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day P&L Header */}
        <div className="px-6 py-3 bg-[#080d12] border-b border-[#141f2b] flex items-center justify-between">
          <span className="text-[#8092a4] text-xs font-mono">
            {trades.length} {trades.length === 1 ? 'trade' : 'trades'} executed
          </span>
          <span
            className={`text-base font-mono font-extrabold ${
              isProfit ? 'text-[#00f098]' : 'text-[#ff4d4d]'
            }`}
          >
            {formatCurrencyRaw(dayPnl, currency, true)}
          </span>
        </div>

        {/* Trade list */}
        <div className="p-6 space-y-3 max-h-96 overflow-y-auto">
          {trades.map((t) => {
            const isBuy = t.direction === 'BUY';
            const tradeProfit = (t.pnl || 0) >= 0;

            return (
              <div
                key={t.id}
                className="bg-[#0b1117] border border-[#16222f] rounded-xl p-4 space-y-2 hover:border-[#1e2e3f] transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-white font-mono font-bold text-sm">
                      {t.pair}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase ${
                        isBuy
                          ? 'bg-[#00f098]/15 text-[#00f098] border border-[#00f098]/30'
                          : 'bg-[#ff4d4d]/15 text-[#ff4d4d] border border-[#ff4d4d]/30'
                      }`}
                    >
                      {t.direction}
                    </span>
                    <span className="text-[#8092a4] text-xs font-sans">
                      · {t.session}
                    </span>
                  </div>

                  <span
                    className={`font-mono font-extrabold text-sm ${
                      tradeProfit ? 'text-[#00f098]' : 'text-[#ff4d4d]'
                    }`}
                  >
                    {formatCurrencyRaw(t.pnl, currency, true)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-mono text-[#8092a4]">
                  <span>
                    {t.entryPrice} → {t.exitPrice}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{formatPips(t.pips)} pips</span>
                    <span>·</span>
                    <span>{formatR(t.rMultiple)}</span>
                  </div>
                </div>

                {t.notes && (
                  <p className="text-xs text-[#cbd5e1] font-sans pt-1 border-t border-[#141e2a]/50">
                    &ldquo;{t.notes}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>

        <div className="p-4 border-t border-[#141f2b] text-right bg-[#0c131c]">
          <button
            onClick={() => setCalendarDayModal({ isOpen: false, day: null, dateStr: '', trades: [] })}
            className="px-4 py-2 text-xs font-bold text-white bg-[#15212d] hover:bg-[#1f2e3e] rounded-xl transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};

