import React, { useState } from 'react';
import { X, Upload, Download, Archive, FileText, Image as ImageIcon } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const ImportExportModal = () => {
  const { isImportExportOpen, setIsImportExportOpen, importTrades, exportBackupJSON, exportCSV } = useTrading();
  const [csvText, setCsvText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [activeTab, setActiveTab] = useState('json'); // 'json' | 'csv'

  if (!isImportExportOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const isJson = file.name.endsWith('.json') || file.type === 'application/json';
    const reader = new FileReader();

    reader.onload = async (event) => {
      const content = event.target.result;
      if (isJson) {
        try {
          const parsed = JSON.parse(content);
          const tradeList = Array.isArray(parsed)
            ? parsed
            : (Array.isArray(parsed.trades) ? parsed.trades : null);

          if (tradeList && tradeList.length > 0) {
            await importTrades(tradeList);
            setStatusMessage(`✓ Successfully restored ${tradeList.length} trades including all chart screenshots!`);
            setTimeout(() => {
              setIsImportExportOpen(false);
            }, 1400);
          } else {
            setStatusMessage('Error: No valid trades found in this JSON backup.');
          }
        } catch (err) {
          setStatusMessage(`JSON Parse Error: ${err.message}`);
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

      const lines = csvText.trim().split(/\r?\n/);
      if (lines.length < 2) {
        setStatusMessage('Error: CSV must contain a header and at least one data row.');
        return;
      }

      const headers = lines[0].split(',').map((h) => h.trim().toLowerCase());
      const parsedTrades = [];

      for (let i = 1; i < lines.length; i++) {
        const line = lines[i];
        if (!line.trim()) continue;

        const values = line.split(',');
        const row = {};
        headers.forEach((h, idx) => {
          row[h] = values[idx] ? values[idx].trim() : '';
        });

        parsedTrades.push({
          id: `tr-import-${Date.now()}-${i}`,
          pair: (row.pair || 'XAUUSD').toUpperCase(),
          direction: (row.direction || 'BUY').toUpperCase(),
          session: row.session || 'London',
          lots: parseFloat(row.lots) || 0.1,
          entryPrice: parseFloat(row.entryprice) || 0,
          exitPrice: row.exitprice ? parseFloat(row.exitprice) : null,
          stopLoss: row.stoploss ? parseFloat(row.stoploss) : null,
          takeProfit: row.takeprofit ? parseFloat(row.takeprofit) : null,
          pnl: row.pnl ? parseFloat(row.pnl) : (row.status === 'OPEN' ? null : 0),
          rMultiple: row.rmultiple ? parseFloat(row.rmultiple) : null,
          pips: row.pips ? parseFloat(row.pips) : null,
          date: row.date || new Date().toISOString().slice(0, 10),
          status: (row.status || (row.pnl ? 'CLOSED' : 'OPEN')).toUpperCase(),
          setupTag: row.setuptag || 'trend',
          followedPlan: row.followedplan === 'yes' || row.followedplan === 'true',
          notes: row.notes || '',
          screenshot: '',
          exitScreenshot: null,
        });
      }

      await importTrades(parsedTrades);
      setStatusMessage(`✓ Successfully imported ${parsedTrades.length} trades!`);
      setTimeout(() => {
        setIsImportExportOpen(false);
      }, 1200);
    } catch (err) {
      setStatusMessage(`Parse error: ${err.message}`);
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
            onClick={() => setActiveTab('json')}
            className={`flex items-center justify-center gap-2 py-2 px-3 rounded-lg text-xs font-bold transition cursor-pointer ${
              activeTab === 'json'
                ? 'bg-primary text-primary-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <ImageIcon className="w-4 h-4" />
            <span>Full Backup (with Images)</span>
          </button>
          <button
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

        {/* Tab 1: Full JSON Backup (with Images) */}
        {activeTab === 'json' && (
          <div className="space-y-4">
            <div className="p-3.5 bg-primary/10 border border-primary/25 rounded-xl space-y-2">
              <div className="flex items-center gap-2 text-primary font-bold text-xs">
                <Archive className="w-4 h-4" />
                <span>Complete Backup (Includes All Chart Screenshots)</span>
              </div>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Exports all trades, notes, tags, entry chart screenshots, and exit chart screenshots into a single portable backup file.
              </p>
              <button
                type="button"
                onClick={exportBackupJSON}
                className="mt-1 flex items-center justify-center gap-2 w-full py-2.5 px-4 bg-primary text-primary-foreground hover:bg-primary/90 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer active:scale-95"
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
                accept=".json,.csv,application/json,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-secondary file:text-foreground hover:file:bg-secondary/80 border border-border rounded-xl cursor-pointer"
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
                onClick={exportCSV}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-secondary hover:bg-secondary/80 text-foreground border border-border font-bold text-xs rounded-lg transition cursor-pointer"
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
                accept=".csv,text/csv"
                onChange={handleFileUpload}
                className="w-full text-xs text-foreground file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-primary file:text-primary-foreground hover:file:bg-primary/90 cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-muted-foreground text-xs font-semibold mb-1">
                Or paste CSV content directly:
              </label>
              <textarea
                rows="4"
                value={csvText}
                onChange={(e) => setCsvText(e.target.value)}
                placeholder="pair,direction,session,lots,entryPrice,exitPrice,pnl,date,status..."
                className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary"
              />
            </div>

            <button
              type="button"
              onClick={handleParseAndImportCSV}
              className="w-full flex items-center justify-center gap-2 py-2 px-4 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>Import CSV Trades</span>
            </button>
          </div>
        )}

        {/* Status Message */}
        {statusMessage && (
          <div className="text-xs text-profit bg-profit/15 p-2.5 rounded-lg border border-profit/35 font-num animate-fadeIn">
            {statusMessage}
          </div>
        )}

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-border">
          <button
            type="button"
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
