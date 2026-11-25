import React from 'react';
import { ChevronRight } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { calculateCalendarMonth } from '../../utils/calculations';
import { formatCurrencyRaw } from '../../utils/formatters';

export const CalendarPreview = () => {
  const { trades, currency, setCurrentTab, setCalendarDayModal } = useTrading();

  const year = 2026;
  const month = 10; // November

  const {
    firstDayIndex,
    dailyMap,
    monthTotalPnl,
  } = calculateCalendarMonth(trades, year, month);

  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const previewCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    previewCells.push(null);
  }
  for (let d = 1; d <= 9; d++) {
    previewCells.push(d);
  }

  const handleDayClick = (dayNum) => {
    const dayData = dailyMap[dayNum];
    if (dayData && dayData.trades.length > 0) {
      const monthStr = String(month + 1).padStart(2, '0');
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${year}-${monthStr}-${dayStr}`;
      setCalendarDayModal({
        isOpen: true,
        day: dayNum,
        dateStr,
        trades: dayData.trades,
        dayPnl: dayData.pnl,
      });
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 md:p-6 shadow-xs animate-rise">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-border/60">
        <div>
          <h3 className="text-foreground text-sm font-bold tracking-wide">
            November 2026
          </h3>
          <span className="text-profit font-num text-xs font-semibold">
            {formatCurrencyRaw(monthTotalPnl, currency, true)} this month
          </span>
        </div>
        <button
          onClick={() => setCurrentTab('calendar')}
          className="flex items-center gap-1 text-xs text-profit hover:text-profit/80 font-medium transition cursor-pointer"
        >
          View Full Calendar
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {dayHeaders.map((dh, idx) => (
          <div key={idx} className="text-muted-foreground text-[10px] font-bold font-num tracking-wider">
            {dh}
          </div>
        ))}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-7 gap-2">
        {previewCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="h-20 rounded-xl bg-secondary/20 border border-border/30 opacity-30"
              />
            );
          }

          const dayData = dailyMap[dayNum];
          const hasTrades = dayData && dayData.count > 0;
          const isProfit = hasTrades && dayData.pnl > 0;
          const isLoss = hasTrades && dayData.pnl < 0;

          let cardBg = 'bg-card/40 border-border/50';
          if (isProfit) {
            cardBg = 'bg-profit/10 border-profit/35 shadow-[0_0_12px_rgba(18,213,134,0.12)] cursor-pointer hover:border-profit/80';
          } else if (isLoss) {
            cardBg = 'bg-loss/10 border-loss/35 shadow-[0_0_12px_rgba(239,68,68,0.12)] cursor-pointer hover:border-loss/80';
          }

          return (
            <div
              key={dayNum}
              onClick={() => handleDayClick(dayNum)}
              className={`h-20 p-2 rounded-xl border flex flex-col justify-between transition-all font-num ${cardBg}`}
            >
              <div className="text-[10px] font-num text-muted-foreground">{dayNum}</div>
              {hasTrades && (
                <div
                  className={`text-[11px] font-num font-bold ${
                    isProfit ? 'text-profit' : 'text-loss'
                  }`}
                >
                  {formatCurrencyRaw(dayData.pnl, currency, true)}
                </div>
              )}
              <div className="text-right">
                {hasTrades && (
                  <span className="text-[9px] font-num text-muted-foreground">{dayData.count}t</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
