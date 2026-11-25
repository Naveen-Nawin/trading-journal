import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Palette, Check, X, ChevronDown } from 'lucide-react';
import { useTrading, AVAILABLE_THEMES } from '../context/TradingContext';

export const ThemeSelector = ({ compact = false, showLabel = true }) => {
  const { theme, setTheme } = useTrading();
  const [isOpen, setIsOpen] = useState(false);

  // Close when pressing Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const activeTheme = AVAILABLE_THEMES.find((t) => t.id === theme) || AVAILABLE_THEMES[0];

  return (
    <>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className={`flex items-center gap-1.5 rounded-xl border border-border bg-card/80 hover:bg-secondary text-foreground text-xs font-medium transition cursor-pointer shadow-xs active:scale-95 shrink-0 ${
          compact ? 'px-2 py-1.5' : 'px-3 py-2 w-full justify-between'
        }`}
        title={`Theme: ${activeTheme.name}`}
        aria-label="Select color theme"
      >
        <div className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-full border border-border shrink-0 shadow-xs"
            style={{ backgroundColor: activeTheme.primaryPreview }}
          />
          <Palette className="w-3.5 h-3.5 text-muted-foreground" />
          {showLabel && !compact && (
            <span className="font-medium text-xs truncate max-w-[120px]">
              {activeTheme.name}
            </span>
          )}
        </div>
        {showLabel && !compact && (
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground opacity-70" />
        )}
      </button>

      {/* Theme Modal Dialog — Rendered in document.body via Portal to guarantee 100% viewport fit on all mobile screens */}
      {isOpen &&
        createPortal(
          <div
            className="fixed inset-0 z-[100] flex items-center justify-center p-3 sm:p-4 bg-black/70 backdrop-blur-sm animate-fade-in"
            onClick={() => setIsOpen(false)}
          >
            <div
              className="relative w-full max-w-[340px] sm:max-w-[380px] rounded-2xl bg-card border border-border shadow-2xl p-4 sm:p-5 animate-rise flex flex-col max-h-[85vh] text-foreground"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-3 mb-2.5 border-b border-border/80">
                <div className="flex items-center gap-2">
                  <div
                    className="w-4 h-4 rounded-full border border-border shrink-0 shadow-xs"
                    style={{ backgroundColor: activeTheme.primaryPreview }}
                  />
                  <span className="text-sm font-bold text-foreground font-num">
                    Select Color Theme
                  </span>
                </div>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground bg-secondary/50 hover:bg-secondary cursor-pointer transition"
                  title="Close"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Themes List */}
              <div className="space-y-1.5 overflow-y-auto max-h-[58vh] pr-0.5">
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

              {/* Footer */}
              <div className="pt-3 mt-2 border-t border-border/80 flex items-center justify-between text-[11px] text-muted-foreground">
                <span>Theme saved automatically</span>
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="font-bold text-primary hover:underline cursor-pointer"
                >
                  Done
                </button>
              </div>
            </div>
          </div>,
          document.body
        )}
    </>
  );
};
