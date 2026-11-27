import React from 'react';
import { AlertTriangle, Lock, X, Volume2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const DisciplineAlertModal = () => {
  const { disciplineAlert, dismissDisciplineAlert } = useTrading();

  if (!disciplineAlert?.isOpen) return null;

  const isLock = disciplineAlert.type === 'lock';

  return (
    <div className="fixed inset-0 z-60 flex items-center justify-center p-4 bg-background/85 backdrop-blur-md animate-fade-in">
      <div
        className={`relative w-full max-w-lg rounded-2xl p-6 sm:p-7 border shadow-2xl transition-all animate-rise text-foreground ${
          isLock
            ? 'bg-[#12080a] border-loss/70 shadow-[0_0_50px_rgba(239,68,68,0.35)]'
            : 'bg-[#141009] border-amber-500/70 shadow-[0_0_50px_rgba(245,158,11,0.3)]'
        }`}
      >
        {/* Close Button */}
        <button
          onClick={dismissDisciplineAlert}
          className="absolute top-4 right-4 p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-secondary/40 hover:bg-secondary transition cursor-pointer"
          title="Dismiss"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Icon & Title */}
        <div className="flex flex-col items-center text-center space-y-4">
          <div
            className={`w-16 h-16 rounded-2xl flex items-center justify-center shadow-lg ${
              isLock
                ? 'bg-loss/20 text-loss border border-loss/50 animate-pulse shadow-[0_0_20px_rgba(239,68,68,0.4)]'
                : 'bg-amber-500/20 text-amber-400 border border-amber-500/50 shadow-[0_0_20px_rgba(245,158,11,0.3)]'
            }`}
          >
            {isLock ? <Lock className="w-8 h-8 stroke-[2.5]" /> : <AlertTriangle className="w-8 h-8 stroke-[2.5]" />}
          </div>

          <div className="space-y-1">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider ${
                isLock
                  ? 'bg-loss/20 text-loss border border-loss/40'
                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              }`}
            >
              <Volume2 className="w-3.5 h-3.5" />
              {isLock ? 'Daily Limit Reached (5/5 Trades)' : `Trade #${disciplineAlert.count} Completed Today`}
            </span>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-foreground pt-1">
              {isLock ? '🚨 TRADING LOCKED FOR TODAY' : '⚠️ EMOTIONS CONTROL CHECK'}
            </h2>
          </div>

          {/* Telugu Quote Highlight */}
          <div
            className={`w-full p-4 rounded-xl border text-center space-y-1 ${
              isLock
                ? 'bg-loss/10 border-loss/40 text-red-200'
                : 'bg-amber-500/10 border-amber-500/40 text-amber-200'
            }`}
          >
            <p className="text-base sm:text-lg font-bold tracking-wide leading-snug">
              “Emotions control cheysuko! Trades enduku enter avutunavuu think cheysuko!”
            </p>
            <p className="text-xs text-muted-foreground font-mono">
              (Control your emotions! Think carefully: why are you entering trades?)
            </p>
          </div>

          {/* Explanation */}
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            {isLock ? (
              <>
                You have reached your <span className="text-foreground font-bold font-num">maximum limit of 5 trades today</span>. 
                Whether in profit or loss, trade logging is <span className="text-loss font-bold">LOCKED</span> to protect 
                your psychology and prevent destructive overtrading. Step away from the charts now!
              </>
            ) : (
              <>
                You have already logged <span className="text-foreground font-bold font-num">{disciplineAlert.count} trades today</span>. 
                Whether in profit or loss, ask yourself honestly: Are you strictly following your strategy, or is greed/FOMO driving your entries?
              </>
            )}
          </p>

          {/* Action Button */}
          <button
            onClick={dismissDisciplineAlert}
            className={`w-full py-3 px-4 rounded-xl font-bold text-sm tracking-wide transition shadow-lg cursor-pointer active:scale-95 ${
              isLock
                ? 'bg-loss hover:bg-loss/90 text-white hover:shadow-[0_0_20px_rgba(239,68,68,0.5)]'
                : 'bg-amber-500 hover:bg-amber-400 text-black hover:shadow-[0_0_20px_rgba(245,158,11,0.5)]'
            }`}
          >
            {isLock ? 'I Will Step Away From Charts (Close)' : 'I Understand & Will Control My Emotions'}
          </button>
        </div>
      </div>
    </div>
  );
};
