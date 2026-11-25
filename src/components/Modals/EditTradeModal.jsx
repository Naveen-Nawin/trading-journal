import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ImagePlus } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const EditTradeModal = () => {
  const { tradeToEdit, setTradeToEdit, updateTrade, currency } = useTrading();

  const [formData, setFormData] = useState(null);
  const entryFileRef = useRef(null);
  const exitFileRef = useRef(null);

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

    const lots = parseFloat(formData.lots) || 0.1;
    const entryPrice = parseFloat(formData.entryPrice) || 0;
    const exitPrice = formData.status === 'CLOSED' && formData.exitPrice ? parseFloat(formData.exitPrice) : null;
    const stopLoss = formData.stopLoss !== '' && formData.stopLoss != null ? parseFloat(formData.stopLoss) : null;
    const takeProfit = formData.takeProfit !== '' && formData.takeProfit != null ? parseFloat(formData.takeProfit) : null;

    let rMultiple = formData.status === 'CLOSED' ? (formData.rMultiple !== '' && formData.rMultiple != null ? parseFloat(formData.rMultiple) : null) : null;
    let pips = formData.status === 'CLOSED' ? (formData.pips !== '' && formData.pips != null ? parseFloat(formData.pips) : null) : null;

    // Auto-calculate R-Multiple if stopLoss, entry, and exit are available and R was not manually specified
    if (formData.status === 'CLOSED' && exitPrice != null && stopLoss != null && Math.abs(entryPrice - stopLoss) > 0) {
      if (rMultiple === null || rMultiple === 0) {
        const diff = formData.direction === 'BUY' ? exitPrice - entryPrice : entryPrice - exitPrice;
        rMultiple = parseFloat((diff / Math.abs(entryPrice - stopLoss)).toFixed(2));
      }
    }

    const prepared = {
      ...formData,
      lots,
      entryPrice,
      exitPrice,
      stopLoss,
      takeProfit,
      exitScreenshot: formData.exitScreenshot || null,
      pnl: formData.status === 'CLOSED' ? (formData.pnl !== '' && formData.pnl != null ? parseFloat(formData.pnl) : 0) : null,
      rMultiple,
      pips,
    };

    updateTrade(tradeToEdit.id, prepared);
    setTradeToEdit(null);
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[#ef4444] text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                <span>Stop Loss (SL)</span>
                <span className="text-[10px] text-[#64748b] font-normal lowercase">optional</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2730.00"
                value={formData.stopLoss ?? ''}
                onChange={(e) => handleChange('stopLoss', e.target.value)}
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] focus:border-[#ef4444]/60 rounded-xl px-3 py-2"
              />
            </div>
            <div>
              <label className="block text-[#00f098] text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                <span>Take Profit (TP / Target)</span>
                <span className="text-[10px] text-[#64748b] font-normal lowercase">optional</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2760.00"
                value={formData.takeProfit ?? ''}
                onChange={(e) => handleChange('takeProfit', e.target.value)}
                className="w-full bg-[#06090d] text-white font-mono text-xs border border-[#16222f] focus:border-[#00f098]/60 rounded-xl px-3 py-2"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entry Screenshot */}
            <div className="space-y-1.5">
              <label className="block text-[#00f098] text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                <span>Entry Chart Screenshot</span>
                <span className="text-[10px] text-[#64748b] font-normal lowercase">optional</span>
              </label>
              {formData.screenshot ? (
                <div className="relative w-full h-24 rounded-xl border border-[#16222f] overflow-hidden bg-[#06090d]">
                  <img
                    src={formData.screenshot}
                    alt="Entry Chart"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('screenshot', '')}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#ff4d4d] text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-[#dc2626]"
                    title="Remove Entry Chart"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => entryFileRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-[#8092a4] border border-dashed border-[#1e2c3d] hover:border-[#00f098]/50 hover:text-white rounded-xl px-4 py-4 w-full transition cursor-pointer bg-[#06090d]/60"
                >
                  <ImagePlus className="w-4 h-4 text-[#00f098]" />
                  <span>Upload Entry Chart</span>
                </button>
              )}
              <input
                ref={entryFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => handleChange('screenshot', reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>

            {/* Exit Screenshot */}
            <div className="space-y-1.5">
              <label className="block text-[#38bdf8] text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                <span>Exit Chart Screenshot</span>
                <span className="text-[10px] text-[#64748b] font-normal lowercase">optional</span>
              </label>
              {formData.exitScreenshot ? (
                <div className="relative w-full h-24 rounded-xl border border-[#16222f] overflow-hidden bg-[#06090d]">
                  <img
                    src={formData.exitScreenshot}
                    alt="Exit Chart"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('exitScreenshot', '')}
                    className="absolute top-1 right-1 w-6 h-6 rounded-full bg-[#ff4d4d] text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-[#dc2626]"
                    title="Remove Exit Chart"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => exitFileRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-[#8092a4] border border-dashed border-[#1e2c3d] hover:border-[#38bdf8]/50 hover:text-white rounded-xl px-4 py-4 w-full transition cursor-pointer bg-[#06090d]/60"
                >
                  <ImagePlus className="w-4 h-4 text-[#38bdf8]" />
                  <span>Upload Exit Chart</span>
                </button>
              )}
              <input
                ref={exitFileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    const reader = new FileReader();
                    reader.onloadend = () => handleChange('exitScreenshot', reader.result);
                    reader.readAsDataURL(file);
                  }
                }}
              />
            </div>
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

