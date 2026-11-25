import { useQuery } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useJournal } from "@/context/JournalContext";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import { formatMoney } from "@/lib/format";

export default function CalendarPage() {
  const { currency } = useJournal();
  const { data: stats, isLoading } = useQuery({ queryKey: ["stats"], queryFn: async () => (await api.get("/stats")).data });
  const { data: trades } = useQuery({ queryKey: ["trades"], queryFn: async () => (await api.get("/trades")).data });

  return (
    <div className="space-y-5">
      <div className="animate-rise">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Month at a glance</p>
        <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight">
          Daily <span className="text-accent">P&L Calendar</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2">
          Green days build your edge, red days teach you something. Tap any day to review its trades.
        </p>
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground" data-testid="calendar-loading">Loading calendar…</div>
      ) : (
        <div className="max-w-2xl">
          <CalendarHeatmap byDay={stats?.by_day || {}} trades={trades} currency={currency} testid="calendar-page-heatmap" />
        </div>
      )}

      {stats && stats.kpis.total_closed > 0 && (
        <div className="grid grid-cols-3 gap-3 max-w-2xl">
          {[
            ["Trading days", stats.equity_curve.length],
            ["Best day", formatMoney(Math.max(...Object.values(stats.by_day).map((d) => d.pnl)), currency, { signed: true })],
            ["Worst day", formatMoney(Math.min(...Object.values(stats.by_day).map((d) => d.pnl)), currency, { signed: true })],
          ].map(([label, val], i) => (
            <div key={label} className="rounded-xl border border-border bg-card/70 p-3.5 animate-rise" style={{ animationDelay: `${i * 60}ms` }} data-testid={`calendar-stat-${label.toLowerCase().replace(/\s+/g, "-")}`}>
              <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground">{label}</p>
              <p className="font-num font-bold text-base md:text-lg mt-1.5">{val}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
