import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { calculateCalendarMonth } from '../../utils/calculations';
import { formatCurrencyRaw } from '../../utils/formatters';

export const CalendarView = () => {
  const { trades, currency, setCalendarDayModal } = useTrading();

  const [currentYear, setCurrentYear] = useState(2026);
  const [currentMonth, setCurrentMonth] = useState(10); // 0-indexed: 10 = November

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = () => {
    if (currentMonth === 0) {
      setCurrentMonth(11);
      setCurrentYear((y) => y - 1);
    } else {
      setCurrentMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (currentMonth === 11) {
      setCurrentMonth(0);
      setCurrentYear((y) => y + 1);
    } else {
      setCurrentMonth((m) => m + 1);
    }
  };

  const {
    daysInMonth,
    firstDayIndex,
    dailyMap,
    monthTotalPnl,
    bestDayPnl,
    worstDayPnl,
    activeTradingDays,
  } = calculateCalendarMonth(trades, currentYear, currentMonth);

  const dayHeaders = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }

  const handleDayClick = (dayNum) => {
    const dayData = dailyMap[dayNum];
    if (dayData && dayData.trades.length > 0) {
      const monthStr = String(currentMonth + 1).padStart(2, '0');
      const dayStr = String(dayNum).padStart(2, '0');
      const dateStr = `${currentYear}-${monthStr}-${dayStr}`;
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
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-1">
          MONTH AT A GLANCE
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Daily P&L Calendar
        </h1>
        <p className="text-[#64748b] text-xs mt-1">
          Green days build your edge, red days teach you something. Tap any day to review its trades.
        </p>
      </div>

      {/* Main Calendar Card */}
      <div className="bg-[#0b1117] border border-[#16222f] rounded-2xl p-6 shadow-xl">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-[#141e2a]">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#121c27] transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-bold text-white tracking-wide">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div
              className={`text-xs font-mono font-semibold mt-0.5 ${
                monthTotalPnl >= 0 ? 'text-[#00f098]' : 'text-[#ff4d4d]'
              }`}
            >
              {formatCurrencyRaw(monthTotalPnl, currency, true)} this month
            </div>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-[#64748b] hover:text-white hover:bg-[#121c27] transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {dayHeaders.map((dh, idx) => (
            <div
              key={idx}
              className="text-[#546577] text-[11px] font-bold font-mono tracking-wider py-1"
            >
              {dh}
            </div>
          ))}
        </div>

        {/* Calendar Grid */}
        <div className="grid grid-cols-7 gap-2">
          {calendarCells.map((dayNum, idx) => {
            if (dayNum === null) {
              return (
                <div
                  key={`empty-${idx}`}
                  className="min-h-[88px] rounded-xl bg-[#080d12]/40 border border-[#121a24]/40 opacity-30"
                />
              );
            }

            const dayData = dailyMap[dayNum];
            const hasTrades = dayData && dayData.count > 0;
            const isProfit = hasTrades && dayData.pnl > 0;
            const isLoss = hasTrades && dayData.pnl < 0;

            let cardBg = 'bg-[#080d12]/70 border-[#141e2a] hover:border-[#1e2d3d]';
            if (isProfit) {
              cardBg = 'bg-[#0c241c] border-[#00f098]/40 shadow-[0_0_15px_rgba(0,240,152,0.12)] cursor-pointer hover:border-[#00f098]/80';
            } else if (isLoss) {
              cardBg = 'bg-[#241117] border-[#ff4d4d]/40 shadow-[0_0_15px_rgba(255,77,77,0.12)] cursor-pointer hover:border-[#ff4d4d]/80';
            }

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[88px] p-2.5 rounded-xl border flex flex-col justify-between transition-all ${cardBg}`}
              >
                {/* Day number */}
                <div className="text-[11px] font-mono font-medium text-[#64748b]">
                  {dayNum}
                </div>

                {/* Day P&L content */}
                {hasTrades ? (
                  <div className="my-auto">
                    <div
                      className={`text-xs md:text-sm font-mono font-bold tracking-tight ${
                        isProfit ? 'text-[#00f098]' : 'text-[#ff4d4d]'
                      }`}
                    >
                      {formatCurrencyRaw(dayData.pnl, currency, true)}
                    </div>
                  </div>
                ) : (
                  <div />
                )}

                {/* Trade count badge */}
                <div className="text-right">
                  {hasTrades && (
                    <span className="text-[10px] font-mono text-[#8092a4]">
                      {dayData.count}t
                    </span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom 3 Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-1">
            TRADING DAYS
          </div>
          <div className="text-2xl font-mono font-extrabold text-white">
            {activeTradingDays}
          </div>
        </div>

        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-1">
            BEST DAY
          </div>
          <div className="text-2xl font-mono font-extrabold text-[#00f098]">
            {formatCurrencyRaw(bestDayPnl, currency, true)}
          </div>
        </div>

        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-1">
            WORST DAY
          </div>
          <div
            className={`text-2xl font-mono font-extrabold ${
              worstDayPnl < 0
                ? 'text-[#ff4d4d]'
                : worstDayPnl > 0
                ? 'text-[#00f098]'
                : 'text-[#64748b]'
            }`}
          >
            {formatCurrencyRaw(worstDayPnl, currency, worstDayPnl > 0)}
          </div>
        </div>
      </div>
    </div>
  );
};

