import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw } from '../../utils/formatters';

export const BreakdownBars = () => {
  const { stats, currency } = useTrading();

  const renderSection = (title, items) => {
    return (
      <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
        <h4 className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-4">
          {title}
        </h4>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-xs text-[#546577] py-6 text-center font-mono">
              No trades logged yet
            </div>
          ) : (
            items.slice(0, 6).map((item, idx) => {
              const isProfit = item.pnl >= 0;
              const barWidth = Math.max(8, Math.min(100, item.winRate || 0));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-white font-mono font-medium tracking-wide">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 font-mono text-[11px]">
                      <span className="text-[#8092a4]">{item.count}t</span>
                      <span className="text-[#4b5563]">·</span>
                      <span className="text-[#8092a4]">{item.winRate.toFixed(1)}%w</span>
                      <span className="text-[#4b5563]">·</span>
                      <span
                        className={`font-semibold ${
                          isProfit ? 'text-[#00f098]' : 'text-[#ff4d4d]'
                        }`}
                      >
                        {formatCurrencyRaw(item.pnl, currency, true)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1 bg-[#121c27] rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isProfit
                          ? 'bg-[#00f098] shadow-[0_0_8px_rgba(0,240,152,0.6)]'
                          : 'bg-[#ff4d4d] shadow-[0_0_8px_rgba(255,77,77,0.6)]'
                      }`}
                      style={{ width: `${barWidth}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      {renderSection('BY PAIR', stats.pairBreakdown)}
      {renderSection('BY SESSION', stats.sessionBreakdown)}
      {renderSection('BY SETUP TAG', stats.setupBreakdown)}
    </div>
  );
};

