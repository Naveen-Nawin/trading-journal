import { useEffect } from "react";
import { NavLink, useLocation } from "react-router-dom";
import { LayoutDashboard, NotebookPen, CalendarRange, ClipboardCheck, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { useJournal } from "@/context/JournalContext";
import { cn } from "@/lib/utils";
import TradeDialog from "@/components/TradeDialog";
import CloseTradeDialog from "@/components/CloseTradeDialog";
import LightboxDialog from "@/components/LightboxDialog";
import { Toaster } from "@/components/ui/sonner";

const NAV = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard, testid: "nav-dashboard" },
  { to: "/trades", label: "Trades", icon: NotebookPen, testid: "nav-trades" },
  { to: "/calendar", label: "Calendar", icon: CalendarRange, testid: "nav-calendar" },
  { to: "/plan", label: "Trading Plan", icon: ClipboardCheck, testid: "nav-plan" },
];

function Sidebar() {
  const { currency, setCurrency } = useJournal();
  return (
    <aside
      data-testid="sidebar"
      className="hidden md:flex fixed inset-y-0 left-0 w-56 flex-col border-r border-border bg-card/60 backdrop-blur-xl z-40"
    >
      <div className="px-5 pt-6 pb-5 border-b border-border/70">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
              <path d="M3 17.5 8 11l4 3.5L21 5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 5H21v5.5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <div>
            <p className="font-num font-bold text-[15px] tracking-tight leading-none">PIPDESK</p>
            <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">Forex Journal</p>
          </div>
        </div>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV.map(({ to, label, icon: Icon, testid }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            data-testid={testid}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200",
                isActive
                  ? "bg-primary/12 text-primary border border-primary/25"
                  : "text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent"
              )
            }
          >
            <Icon size={17} strokeWidth={2} />
            {label}
          </NavLink>
        ))}
      </nav>

      <div className="px-5 py-4 border-t border-border/70 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[11px] font-num">
            <span className={cn(currency === "USD" ? "text-foreground font-semibold" : "text-muted-foreground")}>USD</span>
            <Switch
              data-testid="currency-toggle"
              checked={currency === "INR"}
              onCheckedChange={(v) => setCurrency(v ? "INR" : "USD")}
              className="scale-75"
            />
            <span className={cn(currency === "INR" ? "text-foreground font-semibold" : "text-muted-foreground")}>INR</span>
          </div>
        </div>
        <p className="text-[10px] text-muted-foreground leading-relaxed">
          <span className="live-dot text-profit">●</span> Journal live — every trade logged here sharpens your edge.
        </p>
      </div>
    </aside>
  );
}

function MobileHeader() {
  const { openTradeForm } = useJournal();
  return (
    <header className="md:hidden sticky top-0 z-40 flex items-center justify-between px-4 py-3 border-b border-border bg-card/90 backdrop-blur-xl">
      <p className="font-num font-bold tracking-tight">PIPDESK</p>
      <div className="flex items-center gap-2">
        <MobileCurrencyToggle />
        <Button size="sm" data-testid="log-trade-btn-mobile" onClick={() => openTradeForm(null)}>
          <Plus size={14} className="mr-1" /> Log
        </Button>
      </div>
    </header>
  );
}

function MobileCurrencyToggle() {
  const { currency, setCurrency } = useJournal();
  return (
    <button
      data-testid="currency-toggle-mobile"
      onClick={() => setCurrency(currency === "USD" ? "INR" : "USD")}
      className="font-num text-[11px] font-semibold px-2.5 py-1.5 rounded-md border border-border bg-secondary hover:bg-muted transition-colors"
    >
      {currency === "USD" ? "$ USD" : "₹ INR"}
    </button>
  );
}

export default function Layout({ children }) {
  const { openTradeForm } = useJournal();
  const location = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location.pathname]);

  return (
    <div className="min-h-screen terminal-grid">
      <Sidebar />
      <MobileHeader />
      <div className="md:pl-56">
        <main className="max-w-6xl mx-auto px-4 md:px-8 py-6 md:py-10">{children}</main>
      </div>

      {/* desktop floating log button */}
      <Button
        data-testid="log-trade-btn"
        onClick={() => openTradeForm(null)}
        className="hidden md:flex fixed bottom-7 right-8 z-40 h-12 px-5 shadow-lg shadow-primary/20 font-semibold"
      >
        <Plus size={16} className="mr-1.5" /> Log Trade
      </Button>

      <TradeDialog />
      <CloseTradeDialog />
      <LightboxDialog />
      <Toaster theme="dark" position="top-right" richColors />
    </div>
  );
}
