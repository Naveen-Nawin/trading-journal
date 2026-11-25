import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { initialTrades } from '../data/initialTrades';
import { initialRules } from '../data/initialRules';
import { calculateStats } from '../utils/calculations';
import { setLiveExchangeRate, LIVE_USD_TO_INR_RATE } from '../utils/formatters';
import { useAuth } from './AuthContext';

const TradingContext = createContext();

export const TradingProvider = ({ children }) => {
  // Live market USD to INR conversion rate
  const [usdToInrRate, setUsdToInrRateState] = useState(() => {
    try {
      const saved = localStorage.getItem('fx_usd_inr_rate');
      const val = saved ? parseFloat(saved) : LIVE_USD_TO_INR_RATE;
      setLiveExchangeRate(val);
      return val;
    } catch {
      return LIVE_USD_TO_INR_RATE;
    }
  });

  const setUsdToInrRate = (rate) => {
    const val = parseFloat(rate);
    if (!isNaN(val) && val > 0) {
      setUsdToInrRateState(val);
      setLiveExchangeRate(val);
      localStorage.setItem('fx_usd_inr_rate', val);
    }
  };

  // Fetch real market exchange rate on load
  useEffect(() => {
    fetch('https://open.er-api.com/v6/latest/USD')
      .then((res) => res.json())
      .then((data) => {
        if (data?.rates?.INR) {
          const live = parseFloat(data.rates.INR.toFixed(2));
          setUsdToInrRate(live);
        }
      })
      .catch((err) => {
        console.warn('Using baseline live rate 93.51:', err);
      });
  }, []);

  const { token, user } = useAuth();

  // Load user trades (starts empty until user authenticates)
  const [trades, setTrades] = useState([]);
  const [rules, setRules] = useState(initialRules);

  // Load trades and rules from DB when authenticated
  useEffect(() => {
    if (token) {
      fetch('/api/trades', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.trades)) {
            setTrades(data.trades);
          }
        })
        .catch((err) => console.warn('Could not load trades from DB:', err));

      fetch('/api/rules', {
        headers: { Authorization: `Bearer ${token}` },
      })
        .then((res) => (res.ok ? res.json() : null))
        .then((data) => {
          if (data && Array.isArray(data.rules) && data.rules.length > 0) {
            setRules(data.rules);
          }
        })
        .catch((err) => console.warn('Could not load rules from DB:', err));
    } else {
      setTrades([]);
      setRules(initialRules);
    }
  }, [token]);

  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('pipdesk_currency_v1') || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [currentTab, setCurrentTab] = useState('dashboard'); // 'dashboard', 'trades', 'calendar', 'plan'

  // Modals
  const [isLogTradeOpen, setIsLogTradeOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState(null);
  const [tradeToEdit, setTradeToEdit] = useState(null);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [calendarDayModal, setCalendarDayModal] = useState({ isOpen: false, day: null, dateStr: '', trades: [] });
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('pipdesk_trades_v2', JSON.stringify(trades));
    } catch (e) {
      console.error('Failed to save trades to localStorage', e);
    }
  }, [trades]);

  useEffect(() => {
    try {
      localStorage.setItem('pipdesk_rules_v1', JSON.stringify(rules));
    } catch (e) {
      console.error('Failed to save rules to localStorage', e);
    }
  }, [rules]);

  useEffect(() => {
    try {
      localStorage.setItem('pipdesk_currency_v1', currency);
    } catch (e) {
      console.error('Failed to save currency to localStorage', e);
    }
  }, [currency]);

  // Derived statistics
  const stats = useMemo(() => calculateStats(trades), [trades]);

  // Confetti helper
  const triggerWinCelebration = () => {
    try {
      confetti({
        particleCount: 80,
        spread: 60,
        origin: { y: 0.8 },
        colors: ['#00f098', '#10b981', '#34d399', '#ffffff'],
      });
    } catch (e) {
      // ignore
    }
  };

  // Actions
  const logTrade = async (newTrade) => {
    const tradeWithId = {
      ...newTrade,
      id: newTrade.id || `tr-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`,
    };

    setTrades((prev) => [tradeWithId, ...prev]);

    if (token) {
      try {
        await fetch('/api/trades', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(tradeWithId),
        });
      } catch (err) {
        console.warn('Failed to sync trade to DB:', err);
      }
    }

    if (tradeWithId.status === 'CLOSED' && tradeWithId.pnl > 0) {
      triggerWinCelebration();
    }
  };

  const logMultipleTrades = async (newTrades) => {
    if (!Array.isArray(newTrades) || newTrades.length === 0) return 0;

    const formattedTrades = newTrades.map((t, idx) => ({
      ...t,
      id: t.id && !t.id.startsWith('ocr-') && !t.id.startsWith('sample-')
        ? t.id
        : `tr-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
    }));

    setTrades((prev) => [...formattedTrades, ...prev]);

    if (token) {
      try {
        await fetch('/api/trades/batch', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ trades: formattedTrades }),
        });
      } catch (err) {
        console.warn('Failed to sync batch trades to DB:', err);
      }
    }

    const netPnl = formattedTrades.reduce((acc, t) => acc + (parseFloat(t.pnl) || 0), 0);
    if (netPnl > 0) {
      triggerWinCelebration();
    }
    return formattedTrades.length;
  };

  const closeTrade = async (tradeId, closeData) => {
    setTrades((prev) =>
      prev.map((trade) => {
        if (trade.id === tradeId) {
          const updated = {
            ...trade,
            ...closeData,
            status: 'CLOSED',
          };
          if (updated.pnl > 0) {
            triggerWinCelebration();
          }
          return updated;
        }
        return trade;
      })
    );

    if (token) {
      try {
        await fetch(`/api/trades/${tradeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(closeData),
        });
      } catch (err) {
        console.warn('Failed to update close trade in DB:', err);
      }
    }

    setTradeToClose(null);
  };

  const updateTrade = async (tradeId, updatedData) => {
    setTrades((prev) =>
      prev.map((trade) => (trade.id === tradeId ? { ...trade, ...updatedData } : trade))
    );

    if (token) {
      try {
        await fetch(`/api/trades/${tradeId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(updatedData),
        });
      } catch (err) {
        console.warn('Failed to update trade in DB:', err);
      }
    }

    setTradeToEdit(null);
  };

  const deleteTrade = async (tradeId) => {
    setTrades((prev) => prev.filter((trade) => trade.id !== tradeId));

    if (token) {
      try {
        await fetch(`/api/trades/${tradeId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to delete trade in DB:', err);
      }
    }

    setTradeToDelete(null);
  };

  const clearAllTrades = async () => {
    setTrades([]);
    localStorage.removeItem('pipdesk_trades_v1');
    localStorage.setItem('pipdesk_trades_v2', JSON.stringify([]));

    if (token) {
      try {
        await fetch('/api/trades', {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to clear trades in DB:', err);
      }
    }
  };

  const toggleRule = async (ruleId) => {
    setRules((prev) =>
      prev.map((r) => (r.id === ruleId ? { ...r, active: !r.active } : r))
    );

    if (token) {
      try {
        await fetch(`/api/rules/${ruleId}/toggle`, {
          method: 'PUT',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to toggle rule in DB:', err);
      }
    }
  };

  const addRule = async (text) => {
    if (!text.trim()) return;
    const nextNum = String(rules.length + 1).padStart(2, '0');
    const tempId = `rule-${Date.now()}`;
    const newRule = {
      id: tempId,
      num: nextNum,
      text: text.trim(),
      active: true,
    };

    setRules((prev) => [...prev, newRule]);

    if (token) {
      try {
        const res = await fetch('/api/rules', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ text }),
        });
        if (res.ok) {
          const data = await res.json();
          setRules((prev) => prev.map((r) => (r.id === tempId ? data.rule : r)));
        }
      } catch (err) {
        console.warn('Failed to add rule to DB:', err);
      }
    }
  };

  const deleteRule = async (ruleId) => {
    setRules((prev) =>
      prev
        .filter((r) => r.id !== ruleId)
        .map((r, index) => ({
          ...r,
          num: String(index + 1).padStart(2, '0'),
        }))
    );

    if (token) {
      try {
        await fetch(`/api/rules/${ruleId}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        });
      } catch (err) {
        console.warn('Failed to delete rule in DB:', err);
      }
    }
  };

  const resetToDefaults = () => {
    setTrades([]);
    setRules(initialRules);
    setCurrency('USD');
    localStorage.removeItem('pipdesk_trades_v1');
    localStorage.setItem('pipdesk_trades_v2', JSON.stringify([]));
  };

  const exportCSV = () => {
    const headers = [
      'id',
      'pair',
      'direction',
      'session',
      'lots',
      'entryPrice',
      'exitPrice',
      'stopLoss',
      'takeProfit',
      'pnl',
      'rMultiple',
      'pips',
      'date',
      'status',
      'setupTag',
      'followedPlan',
      'notes',
    ];

    const rows = trades.map((t) => [
      t.id,
      t.pair,
      t.direction,
      t.session,
      t.lots,
      t.entryPrice ?? '',
      t.exitPrice ?? '',
      t.stopLoss ?? '',
      t.takeProfit ?? '',
      t.pnl ?? '',
      t.rMultiple ?? '',
      t.pips ?? '',
      t.date,
      t.status,
      t.setupTag ?? '',
      t.followedPlan ? 'yes' : 'no',
      `"${(t.notes || '').replace(/"/g, '""')}"`,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `pipdesk-trades-${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const importTrades = (importedList) => {
    if (!Array.isArray(importedList) || importedList.length === 0) return;
    setTrades((prev) => [...importedList, ...prev]);
  };

  return (
    <TradingContext.Provider
      value={{
        trades,
        rules,
        currency,
        setCurrency,
        usdToInrRate,
        setUsdToInrRate,
        currentTab,
        setCurrentTab,
        stats,
        isLogTradeOpen,
        setIsLogTradeOpen,
        tradeToClose,
        setTradeToClose,
        tradeToEdit,
        setTradeToEdit,
        tradeToDelete,
        setTradeToDelete,
        calendarDayModal,
        setCalendarDayModal,
        isImportExportOpen,
        setIsImportExportOpen,
        isScanModalOpen,
        setIsScanModalOpen,
        logTrade,
        logMultipleTrades,
        closeTrade,
        updateTrade,
        deleteTrade,
        clearAllTrades,
        toggleRule,
        addRule,
        deleteRule,
        resetToDefaults,
        exportCSV,
        importTrades,
      }}
    >
      {children}
    </TradingContext.Provider>
  );
};

export const useTrading = () => {
  const context = useContext(TradingContext);
  if (!context) {
    throw new Error('useTrading must be used within TradingProvider');
  }
  return context;
};

