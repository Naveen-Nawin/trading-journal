import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ChevronDown,
  Calendar,
  X,
  Layers,
  Globe,
  Check,
  Search,
  ChevronLeft,
  ChevronRight,
  Clock,
  Zap,
} from 'lucide-react';
import { getSessionConfig, SESSIONS_LIST } from '../../utils/sessionConfig';
import { formatDateDisplay } from '../../utils/formatters';

/**
 * Custom Dark-Themed Pair Dropdown Filter
 */
export const CustomPairFilter = ({ value, onChange, uniquePairs = [], trades = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Pair trade count map
  const pairCountMap = useMemo(() => {
    const counts = {};
    trades.forEach((t) => {
      const p = (t.pair || '').toUpperCase().trim();
      if (p) counts[p] = (counts[p] || 0) + 1;
    });
    return counts;
  }, [trades]);

  // Combine unique pairs logged in trades with common popular pairs
  const POPULAR_PAIRS = ['XAUUSD', 'EURUSD', 'GBPUSD', 'US100', 'US30', 'BTCUSD', 'USDJPY', 'NAS100'];

  const allDisplayPairs = useMemo(() => {
    const set = new Set([...uniquePairs, ...POPULAR_PAIRS]);
    return Array.from(set).sort((a, b) => {
      const countA = pairCountMap[a] || 0;
      const countB = pairCountMap[b] || 0;
      if (countA > 0 && countB === 0) return -1;
      if (countB > 0 && countA === 0) return 1;
      return a.localeCompare(b);
    });
  }, [uniquePairs, pairCountMap]);

  const filteredPairs = useMemo(() => {
    if (!search.trim()) return allDisplayPairs;
    const q = search.toLowerCase().replace(/[/\-_ ]/g, '');
    return allDisplayPairs.filter((p) =>
      p.toLowerCase().replace(/[/\-_ ]/g, '').includes(q)
    );
  }, [allDisplayPairs, search]);

  const isAll = value === 'ALL';

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer shadow-xs ${
          isAll
            ? 'bg-secondary/50 hover:bg-secondary text-foreground border-border hover:border-border/80'
            : 'bg-primary/15 text-primary border-primary/40 hover:border-primary/70 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
        }`}
      >
        <Layers className={`w-3.5 h-3.5 ${isAll ? 'text-muted-foreground' : 'text-primary'}`} />
        <span className="font-num tracking-wide font-bold">
          {isAll ? 'All Pairs' : value}
        </span>
        {!isAll && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('ALL');
            }}
            className="hover:bg-primary/20 rounded p-0.5 ml-0.5 text-primary"
            title="Clear pair filter"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>

      {/* Floating Dark Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-56 rounded-2xl border border-border/90 bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-rise">
          {uniquePairs.length > 5 && (
            <div className="relative mb-1.5 px-1 pt-1">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search pair..."
                className="w-full bg-secondary/60 text-xs text-foreground placeholder-muted-foreground/60 border border-border/70 rounded-xl pl-8 pr-2 py-1.5 focus:outline-hidden focus:border-primary"
                autoFocus
              />
            </div>
          )}

          <div className="max-h-60 overflow-y-auto space-y-0.5 custom-scrollbar">
            {/* All Pairs Option */}
            <button
              type="button"
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isAll
                  ? 'bg-primary/15 text-primary font-bold'
                  : 'text-foreground hover:bg-secondary/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-muted-foreground" />
                <span>All Pairs</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-[11px] font-mono text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                  {trades.length}
                </span>
                {isAll && <Check className="w-3.5 h-3.5 text-primary" />}
              </div>
            </button>

            {/* Individual Pairs */}
            {filteredPairs.map((pair) => {
              const count = pairCountMap[pair] || 0;
              const isSelected = value === pair;
              return (
                <button
                  key={pair}
                  type="button"
                  onClick={() => {
                    onChange(pair);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                    isSelected
                      ? 'bg-primary/15 text-primary font-bold'
                      : 'text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <span className="font-num tracking-wide font-bold">{pair}</span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] font-mono text-muted-foreground bg-secondary/60 px-1.5 py-0.5 rounded">
                      {count}
                    </span>
                    {isSelected && <Check className="w-3.5 h-3.5 text-primary" />}
                  </div>
                </button>
              );
            })}

            {filteredPairs.length === 0 && (
              <div className="py-3 text-center text-xs text-muted-foreground">
                No pairs found
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Dark-Themed Session Dropdown Filter with Colored Dots & IST Timings
 */
export const CustomSessionFilter = ({ value, onChange, uniqueSessions = [], trades = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  const isAll = value === 'ALL';
  const selectedConfig = isAll ? null : getSessionConfig(value);

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer shadow-xs ${
          isAll
            ? 'bg-secondary/50 hover:bg-secondary text-foreground border-border hover:border-border/80'
            : `${selectedConfig?.bg || 'bg-secondary/50'} ${selectedConfig?.color || 'text-foreground'} ${selectedConfig?.border || 'border-border'} shadow-[0_0_10px_rgba(6,182,212,0.15)]`
        }`}
      >
        {isAll ? (
          <Globe className="w-3.5 h-3.5 text-muted-foreground" />
        ) : (
          <span className={`w-2 h-2 rounded-full ${selectedConfig?.dot || 'bg-primary'}`} />
        )}
        <span>{isAll ? 'All Sessions' : selectedConfig?.label || value}</span>
        {!isAll && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('ALL');
            }}
            className="hover:opacity-80 rounded p-0.5 ml-0.5"
            title="Clear session filter"
          >
            <X className="w-3 h-3" />
          </span>
        )}
        <ChevronDown
          className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
            isOpen ? 'rotate-180 text-foreground' : ''
          }`}
        />
      </button>

      {/* Floating Dark Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-64 rounded-2xl border border-border/90 bg-card/95 backdrop-blur-xl shadow-2xl p-1.5 z-50 animate-rise">
          <div className="space-y-0.5">
            {/* All Sessions Option */}
            <button
              type="button"
              onClick={() => {
                onChange('ALL');
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-medium transition cursor-pointer ${
                isAll
                  ? 'bg-primary/15 text-primary font-bold'
                  : 'text-foreground hover:bg-secondary/70'
              }`}
            >
              <div className="flex items-center gap-2">
                <Globe className="w-3.5 h-3.5 text-muted-foreground" />
                <span>All Sessions</span>
              </div>
              {isAll && <Check className="w-3.5 h-3.5 text-primary" />}
            </button>

            {/* List of Available Sessions */}
            {SESSIONS_LIST.map((session) => {
              const isSelected = value === session.id || value === session.label;
              return (
                <button
                  key={session.id}
                  type="button"
                  onClick={() => {
                    onChange(session.id);
                    setIsOpen(false);
                  }}
                  className={`w-full flex items-start justify-between px-3 py-2 rounded-xl text-xs transition cursor-pointer ${
                    isSelected
                      ? `${session.bg} ${session.color} font-bold`
                      : 'text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <span className={`w-2 h-2 rounded-full mt-1 shrink-0 ${session.dot}`} />
                    <div className="text-left">
                      <div className="font-semibold">{session.label}</div>
                      <div className="text-[10px] text-muted-foreground mt-0.5">
                        {session.istTime}
                      </div>
                    </div>
                  </div>
                  {isSelected && <Check className={`w-3.5 h-3.5 mt-0.5 shrink-0 ${session.color}`} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Custom Dark-Themed Date Picker Popover with Calendar Grid & Quick Presets
 */
export const CustomDatePickerFilter = ({ value, onChange, trades = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Month state for navigating calendar
  const initialDate = value ? new Date(value.replace(/-/g, '/')) : new Date();
  const [viewYear, setViewYear] = useState(initialDate.getFullYear());
  const [viewMonth, setViewMonth] = useState(initialDate.getMonth()); // 0-11

  // Keep view year & month synced when value changes externally (e.g. via Today button or Clear)
  useEffect(() => {
    if (value && typeof value === 'string') {
      const parts = value.split('-');
      if (parts.length === 3) {
        const y = parseInt(parts[0], 10);
        const m = parseInt(parts[1], 10) - 1;
        if (!isNaN(y) && !isNaN(m)) {
          setViewYear(y);
          setViewMonth(m);
        }
      }
    }
  }, [value]);

  // Set of dates that have trades for dot indicators
  const tradeDatesSet = useMemo(() => {
    const set = new Set();
    trades.forEach((t) => {
      const raw = t.date || t.opened_at || (t.closed_at ? t.closed_at.slice(0, 10) : '');
      if (raw) {
        set.add(String(raw).slice(0, 10));
        const d = new Date(raw);
        if (!isNaN(d.getTime())) {
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, '0');
          const day = String(d.getDate()).padStart(2, '0');
          set.add(`${y}-${m}-${day}`);
        }
      }
    });
    return set;
  }, [trades]);

  // Today string
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Yesterday string
  const yesterdayStr = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  // Close on outside click
  useEffect(() => {
    const handleOutsideClick = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleOutsideClick);
    }
    return () => document.removeEventListener('mousedown', handleOutsideClick);
  }, [isOpen]);

  // Calendar days generation
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const firstDayOfWeek = new Date(viewYear, viewMonth, 1).getDay(); // 0 is Sun

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const handlePrevMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = (e) => {
    e.stopPropagation();
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const selectDate = (dayNum) => {
    const m = String(viewMonth + 1).padStart(2, '0');
    const d = String(dayNum).padStart(2, '0');
    onChange(`${viewYear}-${m}-${d}`);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen((prev) => !prev)}
        className={`flex items-center gap-2 px-3 py-2 text-xs font-semibold rounded-xl border transition-all duration-150 cursor-pointer shadow-xs ${
          value
            ? 'bg-primary/15 text-primary border-primary/40 hover:border-primary/70 shadow-[0_0_10px_rgba(56,189,248,0.2)]'
            : 'bg-secondary/50 hover:bg-secondary text-foreground border border-border hover:border-border/80'
        }`}
      >
        <Calendar className={`w-3.5 h-3.5 ${value ? 'text-primary' : 'text-muted-foreground'}`} />
        <span className="font-num tracking-wide">
          {value ? formatDateDisplay(value) : 'Filter by Date'}
        </span>
        {value ? (
          <span
            onClick={(e) => {
              e.stopPropagation();
              onChange('');
            }}
            className="hover:bg-primary/20 rounded p-0.5 ml-0.5 text-primary"
            title="Clear date filter"
          >
            <X className="w-3 h-3" />
          </span>
        ) : (
          <ChevronDown
            className={`w-3.5 h-3.5 text-muted-foreground transition-transform duration-200 ${
              isOpen ? 'rotate-180 text-foreground' : ''
            }`}
          />
        )}
      </button>

      {/* Floating Dark Calendar Popover */}
      {isOpen && (
        <div className="absolute left-0 mt-1.5 w-72 rounded-2xl border border-border/90 bg-card/95 backdrop-blur-xl shadow-2xl p-3.5 z-50 animate-rise">
          {/* Header with Month / Year Navigation */}
          <div className="flex items-center justify-between mb-3 px-1">
            <span className="font-num font-bold text-xs text-foreground tracking-wide">
              {monthNames[viewMonth]} {viewYear}
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={handlePrevMonth}
                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={handleNextMonth}
                className="p-1 hover:bg-secondary rounded-lg text-muted-foreground hover:text-foreground cursor-pointer transition"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-1 text-center mb-1.5">
            {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((wd, i) => (
              <span
                key={wd}
                className={`text-[10px] font-bold ${
                  i === 0 ? 'text-loss/70' : 'text-muted-foreground'
                }`}
              >
                {wd}
              </span>
            ))}
          </div>

          {/* Days Grid */}
          <div className="grid grid-cols-7 gap-1">
            {/* Blank leading days */}
            {Array.from({ length: firstDayOfWeek }).map((_, i) => (
              <div key={`blank-${i}`} className="h-8" />
            ))}

            {/* Month days */}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const dayNum = i + 1;
              const mStr = String(viewMonth + 1).padStart(2, '0');
              const dStr = String(dayNum).padStart(2, '0');
              const dateKey = `${viewYear}-${mStr}-${dStr}`;
              const isSelected = value === dateKey;
              const isToday = todayStr === dateKey;
              const hasTrades = tradeDatesSet.has(dateKey);

              return (
                <button
                  key={dayNum}
                  type="button"
                  onClick={() => selectDate(dayNum)}
                  className={`relative h-8 rounded-lg text-xs font-num font-semibold transition cursor-pointer flex flex-col items-center justify-center ${
                    isSelected
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : isToday
                      ? 'border border-primary text-primary bg-primary/10'
                      : 'text-foreground hover:bg-secondary/70'
                  }`}
                >
                  <span>{dayNum}</span>
                  {hasTrades && (
                    <span
                      className={`w-1 h-1 rounded-full absolute bottom-1 ${
                        isSelected ? 'bg-primary-foreground' : 'bg-profit'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Quick Filter Presets */}
          <div className="flex items-center justify-between gap-1.5 pt-3 mt-3 border-t border-border/70">
            <button
              type="button"
              onClick={() => {
                onChange(todayStr);
                setIsOpen(false);
              }}
              className="flex-1 py-1 px-2 text-[11px] font-bold bg-secondary/60 hover:bg-secondary text-foreground rounded-lg transition cursor-pointer text-center"
            >
              Today
            </button>
            <button
              type="button"
              onClick={() => {
                onChange(yesterdayStr);
                setIsOpen(false);
              }}
              className="flex-1 py-1 px-2 text-[11px] font-bold bg-secondary/60 hover:bg-secondary text-foreground rounded-lg transition cursor-pointer text-center"
            >
              Yesterday
            </button>
            {value && (
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="py-1 px-2.5 text-[11px] font-semibold text-loss hover:bg-loss/15 rounded-lg transition cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

/**
 * Direct 1-Click "Today" Quick Filter Button
 */
export const TodayFilterButton = ({ dateFilter, onToggle, todayTradesCount = 0 }) => {
  const todayStr = useMemo(() => {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }, []);

  const isActive = dateFilter === todayStr;

  return (
    <button
      type="button"
      onClick={() => onToggle(isActive ? '' : todayStr)}
      className={`flex items-center gap-1.5 px-3 py-2 text-xs font-bold rounded-xl border transition-all duration-150 cursor-pointer active:scale-95 shadow-xs ${
        isActive
          ? 'bg-profit/20 text-profit border-profit/50 shadow-[0_0_12px_rgba(18,213,134,0.3)]'
          : 'bg-secondary/40 hover:bg-secondary text-muted-foreground hover:text-foreground border-border hover:border-border/80'
      }`}
      title={isActive ? 'Click to show all dates' : "Filter only today's trades"}
    >
      <Zap className={`w-3.5 h-3.5 ${isActive ? 'text-profit fill-profit' : 'text-amber-400'}`} />
      <span>Today</span>
      {todayTradesCount > 0 && (
        <span
          className={`font-mono text-[10px] px-1.5 py-0.2 rounded-md ${
            isActive
              ? 'bg-profit text-background font-extrabold'
              : 'bg-secondary text-foreground font-semibold'
          }`}
        >
          {todayTradesCount}
        </span>
      )}
    </button>
  );
};
