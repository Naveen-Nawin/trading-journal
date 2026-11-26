import React from 'react';
import { Calculator } from 'lucide-react';
import { TradingCalculator } from './TradingCalculator';

export const CalculatorView = () => {
  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="animate-rise">
        <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1 flex items-center gap-1.5">
          <Calculator className="w-3.5 h-3.5 text-profit" />
          <span>Position Sizing & Profit Planning</span>
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          Trading <span className="text-profit glow-green">Profit Calculator</span>
        </h1>
        <p className="text-muted-foreground text-xs mt-1.5 max-w-2xl leading-relaxed">
          Simulate exact profits, losses, risk-to-reward ratios, and target milestones before entering the market. Supports Gold (XAUUSD), EUR/USD, GBP/USD, Nasdaq (US100), Dow Jones (US30 / US300), Ethereum (ETH), NIFTY, and SENSEX.
        </p>
      </div>

      {/* Main Calculator Card */}
      <TradingCalculator />
    </div>
  );
};
