import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Sparkles } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { calculateCalendarMonth } from '../../utils/calculations';
import { formatCurrencyRaw } from '../../utils/formatters';

export const CalendarPreview = () => {
  const { trades, currency, setCalendarDayModal } = useTrading();

  const now = new Date();
  // Default to November 2026 or current date based on trade dates
  const [currentYear, setCurrentYear] = useState(() => {
    if (trades && trades.length > 0) {
      const dates = trades.map((t) => new Date(t.date || t.opened_at)).filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        return dates[0].getFullYear();
      }
    }
    return 2026;
  });

  const [currentMonth, setCurrentMonth] = useState(() => {
    if (trades && trades.length > 0) {
      const dates = trades.map((t) => new Date(t.date || t.opened_at)).filter((d) => !isNaN(d.getTime()));
      if (dates.length > 0) {
        return dates[0].getMonth();
      }
    }
    return 10; // November (0-indexed)
  });

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

  const handleCurrentMonth = () => {
    setCurrentMonth(now.getMonth());
    setCurrentYear(now.getFullYear());
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

  // Build the complete calendar cell array for the entire month
  const calendarCells = [];
  for (let i = 0; i < firstDayIndex; i++) {
    calendarCells.push(null);
  }
  for (let d = 1; d <= daysInMonth; d++) {
    calendarCells.push(d);
  }
  // Fill remaining cells to complete the grid row evenly
  const remainder = calendarCells.length % 7;
  if (remainder !== 0) {
    for (let i = 0; i < 7 - remainder; i++) {
      calendarCells.push(null);
    }
  }

  // Count win days vs loss days in this month
  let winDays = 0;
  let lossDays = 0;
  Object.values(dailyMap).forEach((dayData) => {
    if (dayData.count > 0) {
      if (dayData.pnl > 0) winDays++;
      else if (dayData.pnl < 0) lossDays++;
    }
  });

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

  const isCurrentViewingMonth =
    now.getFullYear() === currentYear && now.getMonth() === currentMonth;
  const todayDateNum = isCurrentViewingMonth ? now.getDate() : null;

  return (
    <div className="rounded-2xl border border-border bg-card/75 backdrop-blur-sm p-4 sm:p-6 shadow-sm animate-rise overflow-hidden">
      {/* Calendar Header with Navigation & Summary */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5 pb-4 border-b border-border/80">
        <div>
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-primary/15 border border-primary/30 text-profit flex items-center justify-center shrink-0 shadow-xs">
              <CalendarIcon className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-foreground tracking-tight font-num">
                {monthNames[currentMonth]} {currentYear}
              </h2>
              <p className="text-[11px] text-muted-foreground font-sans">
                Full Monthly P&L Calendar · Tap any day to inspect trades
              </p>
            </div>
          </div>
        </div>

        {/* Right side: Navigation buttons & Month P&L badge */}
        <div className="flex items-center justify-between sm:justify-end gap-2.5">
          <div
            className={`px-3 py-1.5 rounded-xl border font-num text-xs sm:text-sm font-extrabold tracking-tight shadow-xs ${
              monthTotalPnl >= 0
                ? 'bg-profit/15 text-profit border-profit/40 glow-green'
                : 'bg-loss/15 text-loss border-loss/40'
            }`}
          >
            {formatCurrencyRaw(monthTotalPnl, currency, true)}
          </div>

          <div className="flex items-center gap-1 bg-secondary/40 border border-border/80 p-1 rounded-xl shrink-0">
            <button
              type="button"
              onClick={handlePrevMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer active:scale-95"
              title="Previous Month"
              aria-label="Previous Month"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={handleCurrentMonth}
              className="px-2 py-1 rounded-lg text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer"
              title="Current Month"
            >
              Today
            </button>
            <button
              type="button"
              onClick={handleNextMonth}
              className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition cursor-pointer active:scale-95"
              title="Next Month"
              aria-label="Next Month"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Day of Week Headers */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2 mb-2.5 text-center">
        {dayHeaders.map((dh, idx) => (
          <div
            key={idx}
            className="text-muted-foreground text-[10px] sm:text-[11px] font-bold font-num tracking-wider py-1 uppercase"
          >
            {dh}
          </div>
        ))}
      </div>

      {/* Full Month Calendar Grid (Complete Days 1 through End of Month) */}
      <div className="grid grid-cols-7 gap-1.5 sm:gap-2">
        {calendarCells.map((dayNum, idx) => {
          if (dayNum === null) {
            return (
              <div
                key={`empty-${idx}`}
                className="min-h-[64px] sm:min-h-[76px] md:min-h-[86px] rounded-xl bg-secondary/15 border border-border/20 opacity-30"
              />
            );
          }

          const dayData = dailyMap[dayNum];
          const hasTrades = dayData && dayData.count > 0;
          const isProfit = hasTrades && dayData.pnl > 0;
          const isLoss = hasTrades && dayData.pnl < 0;
          const isBreakEven = hasTrades && dayData.pnl === 0;
          const isToday = dayNum === todayDateNum;

          let cardBg =
            'bg-card/40 border-border/50 hover:border-border/80 text-foreground';
          if (isProfit) {
            cardBg =
              'bg-profit/10 border-profit/40 shadow-[0_0_12px_rgba(18,213,134,0.12)] cursor-pointer hover:border-profit hover:bg-profit/15 hover:shadow-[0_0_20px_rgba(18,213,134,0.22)]';
          } else if (isLoss) {
            cardBg =
              'bg-loss/10 border-loss/40 shadow-[0_0_12px_rgba(239,68,68,0.12)] cursor-pointer hover:border-loss hover:bg-loss/15 hover:shadow-[0_0_20px_rgba(239,68,68,0.22)]';
          } else if (isBreakEven) {
            cardBg =
              'bg-secondary/60 border-border cursor-pointer hover:bg-secondary';
          }

          return (
            <div
              key={dayNum}
              onClick={() => handleDayClick(dayNum)}
              className={`min-h-[64px] sm:min-h-[76px] md:min-h-[86px] p-2 sm:p-2.5 rounded-xl border flex flex-col justify-between transition-all duration-200 font-num select-none relative group ${cardBg} ${
                isToday ? 'ring-2 ring-primary/40' : ''
              }`}
            >
              {/* Day Number and Today Indicator */}
              <div className="flex items-center justify-between">
                <span
                  className={`text-[10px] sm:text-xs font-num font-semibold ${
                    isToday
                      ? 'text-primary font-bold'
                      : hasTrades
                      ? 'text-foreground'
                      : 'text-muted-foreground'
                  }`}
                >
                  {dayNum}
                </span>
                {isToday && (
                  <span
                    className="w-1.5 h-1.5 rounded-full bg-primary shrink-0 shadow-xs"
                    title="Today"
                  />
                )}
              </div>

              {/* Day P&L Content */}
              {hasTrades ? (
                <div className="my-auto py-0.5">
                  <div
                    className={`text-[11px] sm:text-xs md:text-sm font-num font-extrabold tracking-tight truncate ${
                      isProfit
                        ? 'text-profit glow-green'
                        : isLoss
                        ? 'text-loss'
                        : 'text-muted-foreground'
                    }`}
                  >
                    {formatCurrencyRaw(dayData.pnl, currency, true)}
                  </div>
                </div>
              ) : (
                <div className="my-auto" />
              )}

              {/* Trade count badge */}
              <div className="flex items-center justify-end">
                {hasTrades ? (
                  <span className="text-[9px] sm:text-[10px] font-num font-medium text-muted-foreground px-1 py-0.2 rounded bg-secondary/60 border border-border/40">
                    {dayData.count}t
                  </span>
                ) : (
                  <span className="h-3.5" />
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Month Summary Stats Strip (Trading Days, Best Day, Worst Day, Win/Loss Ratio) */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2.5 sm:gap-3 mt-5 pt-4 border-t border-border/80 font-num">
        <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 sm:p-3.5">
          <div className="text-muted-foreground text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1">
            Trading Days
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-foreground">
            {activeTradingDays} <span className="text-xs text-muted-foreground font-normal">days</span>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 sm:p-3.5">
          <div className="text-muted-foreground text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1">
            Best Day
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-profit">
            {formatCurrencyRaw(bestDayPnl, currency, true)}
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 sm:p-3.5">
          <div className="text-muted-foreground text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1">
            Worst Day
          </div>
          <div
            className={`text-lg sm:text-xl font-extrabold ${
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

        <div className="rounded-xl border border-border/70 bg-secondary/30 p-3 sm:p-3.5">
          <div className="text-muted-foreground text-[10px] sm:text-[11px] font-bold tracking-wider uppercase mb-1">
            Day Win / Loss
          </div>
          <div className="text-lg sm:text-xl font-extrabold text-foreground flex items-center gap-1.5">
            <span className="text-profit">{winDays}W</span>
            <span className="text-muted-foreground text-sm font-normal">/</span>
            <span className="text-loss">{lossDays}L</span>
          </div>
        </div>
      </div>
    </div>
  );
};
