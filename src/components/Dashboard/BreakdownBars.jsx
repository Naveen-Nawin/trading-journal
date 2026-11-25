import React from 'react';
import { useTrading } from '../../context/TradingContext';
import { formatCurrencyRaw } from '../../utils/formatters';

export const BreakdownBars = () => {
  const { stats, currency } = useTrading();

  const renderSection = (title, items) => {
    return (
      <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs animate-rise">
        <h4 className="text-xs font-semibold tracking-wider uppercase text-muted-foreground mb-4">
          {title}
        </h4>
        <div className="space-y-4">
          {items.length === 0 ? (
            <div className="text-xs text-muted-foreground/60 py-6 text-center font-num">
              No trades logged yet
            </div>
          ) : (
            items.slice(0, 6).map((item, idx) => {
              const isProfit = item.pnl >= 0;
              const barWidth = Math.max(8, Math.min(100, item.winRate || 0));

              return (
                <div key={idx} className="space-y-1.5">
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-foreground font-num font-medium tracking-wide">
                      {item.name}
                    </span>
                    <div className="flex items-center gap-1.5 font-num text-[11px]">
                      <span className="text-muted-foreground">{item.count}t</span>
                      <span className="text-border">·</span>
                      <span className="text-muted-foreground">{item.winRate.toFixed(1)}%w</span>
                      <span className="text-border">·</span>
                      <span
                        className={`font-semibold ${
                          isProfit ? 'text-profit' : 'text-loss'
                        }`}
                      >
                        {formatCurrencyRaw(item.pnl, currency, true)}
                      </span>
                    </div>
                  </div>

                  {/* Progress bar */}
                  <div className="w-full h-1.5 bg-secondary/80 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isProfit
                          ? 'bg-profit shadow-[0_0_8px_rgba(18,213,134,0.4)]'
                          : 'bg-loss shadow-[0_0_8px_rgba(239,68,68,0.4)]'
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
