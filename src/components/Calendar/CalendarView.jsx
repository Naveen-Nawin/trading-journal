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
      <div className="animate-rise">
        <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1">
          Month at a Glance
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          Daily <span className="text-profit glow-green">P&L Calendar</span>
        </h1>
        <p className="text-muted-foreground text-xs mt-1">
          Green days build your edge, red days teach you something. Tap any day to review its trades.
        </p>
      </div>

      {/* Main Calendar Card */}
      <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-6 shadow-xs animate-rise">
        {/* Navigation Bar */}
        <div className="flex items-center justify-between mb-6 pb-4 border-b border-border">
          <button
            onClick={handlePrevMonth}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150 cursor-pointer active:scale-95"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <div className="text-center">
            <h2 className="text-base font-bold text-foreground tracking-wide font-num">
              {monthNames[currentMonth]} {currentYear}
            </h2>
            <div
              className={`text-xs font-num font-semibold mt-0.5 ${
                monthTotalPnl >= 0 ? 'text-profit' : 'text-loss'
              }`}
            >
              {formatCurrencyRaw(monthTotalPnl, currency, true)} this month
            </div>
          </div>

          <button
            onClick={handleNextMonth}
            className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-all duration-150 cursor-pointer active:scale-95"
            aria-label="Next month"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        {/* Days Header */}
        <div className="grid grid-cols-7 gap-2 mb-3 text-center">
          {dayHeaders.map((dh, idx) => (
            <div
              key={idx}
              className="text-muted-foreground text-[11px] font-bold font-num tracking-wider py-1"
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
                  className="min-h-[88px] rounded-xl bg-secondary/20 border border-border/30 opacity-30"
                />
              );
            }

            const dayData = dailyMap[dayNum];
            const hasTrades = dayData && dayData.count > 0;
            const isProfit = hasTrades && dayData.pnl > 0;
            const isLoss = hasTrades && dayData.pnl < 0;

            let cardBg = 'bg-card/40 border-border/50 hover:border-border';
            if (isProfit) {
              cardBg = 'bg-profit/10 border-profit/35 shadow-[0_0_15px_rgba(18,213,134,0.12)] cursor-pointer hover:border-profit/80';
            } else if (isLoss) {
              cardBg = 'bg-loss/10 border-loss/35 shadow-[0_0_15px_rgba(239,68,68,0.12)] cursor-pointer hover:border-loss/80';
            }

            return (
              <div
                key={dayNum}
                onClick={() => handleDayClick(dayNum)}
                className={`min-h-[88px] p-2.5 rounded-xl border flex flex-col justify-between transition-all font-num ${cardBg}`}
              >
                {/* Day number */}
                <div className="text-[11px] font-num font-medium text-muted-foreground">
                  {dayNum}
                </div>

                {/* Day P&L content */}
                {hasTrades ? (
                  <div className="my-auto">
                    <div
                      className={`text-xs md:text-sm font-num font-bold tracking-tight ${
                        isProfit ? 'text-profit' : 'text-loss'
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
                    <span className="text-[10px] font-num text-muted-foreground">
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
        <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs animate-rise">
          <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1">
            Trading Days
          </div>
          <div className="text-2xl font-num font-extrabold text-foreground">
            {activeTradingDays}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs animate-rise">
          <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1">
            Best Day
          </div>
          <div className="text-2xl font-num font-extrabold text-profit">
            {formatCurrencyRaw(bestDayPnl, currency, true)}
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs animate-rise">
          <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1">
            Worst Day
          </div>
          <div
            className={`text-2xl font-num font-extrabold ${
              worstDayPnl < 0
                ? 'text-loss'
                : worstDayPnl > 0
                ? 'text-profit'
                : 'text-muted-foreground'
            }`}
          >
            {formatCurrencyRaw(worstDayPnl, currency, worstDayPnl > 0)}
          </div>
        </div>
      </div>
    </div>
  );
};
