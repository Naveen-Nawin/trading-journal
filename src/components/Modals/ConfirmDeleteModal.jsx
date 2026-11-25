import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const ConfirmDeleteModal = () => {
  const { tradeToDelete, setTradeToDelete, deleteTrade } = useTrading();

  if (!tradeToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-sm bg-card border border-border rounded-xl shadow-2xl p-6 text-center space-y-4 animate-rise">
        <div className="w-12 h-12 rounded-full bg-loss/10 border border-loss/30 text-loss flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-foreground font-bold text-base">Delete Trade?</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Are you sure you want to delete this trade ({tradeToDelete.pair} - {tradeToDelete.direction})? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => setTradeToDelete(null)}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl bg-secondary/50 hover:bg-secondary transition cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteTrade(tradeToDelete.id)}
            className="px-5 py-2 text-xs font-bold text-destructive-foreground bg-loss hover:bg-loss/90 rounded-xl transition shadow-[0_0_12px_rgba(239,68,68,0.3)] cursor-pointer"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};
