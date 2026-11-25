import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw, formatR } from '../../utils/formatters';
import { EquityCurveChart } from './EquityCurveChart';
import { JournalPulse } from './JournalPulse';
import { BreakdownBars } from './BreakdownBars';
import { CalendarPreview } from './CalendarPreview';

export const DashboardView = () => {
  const { stats, currency } = useTrading();

  const currentDateFormatted = new Date().toLocaleDateString("en-GB", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="space-y-5 md:space-y-6 pb-24">
      {/* Header */}
      <div className="animate-rise">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5 font-sans">
          {currentDateFormatted}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight text-white">
          Trading <span className="text-profit glow-green">Performance</span>
        </h1>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        {/* Net P&L Card */}
        <div
          className="animate-rise rounded-xl border border-primary/30 p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-sm"
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
          className="animate-rise rounded-xl border border-border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-sm"
          style={{ animationDelay: '60ms' }}
        >
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">
            WIN RATE
          </p>
          <p className="font-num font-bold text-xl md:text-2xl mt-2 tracking-tight text-white">
            {stats.winRate.toFixed(1)}%
          </p>
          <p className="text-[11px] text-muted-foreground mt-1.5 font-num">
            avg win {formatCurrencyRaw(stats.avgWin, currency, false)}
          </p>
        </div>

        {/* Profit Factor Card */}
        <div
          className="animate-rise rounded-xl border border-border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-sm"
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
          className="animate-rise rounded-xl border border-border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30 shadow-sm"
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

      {/* Mini Calendar Preview */}
      <div className="mt-8">
        <CalendarPreview />
      </div>
    </div>
  );
};

