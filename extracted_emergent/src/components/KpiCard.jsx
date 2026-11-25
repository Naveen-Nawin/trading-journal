import { cn } from "@/lib/utils";

export function KpiCard({ label, value, sub, accent = false, testid, delay = 0 }) {
  return (
    <div
      data-testid={testid}
      className={cn(
        "animate-rise rounded-xl border p-4 md:p-5 bg-card/70 backdrop-blur-sm transition-colors duration-200 hover:border-muted-foreground/30",
        accent ? "border-primary/30" : "border-border"
      )}
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">{label}</p>
      <p className={cn("font-num font-bold text-xl md:text-2xl mt-2 tracking-tight", accent && "glow-green text-profit")}>
        {value ?? "—"}
      </p>
      {sub && <p className="text-[11px] text-muted-foreground mt-1.5">{sub}</p>}
    </div>
  );
}

export function BreakdownBars({ title, rows, currency, testid, emptyText = "No data yet" }) {
  const max = Math.max(...rows.map((r) => Math.abs(r.pnl)), 1);
  return (
    <div data-testid={testid} className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 md:p-5">
      <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-4">{title}</p>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground py-6 text-center">{emptyText}</p>
      ) : (
        <div className="space-y-3.5">
          {rows.slice(0, 6).map((r) => (
            <div key={r.key}>
              <div className="flex items-center justify-between mb-1.5 gap-2">
                <span className="text-xs font-medium truncate font-num">{r.key}</span>
                <span className="text-xs flex items-center gap-2 shrink-0">
                  <span className="text-muted-foreground font-num">{r.trades}t · {r.win_rate}%w</span>
                  <span className={cn("font-num font-semibold", r.pnl >= 0 ? "text-profit" : "text-loss")}>
                    {r.pnl >= 0 ? "+" : "−"}
                    {currency === "INR" ? "₹" : "$"}
                    {Math.abs(currency === "INR" ? r.pnl * 83.25 : r.pnl).toLocaleString("en-US", { maximumFractionDigits: 0 })}
                  </span>
                </span>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-500", r.pnl >= 0 ? "bg-profit" : "bg-loss")}
                  style={{ width: `${Math.max((Math.abs(r.pnl) / max) * 100, 4)}%` }}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
