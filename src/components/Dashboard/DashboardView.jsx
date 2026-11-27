import React from 'react';
import { Sparkles, Plus, Lock, AlertTriangle } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw, formatR } from '../../utils/formatters';
import { EquityCurveChart } from './EquityCurveChart';
import { JournalPulse } from './JournalPulse';
import { BreakdownBars } from './BreakdownBars';
import { CalendarPreview } from './CalendarPreview';
import { RotatingQuotesBanner } from './RotatingQuotesBanner';

export const DashboardView = () => {
  const {
    trades,
    stats,
    currency,
    setIsLogTradeOpen,
    loadSampleTrades,
    todayTradesCount,
    isDailyLocked,
    isDailyWarning,
    triggerDisciplineAlert,
  } = useTrading();

  const currentDateFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  // Empty State from forex-journal-project
  if (!trades || trades.length === 0) {
    return (
      <div className="space-y-6 pb-24">
        {/* Colorful Rotating Quotes Banner */}
        <RotatingQuotesBanner />

        <div className="animate-rise">
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5 font-sans">
            {currentDateFormatted}
          </p>
          <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight text-white">
            Trading <span className="text-profit glow-green">Performance</span>
          </h1>
        </div>

        <div className="animate-rise rounded-2xl border border-border bg-card/70 backdrop-blur-sm p-10 md:p-14 text-center">
          <div className="w-14 h-14 mx-auto rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center mb-5 shadow-xs">
            <Sparkles size={24} className="text-profit" />
          </div>
          <h2 className="text-xl font-bold font-num tracking-tight text-foreground">
            Your journal is empty
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
            Log your first forex trade — pair, entry, exit, emotion and screenshot — and watch your edge build up here.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
            <button
              onClick={() => setIsLogTradeOpen(true)}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Log first trade</span>
            </button>
            <button
              onClick={loadSampleTrades}
              className="flex items-center justify-center gap-2 px-5 py-2.5 bg-secondary/60 hover:bg-secondary text-foreground border border-border font-semibold text-xs rounded-xl transition cursor-pointer"
            >
              <span>Load sample trades</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5 md:space-y-6 pb-24">
      {/* Colorful Rotating Quotes Banner */}
      <RotatingQuotesBanner />

      {/* Header */}
      <div className="animate-rise">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5 font-sans">
          {currentDateFormatted}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight text-white">
          Trading <span className="text-profit glow-green">Performance</span>
        </h1>
      </div>

      {/* Daily Discipline & Lock Banner */}
      {isDailyLocked ? (
        <div
          onClick={() => triggerDisciplineAlert('lock', todayTradesCount)}
          className="animate-rise rounded-xl border border-loss/60 bg-loss/15 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer shadow-[0_0_25px_rgba(239,68,68,0.25)] hover:border-loss transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-loss/20 text-loss border border-loss/40 shrink-0">
              <Lock className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold text-loss tracking-wide flex items-center gap-2">
                <span>DAILY LIMIT REACHED (5/5 TRADES)</span>
                <span className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-loss/30 text-white font-bold">LOCKED</span>
              </p>
              <p className="text-sm font-bold text-red-100 mt-0.5">
                “Emotions control cheysuko! Trades enduku enter avutunavuu think cheysuko!”
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-loss hover:underline shrink-0">
            View Lockout Notice →
          </span>
        </div>
      ) : isDailyWarning ? (
        <div
          onClick={() => triggerDisciplineAlert('warning', todayTradesCount)}
          className="animate-rise rounded-xl border border-amber-500/60 bg-amber-500/10 p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 cursor-pointer shadow-[0_0_20px_rgba(245,158,11,0.2)] hover:border-amber-400 transition"
        >
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/40 shrink-0">
              <AlertTriangle className="w-5 h-5 animate-bounce" />
            </div>
            <div>
              <p className="text-xs font-bold text-amber-400 tracking-wide flex items-center gap-2">
                <span>DAILY DISCIPLINE WARNING ({todayTradesCount}/5 TRADES TODAY)</span>
              </p>
              <p className="text-sm font-bold text-amber-100 mt-0.5">
                “Emotions control cheysuko! Trades enduku enter avutunavuu think cheysuko!”
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-amber-400 hover:underline shrink-0">
            Check Emotions →
          </span>
        </div>
      ) : null}

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Net P&L Card */}
        <div
          className="animate-rise rounded-xl border border-primary/30 p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-xs"
          style={{ animationDelay: '0ms' }}
        >
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            NET P&L
          </p>
          <p
            className={`font-num font-bold text-xl md:text-2xl mt-2 tracking-tight ${
              stats.netPnl >= 0 ? 'text-profit glow-green' : 'text-loss'
            }`}
          >
            {formatCurrencyRaw(stats.netPnl, currency, true)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-num">
            {stats.closedCount} closed · {stats.openCount} open
          </p>
        </div>

        {/* Win Rate Card */}
        <div
          className="animate-rise rounded-xl border border-border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-xs"
          style={{ animationDelay: '60ms' }}
        >
          <div className="flex items-center justify-between">
            <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
              WIN RATE
            </p>
            <span className="text-[10px] md:text-[11px] font-mono px-2 py-0.5 rounded-md bg-secondary/80 text-foreground border border-border/80 font-bold">
              {stats.closedCount} {stats.closedCount === 1 ? 'Trade' : 'Trades'}
            </span>
          </div>

          <div className="flex items-baseline flex-wrap gap-2 md:gap-2.5 mt-2">
            <p className="font-num font-bold text-xl md:text-2xl tracking-tight text-white">
              {stats.winRate.toFixed(1)}%
            </p>
            <div className="flex items-center gap-1.5 font-num text-[11px] md:text-xs font-bold">
              <span
                className="inline-flex items-center gap-1 text-profit bg-profit/15 border border-profit/30 px-1.5 md:px-2 py-0.5 rounded-md"
                title="Winning Trades"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-profit"></span>
                <span>{stats.winCount} Won</span>
              </span>
              <span
                className="inline-flex items-center gap-1 text-loss bg-loss/15 border border-loss/30 px-1.5 md:px-2 py-0.5 rounded-md"
                title="Losing Trades"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-loss"></span>
                <span>{stats.lossCount} Lost</span>
              </span>
            </div>
          </div>

          <p className="text-[11px] text-muted-foreground mt-1.5 font-num flex items-center justify-between">
            <span>avg win {formatCurrencyRaw(stats.avgWin, currency, false)}</span>
            {stats.openCount > 0 && (
              <span className="text-primary font-medium">({stats.openCount} open)</span>
            )}
          </p>
        </div>

        {/* Profit Factor Card */}
        <div
          className="animate-rise rounded-xl border border-border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-xs"
          style={{ animationDelay: '120ms' }}
        >
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            PROFIT FACTOR
          </p>
          <p className="font-num font-bold text-xl md:text-2xl mt-2 tracking-tight text-white">
            {stats.profitFactor.toFixed(2)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-num">
            avg loss {formatCurrencyRaw(stats.avgLoss, currency, false)}
          </p>
        </div>

        {/* Avg R Multiple Card */}
        <div
          className="animate-rise rounded-xl border border-border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-xs"
          style={{ animationDelay: '180ms' }}
        >
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            AVG R MULTIPLE
          </p>
          <p className="font-num font-bold text-xl md:text-2xl mt-2 tracking-tight text-white">
            {formatR(stats.avgRMultiple)}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-num">
            plan followed {stats.planComplianceRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Middle Row: Equity Curve (2/3) + Journal Pulse (1/3) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2">
          <EquityCurveChart />
        </div>
        <div className="lg:col-span-1">
          <JournalPulse />
        </div>
      </div>

      {/* Breakdown by Pair, Session, Setup Tag */}
      <div>
        <BreakdownBars />
      </div>

      {/* Full Monthly P&L Calendar */}
      <div className="mt-8">
        <CalendarPreview />
      </div>
    </div>
  );
};
