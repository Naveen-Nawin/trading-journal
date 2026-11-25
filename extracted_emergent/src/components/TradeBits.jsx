import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { api, fileUrl } from "@/lib/api";
import { formatDate, formatMoney, formatPips, formatR, sessionLabel } from "@/lib/format";
import { useJournal } from "@/context/JournalContext";
import { cn } from "@/lib/utils";

export function TradeDetail({ trade }) {
  const { setLightbox } = useJournal();
  const dateLabel = trade.closed_at ? `${formatDate(trade.opened_at)} → ${formatDate(trade.closed_at)}` : `Open since ${formatDate(trade.opened_at)}`;
  return (
    <div className="grid md:grid-cols-[1fr_220px] gap-4 py-1" data-testid={`trade-detail-${trade.id}`}>
      <div className="space-y-3">
        <div className="flex flex-wrap items-center gap-2 text-[11px] font-num">
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border">{sessionLabel(trade.session)}</span>
          <span className="px-2 py-0.5 rounded-md bg-secondary border border-border capitalize">{trade.emotion || "no emotion logged"}</span>
          {(trade.tags || []).map((t) => (
            <span key={t} className="px-2 py-0.5 rounded-md bg-accent/10 border border-accent/30 text-accent">{t}</span>
          ))}
          <span className={cn("px-2 py-0.5 rounded-md border", trade.followed_plan ? "bg-profit/10 border-profit/40 text-profit" : "bg-loss/10 border-loss/40 text-loss")}>
            {trade.followed_plan ? "✓ followed plan" : "✗ broke plan"}
          </span>
        </div>
        {trade.notes ? (
          <p className="text-xs text-muted-foreground leading-relaxed whitespace-pre-wrap">{trade.notes}</p>
        ) : (
          <p className="text-xs text-muted-foreground/60 italic">No notes on this trade.</p>
        )}
        <p className="text-[10px] text-muted-foreground/70 font-num">{dateLabel}</p>
      </div>
      <div>
        {trade.screenshot_path ? (
          <button
            data-testid={`trade-screenshot-${trade.id}`}
            onClick={() => setLightbox(trade.screenshot_path)}
            className="block w-full"
          >
            <img src={fileUrl(trade.screenshot_path)} alt="chart" className="w-full h-28 object-cover rounded-lg border border-border hover:border-primary/60 transition-colors" />
          </button>
        ) : (
          <div className="h-28 rounded-lg border border-dashed border-border flex items-center justify-center text-[10px] text-muted-foreground/60">
            No screenshot
          </div>
        )}
      </div>
    </div>
  );
}

export function PnlBadge({ trade, currency }) {
  const { currency: cur } = useJournal();
  const c = currency || cur;
  return (
    <span className={cn("font-num font-bold text-sm", trade.pnl > 0 ? "text-profit" : trade.pnl < 0 ? "text-loss" : "text-muted-foreground")}>
      {formatMoney(trade.pnl, c, { signed: true })}
    </span>
  );
}

export function DeleteTradeButton({ tradeId, children }) {
  const queryClient = useQueryClient();
  const mutation = useMutation({
    mutationFn: () => api.delete(`/trades/${tradeId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Trade deleted");
    },
    onError: () => toast.error("Delete failed"),
  });
  return children({ remove: mutation.mutate, removing: mutation.isPending });
}

export function CloseCell({ trade, currency }) {
  return (
    <span className={cn("font-num font-bold text-sm", trade.pnl > 0 ? "text-profit" : trade.pnl < 0 ? "text-loss" : "text-muted-foreground")}>
      {formatMoney(trade.pnl, currency, { signed: true })}
    </span>
  );
}

export const cellHelpers = { formatPips, formatR };
