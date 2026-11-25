import React, { useState } from 'react';
import { X, Upload } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const ImportExportModal = () => {
  const { isImportExportOpen, setIsImportExportOpen, importTrades } = useTrading();
  const [csvText, setCsvText] = useState('');
  const [statusMessage, setStatusMessage] = useState('');

  if (!isImportExportOpen) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCsvText(event.target.result);
      };
      reader.readAsText(file);
    }
  };

  const handleParseAndImport = () => {
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
        });
      }

      importTrades(parsedTrades);
      setStatusMessage(`Successfully imported ${parsedTrades.length} trades!`);
      setTimeout(() => {
        setIsImportExportOpen(false);
      }, 1000);
    } catch (err) {
      setStatusMessage(`Parse error: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="relative w-full max-w-lg bg-card border border-border rounded-xl shadow-2xl p-6 space-y-4 animate-rise">
        <div className="flex items-center justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Upload className="w-5 h-5 text-profit" />
            <h2 className="text-foreground font-bold text-base tracking-wide font-num">
              Import Trades from CSV
            </h2>
          </div>
          <button
            onClick={() => setIsImportExportOpen(false)}
            className="p-1 text-muted-foreground hover:text-foreground cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div>
          <label className="block text-muted-foreground text-xs font-semibold mb-2">
            Select CSV File from your computer:
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
            rows="6"
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            placeholder="pair,direction,session,lots,entryPrice,exitPrice,pnl,date,status..."
            className="w-full bg-secondary/40 text-foreground font-num text-xs border border-border rounded-xl p-3 focus:outline-hidden focus:border-primary"
          />
        </div>

        {statusMessage && (
          <div className="text-xs text-profit bg-profit/15 p-2.5 rounded-lg border border-profit/35 font-num">
            {statusMessage}
          </div>
        )}

        <div className="flex justify-end gap-2 pt-2 border-t border-border">
          <button
            type="button"
            onClick={() => setIsImportExportOpen(false)}
            className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground cursor-pointer rounded-xl"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleParseAndImport}
            className="px-5 py-2 text-xs font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl shadow-xs cursor-pointer"
          >
            Import Trades
          </button>
        </div>
      </div>
    </div>
  );
};
