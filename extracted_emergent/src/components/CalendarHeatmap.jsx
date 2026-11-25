import { useMemo, useState } from "react";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { TradeDetail, PnlBadge } from "@/components/TradeBits";

const DOW = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

function monthLabel(y, m) {
  return new Date(y, m, 1).toLocaleDateString("en-GB", { month: "long", year: "numeric" });
}

export default function CalendarHeatmap({ byDay, trades, currency, testid = "calendar-heatmap" }) {
  const now = new Date();
  const [ym, setYm] = useState(() => {
    const keys = Object.keys(byDay || {}).sort();
    const curPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
    const hasCurrent = keys.some((k) => k.startsWith(curPrefix));
    const src = keys.length && !hasCurrent ? keys[keys.length - 1] : null;
    if (src) {
      const [y, m] = src.split("-").map(Number);
      return { y, m: m - 1 };
    }
    return { y: now.getFullYear(), m: now.getMonth() };
  });
  const [dayOpen, setDayOpen] = useState(null);

  const { cells, monthTotal, maxAbs } = useMemo(() => {
    const first = new Date(ym.y, ym.m, 1);
    const daysInMonth = new Date(ym.y, ym.m + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7; // Monday start
    const list = [];
    for (let i = 0; i < offset; i++) list.push(null);
    for (let d = 1; d <= daysInMonth; d++) {
      const date = `${ym.y}-${String(ym.m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      list.push({ date, day: d, ...(byDay?.[date] || { pnl: null, count: 0 }) });
    }
    const entries = Object.entries(byDay || {}).filter(([k]) => k.startsWith(`${ym.y}-${String(ym.m + 1).padStart(2, "0")}`));
    const total = entries.reduce((s, [, v]) => s + v.pnl, 0);
    const mAbs = Math.max(...entries.map(([, v]) => Math.abs(v.pnl)), 1);
    return { cells: list, monthTotal: total, maxAbs: mAbs };
  }, [ym, byDay]);

  const dayTrades = (date) => (trades || []).filter((t) => (t.closed_at || t.opened_at) === date);

  return (
    <div data-testid={testid} className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <button
          data-testid="calendar-prev" onClick={() => setYm(({ y, m }) => (m === 0 ? { y: y - 1, m: 11 } : { y, m: m - 1 }))}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors" aria-label="Previous month"
        >
          <ChevronLeft size={16} />
        </button>
        <div className="text-center">
          <p className="text-sm font-semibold font-num">{monthLabel(ym.y, ym.m)}</p>
          {monthTotal !== 0 && (
            <p className={cn("text-xs font-num", monthTotal > 0 ? "text-profit" : "text-loss")}>
              {formatMoney(monthTotal, currency, { signed: true })} this month
            </p>
          )}
        </div>
        <button
          data-testid="calendar-next" onClick={() => setYm(({ y, m }) => (m === 11 ? { y: y + 1, m: 0 } : { y, m: m + 1 }))}
          className="p-1.5 rounded-md hover:bg-secondary transition-colors" aria-label="Next month"
        >
          <ChevronRight size={16} />
        </button>
      </div>

      <div className="grid grid-cols-7 gap-1.5 mb-1.5">
        {DOW.map((d) => (
          <p key={d} className="text-center text-[10px] uppercase tracking-wider text-muted-foreground/70">{d}</p>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {cells.map((c, i) =>
          c === null ? (
            <div key={`x${i}`} />
          ) : (
            <button
              key={c.date}
              data-testid={`calendar-day-${c.date}`}
              onClick={() => c.count > 0 && setDayOpen(c.date)}
              disabled={c.count === 0}
              className={cn(
                "aspect-square min-h-[52px] rounded-lg border p-1.5 flex flex-col justify-between transition-all duration-150 text-left",
                c.count === 0
                  ? "border-border/50 bg-secondary/30 text-muted-foreground/50"
                  : c.pnl >= 0
                  ? "border-profit/40 text-foreground hover:border-profit"
                  : "border-loss/40 text-foreground hover:border-loss",
                c.count > 0 && "cursor-pointer"
              )}
              style={
                c.count > 0
                  ? { backgroundColor: `hsl(${c.pnl >= 0 ? 160 : 0} 70% 30% / ${0.12 + (Math.abs(c.pnl) / maxAbs) * 0.38})` }
                  : undefined
              }
            >
              <span className="text-[10px] font-num text-muted-foreground">{c.day}</span>
              {c.count > 0 && (
                <>
                  <span className={cn("text-[10px] md:text-[11px] font-num font-bold leading-none", c.pnl >= 0 ? "text-profit" : "text-loss")}>
                    {formatMoney(c.pnl, currency, { signed: true, compact: true })}
                  </span>
                  <span className="text-[9px] text-muted-foreground font-num">{c.count}t</span>
                </>
              )}
            </button>
          )
        )}
      </div>

      <Dialog open={!!dayOpen} onOpenChange={(o) => !o && setDayOpen(null)}>
        <DialogContent className="max-w-md max-h-[85vh] overflow-y-auto" data-testid="day-trades-dialog">
          <DialogHeader>
            <DialogTitle className="font-num">Trades on {dayOpen}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {dayOpen &&
              dayTrades(dayOpen).map((t) => (
                <div key={t.id} className="rounded-lg border border-border p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-num font-semibold text-sm">
                      {t.pair} <span className={t.direction === "buy" ? "text-profit" : "text-loss"}>{t.direction.toUpperCase()}</span> · {t.lots} lots
                    </span>
                    <PnlBadge trade={t} currency={currency} />
                  </div>
                  <TradeDetail trade={t} />
                </div>
              ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
