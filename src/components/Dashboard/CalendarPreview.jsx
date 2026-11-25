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
    <div className="bg-[#0b1117] border border-[#16222f] rounded-2xl p-6 shadow-xl">
      <div className="flex items-center justify-between mb-4 pb-3 border-b border-[#141e2a]">
        <div>
          <h3 className="text-white text-sm font-bold tracking-wide">
            November 2026
          </h3>
          <span className="text-[#00f098] font-mono text-xs font-semibold">
            {formatCurrencyRaw(monthTotalPnl, currency, true)} this month
          </span>
        </div>
        <button
          onClick={() => setCurrentTab('calendar')}
          className="flex items-center gap-1 text-xs text-[#00f098] hover:underline font-medium"
        >
          View Full Calendar
          <ChevronRight className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Day of week headers */}
      <div className="grid grid-cols-7 gap-2 mb-2 text-center">
        {dayHeaders.map((dh, idx) => (
          <div key={idx} className="text-[#546577] text-[10px] font-bold font-mono tracking-wider">
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
                className="h-20 rounded-xl bg-[#080d12]/40 border border-[#121a24]/40 opacity-30"
              />
            );
          }

          const dayData = dailyMap[dayNum];
          const hasTrades = dayData && dayData.count > 0;
          const isProfit = hasTrades && dayData.pnl > 0;
          const isLoss = hasTrades && dayData.pnl < 0;

          let cardBg = 'bg-[#080d12]/70 border-[#141e2a]';
          if (isProfit) {
            cardBg = 'bg-[#0c241c] border-[#00f098]/40 shadow-[0_0_12px_rgba(0,240,152,0.1)] cursor-pointer hover:border-[#00f098]/80';
          } else if (isLoss) {
            cardBg = 'bg-[#241117] border-[#ff4d4d]/40 shadow-[0_0_12px_rgba(255,77,77,0.1)] cursor-pointer hover:border-[#ff4d4d]/80';
          }

          return (
            <div
              key={dayNum}
              onClick={() => handleDayClick(dayNum)}
              className={`h-20 p-2 rounded-xl border flex flex-col justify-between transition-all ${cardBg}`}
            >
              <div className="text-[10px] font-mono text-[#64748b]">{dayNum}</div>
              {hasTrades && (
                <div
                  className={`text-[11px] font-mono font-bold ${
                    isProfit ? 'text-[#00f098]' : 'text-[#ff4d4d]'
                  }`}
                >
                  {formatCurrencyRaw(dayData.pnl, currency, true)}
                </div>
              )}
              <div className="text-right">
                {hasTrades && (
                  <span className="text-[9px] font-mono text-[#8092a4]">{dayData.count}t</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

