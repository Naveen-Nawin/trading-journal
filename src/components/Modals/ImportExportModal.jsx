import React, { useState } from 'react';
import { X, Upload, Download, Archive, FileText, Image as ImageIcon, AlertCircle, CheckCircle2 } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import { parseTradesFromCSV } from '../../utils/csvHelper';
import { validateBackupJSON } from '../../utils/backupHelper';

export const ImportExportModal = () => {
  const { isImportExportOpen, setIsImportExportOpen, restoreBackup, exportBackupJSON, exportCSV } = useTrading();
  const [csvText, setCsvText] = useState('');
  const [statusMessage, setStatusMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'csv'
  const [restoreMode, setRestoreMode] = useState('replace'); // 'replace' | 'append'
  const [isProcessing, setIsProcessing] = useState(false);

  if (!isImportExportOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target.result;
      if (isJson) {
        setIsProcessing(true);
        try {
          const validated = validateBackupJSON(content);
          if (!validated.valid || validated.trades.length === 0) {
            setStatusMessage({
              type: 'error',
              text: validated.error || 'No valid trades found in this JSON backup file.',
            });
            setIsProcessing(false);
            return;
          }

          const result = await restoreBackup({
            trades: validated.trades,
            rules: validated.rules,
            settings: validated.settings,
            mode: restoreMode,
          });

          const modeText = restoreMode === 'replace' ? 'restored' : 'imported';
          const dupText = result.duplicatesSkipped > 0 ? ` (${result.duplicatesSkipped} duplicates skipped)` : '';
          const imgText = validated.hasImages ? ' including all chart screenshots' : '';
          const rulesText = validated.rulesCount > 0 ? ` and ${validated.rulesCount} trading rules` : '';

          setStatusMessage({
            type: 'success',
            text: `✓ Successfully ${modeText} ${result.count} trades${imgText}${rulesText}!${dupText}`,
          });

          setTimeout(() => {
            setIsImportExportOpen(false);
          }, 1600);
        } catch (err) {
          setStatusMessage({ type: 'error', text: `Restore Error: ${err.message}` });
        } finally {
          setIsProcessing(false);
        }
      } else {
        setCsvText(content);
        setActiveTab('csv');
      }
    };

    reader.readAsText(file);
  };

  const handleParseAndImportCSV = async () => {
    try {
      if (!csvText.trim()) return;
      setIsProcessing(true);

      const parsedTrades = parseTradesFromCSV(csvText);
      if (!parsedTrades || parsedTrades.length === 0) {
        setStatusMessage({ type: 'error', text: 'Error: No valid trade records found in CSV.' });
        setIsProcessing(false);
        return;
      }

      const result = await restoreBackup({
        trades: parsedTrades,
        rules: [],
        settings: {},
        mode: restoreMode,
      });

      const modeText = restoreMode === 'replace' ? 'restored' : 'imported';
      const dupText = result.duplicatesSkipped > 0 ? ` (${result.duplicatesSkipped} duplicates skipped)` : '';

      setStatusMessage({
        type: 'success',
        text: `✓ Successfully ${modeText} ${result.count} trades from CSV!${dupText}`,
      });

      setTimeout(() => {
        setIsImportExportOpen(false);
      }, 1400);
    } catch (err) {
      setStatusMessage({ type: 'error', text: `CSV Parse Error: ${err.message}` });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-2xl shadow-2xl p-6 space-y-5 animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2.5">
            <Archive className="w-5 h-5 text-primary" />
            <div>
              <h2 className="text-foreground font-bold text-base tracking-wide font-num">
                Backup & Restore Journal
              </h2>
              <p className="text-xs text-muted-foreground">
                Export or restore trades and chart screenshots
              </p>
            </div>
          </div>
          <button
            onClick={() => setIsImportExportOpen(false)}
            className="p-1.5 text-muted-foreground hover:text-foreground hover:bg-secondary/60 rounded-lg transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="grid grid-cols-2 gap-2 bg-secondary/40 p-1 rounded-xl border border-border">
          <button
            type="button"
            onClick={() => setActiveTab('json')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'json'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Full Backup (.json)</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('csv')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'csv'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <FileText className="w-4 h-4" />
            <span>Spreadsheet CSV</span>
          </button>
        </div>

        {/* Restore Mode Selector */}
        <div className="space-y-1.5">
          <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider block">
            Import & Restore Mode:
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setRestoreMode('replace')}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                restoreMode === 'replace'
                  ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                  : 'bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40'
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${restoreMode === 'replace' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                Clean Restore (Replace)
              </span>
              <span className="text-[10px] text-muted-foreground">
                Account transfer: replace current trades with exact backup
              </span>
            </button>

            <button
              type="button"
              disabled={isProcessing}
              onClick={() => setRestoreMode('append')}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer flex flex-col gap-0.5 ${
                restoreMode === 'append'
                  ? 'bg-primary/10 border-primary text-foreground ring-1 ring-primary/40'
                  : 'bg-secondary/20 border-border text-muted-foreground hover:bg-secondary/40'
              }`}
            >
              <span className="text-xs font-bold flex items-center gap-1.5">
                <span className={`w-2 h-2 rounded-full ${restoreMode === 'append' ? 'bg-primary' : 'bg-muted-foreground'}`} />
                Merge (Append New)
              </span>
              <span className="text-[10px] text-muted-foreground">
                Keep existing trades, add new ones & skip duplicates
              </span>
            </button>
          </div>
        </div>

        {/* Tab 1: Full JSON Backup (with Images) */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-primary/10 border border-primary/25 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Archive className="w-4 h-4" />
                <span>Complete Backup (Includes Rules & Screenshots)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Exports all trades, notes, tags, entry & exit chart screenshots, and custom trading rules into a portable backup file.
              </p>
              <button
                type="button"
                disabled={isProcessing}
                onClick={exportBackupJSON}
                className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95 disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                <span>Download Complete Backup (.json)</span>
              </button>
            </div>

            <div className="space-y-2">
              <label className="block text-foreground text-xs font-bold">
                Restore from Backup (.json or .csv):
              </label>
              <input
                type="file"
                disabled={isProcessing}
                accept=".json,.csv,application/json,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-secondary file:text-foreground hover:file:bg-secondary/80 border border-border rounded-xl cursor-pointer disabled:opacity-50"
              />
              <p className="text-[11px] text-muted-foreground">
                Select your downloaded <code className="text-primary font-mono font-semibold">.json</code> file to restore all trades and screenshots instantly.
              </p>
            </div>
          </div>
        )}

        {/* Tab 2: Spreadsheet CSV */}
        {activeTab === 'csv' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-secondary/30 border border-border rounded-xl">
              <div className="text-xs">
                <span className="font-bold text-foreground block">Download for Excel / Sheets</span>
                <span className="text-muted-foreground text-[11px]">Numbers and trade metrics (excludes image files)</span>
              </div>
              <button
                type="button"
                disabled={isProcessing}
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs rounded-lg transition cursor-pointer disabled:opacity-50"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download CSV</span>
              </button>
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-semibold mb-2">
                Upload CSV File:
              </label>
              <input
                type="file"
                disabled={isProcessing}
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer disabled:opacity-50"
              />
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-semibold mb-1">
                Or paste CSV content directly:
              </label>
              <textarea
                rows="4"
                disabled={isProcessing}
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="pair,direction,session,lots,entryPrice,exitPrice,pnl,date,status..."
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary disabled:opacity-50"
              />
            </div>

            <button
              type="button"
              disabled={isProcessing || !csvText.trim()}
              onClick={handleParseAndImportCSV}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer disabled:opacity-50"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{isProcessing ? 'Processing...' : 'Import CSV Trades'}</span>
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage?.text && (
          <div
            className={`flex items-center gap-2 text-xs p-3 rounded-xl border font-num animate-fadeIn ${
              statusMessage.type === 'error'
                ? 'text-loss bg-loss/10 border-loss/30'
                : 'text-profit bg-profit/10 border-profit/30'
            }`}
          >
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-loss" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-profit" />
            )}
            <span>{statusMessage.text}</span>
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="button"
            disabled={isProcessing}
            onClick={() => setIsImportExportOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
