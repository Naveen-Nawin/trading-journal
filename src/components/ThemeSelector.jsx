import React, { useState, useRef, useEffect } from 'react';
import { Palette, Check, ChevronDown, X } from 'lucide-react';
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
        className={`flex items-center gap-1.5 rounded-xl border border-border bg-card/80 hover:bg-secondary text-foreground text-xs font-medium transition cursor-pointer shadow-xs active:scale-95 ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2 w-full justify-between'
        }`}
        title={`Theme: ${activeTheme.name}`}
        aria-label="Select theme"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-border shrink-0 shadow-xs"
            style={{ backgroundColor: activeTheme.primaryPreview }}
          />
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          {!compact && (
            <span className="font-medium text-xs truncate">
              {activeTheme.name}
            </span>
          )}
        </div>
        {!compact && (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70" />
        )}
      </button>

      {/* 1. Mobile Bottom-Sheet Modal (Fitted for all phone screen sizes) */}
      {isOpen && (
        <div
          className="sm:hidden fixed inset-0 z-60 flex items-end justify-center p-3 bg-black/60 backdrop-blur-xs animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div
            className="w-full max-w-sm rounded-2xl bg-card border border-border shadow-2xl p-4 animate-rise max-h-[85vh] flex flex-col text-foreground"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-3 mb-2 border-b border-border/80">
              <div className="flex items-center gap-2">
                <div
                  className="w-4 h-4 rounded-full border border-border shrink-0"
                  style={{ backgroundColor: activeTheme.primaryPreview }}
                />
                <span className="text-sm font-bold text-foreground">
                  Select Color Theme
                </span>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Themes List */}
            <div className="space-y-1.5 overflow-y-auto max-h-[60vh] pr-0.5">
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
                    className={`w-full text-left p-3 rounded-xl text-xs flex items-center justify-between transition cursor-pointer active:scale-98 ${
                      isSelected
                        ? 'bg-secondary border border-primary/50 text-foreground font-semibold shadow-xs'
                        : 'bg-secondary/30 hover:bg-secondary/70 text-muted-foreground hover:text-foreground border border-border/60'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {/* Swatch Pill */}
                      <div className="flex items-center -space-x-1.5 shrink-0 p-1 rounded-full border border-border/70 bg-background">
                        <span
                          className="w-4 h-4 rounded-full border border-black/20"
                          style={{ backgroundColor: item.bgPreview }}
                        />
                        <span
                          className="w-4 h-4 rounded-full border border-black/20 z-10"
                          style={{ backgroundColor: item.primaryPreview }}
                        />
                      </div>
                      <div>
                        <div className="text-xs font-bold text-foreground">
                          {item.name}
                        </div>
                        <div className="text-[10px] text-muted-foreground">
                          {item.category}
                        </div>
                      </div>
                    </div>

                    {isSelected && (
                      <span className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 stroke-[2.5]" />
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 2. Desktop Anchored Dropdown (for Tablet & Desktop screens) */}
      {isOpen && (
        <div
          className={`hidden sm:block absolute z-50 mt-2 w-72 rounded-2xl bg-card border border-border shadow-2xl p-2 animate-rise ${
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
              6 Themes
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
