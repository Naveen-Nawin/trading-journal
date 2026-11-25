import React, { useState, useEffect, useRef } from 'react';
import { Quote, ChevronLeft, ChevronRight, Shuffle, Sparkles } from 'lucide-react';

export const TRADING_QUOTES = [
  {
    id: 1,
    quote: "Be fearful when others are greedy, and greedy when others are fearful.",
    author: "Warren Buffett",
    role: "Chairman & CEO, Berkshire Hathaway",
    tag: "Market Sentiment",
    gradient: "from-emerald-400 via-teal-300 to-cyan-400",
    glowColor: "rgba(18, 213, 134, 0.15)",
    borderHighlight: "border-emerald-500/30",
  },
  {
    id: 2,
    quote: "The goal of a successful trader is to make the best trades. Money is secondary.",
    author: "Dr. Alexander Elder",
    role: "Author of 'Trading for a Living'",
    tag: "Execution",
    gradient: "from-cyan-400 via-sky-300 to-blue-400",
    glowColor: "rgba(6, 182, 212, 0.15)",
    borderHighlight: "border-cyan-500/30",
  },
  {
    id: 3,
    quote: "It's not whether you're right or wrong, but how much money you make when you're right and how much you lose when you're wrong.",
    author: "George Soros",
    role: "Legendary Macro Investor & Quantum Fund Founder",
    tag: "Risk to Reward",
    gradient: "from-amber-300 via-yellow-400 to-orange-400",
    glowColor: "rgba(245, 158, 11, 0.15)",
    borderHighlight: "border-amber-500/30",
  },
  {
    id: 4,
    quote: "Amateurs think about how much money they can make. Professionals think about how much money they could lose.",
    author: "Mark Douglas",
    role: "Pioneer of Trading Psychology, Author of 'Trading in the Zone'",
    tag: "Psychology",
    gradient: "from-fuchsia-400 via-pink-400 to-rose-400",
    glowColor: "rgba(236, 72, 153, 0.15)",
    borderHighlight: "border-pink-500/30",
  },
  {
    id: 5,
    quote: "Don't focus on making money; focus on protecting what you have at all times.",
    author: "Paul Tudor Jones",
    role: "Billionaire Macro Trader & Founder, Tudor Investment",
    tag: "Capital Preservation",
    gradient: "from-emerald-300 via-green-400 to-teal-400",
    glowColor: "rgba(16, 185, 129, 0.15)",
    borderHighlight: "border-green-500/30",
  },
  {
    id: 6,
    quote: "The stock market is a device for transferring money from the impatient to the patient.",
    author: "Warren Buffett",
    role: "The Oracle of Omaha",
    tag: "Patience",
    gradient: "from-amber-200 via-amber-400 to-yellow-500",
    glowColor: "rgba(245, 158, 11, 0.15)",
    borderHighlight: "border-amber-500/30",
  },
  {
    id: 7,
    quote: "The elements of good trading are: 1. Cutting losses, 2. Cutting losses, and 3. Cutting losses. If you can follow these three rules, you may have a chance.",
    author: "Ed Seykota",
    role: "Market Wizard & Pioneer of Computerized Trend Following",
    tag: "Discipline",
    gradient: "from-rose-400 via-pink-400 to-red-400",
    glowColor: "rgba(244, 63, 94, 0.15)",
    borderHighlight: "border-rose-500/30",
  },
  {
    id: 8,
    quote: "Accepting the risk means accepting the consequences of your trades without emotional discomfort or fear.",
    author: "Mark Douglas",
    role: "Author of 'The Disciplined Trader'",
    tag: "Emotion Control",
    gradient: "from-violet-400 via-purple-300 to-indigo-400",
    glowColor: "rgba(139, 92, 246, 0.15)",
    borderHighlight: "border-purple-500/30",
  },
  {
    id: 9,
    quote: "Cut your losses short and let your winners run. The market is never wrong; opinions frequently are.",
    author: "Jesse Livermore",
    role: "Legendary Pioneer of Modern Trading",
    tag: "Edge",
    gradient: "from-teal-300 via-cyan-400 to-emerald-400",
    glowColor: "rgba(20, 184, 166, 0.15)",
    borderHighlight: "border-teal-500/30",
  },
  {
    id: 10,
    quote: "The big money is not in the buying and the selling, but in the waiting.",
    author: "Charlie Munger",
    role: "Vice Chairman, Berkshire Hathaway",
    tag: "Mindset",
    gradient: "from-sky-300 via-cyan-400 to-teal-300",
    glowColor: "rgba(56, 189, 248, 0.15)",
    borderHighlight: "border-sky-500/30",
  },
  {
    id: 11,
    quote: "Learn to take losses. The most important thing in making money is not letting your losses get out of hand.",
    author: "Marty Schwartz",
    role: "U.S. Investing Champion & Author of 'Pit Bull'",
    tag: "Risk Management",
    gradient: "from-amber-300 via-orange-400 to-red-400",
    glowColor: "rgba(249, 115, 22, 0.15)",
    borderHighlight: "border-orange-500/30",
  },
  {
    id: 12,
    quote: "Pain plus reflection equals progress. If you are not learning from every loss, you are paying the market tuition for nothing.",
    author: "Ray Dalio",
    role: "Founder, Bridgewater Associates & Author of 'Principles'",
    tag: "Continuous Growth",
    gradient: "from-purple-400 via-violet-300 to-blue-400",
    glowColor: "rgba(168, 85, 247, 0.15)",
    borderHighlight: "border-purple-500/30",
  },
];

export const RotatingQuotesBanner = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const [fadeKey, setFadeKey] = useState(0);
  const progressRef = useRef(null);

  const ROTATION_INTERVAL = 7000; // 7 seconds per quote

  const currentQuote = TRADING_QUOTES[currentIndex];

  // Auto-rotate every 7s
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      handleNext();
    }, ROTATION_INTERVAL);

    return () => clearInterval(timer);
  }, [currentIndex, isPaused]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % TRADING_QUOTES.length);
    setFadeKey((k) => k + 1);
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + TRADING_QUOTES.length) % TRADING_QUOTES.length);
    setFadeKey((k) => k + 1);
  };

  const handleShuffle = () => {
    let nextIdx = Math.floor(Math.random() * TRADING_QUOTES.length);
    if (nextIdx === currentIndex) {
      nextIdx = (currentIndex + 1) % TRADING_QUOTES.length;
    }
    setCurrentIndex(nextIdx);
    setFadeKey((k) => k + 1);
  };

  return (
    <div
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      className={`relative w-full rounded-2xl border ${currentQuote.borderHighlight} bg-card/85 backdrop-blur-md p-4 sm:p-5 shadow-lg transition-all duration-500 overflow-hidden group`}
      style={{
        boxShadow: `0 8px 30px ${currentQuote.glowColor}`,
      }}
    >
      {/* Top Background Glow Ambient Light */}
      <div
        className="absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl pointer-events-none opacity-20 transition-all duration-700"
        style={{ backgroundColor: currentQuote.glowColor }}
      />

      <div className="relative z-10 flex flex-col gap-3">
        {/* Top Header Row: Category Badge, Quote Icon, Controls */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 rounded-lg bg-secondary/80 border border-border text-foreground flex items-center justify-center shrink-0 shadow-xs">
              <Quote className="w-3.5 h-3.5 text-primary rotate-180" />
            </div>
            <span className="text-[10px] sm:text-xs font-mono font-bold tracking-wider uppercase px-2 py-0.5 rounded-md bg-secondary border border-border/80 text-muted-foreground truncate">
              {currentQuote.tag}
            </span>
            <span className="hidden sm:inline-flex items-center gap-1 text-[11px] text-muted-foreground">
              <Sparkles className="w-3 h-3 text-amber-400" />
              <span>Trader Wisdom</span>
            </span>
          </div>

          {/* Action buttons (Prev, Next, Shuffle) */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              type="button"
              onClick={handleShuffle}
              className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/70 transition cursor-pointer"
              title="Shuffle Quote"
              aria-label="Shuffle Quote"
            >
              <Shuffle className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handlePrev}
              className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/70 transition cursor-pointer"
              title="Previous Quote"
              aria-label="Previous Quote"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleNext}
              className="p-1.5 rounded-lg bg-secondary/50 hover:bg-secondary text-muted-foreground hover:text-foreground border border-border/70 transition cursor-pointer"
              title="Next Quote"
              aria-label="Next Quote"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* The Quote Colorful Animated Text */}
        <div
          key={fadeKey}
          className="min-h-[64px] sm:min-h-[56px] flex flex-col justify-center animate-rise"
        >
          <blockquote className="text-sm sm:text-base md:text-lg font-bold tracking-tight leading-relaxed">
            <span
              className={`bg-gradient-to-r ${currentQuote.gradient} bg-clip-text text-transparent font-sans`}
              style={{
                textShadow: '0 0 35px rgba(255,255,255,0.06)',
              }}
            >
              “{currentQuote.quote}”
            </span>
          </blockquote>
        </div>

        {/* Person / Author Bio Row */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-border/60">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <span className="w-2 h-2 rounded-full bg-primary shrink-0 live-dot shadow-xs" />
            <div className="min-w-0 flex-1 flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs sm:text-sm font-bold text-foreground font-num tracking-tight truncate">
                — {currentQuote.author}
              </span>
              <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                ({currentQuote.role})
              </span>
            </div>
          </div>

          {/* Quote index counter (e.g. 1/12) */}
          <div className="text-[10px] font-mono font-bold text-muted-foreground shrink-0 px-2 py-0.5 rounded bg-secondary/60 border border-border/60">
            {currentIndex + 1} / {TRADING_QUOTES.length}
          </div>
        </div>

        {/* Auto-rotation Progress Bar */}
        <div className="w-full bg-secondary/50 rounded-full h-1 overflow-hidden mt-0.5">
          <div
            key={`bar-${fadeKey}-${isPaused}`}
            className={`h-full bg-gradient-to-r ${currentQuote.gradient} rounded-full`}
            style={{
              animation: isPaused
                ? 'none'
                : `quotesProgress ${ROTATION_INTERVAL}ms linear infinite`,
              width: isPaused ? '100%' : undefined,
            }}
          />
        </div>
      </div>

      {/* Embedded CSS animation for progress bar */}
      <style>{`
        @keyframes quotesProgress {
          0% { width: 0%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};
