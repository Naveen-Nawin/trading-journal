import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { useJournal } from "@/context/JournalContext";
import { formatMoney, pnlClass, formatDate, formatR, formatPips } from "@/lib/format";
import { KpiCard, BreakdownBars } from "@/components/KpiCard";
import EquityCurve from "@/components/EquityCurve";
import CalendarHeatmap from "@/components/CalendarHeatmap";
import { Button } from "@/components/ui/button";
import { Sparkles, Plus } from "lucide-react";
import { toast } from "sonner";

function EmptyState() {
  const { openTradeForm } = useJournal();
  const queryClient = useQueryClient();
  const seed = useMutation({
    mutationFn: () => api.post("/seed"),
    onSuccess: ({ data }) => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(data.seeded ? "Sample trades loaded — explore freely" : "You already have trades");
    },
  });
  return (
    <div className="animate-rise rounded-2xl border border-border bg-card/70 p-10 md:p-14 text-center">
      <div className="w-14 h-14 mx-auto rounded-xl bg-primary/15 border border-primary/40 flex items-center justify-center mb-5">
        <Sparkles size={22} className="text-primary" />
      </div>
      <h2 className="text-xl font-bold font-num tracking-tight">Your journal is empty</h2>
      <p className="text-sm text-muted-foreground mt-2 max-w-sm mx-auto leading-relaxed">
        Log your first forex trade — pair, entry, exit, emotion and screenshot — and watch your edge build up here.
      </p>
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 mt-6">
        <Button data-testid="log-first-trade-btn" onClick={() => openTradeForm(null)}>
          <Plus size={15} className="mr-1.5" /> Log first trade
        </Button>
        <Button variant="outline" data-testid="seed-sample-btn" onClick={() => seed.mutate()} disabled={seed.isPending}>
          Load sample trades
        </Button>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { currency } = useJournal();
  const { data: stats, isLoading } = useQuery({ queryKey: ["stats"], queryFn: async () => (await api.get("/stats")).data });
  const { data: trades } = useQuery({ queryKey: ["trades"], queryFn: async () => (await api.get("/trades")).data });

  if (isLoading) {
    return <div className="h-64 flex items-center justify-center text-sm text-muted-foreground" data-testid="dashboard-loading">Loading your edge…</div>;
  }
  if (!stats || stats.kpis.total_closed + stats.kpis.open_count === 0) return <EmptyState />;

  const k = stats.kpis;
  const pfLabel = k.profit_factor == null ? "∞" : k.profit_factor.toFixed(2);

  return (
    <div className="space-y-5 md:space-y-6">
      <div className="animate-rise">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">
          {new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight">
          Trading <span className="text-profit glow-green">Performance</span>
        </h1>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <KpiCard label="Net P&L" value={formatMoney(k.net_pnl, currency, { signed: true })} accent testid="kpi-net-pnl" delay={0}
          sub={`${k.total_closed} closed · ${k.open_count} open`} />
        <KpiCard label="Win Rate" value={k.win_rate != null ? `${k.win_rate}%` : null} testid="kpi-win-rate" delay={60}
          sub={k.avg_win != null ? `avg win ${formatMoney(k.avg_win, currency)}` : undefined} />
        <KpiCard label="Profit Factor" value={pfLabel} testid="kpi-profit-factor" delay={120}
          sub={k.avg_loss != null ? `avg loss ${formatMoney(k.avg_loss, currency)}` : undefined} />
        <KpiCard label="Avg R Multiple" value={k.avg_r != null ? `${k.avg_r > 0 ? "+" : ""}${k.avg_r}R` : null} testid="kpi-avg-r" delay={180}
          sub={k.plan_compliance != null ? `plan followed ${k.plan_compliance}%` : undefined} />
      </div>

      <div className="grid md:grid-cols-[2fr_1fr] gap-3 md:gap-4">
        <EquityCurve data={stats.equity_curve} currency={currency} />
        <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 md:p-5 space-y-4">
          <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Journal Pulse</p>
          {[
            ["Best trade", formatMoney(k.best, currency, { signed: true }), k.best > 0 ? "text-profit" : "text-loss"],
            ["Worst trade", formatMoney(k.worst, currency, { signed: true }), k.worst > 0 ? "text-profit" : "text-loss"],
            ["Gross profit", formatMoney(k.gross_profit, currency), "text-profit"],
            ["Gross loss", formatMoney(k.gross_loss, currency), "text-loss"],
            ["Max drawdown", formatMoney(stats.max_drawdown, currency, { signed: true }), "text-loss"],
          ].map(([label, val, cls]) => (
            <div key={label} className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground text-xs">{label}</span>
              <span className={`font-num font-semibold ${cls}`} data-testid={`pulse-${label.toLowerCase().replace(/\s+/g, "-")}`}>{val}</span>
            </div>
          ))}
        </div>
      </div>

      <CalendarHeatmap byDay={stats.by_day} trades={trades} currency={currency} />

      <div className="grid md:grid-cols-3 gap-3 md:gap-4">
        <BreakdownBars title="By Pair" rows={stats.by_pair} currency={currency} testid="breakdown-pair" />
        <BreakdownBars title="By Session" rows={stats.by_session} currency={currency} testid="breakdown-session" />
        <BreakdownBars title="By Setup Tag" rows={stats.by_tag} currency={currency} testid="breakdown-tag" />
      </div>
    </div>
  );
}
