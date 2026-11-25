import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { formatMoney } from "@/lib/format";

function DarkTooltip({ active, payload, currency }) {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div className="rounded-lg border border-border bg-popover px-3 py-2 shadow-xl" data-testid="equity-tooltip">
      <p className="text-[10px] text-muted-foreground font-num mb-1">{d.date}</p>
      <p className={`font-num font-bold text-sm ${d.cum_pnl >= 0 ? "text-profit" : "text-loss"}`}>
        {formatMoney(d.cum_pnl, currency, { signed: true })}
      </p>
    </div>
  );
}

export default function EquityCurve({ data, currency }) {
  return (
    <div data-testid="equity-curve" className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-4 md:p-5">
      <div className="flex items-center justify-between mb-4">
        <p className="text-[10px] md:text-[11px] uppercase tracking-[0.16em] text-muted-foreground">Equity Curve</p>
        <p className="text-[10px] text-muted-foreground">cumulative P&L · closed trades</p>
      </div>
      {data.length < 2 ? (
        <div className="h-56 flex items-center justify-center text-xs text-muted-foreground">
          Close at least two trades to draw your equity curve.
        </div>
      ) : (
        <div className="h-56 md:h-64">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 6, right: 6, bottom: 0, left: 6 }}>
              <defs>
                <linearGradient id="eqGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="hsl(160 84% 45%)" stopOpacity={0.32} />
                  <stop offset="100%" stopColor="hsl(160 84% 45%)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <ReferenceLine y={0} stroke="hsl(217 22% 24%)" strokeDasharray="4 4" />
              <XAxis dataKey="date" tickFormatter={(v) => (v || "").slice(5)} tickLine={false} axisLine={false} minTickGap={40} />
              <YAxis tickLine={false} axisLine={false} width={54} tickFormatter={(v) => `${v >= 0 ? "" : "−"}${currency === "INR" ? "₹" : "$"}${Math.abs(v / 1000).toFixed(1)}k`} />
              <Tooltip content={<DarkTooltip currency={currency} />} />
              <Area type="monotone" dataKey="cum_pnl" stroke="hsl(160 84% 45%)" strokeWidth={2.2} fill="url(#eqGrad)" dot={false} activeDot={{ r: 4, fill: "hsl(160 84% 45%)" }} animationDuration={700} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}
