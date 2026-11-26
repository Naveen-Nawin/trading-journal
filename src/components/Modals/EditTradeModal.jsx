import React, { useState, useEffect, useRef } from 'react';
import { X, Save, ImagePlus, AlertCircle, AlertTriangle } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { SESSIONS_LIST, isSessionActiveNow } from '../../utils/sessionConfig';
import { calculatePlannedRR, calculateRealizedTradeStats, getPairPipDetails } from '../../utils/pipsAndRR';

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

    // Auto-calculate accurate pips and R-Multiple based on pair
    if (formData.status === 'CLOSED' && exitPrice != null && entryPrice > 0) {
      const stats = calculateRealizedTradeStats(
        formData.pair,
        formData.direction,
        entryPrice,
        exitPrice,
        stopLoss,
        lots
      );
      if (pips === null || pips === 0) {
        pips = stats.pips;
      }
      if (rMultiple === null || rMultiple === 0) {
        rMultiple = stats.rMultiple;
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-xl bg-card border border-border rounded-xl shadow-2xl overflow-hidden my-8 animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-primary" />
            <h2 className="text-foreground font-bold text-base tracking-wide font-num">
              Edit Trade #{formData.id}
            </h2>
          </div>
          <button
            onClick={() => setTradeToEdit(null)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {/* Pair & Direction */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Pair
              </label>
              <input
                type="text"
                value={formData.pair}
                onChange={(e) => handleChange('pair', e.target.value.toUpperCase())}
                required
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              />
            </div>
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Direction
              </label>
              <select
                value={formData.direction}
                onChange={(e) => handleChange('direction', e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              >
                <option value="BUY">BUY</option>
                <option value="SELL">SELL</option>
              </select>
            </div>
          </div>

          {/* Lots & Date & Time */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Lots
              </label>
              <input
                type="number"
                step="0.01"
                value={formData.lots}
                onChange={(e) => handleChange('lots', e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              />
            </div>
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Date
              </label>
              <input
                type="date"
                value={formData.date}
                onChange={(e) => handleChange('date', e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              />
            </div>
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                  Time
                </label>
                <span className="text-[10px] text-profit font-mono">IST</span>
              </div>
              <input
                type="time"
                value={formData.time || ''}
                onChange={(e) => handleChange('time', e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              />
            </div>
          </div>

          {/* Session Selector (Color-Coded Interactive Selection with IST Timings) */}
          <div className="space-y-2 p-3.5 rounded-xl border border-border/80 bg-secondary/20">
            <div className="flex items-center justify-between">
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase">
                Trading Session (IST Timings)
              </label>
              <span className="text-[11px] font-mono text-muted-foreground">
                Selected: <span className="font-bold text-foreground">{formData.session || 'London'}</span>
              </span>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 pt-0.5">
              {SESSIONS_LIST.map((item) => {
                const isSelected = formData.session === item.id || formData.session === item.label;
                const isLive = isSessionActiveNow(item.id);
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handleChange('session', item.id)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer flex flex-col justify-between ${
                      isSelected
                        ? item.activeBg
                        : 'bg-secondary/40 text-muted-foreground border-border hover:text-foreground hover:bg-secondary/70'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-1">
                      <div className="flex items-center gap-1.5 font-bold text-xs text-foreground">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${item.dot} ${isSelected ? 'animate-pulse' : 'opacity-80'}`} />
                        <span>{item.label}</span>
                      </div>
                      {isLive && (
                        <span className="px-1.5 py-0.2 rounded text-[9px] font-mono font-bold uppercase tracking-wider bg-profit/20 text-profit border border-profit/40 animate-pulse">
                          Live IST
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] font-mono mt-1.5 flex items-center justify-between text-muted-foreground">
                      <span className="font-semibold text-foreground/80">{item.istTime}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Entry Price & Exit Price */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Entry Price
              </label>
              <input
                type="number"
                step="any"
                value={formData.entryPrice ?? ''}
                onChange={(e) => handleChange('entryPrice', e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              />
            </div>
            <div>
              <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                Exit Price
              </label>
              <input
                type="number"
                step="any"
                value={formData.exitPrice ?? ''}
                onChange={(e) => handleChange('exitPrice', e.target.value)}
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
              />
            </div>
          </div>

          {/* Stop Loss & Take Profit (Crucial Feature) */}
          <div className="grid grid-cols-2 gap-3 p-3.5 rounded-xl border border-border/80 bg-secondary/20">
            <div>
              <label className="block text-loss text-[11px] font-bold tracking-wider uppercase mb-1.5 flex items-center justify-between">
                <span>Stop Loss (SL)</span>
                <span className="text-[10px] text-muted-foreground font-normal lowercase">editable</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2730.00"
                value={formData.stopLoss ?? ''}
                onChange={(e) => handleChange('stopLoss', e.target.value)}
                className="w-full bg-secondary/50 text-foreground font-num text-xs border border-loss/40 focus:border-loss focus:ring-1 focus:ring-loss rounded-xl px-3 py-2.5 transition"
              />
            </div>
            <div>
              <label className="block text-profit text-[11px] font-bold tracking-wider uppercase mb-1.5 flex items-center justify-between">
                <span>Take Profit (TP / Target)</span>
                <span className="text-[10px] text-muted-foreground font-normal lowercase">editable</span>
              </label>
              <input
                type="number"
                step="any"
                placeholder="e.g. 2760.00"
                value={formData.takeProfit ?? ''}
                onChange={(e) => handleChange('takeProfit', e.target.value)}
                className="w-full bg-secondary/50 text-foreground font-num text-xs border border-profit/40 focus:border-profit focus:ring-1 focus:ring-profit rounded-xl px-3 py-2.5 transition"
              />
            </div>
          </div>

          {/* Pair-Aware Live R:R Analytics */}
          {(() => {
            const editRR = calculatePlannedRR(
              formData.pair,
              formData.direction,
              formData.entryPrice,
              formData.stopLoss,
              formData.takeProfit
            );
            if (!editRR.riskPips && !editRR.rewardPips && !editRR.warning) return null;
            return (
              <div className="p-3 rounded-xl border border-border/80 bg-secondary/30 text-xs font-num animate-rise">
                {editRR.warning ? (
                  <div className="flex items-center gap-2 text-amber-400 font-medium">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    <span>{editRR.warning}</span>
                  </div>
                ) : (
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-3">
                      {editRR.riskPips !== null && (
                        <span className="text-loss">
                          Risk: -{editRR.riskPips} {editRR.unitName}
                        </span>
                      )}
                      {editRR.rewardPips !== null && (
                        <span className="text-profit">
                          Reward: +{editRR.rewardPips} {editRR.unitName}
                        </span>
                      )}
                    </div>
                    {editRR.ratio !== null && (
                      <span className="px-2 py-0.5 rounded-lg bg-profit/20 text-profit border border-profit/40 font-bold">
                        {editRR.ratioFormatted} RR
                      </span>
                    )}
                  </div>
                )}
              </div>
            );
          })()}

          {formData.status === 'CLOSED' && (
            <div className="grid grid-cols-3 gap-3">
              <div>
                <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                  P&L ({currency === 'INR' ? '₹' : '$'})
                </label>
                <input
                  type="number"
                  step="any"
                  value={formData.pnl ?? ''}
                  onChange={(e) => handleChange('pnl', e.target.value)}
                  className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                  R-Multiple
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={formData.rMultiple ?? ''}
                  onChange={(e) => handleChange('rMultiple', e.target.value)}
                  className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
                />
              </div>
              <div>
                <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
                  Pips
                </label>
                <input
                  type="number"
                  step="0.1"
                  value={formData.pips ?? ''}
                  onChange={(e) => handleChange('pips', e.target.value)}
                  className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl px-3 py-2.5 transition"
                />
              </div>
            </div>
          )}

          {/* Notes */}
          <div>
            <label className="block text-muted-foreground text-[11px] font-bold tracking-wider uppercase mb-1.5">
              Notes
            </label>
            <textarea
              rows="3"
              value={formData.notes || ''}
              onChange={(e) => handleChange('notes', e.target.value)}
              className="w-full bg-secondary/40 text-foreground text-xs border border-border focus:border-primary focus:ring-1 focus:ring-primary rounded-xl p-3 transition"
            />
          </div>

          {/* Screenshots: Entry & Exit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Entry Screenshot */}
            <div className="space-y-1.5">
              <label className="block text-profit text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                <span>Entry Chart</span>
                <span className="text-[10px] text-muted-foreground font-normal lowercase">optional</span>
              </label>
              {formData.screenshot ? (
                <div className="relative w-full h-24 rounded-xl border border-border overflow-hidden bg-secondary/30">
                  <img
                    src={formData.screenshot}
                    alt="Entry Chart"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('screenshot', '')}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-loss text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-loss/90 transition"
                    title="Remove Entry Chart"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => entryFileRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border hover:border-profit/60 hover:text-foreground rounded-xl px-4 py-4 w-full transition cursor-pointer bg-secondary/20"
                >
                  <ImagePlus className="w-4 h-4 text-profit" />
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
              <label className="block text-sky-400 text-[11px] font-bold tracking-wider uppercase mb-1 flex items-center justify-between">
                <span>Exit Chart</span>
                <span className="text-[10px] text-muted-foreground font-normal lowercase">optional</span>
              </label>
              {formData.exitScreenshot ? (
                <div className="relative w-full h-24 rounded-xl border border-border overflow-hidden bg-secondary/30">
                  <img
                    src={formData.exitScreenshot}
                    alt="Exit Chart"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => handleChange('exitScreenshot', '')}
                    className="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-loss text-white flex items-center justify-center text-xs shadow-md cursor-pointer hover:bg-loss/90 transition"
                    title="Remove Exit Chart"
                  >
                    ✕
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => exitFileRef.current?.click()}
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground border border-dashed border-border hover:border-sky-400/60 hover:text-foreground rounded-xl px-4 py-4 w-full transition cursor-pointer bg-secondary/20"
                >
                  <ImagePlus className="w-4 h-4 text-sky-400" />
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

          {/* Action buttons */}
          <div className="pt-3 border-t border-border flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={() => setTradeToEdit(null)}
              className="px-4 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex items-center gap-2 px-5 py-2.5 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl shadow-xs transition-all duration-150 cursor-pointer hover:shadow-[0_0_15px_rgba(18,213,134,0.35)] active:scale-95"
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
