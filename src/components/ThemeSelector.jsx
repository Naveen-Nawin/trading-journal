import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, Sparkles, ChevronDown } from 'lucide-react';
import { useTrading, AVAILABLE_THEMES } from '../context/TradingContext';

export const ThemeSelector = ({ compact = false, position = 'bottom-right' }) => {
  const { theme, setTheme } = useTrading();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const activeTheme = AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 rounded-xl border border-border bg-card/80 hover:bg-secondary text-foreground text-xs font-medium transition cursor-pointer shadow-xs ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2'
        }`}
        title={`Theme: ${activeTheme.name}`}
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3.5 h-3.5 rounded-full border border-border shrink-0 shadow-xs"
            style={{ backgroundColor: activeTheme.primaryPreview }}
          />
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
        </div>
        {!compact && (
          <span className="hidden sm:inline font-medium text-[11px] max-w-[100px] truncate">
            {activeTheme.name}
          </span>
        )}
        <ChevronDown className="w-3 h-3 text-muted-foreground opacity-70" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className={`absolute z-50 mt-2 w-72 rounded-2xl bg-card border border-border shadow-2xl p-2 animate-rise ${
            position === 'top-left'
              ? 'bottom-full mb-2 left-0'
              : position === 'top-right'
              ? 'bottom-full mb-2 right-0'
              : position === 'bottom-left'
              ? 'top-full left-0'
              : 'top-full right-0'
          }`}
        >
          <div className="px-3 py-2 border-b border-border/70 mb-1 flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground font-mono">
              Color Themes
            </span>
            <span className="text-[10px] text-primary font-bold">
              6 Themes Available
            </span>
          </div>

          <div className="space-y-1 max-h-[340px] overflow-y-auto pr-1">
            {AVAILABLE_THEMES.map((item) => {
              const isSelected = item.id === theme;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => {
                    setTheme(item.id);
                    setIsOpen(false);
                  }}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-xs flex items-center justify-between transition cursor-pointer ${
                    isSelected
                      ? 'bg-secondary border border-primary/40 text-foreground font-semibold shadow-xs'
                      : 'hover:bg-secondary/60 text-muted-foreground hover:text-foreground border border-transparent'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    {/* Swatch Pill */}
                    <div className="flex items-center -space-x-1 shrink-0 p-0.5 rounded-full border border-border/60 bg-background/50">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20"
                        style={{ backgroundColor: item.bgPreview }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/20 z-10"
                        style={{ backgroundColor: item.primaryPreview }}
                      />
                    </div>
                    <div>
                      <div className="text-xs font-bold text-foreground leading-snug">
                        {item.name}
                      </div>
                      <div className="text-[10px] text-muted-foreground truncate max-w-[160px]">
                        {item.category}
                      </div>
                    </div>
                  </div>

                  {isSelected && (
                    <Check className="w-4 h-4 text-primary shrink-0" strokeWidth={2.5} />
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
};
