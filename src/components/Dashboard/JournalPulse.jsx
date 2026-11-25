import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw } from '../../utils/formatters';

export const JournalPulse = () => {
  const { stats, currency } = useTrading();

  const getPnlColor = (val, isPositiveType = false) => {
    if (val > 0) return 'text-[#00f098]';
    if (val < 0) return 'text-[#ff4d4d]';
    return isPositiveType ? 'text-[#8092a4]' : 'text-[#64748b]';
  };

  const items = [
    {
      label: 'Best trade',
      value: formatCurrencyRaw(stats.bestTrade, currency, true),
      colorClass: stats.bestTrade > 0 ? 'text-[#00f098]' : 'text-[#64748b]',
    },
    {
      label: 'Worst trade',
      value: formatCurrencyRaw(stats.worstTrade, currency, stats.worstTrade > 0),
      colorClass: getPnlColor(stats.worstTrade),
    },
    {
      label: 'Gross profit',
      value: formatCurrencyRaw(stats.grossProfit, currency, false),
      colorClass: stats.grossProfit > 0 ? 'text-[#e2e8f0]' : 'text-[#64748b]',
    },
    {
      label: 'Gross loss',
      value: formatCurrencyRaw(stats.grossLoss, currency, false),
      colorClass: stats.grossLoss < 0 ? 'text-[#ff4d4d]' : 'text-[#64748b]',
    },
    {
      label: 'Max drawdown',
      value: formatCurrencyRaw(stats.maxDrawdown, currency, false),
      colorClass: stats.maxDrawdown < 0 ? 'text-[#ff4d4d]' : 'text-[#64748b]',
    },
  ];

  return (
    <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm flex flex-col justify-between">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-white text-xs font-bold tracking-widest uppercase">
          JOURNAL PULSE
        </h3>
      </div>

      <div className="space-y-3.5 my-auto">
        {items.map((item, idx) => (
          <div
            key={idx}
            className="flex items-center justify-between py-1 border-b border-[#141e2a]/50 last:border-b-0"
          >
            <span className="text-[#8092a4] text-xs font-medium">
              {item.label}
            </span>
            <span className={`text-sm font-mono font-semibold ${item.colorClass}`}>
              {item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
};

