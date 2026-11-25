import { useEffect, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/lib/api";
import { useJournal } from "@/context/JournalContext";
import { Loader2 } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

export default function CloseTradeDialog() {
  const { closeDialog, closeCloseForm } = useJournal();
  const trade = closeDialog.trade;
  const [exitPrice, setExitPrice] = useState("");
  const [pnl, setPnl] = useState("");
  const [closedAt, setClosedAt] = useState(today());
  const [saving, setSaving] = useState(false);
  const queryClient = useQueryClient();

  useEffect(() => {
    if (closeDialog.open) {
      setExitPrice("");
      setPnl("");
      setClosedAt(today());
      setSaving(false);
    }
  }, [closeDialog.open]);

  const save = async () => {
    if (pnl === "") {
      toast.error("Enter the realized P&L (USD)");
      return;
    }
    setSaving(true);
    try {
      await api.post(`/trades/${trade.id}/close`, {
        exit_price: exitPrice === "" ? null : Number(exitPrice),
        pnl: Number(pnl),
        closed_at: closedAt || today(),
      });
      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success("Trade closed — logged to your stats");
      closeCloseForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not close trade");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={closeDialog.open} onOpenChange={(o) => !o && closeCloseForm()}>
      <DialogContent className="max-w-sm" data-testid="close-trade-dialog">
        <DialogHeader>
          <DialogTitle className="font-num">Close {trade?.pair}</DialogTitle>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label>Exit price</Label>
            <Input data-testid="close-exit-input" type="number" step="any" value={exitPrice} onChange={(e) => setExitPrice(e.target.value)} className="font-num" placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Realized P&L (USD)</Label>
            <Input data-testid="close-pnl-input" type="number" step="any" value={pnl} onChange={(e) => setPnl(e.target.value)} className="font-num" placeholder="e.g. 145.50 or -80" />
          </div>
          <div className="space-y-1.5">
            <Label>Close date</Label>
            <Input data-testid="close-date-input" type="date" value={closedAt} onChange={(e) => setClosedAt(e.target.value)} className="font-num" />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" data-testid="close-trade-cancel" onClick={closeCloseForm}>Cancel</Button>
            <Button data-testid="close-trade-save" onClick={save} disabled={saving}>
              {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
              Close trade
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
