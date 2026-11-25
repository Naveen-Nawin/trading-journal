import React from 'react';
import { Trash2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const ConfirmDeleteModal = () => {
  const { tradeToDelete, setTradeToDelete, deleteTrade } = useTrading();

  if (!tradeToDelete) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs">
      <div className="relative w-full max-w-sm bg-[#090e14] border border-[#2b181b] rounded-2xl shadow-2xl p-6 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-[#ff4d4d]/10 border border-[#ff4d4d]/30 text-[#ff4d4d] flex items-center justify-center mx-auto">
          <Trash2 className="w-6 h-6" />
        </div>

        <div>
          <h3 className="text-white font-bold text-base">Delete Trade?</h3>
          <p className="text-xs text-[#8092a4] mt-1">
            Are you sure you want to delete this trade ({tradeToDelete.pair} - {tradeToDelete.direction})? This action cannot be undone.
          </p>
        </div>

        <div className="flex gap-2 justify-center pt-2">
          <button
            onClick={() => setTradeToDelete(null)}
            className="px-4 py-2 text-xs font-semibold text-[#8092a4] hover:text-white rounded-xl bg-[#121c27] hover:bg-[#1a2736] transition"
          >
            Cancel
          </button>
          <button
            onClick={() => deleteTrade(tradeToDelete.id)}
            className="px-5 py-2 text-xs font-bold text-white bg-[#ff4d4d] hover:bg-[#ff4d4d]/90 rounded-xl transition shadow-[0_0_12px_rgba(255,77,77,0.3)]"
          >
            Yes, Delete
          </button>
        </div>
      </div>
    </div>
  );
};

