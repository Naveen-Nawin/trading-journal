import React, { useState, useEffect } from 'react';
import { X, Save } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const EditTradeModal = () => {
  const { tradeToEdit, setTradeToEdit, updateTrade, currency } = useTrading();

  const [formData, setFormData] = useState(null);

  useEffect(() => {
    if (tradeToEdit) {
      setFormData({ ...tradeToEdit });
    }
  }, [tradeToEdit]);

  if (!tradeToEdit || !formData) return null;

  const handleChange = (field, value) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();

    const prepared = {
      ...formData,
      lots: parseFloat(formData.lots) || 0.1,
      entryPrice: parseFloat(formData.entryPrice) || 0,
      exitPrice: formData.status === 'CLOSED' && formData.exitPrice ? parseFloat(formData.exitPrice) : null,
      stopLoss: formData.stopLoss ? parseFloat(formData.stopLoss) : null,
      takeProfit: formData.takeProfit ? parseFloat(formData.takeProfit) : null,
      pnl: formData.status === 'CLOSED' ? (formData.pnl !== '' ? parseFloat(formData.pnl) : 0) : null,
      rMultiple: formData.status === 'CLOSED' ? (formData.rMultiple !== '' ? parseFloat(formData.rMultiple) : null) : null,
      pips: formData.status === 'CLOSED' ? (formData.pips !== '' ? parseFloat(formData.pips) : null) : null,
    };

    updateTrade(tradeToEdit.id, prepared);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-xl bg-[#090e14] border border-[#1b2b3b] rounded-2xl shadow-2xl overflow-hidden my-8">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#141f2b] bg-[#0c131c]">
          <h2 className="text-white font-extrabold text-base tracking-wide">
            Edit Trade #{formData.id}
          </h2>
          <button
            onClick={() => setTradeToEdit(null)}
            className="p-1.5 text-[#64748b] hover:text-white rounded-lg hover:bg-[#15212d] transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Pair
              </label>
              <input
                type="text"
                value={formData.pair}
                onChange={(e) => handleChange('pair', e.target.value.toUpperCase())}
                required
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Direction
              </label>
              <select
                value={formData.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full bg-[#06090d] text-white text-xs border border-[#16222f] rounded-xl px-3 py-2"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Session
              </label>
              <input
                type="text"
                value={formData.session}
                onChange={(e) => handleChange('session', e.target.value)}
                className="w-full bg-[#06090d] text-white text-xs border border-[#16222f] rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Lots
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.lots}
                onChange={(e) => handleChange('lots', e.target.value)}
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Entry Price
              </label>
              <input
                type="number"
                step="any"
                value={formData.entryPrice ?? ''}
                onChange={(e) => handleChange('entryPrice', e.target.value)}
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={formData.exitPrice ?? ''}
                onChange={(e) => handleChange('exitPrice', e.target.value)}
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
              />
            </div>
          </div>

          {formData.status === 'CLOSED' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                  P&L ({currency === 'INR' ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.pnl ?? ''}
                  onChange={(e) => handleChange('pnl', e.target.value)}
                  className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                  R-Multiple
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rMultiple ?? ''}
                  onChange={(e) => handleChange('rMultiple', e.target.value)}
                  className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
                  Pips
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.pips ?? ''}
                  onChange={(e) => handleChange('pips', e.target.value)}
                  className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] rounded-xl px-3 py-2"
                />
              </div>
            </div>
          )}

          <div>
            <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
              Notes
            </label>
            <textarea
              rows="3"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-[#06090d] text-white text-xs border border-[#16222f] rounded-xl p-3"
            />
          </div>

          <div>
            <label className="block text-[#64748b] text-[11px] font-bold tracking-wider uppercase mb-1">
              Screenshot URL
            </label>
            <input
              type="url"
              value={formData.screenshot || ''}
              onChange={(e) => handleChange('screenshot', e.target.value)}
              placeholder="https://..."
              className="w-full bg-[#06090d] text-white text-xs border border-[#16222f] rounded-xl px-3 py-2"
            />
          </div>

          <div className="pt-3 border-t border-[#141f2b] flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTradeToEdit(null)}
              className="px-4 py-2 text-xs font-semibold text-[#8092a4] hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] font-extrabold text-xs rounded-xl transition"
            >
              <Save className="w-4 h-4" />
              <span>Save Changes</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

