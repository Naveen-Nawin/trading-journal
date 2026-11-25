import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { initialRules } from '../data/initialRules';
import { calculateStats } from '../utils/calculations';
import { setLiveExchangeRate, LIVE_USD_TO_INR_RATE } from '../utils/formatters';
import { useAuth } from './AuthContext';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

const TradingContext = createContext();

const dbToTrade = (r) => ({
  id: r.id,
  pair: r.pair,
  direction: r.direction,
  lots: parseFloat(r.lots) || 0,
  entryPrice: r.entry_price != null ? parseFloat(r.entry_price) : (r.entryPrice != null ? parseFloat(r.entryPrice) : undefined),
  exitPrice: r.exit_price != null ? parseFloat(r.exit_price) : (r.exitPrice != null ? parseFloat(r.exitPrice) : undefined),
  stopLoss: r.stop_loss != null ? parseFloat(r.stop_loss) : (r.stopLoss != null ? parseFloat(r.stopLoss) : undefined),
  takeProfit: r.take_profit != null ? parseFloat(r.take_profit) : (r.takeProfit != null ? parseFloat(r.takeProfit) : undefined),
  pnl: r.pnl != null ? parseFloat(r.pnl) : 0,
  pips: r.pips != null ? parseFloat(r.pips) : 0,
  rMultiple: r.r_multiple != null ? parseFloat(r.r_multiple) : (r.rMultiple != null ? parseFloat(r.rMultiple) : 0),
  date: r.date,
  time: r.time,
  session: r.session,
  status: r.status || 'CLOSED',
  setupTag: r.setup_tag || r.setupTag,
  tags: r.tags_json ? (typeof r.tags_json === 'string' ? JSON.parse(r.tags_json) : r.tags_json) : (r.tags || []),
  emotion: r.emotion,
  notes: r.notes,
  screenshot: r.screenshot,
  exitScreenshot: r.exit_screenshot || r.exitScreenshot || null,
  followedPlan: r.followed_plan !== undefined ? Boolean(r.followed_plan) : Boolean(r.followedPlan),
});

const tradeToDb = (t, userId) => ({
  id: t.id,
  user_id: userId,
  pair: t.pair,
  direction: t.direction,
  lots: t.lots,
  entry_price: t.entryPrice != null ? t.entryPrice : null,
  exit_price: t.exitPrice != null ? t.exitPrice : null,
  stop_loss: t.stopLoss != null ? t.stopLoss : null,
  take_profit: t.takeProfit != null ? t.takeProfit : null,
  pnl: t.pnl != null ? t.pnl : 0,
  pips: t.pips != null ? t.pips : 0,
  r_multiple: t.rMultiple != null ? t.rMultiple : 0,
  date: t.date,
  time: t.time || null,
  session: t.session || null,
  status: t.status || 'CLOSED',
  setup_tag: t.setupTag || null,
  tags_json: JSON.stringify(t.tags || []),
  emotion: t.emotion || null,
  notes: t.notes || '',
  screenshot: t.screenshot || null,
  exit_screenshot: t.exitScreenshot || null,
  followed_plan: t.followedPlan ? true : false,
});

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

  // Load trades and rules from Supabase Cloud DB or local fallback
  useEffect(() => {
    if (!user) {
      setTrades([]);
      setRules(initialRules);
      return;
    }

    const loadData = async () => {
      // 1. Supabase Cloud DB Mode
      if (isSupabaseConfigured && user.id) {
        try {
          const { data: tradesData, error: tradesErr } = await supabase
            .from('trades')
            .select('*')
            .eq('user_id', user.id)
            .order('date', { ascending: false });

          if (!tradesErr && Array.isArray(tradesData)) {
            setTrades(tradesData.map(dbToTrade));
          } else {
            // Fallback to local storage for this user
            const saved = localStorage.getItem(`pipdesk_trades_${user.id}`);
            if (saved) setTrades(JSON.parse(saved));
          }

          const { data: rulesData, error: rulesErr } = await supabase
            .from('rules')
            .select('*')
            .eq('user_id', user.id)
            .order('num', { ascending: true });

          if (!rulesErr && Array.isArray(rulesData) && rulesData.length > 0) {
            setRules(rulesData);
          } else if (!rulesErr && Array.isArray(rulesData) && rulesData.length === 0) {
            // Seed default rules for new user
            const seed = initialRules.map((r) => ({
              id: `rule-${Date.now()}-${r.num}`,
              user_id: user.id,
              num: r.num,
              text: r.text,
              active: true,
            }));
            await supabase.from('rules').insert(seed);
            setRules(seed);
          }
        } catch (err) {
          console.warn('Supabase fetch failed, fallback to local cache:', err);
          const saved = localStorage.getItem(`pipdesk_trades_${user.id}`);
          if (saved) setTrades(JSON.parse(saved));
        }
        return;
      }

      // 2. Express Backend Fallback
      if (token) {
        try {
          const res = await fetch('/api/trades', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.trades) setTrades(data.trades);
          }
        } catch (err) {
          console.warn('Could not load trades from API:', err);
        }

        try {
          const res = await fetch('/api/rules', {
            headers: { Authorization: `Bearer ${token}` },
          });
          if (res.ok) {
            const data = await res.json();
            if (data?.rules) setRules(data.rules);
          }
        } catch (err) {
          console.warn('Could not load rules from API:', err);
        }
      }
    };

    loadData();
  }, [user, token]);

  const [currency, setCurrency] = useState(() => {
    try {
      return localStorage.getItem('pipdesk_currency_v1') || 'USD';
    } catch {
      return 'USD';
    }
  });

  const [currentTab, setCurrentTab] = useState('dashboard');

  // Modals
  const [isLogTradeOpen, setIsLogTradeOpen] = useState(false);
  const [tradeToClose, setTradeToClose] = useState(null);
  const [tradeToEdit, setTradeToEdit] = useState(null);
  const [tradeToDelete, setTradeToDelete] = useState(null);
  const [calendarDayModal, setCalendarDayModal] = useState({ isOpen: false, day: null, dateStr: '', trades: [] });
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);

  // Sync to local cache per user
  useEffect(() => {
    if (user?.id) {
      try {
        localStorage.setItem(`pipdesk_trades_${user.id}`, JSON.stringify(trades));
      } catch (e) {
        console.error('Failed to save trades to local cache', e);
      }
    }
  }, [trades, user]);

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

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('trades').insert([tradeToDb(tradeWithId, user.id)]);
      } catch (err) {
        console.warn('Supabase insert failed:', err);
      }
    } else if (token) {
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

    if (isSupabaseConfigured && user?.id) {
      try {
        const rows = formattedTrades.map((t) => tradeToDb(t, user.id));
        await supabase.from('trades').insert(rows);
      } catch (err) {
        console.warn('Supabase batch insert failed:', err);
      }
    } else if (token) {
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

    if (isSupabaseConfigured && user?.id) {
      try {
        const payload = {
          exit_price: closeData.exitPrice,
          pnl: closeData.pnl,
          pips: closeData.pips,
          r_multiple: closeData.rMultiple,
          status: 'CLOSED',
        };
        if (closeData.exitScreenshot) {
          payload.exit_screenshot = closeData.exitScreenshot;
        }
        if (closeData.notes) {
          payload.notes = closeData.notes;
        }
        const { error } = await supabase
          .from('trades')
          .update(payload)
          .eq('id', tradeId)
          .eq('user_id', user.id);

        if (error && error.message?.includes('exit_screenshot')) {
          delete payload.exit_screenshot;
          await supabase.from('trades').update(payload).eq('id', tradeId).eq('user_id', user.id);
        }
      } catch (err) {
        console.warn('Supabase close trade failed:', err);
      }
    } else if (token) {
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

    if (isSupabaseConfigured && user?.id) {
      try {
        const dbPayload = tradeToDb({ id: tradeId, ...updatedData }, user.id);
        delete dbPayload.id;
        delete dbPayload.user_id;
        await supabase.from('trades').update(dbPayload).eq('id', tradeId).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase update trade failed:', err);
      }
    } else if (token) {
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

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('trades').delete().eq('id', tradeId).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase delete trade failed:', err);
      }
    } else if (token) {
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

  const deleteMultipleTrades = async (tradeIds) => {
    if (!Array.isArray(tradeIds) || tradeIds.length === 0) return;
    const idSet = new Set(tradeIds);
    setTrades((prev) => prev.filter((trade) => !idSet.has(trade.id)));

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('trades').delete().in('id', tradeIds).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase bulk delete failed:', err);
      }
    } else if (token) {
      for (const id of tradeIds) {
        fetch(`/api/trades/${id}`, {
          method: 'DELETE',
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => {});
      }
    }
  };

  const clearAllTrades = async () => {
    setTrades([]);
    if (user?.id) {
      localStorage.removeItem(`pipdesk_trades_${user.id}`);
    }

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('trades').delete().eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase clear trades failed:', err);
      }
    } else if (token) {
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
    let nextActive = true;
    setRules((prev) =>
      prev.map((r) => {
        if (r.id === ruleId) {
          nextActive = !r.active;
          return { ...r, active: nextActive };
        }
        return r;
      })
    );

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('rules').update({ active: nextActive }).eq('id', ruleId).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase toggle rule failed:', err);
      }
    } else if (token) {
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

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('rules').insert([{
          id: tempId,
          user_id: user.id,
          num: nextNum,
          text: text.trim(),
          active: true,
        }]);
      } catch (err) {
        console.warn('Supabase add rule failed:', err);
      }
    } else if (token) {
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

    if (isSupabaseConfigured && user?.id) {
      try {
        await supabase.from('rules').delete().eq('id', ruleId).eq('user_id', user.id);
      } catch (err) {
        console.warn('Supabase delete rule failed:', err);
      }
    } else if (token) {
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
  };

  const exportCSV = () => {
    const headers = [
      'id', 'pair', 'direction', 'session', 'lots', 'entryPrice', 'exitPrice',
      'stopLoss', 'takeProfit', 'pnl', 'rMultiple', 'pips', 'date', 'status',
      'setupTag', 'followedPlan', 'notes',
    ];

    const rows = trades.map((t) => [
      t.id, t.pair, t.direction, t.session, t.lots,
      t.entryPrice ?? '', t.exitPrice ?? '', t.stopLoss ?? '', t.takeProfit ?? '',
      t.pnl ?? '', t.rMultiple ?? '', t.pips ?? '', t.date, t.status,
      t.setupTag ?? '', t.followedPlan ? 'yes' : 'no',
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
        deleteMultipleTrades,
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
