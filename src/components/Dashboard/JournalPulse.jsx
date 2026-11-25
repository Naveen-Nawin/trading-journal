import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw } from '../../utils/formatters';

export const JournalPulse = () => {
  const { stats, currency } = useTrading();

  const getPnlColor = (val, isPositiveType = false) => {
    if (val > 0) return 'text-profit';
    if (val < 0) return 'text-loss';
    return isPositiveType ? 'text-muted-foreground' : 'text-muted-foreground/70';
  };

  const items = [
    {
      label: 'Best trade',
      value: formatCurrencyRaw(stats.bestTrade, currency, true),
      colorClass: stats.bestTrade > 0 ? 'text-profit' : 'text-muted-foreground',
    },
    {
      label: 'Worst trade',
      value: formatCurrencyRaw(stats.worstTrade, currency, stats.worstTrade > 0),
      colorClass: getPnlColor(stats.worstTrade),
    },
    {
      label: 'Gross profit',
      value: formatCurrencyRaw(stats.grossProfit, currency, false),
      colorClass: stats.grossProfit > 0 ? 'text-foreground' : 'text-muted-foreground',
    },
    {
      label: 'Gross loss',
      value: formatCurrencyRaw(stats.grossLoss, currency, false),
      colorClass: stats.grossLoss < 0 ? 'text-loss' : 'text-muted-foreground',
    },
    {
      label: 'Max drawdown',
      value: formatCurrencyRaw(stats.maxDrawdown, currency, false),
      colorClass: stats.maxDrawdown < 0 ? 'text-loss' : 'text-muted-foreground',
    },
  ];

  return (
    <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs flex flex-col justify-between animate-rise">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground">
          Journal Pulse
        </h3>
      </div>

      <div className="space-y-3.5 my-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-1 border-b border-border/40 last:border-b-0"
          >
            <span className="text-muted-foreground text-xs font-medium">
              {item.label}
            </span>
            <span className={`text-sm font-num font-semibold ${item.colorClass}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};
