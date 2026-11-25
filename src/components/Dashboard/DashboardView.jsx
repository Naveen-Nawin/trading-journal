import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw, formatR } from '../../utils/formatters';
import { EquityCurveChart } from './EquityCurveChart';
import { JournalPulse } from './JournalPulse';
import { BreakdownBars } from './BreakdownBars';
import { CalendarPreview } from './CalendarPreview';

export const DashboardView = () => {
  const { stats, currency } = useTrading();

  const currentDateFormatted = 'WEDNESDAY, 18 NOVEMBER 2026';

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div>
        <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-1">
          {currentDateFormatted}
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          Trading Performance
        </h1>
      </div>

      {/* Top 4 Metric Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Net P&L Card */}
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-2">
            NET P&L
          </div>
          <div
            className={`text-2xl md:text-3xl font-mono font-extrabold tracking-tight ${
              stats.netPnl >= 0 ? 'text-[#00f098]' : 'text-[#ff4d4d]'
            }`}
          >
            {formatCurrencyRaw(stats.netPnl, currency, true)}
          </div>
          <div className="text-[#64748b] text-xs font-mono mt-2">
            {stats.closedCount} closed · {stats.openCount} open
          </div>
        </div>

        {/* Win Rate Card */}
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-2">
            WIN RATE
          </div>
          <div className="text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight">
            {stats.winRate.toFixed(1)}%
          </div>
          <div className="text-[#64748b] text-xs font-mono mt-2">
            avg win {formatCurrencyRaw(stats.avgWin, currency, false)}
          </div>
        </div>

        {/* Profit Factor Card */}
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-2">
            PROFIT FACTOR
          </div>
          <div className="text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight">
            {stats.profitFactor.toFixed(2)}
          </div>
          <div className="text-[#64748b] text-xs font-mono mt-2">
            avg loss {formatCurrencyRaw(stats.avgLoss, currency, false)}
          </div>
        </div>

        {/* Avg R Multiple Card */}
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-2">
            AVG R MULTIPLE
          </div>
          <div className="text-2xl md:text-3xl font-mono font-extrabold text-white tracking-tight">
            {formatR(stats.avgRMultiple)}
          </div>
          <div className="text-[#64748b] text-xs font-mono mt-2">
            plan followed {stats.planComplianceRate.toFixed(1)}%
          </div>
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

