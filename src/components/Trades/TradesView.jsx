import React, { useState, useMemo } from 'react';
import {
  Search,
  Upload,
  Download,
  ChevronDown,
  ChevronRight,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  ExternalLink,
  Image as ImageIcon,
  Camera,
  Sparkles,
  Clock,
  Archive,
} from 'lucide-react';
import { useTrading } from '../../context/TradingContext';
import {
  formatCurrencyRaw,
  formatR,
  formatPips,
  formatDateDisplay,
  formatTimeDisplay,
  compareTradesDescending,
} from '../../utils/formatters';
import { getSessionConfig } from '../../utils/sessionConfig';
import { getEffectiveTradePips, getEffectiveTradeRR } from '../../utils/pipsAndRR';

export const TradesView = () => {
  const {
    trades,
    currency,
    setTradeToClose,
    setTradeToEdit,
    setTradeToDelete,
    deleteMultipleTrades,
    exportCSV,
    exportBackupJSON,
    setIsImportExportOpen,
    setIsScanModalOpen,
    logMultipleTrades,
    setLightbox,
  } = useTrading();

  // Selection & Bulk Actions State
  const [selectedTradeIds, setSelectedTradeIds] = useState([]);
  const [isBulkDeleting, setIsBulkDeleting] = useState(false);
  const [showBulkDeleteConfirm, setShowBulkDeleteConfirm] = useState(false);

  // Filter States
  const [statusFilter, setStatusFilter] = useState('ALL'); // 'ALL' | 'OPEN' | 'CLOSED'
  const [pairFilter, setPairFilter] = useState('ALL');
  const [sessionFilter, setSessionFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState('');

  // Expanded rows state
  const [expandedRows, setExpandedRows] = useState({});

  const toggleRow = (id) => {
    setExpandedRows((prev) => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Unique lists for dropdowns
  const uniquePairs = useMemo(() => {
    const set = new Set(trades.map((t) => t.pair).filter(Boolean));
    return Array.from(set).sort();
  }, [trades]);

  const uniqueSessions = useMemo(() => {
    const set = new Set(trades.map((t) => t.session).filter(Boolean));
    return Array.from(set).sort();
  }, [trades]);

  // Filtered trades (sorted strictly in descending order: newest upside, oldest below)
  const filteredTrades = useMemo(() => {
    const list = trades.filter((trade) => {
      // Status
      if (statusFilter === 'OPEN' && trade.status !== 'OPEN') return false;
      if (statusFilter === 'CLOSED' && trade.status !== 'CLOSED') return false;

      // Pair
      if (pairFilter !== 'ALL' && trade.pair !== pairFilter) return false;

      // Session
      if (sessionFilter !== 'ALL' && trade.session !== sessionFilter) return false;

      // Date
      if (dateFilter && trade.date !== dateFilter) return false;

      // Search Query in notes, pair, or setupTag
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const inNotes = (trade.notes || '').toLowerCase().includes(q);
        const inPair = (trade.pair || '').toLowerCase().includes(q);
        const inTag = (trade.setupTag || '').toLowerCase().includes(q);
        if (!inNotes && !inPair && !inTag) return false;
      }

      return true;
    });

    return [...list].sort(compareTradesDescending);
  }, [trades, statusFilter, pairFilter, sessionFilter, dateFilter, searchQuery]);

  // Summary of filtered trades
  const filteredNetPnl = useMemo(() => {
    return filteredTrades
      .filter((t) => t.status === 'CLOSED' && typeof t.pnl === 'number')
      .reduce((sum, t) => sum + t.pnl, 0);
  }, [filteredTrades]);

  // Bulk Selection Handlers
  const allFilteredSelected =
    filteredTrades.length > 0 &&
    filteredTrades.every((t) => selectedTradeIds.includes(t.id));

  const toggleSelectAll = () => {
    if (allFilteredSelected) {
      const filteredIdSet = new Set(filteredTrades.map((t) => t.id));
      setSelectedTradeIds((prev) => prev.filter((id) => !filteredIdSet.has(id)));
    } else {
      const combined = new Set([...selectedTradeIds, ...filteredTrades.map((t) => t.id)]);
      setSelectedTradeIds(Array.from(combined));
    }
  };

  const toggleSelectTrade = (id) => {
    setSelectedTradeIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6 pb-24">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 animate-rise">
        <div>
          <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1">
            Trade Log
          </div>
          <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
            Trade <span className="text-profit glow-green">Journal</span>
          </h1>
        </div>

        {/* Import / Export / Scan Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsScanModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-profit/15 hover:bg-profit/25 text-profit border border-profit/40 hover:border-profit/70 rounded-xl text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer active:scale-95 hover:shadow-[0_0_12px_rgba(18,213,134,0.25)]"
          >
            <Camera className="w-3.5 h-3.5" />
            <span>Scan Screenshot</span>
          </button>
          <button
            onClick={() => setIsImportExportOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2 bg-secondary/50 hover:bg-secondary text-foreground border border-border rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 hover:border-border/80"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Import / Restore</span>
          </button>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 px-3.5 py-2 bg-secondary/50 hover:bg-secondary text-foreground border border-border rounded-xl text-xs font-semibold transition-all duration-150 cursor-pointer active:scale-95 hover:border-border/80"
            title="Export trades spreadsheet (.csv)"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={exportBackupJSON}
            className="flex items-center gap-2 px-3.5 py-2 bg-primary/15 hover:bg-primary/25 text-primary border border-primary/40 hover:border-primary/70 rounded-xl text-xs font-bold shadow-xs transition-all duration-150 cursor-pointer active:scale-95 hover:shadow-[0_0_12px_rgba(56,189,248,0.25)]"
            title="Download Complete Backup with all chart screenshots (.json)"
          >
            <Archive className="w-3.5 h-3.5" />
            <span>Backup All (with Images)</span>
          </button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 flex flex-wrap items-center gap-3 animate-rise shadow-xs">
        {/* Status Pills */}
        <div className="flex items-center bg-secondary/40 p-1 rounded-xl border border-border">
          {['ALL', 'OPEN', 'CLOSED'].map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-all cursor-pointer ${
                statusFilter === st
                  ? 'bg-profit/15 text-profit border border-profit/40 shadow-xs'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {st === 'ALL' ? 'All' : st === 'OPEN' ? 'Open' : 'Closed'}
            </button>
          ))}
        </div>

        {/* Pair Dropdown */}
        <div className="relative">
          <select
            value={pairFilter}
            onChange={(e) => setPairFilter(e.target.value)}
            className="bg-secondary/40 text-xs font-num text-foreground border border-border rounded-xl px-3 py-2 focus:outline-hidden focus:border-primary cursor-pointer"
          >
            <option value="ALL">All pairs</option>
            {uniquePairs.map((p) => (
              <option key={p} value={p}>
                {p}
              </option>
            ))}
          </select>
        </div>

        {/* Session Dropdown */}
        <div className="relative">
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="bg-secondary/40 text-xs text-foreground border border-border rounded-xl px-3 py-2 focus:outline-hidden focus:border-primary cursor-pointer"
          >
            <option value="ALL">All sessions</option>
            {uniqueSessions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>

        {/* Date Filter */}
        <div className="flex items-center gap-1 bg-secondary/40 border border-border rounded-xl px-3 py-1.5">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="bg-transparent text-xs text-foreground font-num focus:outline-hidden"
          />
          {dateFilter && (
            <button
              onClick={() => setDateFilter('')}
              className="text-muted-foreground hover:text-foreground text-xs ml-1 cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Search Notes */}
        <div className="flex-1 min-w-[200px] relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search notes, pair, or tag..."
            className="w-full bg-secondary/40 text-xs text-foreground placeholder-muted-foreground/60 border border-border rounded-xl pl-8 pr-3 py-2 focus:outline-hidden focus:border-primary"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground text-xs cursor-pointer"
            >
              ×
            </button>
          )}
        </div>

        {/* Bulk Action Controls */}
        {selectedTradeIds.length > 0 ? (
          <div className="flex items-center gap-2 bg-loss/15 border border-loss/40 px-3 py-1.5 rounded-xl shadow-[0_0_15px_rgba(239,68,68,0.15)]">
            <span className="text-xs font-num font-bold text-loss">
              {selectedTradeIds.length} Selected
            </span>
            <button
              type="button"
              onClick={() => setShowBulkDeleteConfirm(true)}
              disabled={isBulkDeleting}
              className="flex items-center gap-1.5 px-3 py-1 bg-loss hover:bg-loss/90 text-white rounded-lg text-xs font-bold transition cursor-pointer shadow-[0_0_10px_rgba(239,68,68,0.3)] disabled:opacity-50"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span>{isBulkDeleting ? 'Deleting...' : `Delete Selected (${selectedTradeIds.length})`}</span>
            </button>
            <button
              type="button"
              onClick={() => setSelectedTradeIds([])}
              className="text-xs text-muted-foreground hover:text-foreground underline cursor-pointer ml-1"
            >
              Deselect
            </button>
          </div>
        ) : filteredTrades.length > 0 ? (
          <button
            type="button"
            onClick={toggleSelectAll}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-profit border border-border hover:border-profit/40 rounded-xl text-xs font-semibold transition cursor-pointer"
          >
            <span>Select All ({filteredTrades.length})</span>
          </button>
        ) : null}
      </div>

      {/* Mobile Trade Cards (block md:hidden) */}
      <div className="block md:hidden space-y-3">
        {filteredTrades.length === 0 ? (
          <div className="rounded-xl border border-border bg-card/70 p-8 text-center text-muted-foreground text-xs font-num">
            No trades match the selected filters.
          </div>
        ) : (
          filteredTrades.map((t) => {
            const isOpen = t.status === 'OPEN';
            const isBuy = t.direction === 'BUY';
            const isProfit = !isOpen && t.pnl > 0;
            const isLoss = !isOpen && t.pnl < 0;
            const isExpanded = !!expandedRows[t.id];
            const mEffectivePips = getEffectiveTradePips(t);
            const mEffectiveRR = getEffectiveTradeRR(t);

            return (
              <div
                key={`mobile-${t.id}`}
                className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 space-y-3 animate-rise"
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleRow(t.id)}
                      className="text-muted-foreground hover:text-profit"
                    >
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-profit" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <span className="font-num font-bold text-foreground text-sm tracking-wide">
                      {t.pair}
                    </span>
                    <span
                      className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-num ${
                        isBuy
                          ? 'bg-profit/15 text-profit border border-profit/30'
                          : 'bg-loss/15 text-loss border border-loss/30'
                      }`}
                    >
                      {t.direction}
                    </span>
                    <span className="font-num text-xs text-muted-foreground">
                      {t.lots} lots
                    </span>
                  </div>

                  <div>
                    {isOpen ? (
                      <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        OPEN
                      </span>
                    ) : (
                      <span
                        className={`font-num font-bold text-sm ${
                          isProfit ? 'text-profit' : isLoss ? 'text-loss' : 'text-muted-foreground'
                        }`}
                      >
                        {formatCurrencyRaw(t.pnl, currency, true)}
                      </span>
                    )}
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs font-num text-muted-foreground">
                  <span className="flex items-center gap-1.5 flex-wrap">
                    <span>{formatDateDisplay(t.date)}</span>
                    {t.time && (
                      <>
                        <span className="text-muted-foreground/40">·</span>
                        <span className="text-muted-foreground/85 flex items-center gap-1 font-mono text-[10px]">
                          <Clock className="w-2.5 h-2.5 text-primary/70 shrink-0" />
                          <span>{formatTimeDisplay(t.time)}</span>
                        </span>
                      </>
                    )}
                    <span className="text-muted-foreground/40">·</span>
                    {(() => {
                      const sc = getSessionConfig(t.session);
                      return (
                        <span className={`inline-flex items-center gap-1 px-1.5 py-0.2 rounded text-[10px] font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
                          <span className={`w-1 h-1 rounded-full ${sc.dot}`} />
                          <span>{sc.label}</span>
                        </span>
                      );
                    })()}
                  </span>
                  <span>
                    {isOpen ? t.entryPrice : `${t.entryPrice} → ${t.exitPrice}`}
                  </span>
                </div>

                {t.notes && (
                  <p className="text-xs text-foreground/80 line-clamp-2 bg-secondary/30 p-2.5 rounded-lg border border-border/50">
                    {t.notes}
                  </p>
                )}

                {/* Mobile Expanded Details */}
                {isExpanded && (
                  <div className="pt-2 border-t border-border space-y-2 text-xs font-num">
                    <div className="flex justify-between text-muted-foreground">
                      <span>SL / TP:</span>
                      <span>
                        <span className="text-loss">{t.stopLoss || '—'}</span> / <span className="text-profit">{t.takeProfit || '—'}</span>
                      </span>
                    </div>
                    <div className="flex justify-between text-muted-foreground">
                      <span>R-Multiple / Pips:</span>
                      <span>
                        {mEffectiveRR.formatted} · {mEffectivePips !== null ? `${formatPips(mEffectivePips)} pips` : '-'}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(t.tags || []).map((tg) => (
                        <span key={tg} className="px-2 py-0.5 rounded-md text-[10px] font-num bg-sky-500/10 border border-sky-500/30 text-sky-400">
                          {tg}
                        </span>
                      ))}
                      <span className={`px-2 py-0.5 rounded-md text-[10px] border ${
                        t.followedPlan ? 'bg-profit/15 text-profit border-profit/30' : 'bg-loss/15 text-loss border-loss/30'
                      }`}>
                        {t.followedPlan ? '✓ followed plan' : '✗ broke plan'}
                      </span>
                    </div>
                  </div>
                )}

                <div className="flex items-center justify-between pt-1">
                  <div className="flex items-center gap-2">
                    {t.screenshot && (
                      <button
                        type="button"
                        onClick={() => setLightbox({ url: t.screenshot, title: `${t.pair} Entry Chart`, subtitle: `${t.direction} · ${t.date}` })}
                        className="text-xs text-profit hover:underline font-num flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Entry
                      </button>
                    )}
                    {t.exitScreenshot && (
                      <button
                        type="button"
                        onClick={() => setLightbox({ url: t.exitScreenshot, title: `${t.pair} Exit Chart`, subtitle: `${t.direction} · ${t.date}` })}
                        className="text-xs text-sky-400 hover:underline font-num flex items-center gap-1 cursor-pointer"
                      >
                        <ImageIcon className="w-3.5 h-3.5" /> Exit
                      </button>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {isOpen && (
                      <button
                        onClick={() => setTradeToClose(t)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-profit/15 text-profit border border-profit/35 cursor-pointer"
                      >
                        Close
                      </button>
                    )}
                    <button
                      onClick={() => setTradeToEdit(t)}
                      className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary cursor-pointer"
                      title="Edit"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={() => setTradeToDelete(t)}
                      className="p-1.5 text-muted-foreground hover:text-loss rounded-lg hover:bg-secondary cursor-pointer"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Desktop Trades Table (hidden md:block) */}
      <div className="hidden md:block rounded-xl border border-border bg-card/70 backdrop-blur-sm overflow-hidden shadow-xs animate-rise">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-border text-muted-foreground text-[11px] font-num font-bold tracking-wider uppercase bg-secondary/20">
                <th className="py-3.5 px-3 w-16">
                  <div className="flex items-center gap-1.5">
                    <input
                      type="checkbox"
                      checked={allFilteredSelected}
                      onChange={toggleSelectAll}
                      disabled={filteredTrades.length === 0}
                      className="w-4 h-4 rounded border-border bg-secondary/50 text-profit accent-profit cursor-pointer"
                      title={allFilteredSelected ? 'Deselect All' : 'Select All'}
                    />
                  </div>
                </th>
                <th className="py-3.5 px-3">PAIR</th>
                <th className="py-3.5 px-3">SESSION</th>
                <th className="py-3.5 px-3">LOTS</th>
                <th className="py-3.5 px-3">ENTRY → EXIT</th>
                <th className="py-3.5 px-3">R</th>
                <th className="py-3.5 px-3">PIPS</th>
                <th className="py-3.5 px-3">DATE</th>
                <th className="py-3.5 px-3">P&L</th>
                <th className="py-3.5 px-4 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/40 text-xs font-num">
              {filteredTrades.length === 0 ? (
                <tr>
                  <td colSpan="10" className="py-16 text-center text-muted-foreground">
                    <div className="flex flex-col items-center justify-center space-y-2">
                      <div className="w-10 h-10 rounded-full bg-profit/10 border border-profit/25 flex items-center justify-center text-profit font-bold text-sm">
                        +
                      </div>
                      <div className="text-foreground font-medium text-sm">No trades logged yet</div>
                      <p className="text-xs text-muted-foreground max-w-sm">
                        Your trade journal is clean and ready. Click the green &ldquo;+ Log Trade&rdquo; button above to record your first trade.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                filteredTrades.map((trade) => {
                  const isExpanded = !!expandedRows[trade.id];
                  const isOpen = trade.status === 'OPEN';
                  const isBuy = trade.direction === 'BUY';
                  const isProfit = !isOpen && trade.pnl > 0;
                  const isLoss = !isOpen && trade.pnl < 0;
                  const isSelected = selectedTradeIds.includes(trade.id);
                  const effectivePips = getEffectiveTradePips(trade);
                  const effectiveRR = getEffectiveTradeRR(trade);

                  return (
                    <React.Fragment key={trade.id}>
                      <tr
                        className={`hover:bg-secondary/40 transition-colors group ${
                          isSelected ? 'bg-secondary/60' : isExpanded ? 'bg-secondary/30' : ''
                        }`}
                      >
                        {/* Checkbox & Expand Chevron */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => toggleSelectTrade(trade.id)}
                              className="w-4 h-4 rounded border-border bg-secondary/50 text-profit accent-profit cursor-pointer"
                            />
                            <button
                              onClick={() => toggleRow(trade.id)}
                              className="text-muted-foreground hover:text-profit transition p-1 cursor-pointer"
                            >
                              {isExpanded ? (
                                <ChevronDown className="w-4 h-4 text-profit" />
                              ) : (
                                <ChevronRight className="w-4 h-4" />
                              )}
                            </button>
                          </div>
                        </td>

                        {/* Pair + Direction badge */}
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-foreground tracking-wide font-num">
                              {trade.pair}
                            </span>
                            <span
                              className={`text-[9px] font-bold px-1.5 py-0.5 rounded tracking-wider uppercase font-num ${
                                isBuy
                                  ? 'bg-profit/15 text-profit border border-profit/30'
                                  : 'bg-loss/15 text-loss border border-loss/30'
                              }`}
                            >
                              {trade.direction}
                            </span>
                          </div>
                        </td>

                        {/* Session */}
                        <td className="py-3.5 px-3">
                          {(() => {
                            const sc = getSessionConfig(trade.session);
                            return (
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-[11px] font-semibold border ${sc.bg} ${sc.color} ${sc.border}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${sc.dot}`} />
                                <span>{sc.label}</span>
                              </span>
                            );
                          })()}
                        </td>

                        {/* Lots */}
                        <td className="py-3.5 px-3 text-foreground font-num">
                          {trade.lots}
                        </td>

                        {/* Entry -> Exit */}
                        <td className="py-3.5 px-3 text-muted-foreground font-num">
                          {isOpen ? (
                            <span className="text-foreground font-semibold">{trade.entryPrice}</span>
                          ) : (
                            <span>
                              {trade.entryPrice} → {trade.exitPrice}
                            </span>
                          )}
                        </td>

                        {/* R Multiple */}
                        <td className="py-3.5 px-3 font-num">
                          {effectiveRR.ratio === null ? (
                            <span className="text-muted-foreground/60">-</span>
                          ) : (
                            <div className="flex flex-col">
                              <span
                                className={`font-semibold ${
                                  effectiveRR.ratio >= 0
                                    ? 'text-profit'
                                    : 'text-loss'
                                }`}
                              >
                                {effectiveRR.formatted}
                              </span>
                              {effectiveRR.isPlanned && (
                                <span className="text-[9px] text-sky-400 font-sans tracking-wide">
                                  planned
                                </span>
                              )}
                            </div>
                          )}
                        </td>

                        {/* Pips */}
                        <td className="py-3.5 px-3 font-num">
                          {effectivePips === null ? (
                            <span className="text-muted-foreground/60">-</span>
                          ) : (
                            <span
                              className={`font-semibold ${
                                effectivePips >= 0
                                  ? 'text-profit'
                                  : 'text-loss'
                              }`}
                            >
                              {formatPips(effectivePips)}
                            </span>
                          )}
                        </td>

                        {/* Date & Time */}
                        <td className="py-3.5 px-3 text-muted-foreground font-num">
                          <div>{formatDateDisplay(trade.date)}</div>
                          {trade.time && (
                            <div className="text-[11px] text-muted-foreground/80 flex items-center gap-1 font-mono mt-0.5">
                              <Clock className="w-3 h-3 text-primary/70 inline shrink-0" />
                              <span>{formatTimeDisplay(trade.time)}</span>
                            </div>
                          )}
                        </td>

                        {/* P&L */}
                        <td className="py-3.5 px-3 font-num">
                          {isOpen ? (
                            <span className="text-[10px] font-bold tracking-wider px-2 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30">
                              OPEN
                            </span>
                          ) : (
                            <span
                              className={`font-bold ${
                                isProfit
                                  ? 'text-profit'
                                  : isLoss
                                  ? 'text-loss'
                                  : 'text-muted-foreground'
                              }`}
                            >
                              {formatCurrencyRaw(trade.pnl, currency, true)}
                            </span>
                          )}
                        </td>

                        {/* Actions */}
                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            {isOpen && (
                              <button
                                onClick={() => setTradeToClose(trade)}
                                className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-profit/15 hover:bg-profit/25 text-profit border border-profit/35 hover:border-profit/70 transition-all duration-150 mr-1 cursor-pointer active:scale-95 hover:shadow-[0_0_10px_rgba(18,213,134,0.25)]"
                              >
                                Close
                              </button>
                            )}

                            <button
                              onClick={() => setTradeToEdit(trade)}
                              className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg hover:bg-secondary transition-all duration-150 cursor-pointer active:scale-95"
                              title="Edit trade"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setTradeToDelete(trade)}
                              className="p-1.5 text-muted-foreground hover:text-loss rounded-lg hover:bg-loss/15 hover:border-loss/30 transition-all duration-150 cursor-pointer active:scale-95"
                              title="Delete trade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Expanded Accordion Details */}
                      {isExpanded && (
                        <tr className="bg-secondary/25 border-b border-border">
                          <td colSpan="10" className="p-5">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                              {/* Left Column: Plan & Details */}
                              <div className="space-y-3">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Execution Details
                                </div>
                                <div className="space-y-1.5 text-xs font-num">
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Stop Loss:</span>
                                    <span className="text-loss font-semibold">
                                      {trade.stopLoss || 'None set'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Take Profit:</span>
                                    <span className="text-profit font-semibold">
                                      {trade.takeProfit || 'None set'}
                                    </span>
                                  </div>
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Session:</span>
                                    <span className="text-foreground">{trade.session}</span>
                                  </div>
                                  {trade.emotion && (
                                    <div className="flex justify-between text-muted-foreground">
                                      <span>Emotion:</span>
                                      <span className="text-foreground capitalize">{trade.emotion}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between text-muted-foreground">
                                    <span>Followed Plan:</span>
                                    <span className="flex items-center gap-1 font-semibold">
                                      {trade.followedPlan ? (
                                        <span className="text-profit flex items-center gap-1">
                                          <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                                        </span>
                                      ) : (
                                        <span className="text-loss flex items-center gap-1">
                                          <XCircle className="w-3.5 h-3.5" /> No
                                        </span>
                                      )}
                                    </span>
                                  </div>

                                  {/* Setup Tags Pills */}
                                  <div className="pt-2 flex flex-wrap gap-1.5">
                                    {(trade.tags || [trade.setupTag || 'general']).map((t) => (
                                      <span key={t} className="px-2 py-0.5 rounded-md text-[10px] font-num bg-sky-500/10 border border-sky-500/30 text-sky-400">
                                        {t}
                                      </span>
                                    ))}
                                    <span className={`px-2 py-0.5 rounded-md text-[10px] border ${
                                      trade.followedPlan ? 'bg-profit/15 text-profit border-profit/30' : 'bg-loss/15 text-loss border-loss/30'
                                    }`}>
                                      {trade.followedPlan ? '✓ followed plan' : '✗ broke plan'}
                                    </span>
                                  </div>
                                </div>
                              </div>

                              {/* Middle Column: Trade Notes & Review */}
                              <div className="space-y-2">
                                <div className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                                  Journal Notes & Reflection
                                </div>
                                <p className="text-xs text-foreground leading-relaxed bg-secondary/40 p-3 rounded-xl border border-border min-h-[70px]">
                                  {trade.notes || 'No reflections logged for this trade.'}
                                </p>
                              </div>

                              {/* Right Column: Entry & Exit Screenshots */}
                              <div className="space-y-3">
                                <div>
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-profit mb-1.5 flex items-center justify-between">
                                    <span>Entry Chart</span>
                                    {trade.screenshot && (
                                      <span className="text-[10px] text-muted-foreground font-num font-normal">Active Setup</span>
                                    )}
                                  </div>
                                  {trade.screenshot ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-border h-24 bg-card">
                                      <img
                                        src={trade.screenshot}
                                        alt="Entry trade chart"
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setLightbox({
                                          url: trade.screenshot,
                                          title: `${trade.pair} Entry Chart`,
                                          subtitle: `${trade.direction} · ${trade.session} · ${trade.date}`
                                        })}
                                        className="absolute inset-0 bg-background/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center text-foreground text-xs gap-1 transition cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" /> View Lightbox
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="h-16 rounded-xl border border-dashed border-border bg-card/40 flex items-center justify-center text-muted-foreground text-xs gap-1.5">
                                      <ImageIcon className="w-4 h-4" />
                                      <span>No entry chart attached</span>
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <div className="text-[11px] font-bold uppercase tracking-wider text-sky-400 mb-1.5 flex items-center justify-between">
                                    <span>Exit Chart</span>
                                    {trade.exitScreenshot && (
                                      <span className="text-[10px] text-muted-foreground font-num font-normal">Post-Trade</span>
                                    )}
                                  </div>
                                  {trade.exitScreenshot ? (
                                    <div className="relative group rounded-xl overflow-hidden border border-border h-24 bg-card">
                                      <img
                                        src={trade.exitScreenshot}
                                        alt="Exit trade chart"
                                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => setLightbox({
                                          url: trade.exitScreenshot,
                                          title: `${trade.pair} Exit Chart`,
                                          subtitle: `${trade.direction} · ${trade.session} · ${trade.date}`
                                        })}
                                        className="absolute inset-0 bg-background/60 backdrop-blur-xs opacity-0 group-hover:opacity-100 flex items-center justify-center text-foreground text-xs gap-1 transition cursor-pointer"
                                      >
                                        <ExternalLink className="w-3.5 h-3.5" /> View Lightbox
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="h-16 rounded-xl border border-dashed border-border bg-card/40 flex items-center justify-center text-muted-foreground text-xs gap-1.5">
                                      <ImageIcon className="w-4 h-4" />
                                      <span>No exit chart attached</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer Summary */}
        <div className="p-4 border-t border-border flex items-center justify-between text-xs font-num text-muted-foreground bg-secondary/20">
          <div>
            <span>{filteredTrades.length} trades</span>
            <span className="mx-2">·</span>
            <span>
              net{' '}
              <strong
                className={`font-bold ${
                  filteredNetPnl >= 0 ? 'text-profit' : 'text-loss'
                }`}
              >
                {formatCurrencyRaw(filteredNetPnl, currency, true)}
              </strong>
            </span>
          </div>
        </div>
      </div>

      {/* Bulk Delete Confirmation Modal */}
      {showBulkDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="relative w-full max-w-sm bg-card border border-loss/30 rounded-xl shadow-2xl p-6 text-center space-y-4 animate-rise">
            <div className="w-12 h-12 rounded-full bg-loss/10 border border-loss/30 text-loss flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div>
              <h3 className="text-foreground font-bold text-base">Delete {selectedTradeIds.length} Trades?</h3>
              <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                Are you sure you want to delete <span className="text-foreground font-bold">{selectedTradeIds.length}</span> selected trade{selectedTradeIds.length > 1 ? 's' : ''}? This action will permanently remove them from your database and local journal.
              </p>
            </div>

            <div className="flex gap-2 justify-center pt-2">
              <button
                type="button"
                onClick={() => setShowBulkDeleteConfirm(false)}
                disabled={isBulkDeleting}
                className="px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground rounded-xl bg-secondary/50 hover:bg-secondary transition cursor-pointer disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={async () => {
                  setIsBulkDeleting(true);
                  try {
                    await deleteMultipleTrades(selectedTradeIds);
                    setSelectedTradeIds([]);
                    setShowBulkDeleteConfirm(false);
                  } catch (err) {
                    console.error('Failed to delete trades:', err);
                  } finally {
                    setIsBulkDeleting(false);
                  }
                }}
                disabled={isBulkDeleting}
                className="px-5 py-2 text-xs font-bold text-white bg-loss hover:bg-loss/90 rounded-xl transition shadow-[0_0_12px_rgba(239,68,68,0.3)] cursor-pointer disabled:opacity-50"
              >
                {isBulkDeleting ? 'Deleting...' : `Yes, Delete (${selectedTradeIds.length})`}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
