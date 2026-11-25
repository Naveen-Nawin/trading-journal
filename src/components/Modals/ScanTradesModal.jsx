import React, { useState, useRef } from 'react';
import {
  X,
  UploadCloud,
  Camera,
  CheckCircle2,
  Trash2,
  Plus,
  Sparkles,
  RefreshCw,
  AlertCircle,
  FileImage,
  ArrowRight,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  parseOcrTextToTrades,
  SAMPLE_MT5_SCREENSHOT_TRADES,
  NOV_19_MT5_SCREENSHOT_TRADES,
  NOV_18_MT5_SCREENSHOT_TRADES,
  calculatePips,
  calculateTheoreticalPnl,
  runBrowserOcr,
} from '../../utils/ocrScanner';
import { formatCurrencyRaw } from '../../utils/formatters';

const SESSIONS = [
  'London',
  'New York',
  'Tokyo',
  'London/NY Overlap',
  'Sydney',
];

export const ScanTradesModal = () => {
  const {
    isScanModalOpen,
    setIsScanModalOpen,
    logMultipleTrades,
    currency,
    usdToInrRate,
  } = useTrading();

  const fileInputRef = useRef(null);

  const [imagePreview, setImagePreview] = useState(null);
  const [imageName, setImageName] = useState('');
  const [isScanning, setIsScanning] = useState(false);
  const [scanStatus, setScanStatus] = useState('');
  const [extractedTrades, setExtractedTrades] = useState([]);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isScanModalOpen) return null;

  // Handle file drop / select
  const processImageFile = async (file) => {
    if (!file) return;
    setErrorMsg('');
    setImageName(file.name);

    // Create preview
    const reader = new FileReader();
    reader.onload = async (e) => {
      const dataUrl = e.target.result;
      setImagePreview(dataUrl);
      await performOcr(dataUrl);
    };
    reader.readAsDataURL(file);
  };

  const performOcr = async (imageSrc) => {
    setIsScanning(true);
    setScanStatus('Running neural OCR on screenshot...');
    setExtractedTrades([]);

    try {
      const ocrText = await runBrowserOcr(imageSrc, (status) => {
        setScanStatus(status);
      });
      setScanStatus('Parsing positions, lot sizes, prices & P&L...');

      const parsed = parseOcrTextToTrades(ocrText);

      if (parsed.length > 0) {
        setExtractedTrades(parsed);
        setScanStatus(`Successfully captured ${parsed.length} trades!`);
      } else {
        setErrorMsg(
          'OCR scanned the image, but could not detect MT4/MT5 position lines clearly. You can load sample trades or adjust manually below.'
        );
      }
    } catch (err) {
      console.error('OCR Error:', err);
      setErrorMsg(
        'OCR encountered a browser restriction or network timeout for traineddata. You can click "Load Attached MT5 Screenshot" to load the trades immediately.'
      );
    } finally {
      setIsScanning(false);
    }
  };

  // Load Nov 19 MT5 Screenshot data (Today's 7 XAUUSD trades)
  const handleLoadNov19 = () => {
    setErrorMsg('');
    setIsScanning(true);
    setScanStatus('Loading Nov 19 MT5 Positions (7 XAUUSD trades, -$5.40)...');
    setImageName('mt5_history_2026-11-19.jpg');

    setTimeout(() => {
      setExtractedTrades(
        NOV_19_MT5_SCREENSHOT_TRADES.map((t) => ({ ...t, selected: true }))
      );
      setIsScanning(false);
      setScanStatus('Loaded 7 XAUUSD trades from Nov 19 MT5 Screenshot!');
    }, 300);
  };

  // Direct insert Nov 19 trades straight into user's trades journal
  const handleDirectInsertNov19 = () => {
    logMultipleTrades(NOV_19_MT5_SCREENSHOT_TRADES);
    setIsScanModalOpen(false);
  };

  // Load Nov 18 MT5 Screenshot data (14 mixed trades)
  const handleLoadNov18 = () => {
    setErrorMsg('');
    setIsScanning(true);
    setScanStatus('Loading Nov 18 screenshot positions (14 trades, +$144.15)...');
    setImageName('mt5_history_2026-11-18.jpg');

    setTimeout(() => {
      setExtractedTrades(
        NOV_18_MT5_SCREENSHOT_TRADES.map((t) => ({ ...t, selected: true }))
      );
      setIsScanning(false);
      setScanStatus('Loaded 14 trades from Nov 18 MT5 Screenshot!');
    }, 300);
  };

  // Default handler
  const handleLoadSample = handleLoadNov19;

  // Table row editing
  const handleToggleSelect = (index) => {
    setExtractedTrades((prev) =>
      prev.map((t, idx) => (idx === index ? { ...t, selected: !t.selected } : t))
    );
  };

  const handleSelectAll = (select) => {
    setExtractedTrades((prev) => prev.map((t) => ({ ...t, selected: select })));
  };

  const handleFieldChange = (index, field, value) => {
    setExtractedTrades((prev) =>
      prev.map((t, idx) => {
        if (idx !== index) return t;

        const updated = { ...t, [field]: value };

        // Auto-recalculate pips if entry, exit, direction, or pair changed
        if (['entryPrice', 'exitPrice', 'direction', 'pair'].includes(field)) {
          const entry = parseFloat(field === 'entryPrice' ? value : updated.entryPrice) || 0;
          const exit = parseFloat(field === 'exitPrice' ? value : updated.exitPrice) || 0;
          const dir = field === 'direction' ? value : updated.direction;
          const pair = field === 'pair' ? value : updated.pair;
          updated.pips = calculatePips(pair, dir, entry, exit);
        }

        return updated;
      })
    );
  };

  const handleDeleteRow = (index) => {
    setExtractedTrades((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleAddBlankRow = () => {
    const today = new Date().toISOString().split('T')[0];
    const newTrade = {
      id: `ocr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
      selected: true,
      pair: 'XAUUSD',
      direction: 'BUY',
      lots: 0.1,
      entryPrice: 3780.0,
      exitPrice: 3785.0,
      pnl: 50.0,
      pips: 50.0,
      rMultiple: 1.5,
      date: today,
      time: '12:00:00',
      session: 'London',
      status: 'CLOSED',
      setupTag: 'scalp',
      tags: ['manual-add'],
      emotion: 'disciplined',
      notes: 'Manually added during scan review',
      followedPlan: true,
    };
    setExtractedTrades((prev) => [...prev, newTrade]);
  };

  // Summary calculations
  const selectedTrades = extractedTrades.filter((t) => t.selected);
  const totalNetPnlUSD = selectedTrades.reduce(
    (acc, t) => acc + (parseFloat(t.pnl) || 0),
    0
  );
  const winCount = selectedTrades.filter((t) => (parseFloat(t.pnl) || 0) > 0).length;
  const lossCount = selectedTrades.filter((t) => (parseFloat(t.pnl) || 0) < 0).length;

  const handleImport = () => {
    if (selectedTrades.length === 0) return;

    logMultipleTrades(selectedTrades);
    setIsScanModalOpen(false);
  };

  const allSelected =
    extractedTrades.length > 0 && extractedTrades.every((t) => t.selected);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-black/85 backdrop-blur-xs overflow-y-auto">
      <div className="relative w-full max-w-5xl bg-[#0b1016] border border-[#1b2533] rounded-2xl shadow-2xl overflow-hidden my-6 text-[#e2e8f0] flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#172230] bg-[#080d12]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-[#00f098]/10 border border-[#00f098]/30 flex items-center justify-center text-[#00f098]">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-white font-extrabold text-base sm:text-lg tracking-tight flex items-center gap-2">
                <span>AI Screenshot Trade Capture</span>
                <span className="text-[10px] bg-[#00f098]/20 text-[#00f098] px-2 py-0.5 rounded-full font-mono font-bold uppercase tracking-wider">
                  MT4 / MT5 OCR
                </span>
              </h2>
              <p className="text-xs text-[#64748b]">
                Upload your mobile broker history screenshot to automatically extract, calculate, and log all trades.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsScanModalOpen(false)}
            className="text-[#64748b] hover:text-white p-1 rounded-lg transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 sm:p-6 space-y-5 overflow-y-auto flex-1">
          {/* Upload or Drop Area */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
            <div
              onClick={() => fileInputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.[0]) {
                  processImageFile(e.dataTransfer.files[0]);
                }
              }}
              className="md:col-span-8 border-2 border-dashed border-[#1e2d3d] hover:border-[#00f098]/60 bg-[#080d12]/70 hover:bg-[#0c1520] rounded-xl p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all group"
            >
              <div className="w-12 h-12 rounded-full bg-[#121c27] group-hover:bg-[#00f098]/15 border border-[#1e2d3d] flex items-center justify-center text-[#8092a4] group-hover:text-[#00f098] transition mb-3">
                <UploadCloud className="w-6 h-6" />
              </div>
              <h3 className="text-sm font-bold text-white mb-1">
                Drop your MT4/MT5 screenshot here or{' '}
                <span className="text-[#00f098] underline">browse</span>
              </h3>
              <p className="text-[11px] text-[#64748b]">
                Supports PNG, JPG, JPEG from MetaTrader 4, MetaTrader 5, cTrader, TradingView
              </p>
              {imageName && (
                <div className="mt-3 flex items-center gap-1.5 text-xs text-[#00f098] bg-[#00f098]/10 px-3 py-1 rounded-full font-mono">
                  <FileImage className="w-3.5 h-3.5" />
                  <span>{imageName}</span>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.[0]) {
                    processImageFile(e.target.files[0]);
                  }
                }}
              />
            </div>

            {/* Quick Sample Action / Help */}
            <div className="md:col-span-4 bg-[#080d12] border border-[#1a2636] rounded-xl p-4 flex flex-col justify-between space-y-3">
              <div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#00f098] mb-1">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Instant Test Available</span>
                </div>
                <p className="text-[11px] text-[#8092a4] leading-relaxed">
                  Test with your latest MT5 mobile screenshots with 1 click:
                </p>
              </div>

              <div className="space-y-2">
                <button
                  type="button"
                  onClick={handleLoadNov19}
                  className="w-full py-2.5 px-3 bg-[#0e271f] hover:bg-[#13372b] text-[#00f098] border border-[#00f098]/50 hover:border-[#00f098] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,240,152,0.15)]"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>⚡ Load Nov 19 Screenshot (7 Gold Trades)</span>
                </button>

                <button
                  type="button"
                  onClick={handleDirectInsertNov19}
                  className="w-full py-2 px-3 bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] font-black rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-[0_0_15px_rgba(0,240,152,0.25)]"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>📥 Insert Directly into Trades Journal</span>
                </button>

                <button
                  type="button"
                  onClick={handleLoadNov18}
                  className="w-full py-1.5 px-3 bg-[#0d1620] hover:bg-[#131f2d] text-[#8092a4] hover:text-white border border-[#1b2837] rounded-xl text-[11px] font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer"
                >
                  <span>Load Nov 18 Screenshot (14 Trades)</span>
                </button>
              </div>
            </div>
          </div>

          {/* Status / Progress Banner */}
          {(isScanning || scanStatus) && (
            <div className="bg-[#080d12] border border-[#1b2c3d] rounded-xl p-3.5 flex items-center justify-between">
              <div className="flex items-center gap-3">
                {isScanning ? (
                  <RefreshCw className="w-4 h-4 text-[#00f098] animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4 text-[#00f098]" />
                )}
                <span className="text-xs font-medium text-[#cbd5e1]">
                  {scanStatus}
                </span>
              </div>
              {isScanning && (
                <span className="text-[11px] font-mono text-[#00f098] animate-pulse">
                  Processing...
                </span>
              )}
            </div>
          )}

          {errorMsg && (
            <div className="bg-[#291318] border border-[#ff4d4d]/40 rounded-xl p-3 flex items-center gap-2 text-xs text-[#ff8080]">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#ff4d4d]" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Extracted Trades Review Table */}
          {extractedTrades.length > 0 && (
            <div className="space-y-3">
              {/* Table Controls & Summary */}
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#080d12] p-3 rounded-xl border border-[#172332]">
                <div className="flex items-center gap-3">
                  <label className="flex items-center gap-2 text-xs font-medium text-[#cbd5e1] cursor-pointer">
                    <input
                      type="checkbox"
                      checked={allSelected}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="rounded border-[#1e2d3d] bg-[#0c141d] text-[#00f098] focus:ring-0 cursor-pointer w-4 h-4"
                    />
                    <span>Select All ({extractedTrades.length})</span>
                  </label>
                  <span className="text-[#334155]">•</span>
                  <span className="text-xs text-[#8092a4]">
                    Selected: <strong className="text-white">{selectedTrades.length}</strong>
                  </span>
                </div>

                {/* Net Metrics */}
                <div className="flex items-center gap-4 text-xs">
                  <div>
                    <span className="text-[#64748b] mr-1">Wins / Losses:</span>
                    <span className="text-[#00f098] font-bold">{winCount}W</span>
                    <span className="text-[#64748b]"> / </span>
                    <span className="text-[#ff4d4d] font-bold">{lossCount}L</span>
                  </div>
                  <div>
                    <span className="text-[#64748b] mr-1">Net P&L:</span>
                    <span
                      className={`font-mono font-bold ${
                        totalNetPnlUSD >= 0 ? 'text-[#00f098]' : 'text-[#ff4d4d]'
                      }`}
                    >
                      {formatCurrencyRaw(totalNetPnlUSD, currency, true, usdToInrRate)}
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddBlankRow}
                    className="flex items-center gap-1 px-2.5 py-1 bg-[#121c27] hover:bg-[#1a2837] text-white text-xs font-semibold rounded-lg border border-[#1e2d3d] transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Add Trade</span>
                  </button>
                </div>
              </div>

              {/* Scrollable Table */}
              <div className="overflow-x-auto border border-[#172332] rounded-xl bg-[#070b10]">
                <table className="w-full text-left text-xs text-[#cbd5e1] border-collapse">
                  <thead className="bg-[#0b121a] text-[#64748b] font-mono text-[11px] uppercase tracking-wider border-b border-[#172332]">
                    <tr>
                      <th className="py-2.5 px-3 w-8">#</th>
                      <th className="py-2.5 px-3">Pair</th>
                      <th className="py-2.5 px-3">Type</th>
                      <th className="py-2.5 px-3">Lots</th>
                      <th className="py-2.5 px-3">Entry Price</th>
                      <th className="py-2.5 px-3">Exit Price</th>
                      <th className="py-2.5 px-3">P&L ({currency === 'INR' ? '₹' : '$'})</th>
                      <th className="py-2.5 px-3">Pips</th>
                      <th className="py-2.5 px-3">Session</th>
                      <th className="py-2.5 px-3">Date & Time</th>
                      <th className="py-2.5 px-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#131c26]">
                    {extractedTrades.map((trade, idx) => (
                      <tr
                        key={trade.id || idx}
                        className={`hover:bg-[#0c141e] transition-colors ${
                          !trade.selected ? 'opacity-40' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <td className="py-2 px-3">
                          <input
                            type="checkbox"
                            checked={trade.selected}
                            onChange={() => handleToggleSelect(idx)}
                            className="rounded border-[#1e2d3d] bg-[#0c141d] text-[#00f098] focus:ring-0 cursor-pointer w-3.5 h-3.5"
                          />
                        </td>

                        {/* Pair */}
                        <td className="py-2 px-3">
                          <input
                            type="text"
                            value={trade.pair}
                            onChange={(e) =>
                              handleFieldChange(idx, 'pair', e.target.value.toUpperCase())
                            }
                            className="w-20 bg-[#0d1520] text-white font-mono font-bold text-xs border border-[#1e2d3d] rounded-md px-2 py-1 focus:border-[#00f098]/70 focus:outline-hidden"
                          />
                        </td>

                        {/* Direction Toggle */}
                        <td className="py-2 px-3">
                          <button
                            type="button"
                            onClick={() =>
                              handleFieldChange(
                                idx,
                                'direction',
                                trade.direction === 'BUY' ? 'SELL' : 'BUY'
                              )
                            }
                            className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono border transition ${
                              trade.direction === 'BUY'
                                ? 'bg-[#0e271f] text-[#00f098] border-[#00f098]/50'
                                : 'bg-[#291318] text-[#ff4d4d] border-[#ff4d4d]/50'
                            }`}
                          >
                            {trade.direction === 'BUY' ? '▲ BUY' : '▼ SELL'}
                          </button>
                        </td>

                        {/* Lots */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="0.01"
                            value={trade.lots}
                            onChange={(e) =>
                              handleFieldChange(idx, 'lots', parseFloat(e.target.value) || 0)
                            }
                            className="w-16 bg-[#0d1520] text-white font-mono text-xs border border-[#1e2d3d] rounded-md px-2 py-1 focus:border-[#00f098]/70 focus:outline-hidden"
                          />
                        </td>

                        {/* Entry Price */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="any"
                            value={trade.entryPrice}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                'entryPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 bg-[#0d1520] text-white font-mono text-xs border border-[#1e2d3d] rounded-md px-2 py-1 focus:border-[#00f098]/70 focus:outline-hidden"
                          />
                        </td>

                        {/* Exit Price */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="any"
                            value={trade.exitPrice}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                'exitPrice',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className="w-24 bg-[#0d1520] text-white font-mono text-xs border border-[#1e2d3d] rounded-md px-2 py-1 focus:border-[#00f098]/70 focus:outline-hidden"
                          />
                        </td>

                        {/* PnL */}
                        <td className="py-2 px-3">
                          <input
                            type="number"
                            step="any"
                            value={trade.pnl}
                            onChange={(e) =>
                              handleFieldChange(
                                idx,
                                'pnl',
                                parseFloat(e.target.value) || 0
                              )
                            }
                            className={`w-20 font-mono font-bold text-xs bg-[#0d1520] border rounded-md px-2 py-1 focus:outline-hidden ${
                              (parseFloat(trade.pnl) || 0) >= 0
                                ? 'text-[#00f098] border-[#00f098]/40'
                                : 'text-[#ff4d4d] border-[#ff4d4d]/40'
                            }`}
                          />
                        </td>

                        {/* Pips */}
                        <td className="py-2 px-3 font-mono text-xs text-[#94a3b8]">
                          {(parseFloat(trade.pips) || 0) > 0 ? '+' : ''}
                          {trade.pips}
                        </td>

                        {/* Session */}
                        <td className="py-2 px-3">
                          <select
                            value={trade.session}
                            onChange={(e) =>
                              handleFieldChange(idx, 'session', e.target.value)
                            }
                            className="bg-[#0d1520] text-white text-[11px] border border-[#1e2d3d] rounded-md px-2 py-1 focus:border-[#00f098]/70 focus:outline-hidden"
                          >
                            {SESSIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Date & Time */}
                        <td className="py-2 px-3 font-mono text-[11px] text-[#8092a4]">
                          {trade.date} {trade.time || ''}
                        </td>

                        {/* Delete Action */}
                        <td className="py-2 px-3 text-right">
                          <button
                            type="button"
                            onClick={() => handleDeleteRow(idx)}
                            className="p-1 text-[#64748b] hover:text-[#ff4d4d] rounded-md transition"
                            title="Remove row"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-between px-6 py-4 border-t border-[#172230] bg-[#080d12]">
          <button
            type="button"
            onClick={() => {
              setExtractedTrades([]);
              setImagePreview(null);
              setImageName('');
              setScanStatus('');
              setErrorMsg('');
            }}
            className="text-xs text-[#64748b] hover:text-white transition"
          >
            Clear / Start over
          </button>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsScanModalOpen(false)}
              className="px-4 py-2 text-xs font-semibold text-[#8092a4] hover:text-white rounded-xl bg-[#0d1520] border border-[#1e2d3d] hover:bg-[#14202d] transition"
            >
              Cancel
            </button>

            <button
              type="button"
              disabled={selectedTrades.length === 0}
              onClick={handleImport}
              className={`px-5 py-2 text-xs font-black rounded-xl transition flex items-center gap-2 shadow-lg ${
                selectedTrades.length > 0
                  ? 'bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] shadow-[0_0_15px_rgba(0,240,152,0.35)] cursor-pointer'
                  : 'bg-[#15202b] text-[#556575] cursor-not-allowed'
              }`}
            >
              <span>Import All ({selectedTrades.length}) Trades to Journal</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
