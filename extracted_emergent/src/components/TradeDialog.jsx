import { useState, useRef, useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { api } from "@/lib/api";
import { PAIRS, SESSIONS, TAGS, EMOTIONS, sessionLabel } from "@/lib/format";
import { useJournal } from "@/context/JournalContext";
import { cn } from "@/lib/utils";
import { X, ImagePlus, Loader2 } from "lucide-react";

const today = () => new Date().toISOString().slice(0, 10);

const emptyForm = () => ({
  pair: "EURUSD",
  direction: "buy",
  lots: "0.50",
  entry_price: "",
  exit_price: "",
  stop_loss: "",
  take_profit: "",
  pnl: "",
  session: "london",
  tags: [],
  emotion: "calm",
  notes: "",
  followed_plan: false,
  opened_at: today(),
  closed_at: today(),
  isClosed: false,
});

const fromTrade = (t) => ({
  pair: t.pair,
  direction: t.direction,
  lots: String(t.lots ?? ""),
  entry_price: String(t.entry_price ?? ""),
  exit_price: t.exit_price != null ? String(t.exit_price) : "",
  stop_loss: t.stop_loss != null ? String(t.stop_loss) : "",
  take_profit: t.take_profit != null ? String(t.take_profit) : "",
  pnl: t.pnl != null ? String(t.pnl) : "",
  session: t.session,
  tags: t.tags || [],
  emotion: t.emotion || "",
  notes: t.notes || "",
  followed_plan: !!t.followed_plan,
  opened_at: t.opened_at,
  closed_at: t.closed_at || today(),
  isClosed: t.status === "closed",
});

export default function TradeDialog() {
  const { tradeDialog, closeTradeForm } = useJournal();
  const open = tradeDialog.open;
  const editing = tradeDialog.trade;

  const [form, setForm] = useState(emptyForm());
  const [customTag, setCustomTag] = useState("");
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileRef = useRef(null);
  const queryClient = useQueryClient();

  const { data: planData } = useQuery({ queryKey: ["plan"], enabled: open });

  useEffect(() => {
    if (open) {
      setForm(editing ? fromTrade(editing) : emptyForm());
      setFile(null);
      setPreview(editing?.screenshot_path || null);
      setSaving(false);
    }
  }, [open, editing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));
  const num = (v) => (v === "" || v == null ? null : Number(v));

  const toggleTag = (tag) =>
    set("tags", form.tags.includes(tag) ? form.tags.filter((t) => t !== tag) : [...form.tags, tag]);

  const pickFile = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setPreview(URL.createObjectURL(f));
  };

  const clearFile = () => {
    setFile(null);
    setPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  };

  const save = async () => {
    if (!form.pair.trim() || form.entry_price === "") {
      toast.error("Pair and entry price are required");
      return;
    }
    if (form.isClosed && form.pnl === "") {
      toast.error("Enter the P&L for a closed trade");
      return;
    }
    setSaving(true);
    try {
      let screenshot_path = editing?.screenshot_path || null;
      if (file) {
        const fd = new FormData();
        fd.append("file", file);
        const { data } = await api.post("/upload", fd);
        screenshot_path = data.path;
      } else if (preview === null) {
        screenshot_path = null;
      }

      const payload = {
        pair: form.pair.trim().toUpperCase(),
        direction: form.direction,
        lots: Number(form.lots) || 0.01,
        entry_price: Number(form.entry_price),
        exit_price: form.isClosed ? num(form.exit_price) : null,
        stop_loss: num(form.stop_loss),
        take_profit: num(form.take_profit),
        pnl: form.isClosed ? Number(form.pnl) : null,
        session: form.session,
        tags: form.tags,
        emotion: form.emotion || null,
        notes: form.notes,
        screenshot_path,
        followed_plan: form.followed_plan,
        opened_at: form.opened_at || today(),
        closed_at: form.isClosed ? form.closed_at || today() : null,
      };

      if (editing) await api.put(`/trades/${editing.id}`, payload);
      else await api.post("/trades", payload);

      queryClient.invalidateQueries({ queryKey: ["trades"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
      toast.success(editing ? "Trade updated" : "Trade logged — nice discipline");
      closeTradeForm();
    } catch (err) {
      toast.error(err.response?.data?.detail || "Could not save trade");
    } finally {
      setSaving(false);
    }
  };

  const tagPool = [...new Set([...TAGS, ...form.tags])];

  return (
    <Dialog open={open} onOpenChange={(o) => !o && closeTradeForm()}>
      <DialogContent className="max-w-2xl max-h-[92vh] overflow-y-auto" data-testid="trade-dialog">
        <DialogHeader>
          <DialogTitle className="font-num">{editing ? "Edit Trade" : "Log a Trade"}</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="col-span-2 md:col-span-1 space-y-1.5">
            <Label>Pair</Label>
            <Input
              data-testid="pair-input"
              list="pair-suggestions"
              value={form.pair}
              onChange={(e) => set("pair", e.target.value.toUpperCase())}
              placeholder="EURUSD"
              className="font-num uppercase"
            />
            <datalist id="pair-suggestions">
              {PAIRS.map((p) => (
                <option key={p} value={p} />
              ))}
            </datalist>
          </div>

          <div className="col-span-2 md:col-span-2 space-y-1.5">
            <Label>Direction</Label>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button" data-testid="direction-buy" variant="outline"
                className={cn("font-num", form.direction === "buy" ? "bg-profit/15 border-profit/60 text-profit" : "border-border text-muted-foreground")}
                onClick={() => set("direction", "buy")}
              >
                ▲ BUY
              </Button>
              <Button
                type="button" data-testid="direction-sell" variant="outline"
                className={cn("font-num", form.direction === "sell" ? "bg-loss/15 border-loss/60 text-loss" : "border-border text-muted-foreground")}
                onClick={() => set("direction", "sell")}
              >
                ▼ SELL
              </Button>
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Lots</Label>
            <Input data-testid="lots-input" type="number" step="0.01" min="0" value={form.lots} onChange={(e) => set("lots", e.target.value)} className="font-num" />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="space-y-1.5">
            <Label>Entry price</Label>
            <Input data-testid="entry-input" type="number" step="any" value={form.entry_price} onChange={(e) => set("entry_price", e.target.value)} className="font-num" placeholder="1.0850" />
          </div>
          <div className="space-y-1.5">
            <Label>Stop loss</Label>
            <Input data-testid="sl-input" type="number" step="any" value={form.stop_loss} onChange={(e) => set("stop_loss", e.target.value)} className="font-num" placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Take profit</Label>
            <Input data-testid="tp-input" type="number" step="any" value={form.take_profit} onChange={(e) => set("take_profit", e.target.value)} className="font-num" placeholder="optional" />
          </div>
          <div className="space-y-1.5">
            <Label>Session</Label>
            <Select value={form.session} onValueChange={(v) => set("session", v)}>
              <SelectTrigger data-testid="session-select"><SelectValue /></SelectTrigger>
              <SelectContent>
                {SESSIONS.map((s) => (
                  <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="rounded-lg border border-border p-3.5 space-y-3">
          <div className="flex items-center justify-between">
            <Label className="text-sm">Trade closed?</Label>
            <Switch data-testid="closed-switch" checked={form.isClosed} onCheckedChange={(v) => set("isClosed", v)} />
          </div>
          {form.isClosed && (
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label>Exit price</Label>
                <Input data-testid="exit-input" type="number" step="any" value={form.exit_price} onChange={(e) => set("exit_price", e.target.value)} className="font-num" placeholder="optional" />
              </div>
              <div className="space-y-1.5">
                <Label>P&L (USD)</Label>
                <Input data-testid="pnl-input" type="number" step="any" value={form.pnl} onChange={(e) => set("pnl", e.target.value)} className="font-num" placeholder="e.g. 145.50 or -80" />
              </div>
              <div className="space-y-1.5 col-span-2">
                <Label>Close date</Label>
                <Input data-testid="closed-at-input" type="date" value={form.closed_at} onChange={(e) => set("closed_at", e.target.value)} className="font-num" />
              </div>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Emotion at entry</Label>
            <Select value={form.emotion} onValueChange={(v) => set("emotion", v)}>
              <SelectTrigger data-testid="emotion-select"><SelectValue placeholder="Select" /></SelectTrigger>
              <SelectContent>
                {EMOTIONS.map((e) => (
                  <SelectItem key={e} value={e} className="capitalize">{e}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Open date</Label>
            <Input data-testid="opened-at-input" type="date" value={form.opened_at} onChange={(e) => set("opened_at", e.target.value)} className="font-num" />
          </div>
        </div>

        <div className="space-y-2">
          <Label>Setup tags</Label>
          <div className="flex flex-wrap gap-1.5" data-testid="tags-group">
            {tagPool.map((t) => (
              <button
                key={t} type="button" data-testid={`tag-chip-${t}`}
                onClick={() => toggleTag(t)}
                className={cn(
                  "px-2.5 py-1 rounded-full text-[11px] font-num border transition-colors duration-150",
                  form.tags.includes(t)
                    ? "bg-accent/15 border-accent/60 text-accent"
                    : "border-border text-muted-foreground hover:text-foreground hover:border-muted-foreground/40"
                )}
              >
                {t}
              </button>
            ))}
          </div>
          <Input
            data-testid="custom-tag-input"
            value={customTag}
            onChange={(e) => setCustomTag(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && customTag.trim()) {
                e.preventDefault();
                toggleTag(customTag.trim().toLowerCase());
                setCustomTag("");
              }
            }}
            placeholder="Type a custom tag + Enter"
            className="h-8 text-xs"
          />
        </div>

        <div className="space-y-1.5">
          <Label>Notes</Label>
          <Textarea
            data-testid="notes-input"
            value={form.notes}
            onChange={(e) => set("notes", e.target.value)}
            placeholder="Why did you take this trade? What did you see? What would you do differently?"
            rows={3}
          />
        </div>

        <div className="space-y-1.5">
          <Label>Chart screenshot</Label>
          {preview ? (
            <div className="relative w-fit">
              <img src={file ? preview : api.defaults.baseURL + "/files/" + preview} alt="preview" className="h-24 rounded-lg border border-border" />
              <button
                type="button" onClick={clearFile} data-testid="remove-screenshot-btn"
                className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-loss text-white flex items-center justify-center"
              >
                <X size={12} />
              </button>
            </div>
          ) : (
            <button
              type="button" data-testid="upload-screenshot-btn" onClick={() => fileRef.current?.click()}
              className="flex items-center gap-2 text-xs text-muted-foreground border border-dashed border-border rounded-lg px-4 py-3 w-full justify-center hover:border-primary/50 hover:text-foreground transition-colors"
            >
              <ImagePlus size={14} /> Attach a chart screenshot (PNG/JPG, max 8MB)
            </button>
          )}
          <input ref={fileRef} type="file" accept="image/*" data-testid="screenshot-input" className="hidden" onChange={pickFile} />
        </div>

        <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 px-3.5 py-3">
          <div>
            <Label className="text-sm" htmlFor="followed-plan">Followed my trading plan</Label>
            {planData?.rules?.length > 0 && (
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Plan: {planData.rules.filter((r) => r.active).length} active rules
              </p>
            )}
          </div>
          <Switch id="followed-plan" data-testid="followed-plan-switch" checked={form.followed_plan} onCheckedChange={(v) => set("followed_plan", v)} />
        </div>

        <div className="flex justify-end gap-2 pt-1">
          <Button variant="outline" data-testid="trade-dialog-cancel" onClick={closeTradeForm}>Cancel</Button>
          <Button data-testid="trade-dialog-save" onClick={save} disabled={saving}>
            {saving && <Loader2 size={14} className="mr-1.5 animate-spin" />}
            {editing ? "Save changes" : "Log trade"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
