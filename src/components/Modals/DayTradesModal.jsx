import React from 'react';
import { X, Calendar, Clock } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw, formatR, formatPips, formatTimeDisplay } from '../../utils/formatters';
import { getEffectiveTradePips, getEffectiveTradeRR } from '../../utils/pipsAndRR';

export const DayTradesModal = () => {
  const { calendarDayModal, setCalendarDayModal, currency } = useTrading();

  if (!calendarDayModal.isOpen) return null;

  const { dateStr, trades, dayPnl } = calendarDayModal;
  const isProfit = dayPnl >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl overflow-hidden animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-profit" />
            <h2 className="text-foreground font-bold text-base tracking-wide font-num">
              Trades for {dateStr}
            </h2>
          </div>
          <button
            onClick={() => setCalendarDayModal({ isOpen: false, day: null, dateStr: '', trades: [] })}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Day P&L Header */}
        <div className="px-6 py-3 bg-secondary/30 border-b border-border flex items-center justify-between">
          <span className="text-muted-foreground text-xs font-num">
            {trades.length} {trades.length === 1 ? 'trade' : 'trades'} executed
          </span>
          <span
            className={`text-base font-num font-extrabold ${
              isProfit ? 'text-profit' : 'text-loss'
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
            const effectivePips = getEffectiveTradePips(t);
            const effectiveRR = getEffectiveTradeRR(t);

            return (
              <div
                key={t.id}
                className="bg-card/70 border border-border rounded-xl p-4 space-y-2 hover:border-border/80 transition"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-foreground font-num font-bold text-sm">
                      {t.pair}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-num ${
                        isBuy
                          ? 'bg-profit/15 text-profit border border-profit/30'
                          : 'bg-loss/15 text-loss border border-loss/30'
                      }`}
                    >
                      {t.direction}
                    </span>
                    <span className="text-muted-foreground text-xs">
                      · {t.session}
                    </span>
                    {t.time && (
                      <span className="flex items-center gap-1 text-[11px] font-mono text-muted-foreground/80 bg-secondary/50 px-1.5 py-0.5 rounded border border-border/50">
                        <Clock className="w-2.5 h-2.5 text-primary/70 shrink-0" />
                        <span>{formatTimeDisplay(t.time)}</span>
                      </span>
                    )}
                  </div>

                  <span
                    className={`font-num font-extrabold text-sm ${
                      tradeProfit ? 'text-profit' : 'text-loss'
                    }`}
                  >
                    {formatCurrencyRaw(t.pnl, currency, true)}
                  </span>
                </div>

                <div className="flex items-center justify-between text-xs font-num text-muted-foreground">
                  <span>
                    {t.entryPrice} → {t.exitPrice}
                  </span>
                  <div className="flex items-center gap-2">
                    <span>{effectivePips !== null ? `${formatPips(effectivePips)} pips` : '-'}</span>
                    <span>·</span>
                    <span>{effectiveRR.formatted}</span>
                  </div>
                </div>

                {t.notes && (
                  <p className="text-xs text-muted-foreground pt-1 border-t border-border/40">
                    &ldquo;{t.notes}&rdquo;
                  </p>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
