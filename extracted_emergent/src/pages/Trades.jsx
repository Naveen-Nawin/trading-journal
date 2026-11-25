import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api, fileUrl } from "@/lib/api";
import { useJournal } from "@/context/JournalContext";
import { formatMoney, formatR, formatPips, formatDate, sessionLabel, SESSIONS, PAIRS } from "@/lib/format";
import { TradeDetail, DeleteTradeButton } from "@/components/TradeBits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { downloadCsv, tradesToCsv, csvToTrades } from "@/lib/csv";
import { api as apiBase } from "@/lib/api";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ChevronDown, Pencil, X, Upload, Download, Eye, Trash2 } from "lucide-react";

function DirBadge({ t }) {
  return (
    <span className={cn("inline-block px-1.5 py-0.5 rounded text-[9px] font-num font-bold", t.direction === "buy" ? "bg-profit/15 text-profit" : "bg-loss/15 text-loss")}>
      {t.direction.toUpperCase()}
    </span>
  );
}

function RowActions({ t }) {
  const { openTradeForm, openCloseForm } = useJournal();
  return (
    <div className="flex items-center justify-end gap-1">
      {t.status === "open" && (
        <Button size="sm" variant="outline" data-testid={`trade-close-${t.id}`} onClick={() => openCloseForm(t)} className="h-7 px-2 text-[11px] font-num">
          Close
        </Button>
      )}
      <Button size="icon" variant="ghost" data-testid={`trade-edit-${t.id}`} onClick={() => openTradeForm(t)} className="h-7 w-7 text-muted-foreground hover:text-foreground">
        <Pencil size={13} />
      </Button>
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button size="icon" variant="ghost" data-testid={`trade-delete-${t.id}`} className="h-7 w-7 text-muted-foreground hover:text-loss">
            <Trash2 size={13} />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this trade?</AlertDialogTitle>
            <AlertDialogDescription>
              {t.pair} on {formatDate(t.opened_at)} will be removed from your journal and stats. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="delete-cancel">Keep it</AlertDialogCancel>
            <AlertDialogAction data-testid="delete-confirm" className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function TradeRow({ t, currency }) {
  const [expanded, setExpanded] = useState(false);
  const dateLabel = t.closed_at || t.opened_at;
  return (
    <>
      <tr data-testid={`trade-row-${t.id}`} className="border-b border-border/60 hover:bg-secondary/30 transition-colors duration-150">
        <td className="px-3 py-2.5">
          <button data-testid={`trade-expand-${t.id}`} onClick={() => setExpanded(!expanded)} className="text-muted-foreground hover:text-foreground mr-2 align-middle">
            <ChevronDown size={14} className={cn("transition-transform duration-200", expanded && "rotate-180")} />
          </button>
          <span className="font-num font-semibold text-[13px]">{t.pair}</span>
          <DirBadge t={t} />
        </td>
        <td className="px-3 py-2.5 font-num text-xs text-muted-foreground hidden md:table-cell">{sessionLabel(t.session)}</td>
        <td className="px-3 py-2.5 font-num text-xs hidden lg:table-cell">{t.lots}</td>
        <td className="px-3 py-2.5 font-num text-xs hidden lg:table-cell">{t.entry_price}{t.exit_price != null ? ` → ${t.exit_price}` : ""}</td>
        <td className="px-3 py-2.5 font-num text-xs hidden xl:table-cell">{formatR(t.r_multiple)}</td>
        <td className="px-3 py-2.5 font-num text-xs hidden xl:table-cell">{formatPips(t.pips)}</td>
        <td className="px-3 py-2.5 font-num text-xs">{formatDate(dateLabel)}</td>
        <td className="px-3 py-2.5">
          {t.status === "open" ? (
            <span className="font-num text-[11px] px-2 py-0.5 rounded-full border border-accent/50 text-accent">OPEN</span>
          ) : (
            <span className={cn("font-num font-bold text-[13px]", t.pnl > 0 ? "text-profit" : t.pnl < 0 ? "text-loss" : "text-muted-foreground")}>
              {formatMoney(t.pnl, currency, { signed: true })}
            </span>
          )}
        </td>
        <td className="px-3 py-2.5 text-right"><RowActions t={t} /></td>
      </tr>
      {expanded && (
        <tr className="bg-secondary/20">
          <td colSpan={9} className="px-5 py-4 border-b border-border/60">
            <TradeDetail trade={t} />
          </td>
        </tr>
      )}
    </>
  );
}

function TradeCard({ t, currency }) {
  const { openTradeForm, openCloseForm } = useJournal();
  return (
    <div data-testid={`trade-card-${t.id}`} className="rounded-xl border border-border bg-card/70 p-3.5 space-y-2.5">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-num font-semibold text-sm">{t.pair}</span>
          <DirBadge t={t} />
          <span className="font-num text-[11px] text-muted-foreground">{t.lots} lots</span>
          {t.status === "open" && <span className="font-num text-[10px] px-1.5 py-0.5 rounded-full border border-accent/50 text-accent">OPEN</span>}
        </div>
        {t.status === "closed" && (
          <span className={cn("font-num font-bold text-sm", t.pnl > 0 ? "text-profit" : t.pnl < 0 ? "text-loss" : "text-muted-foreground")}>
            {formatMoney(t.pnl, currency, { signed: true })}
          </span>
        )}
      </div>
      <p className="font-num text-[11px] text-muted-foreground">
        {formatDate(t.opened_at)} · {sessionLabel(t.session)} · entry {t.entry_price}
        {t.exit_price != null ? ` → ${t.exit_price}` : ""} · {formatR(t.r_multiple)}
      </p>
      {t.notes && <p className="text-xs text-muted-foreground line-clamp-2">{t.notes}</p>}
      <div className="flex items-center justify-between pt-1">
        <div className="flex gap-1.5 flex-wrap">
          {(t.tags || []).slice(0, 3).map((tag) => (
            <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-num bg-accent/10 border border-accent/30 text-accent">{tag}</span>
          ))}
        </div>
        <div className="flex gap-1.5">
          {t.status === "open" && (
            <Button size="sm" variant="outline" data-testid={`trade-close-mobile-${t.id}`} onClick={() => openCloseForm(t)} className="h-7 px-2 text-[11px]">
              Close
            </Button>
          )}
          <Button size="icon" variant="ghost" data-testid={`trade-edit-mobile-${t.id}`} onClick={() => openTradeForm(t)} className="h-7 w-7">
            <Pencil size={13} />
          </Button>
          <DeleteTradeButton tradeId={t.id}>
            {({ remove }) => (
              <Button size="icon" variant="ghost" data-testid={`trade-delete-mobile-${t.id}`} onClick={remove} className="h-7 w-7 text-muted-foreground hover:text-loss">
                <Trash2 size={13} />
              </Button>
            )}
          </DeleteTradeButton>
        </div>
      </div>
    </div>
  );
}

const STATUS_TABS = ["all", "open", "closed"];

export default function Trades() {
  const { currency, openTradeForm } = useJournal();
  const [status, setStatus] = useState("all");
  const [pair, setPair] = useState("any");
  const [session, setSession] = useState("any");
  const [month, setMonth] = useState("");
  const [search, setSearch] = useState("");

  const { data: trades, isLoading } = useQuery({
    queryKey: ["trades"],
    queryFn: async () => (await api.get("/trades")).data,
  });

  const filtered = useMemo(() => {
    return (trades || []).filter((t) => {
      if (status !== "all" && t.status !== status) return false;
      if (pair !== "any" && t.pair !== pair) return false;
      if (session !== "any" && t.session !== session) return false;
      if (month && !(t.opened_at.startsWith(month) || (t.closed_at || "").startsWith(month))) return false;
      if (search && !(t.notes || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [trades, status, pair, session, month, search]);

  const exportCsv = () => {
    if (!filtered.length) return toast.error("Nothing to export with these filters");
    downloadCsv(`pipdesk-trades-${new Date().toISOString().slice(0, 10)}.csv`, tradesToCsv(filtered));
    toast.success(`Exported ${filtered.length} trades`);
  };

  const importCsv = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const text = await file.text();
    const parsed = csvToTrades(text);
    if (!parsed.length) return toast.error("No valid rows found — check headers");
    let done = 0;
    for (const t of parsed) {
      try {
        await apiBase.post("/trades", t);
        done++;
      } catch {}
    }
    toast.success(`Imported ${done}/${parsed.length} trades`);
    e.target.value = "";
  };

  return (
    <div className="space-y-5">
      <div className="animate-rise flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Trade Log</p>
          <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight">Your <span className="text-accent">Trades</span></h1>
        </div>
        <div className="flex gap-2">
          <input type="file" accept=".csv" data-testid="csv-import-input" className="hidden" id="csv-import" onChange={importCsv} />
          <Button variant="outline" size="sm" data-testid="csv-import-btn" onClick={() => document.getElementById("csv-import").click()}>
            <Upload size={13} className="mr-1.5" /> Import CSV
          </Button>
          <Button variant="outline" size="sm" data-testid="csv-export-btn" onClick={exportCsv}>
            <Download size={13} className="mr-1.5" /> Export CSV
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2" data-testid="trades-filters">
        <div className="flex rounded-lg border border-border overflow-hidden">
          {STATUS_TABS.map((s) => (
            <button
              key={s}
              data-testid={`filter-status-${s}`}
              onClick={() => setStatus(s)}
              className={cn(
                "px-3.5 py-2 text-xs font-num capitalize transition-colors duration-150",
                status === s ? "bg-primary/15 text-primary" : "text-muted-foreground hover:text-foreground hover:bg-secondary"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Select value={pair} onValueChange={setPair}>
          <SelectTrigger data-testid="filter-pair" className="w-[130px] h-9 text-xs font-num"><SelectValue placeholder="Pair" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All pairs</SelectItem>
            {PAIRS.map((p) => <SelectItem key={p} value={p} className="font-num">{p}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={session} onValueChange={setSession}>
          <SelectTrigger data-testid="filter-session" className="w-[150px] h-9 text-xs"><SelectValue placeholder="Session" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="any">All sessions</SelectItem>
            {SESSIONS.map((s) => <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>)}
          </SelectContent>
        </Select>
        <Input type="month" data-testid="filter-month" value={month} onChange={(e) => setMonth(e.target.value)} className="w-[150px] h-9 text-xs font-num" />
        <Input
          data-testid="filter-search" value={search} onChange={(e) => setSearch(e.target.value)}
          placeholder="Search notes…" className="w-full sm:w-[160px] h-9 text-xs"
        />
        {month && (
          <Button variant="ghost" size="icon" data-testid="clear-month-filter" onClick={() => setMonth("")} className="h-9 w-9 text-muted-foreground">
            <X size={14} />
          </Button>
        )}
      </div>

      {isLoading ? (
        <div className="h-40 flex items-center justify-center text-sm text-muted-foreground" data-testid="trades-loading">Loading trades…</div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border py-14 text-center" data-testid="trades-empty">
          <p className="text-sm text-muted-foreground">No trades match these filters.</p>
          <Button variant="outline" size="sm" className="mt-4" onClick={() => openTradeForm(null)}>Log a trade</Button>
        </div>
      ) : (
        <>
          <div className="hidden md:block rounded-xl border border-border bg-card/70 overflow-hidden" data-testid="trades-table">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-secondary/40 text-left">
                  {["Pair", "Session", "Lots", "Entry → Exit", "R", "Pips", "Date", "P&L", ""].map((h, i) => (
                    <th key={i} className={cn("px-3 py-2.5 text-[10px] uppercase tracking-wider text-muted-foreground font-medium", h === "Session" && "hidden md:table-cell", ["Lots", "Entry → Exit"].includes(h) && "hidden lg:table-cell", ["R", "Pips"].includes(h) && "hidden xl:table-cell")}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map((t) => <TradeRow key={t.id} t={t} currency={currency} />)}
              </tbody>
            </table>
          </div>
          <div className="md:hidden space-y-3">
            {filtered.map((t) => <TradeCard key={t.id} t={t} currency={currency} />)}
          </div>
          <p className="text-[11px] text-muted-foreground font-num" data-testid="trades-count">
            {filtered.length} trade{filtered.length === 1 ? "" : "s"} · net {formatMoney(filtered.reduce((s, t) => s + (t.pnl || 0), 0), currency, { signed: true })}
          </p>
        </>
      )}
    </div>
  );
}
