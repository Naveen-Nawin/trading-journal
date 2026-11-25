import React, { useState } from 'react';
import { Menu, Plus, Lock, AlertTriangle } from 'lucide-react';
import { useTrading } from './context/TradingContext';
import { Sidebar } from './components/Sidebar';
import { DashboardView } from './components/Dashboard/DashboardView';
import { TradesView } from './components/Trades/TradesView';
import { CalendarView } from './components/Calendar/CalendarView';
import { TradingPlanView } from './components/TradingPlan/TradingPlanView';
import { LogTradeModal } from './components/Modals/LogTradeModal';
import { CloseTradeModal } from './components/Modals/CloseTradeModal';
import { EditTradeModal } from './components/Modals/EditTradeModal';
import { ConfirmDeleteModal } from './components/Modals/ConfirmDeleteModal';
import { DayTradesModal } from './components/Modals/DayTradesModal';
import { ImportExportModal } from './components/Modals/ImportExportModal';
import { ScanTradesModal } from './components/Modals/ScanTradesModal';
import { LightboxModal } from './components/Modals/LightboxModal';
import { DisciplineAlertModal } from './components/Modals/DisciplineAlertModal';
import { ThemeSelector } from './components/ThemeSelector';
import { AuthModal } from './components/Auth/AuthModal';
import { useAuth } from './context/AuthContext';

export function AppContent() {
  const {
    currentTab,
    setIsLogTradeOpen,
    currency,
    setCurrency,
    todayTradesCount,
    isDailyLocked,
    isDailyWarning,
    triggerDisciplineAlert,
  } = useTrading();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If verifying session on startup
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background terminal-grid text-foreground flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-primary/15 border border-primary/40 flex items-center justify-center shadow-[0_0_20px_rgba(18,213,134,0.3)] mb-4 animate-pulse">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
            <path d="M3 17.5 8 11l4 3.5L21 5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M15.5 5H21v5.5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <div className="text-foreground font-num font-bold text-base mb-1 tracking-tight">PIPDESK</div>
        <div className="text-xs text-profit font-num animate-pulse">Connecting to secure database...</div>
      </div>
    );
  }

  // Gate: When opening the website without being logged in, pop up the login page directly!
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-background terminal-grid text-foreground flex flex-col items-center justify-center p-4 relative selection:bg-primary/25">
        <AuthModal isGate={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background terminal-grid text-foreground flex flex-col lg:flex-row relative selection:bg-primary/25">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-3.5 bg-card/90 border-b border-border sticky top-0 z-30 backdrop-blur-xl">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
              <path d="M3 17.5 8 11l4 3.5L21 5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15.5 5H21v5.5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <span className="font-num font-bold tracking-tight text-sm text-foreground">PIPDESK</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Theme Selector */}
          <ThemeSelector compact={true} />

          {/* Daily Trades Counter Badge */}
          {todayTradesCount > 0 && (
            <button
              onClick={() => {
                if (isDailyLocked) triggerDisciplineAlert('lock', todayTradesCount);
                else if (isDailyWarning) triggerDisciplineAlert('warning', todayTradesCount);
              }}
              className={`px-2 py-1 rounded-lg text-[11px] font-num font-bold flex items-center gap-1 cursor-pointer transition ${
                isDailyLocked
                  ? 'bg-loss/20 text-loss border border-loss/40'
                  : isDailyWarning
                  ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 animate-pulse'
                  : 'bg-secondary/60 text-muted-foreground border border-border'
              }`}
              title="Daily Trades Counter (Max 5)"
            >
              {isDailyLocked ? <Lock className="w-3 h-3" /> : isDailyWarning ? <AlertTriangle className="w-3 h-3" /> : null}
              <span>{todayTradesCount}/5</span>
            </button>
          )}

          {/* Quick Currency Toggle */}
          <button
            onClick={() => setCurrency(currency === 'USD' ? 'INR' : 'USD')}
            className="px-2 py-1 rounded-lg bg-secondary/60 border border-border text-[11px] font-num text-foreground flex items-center gap-1 cursor-pointer"
            title="Switch Currency"
          >
            <span>{currency === 'USD' ? '$' : '₹'}</span>
          </button>

          {/* Quick Log Button */}
          <button
            onClick={() => {
              if (isDailyLocked) {
                triggerDisciplineAlert('lock', todayTradesCount);
              } else {
                setIsLogTradeOpen(true);
              }
            }}
            className={`flex items-center gap-1 px-3 py-1.5 font-bold text-xs rounded-xl shadow-xs transition cursor-pointer ${
              isDailyLocked
                ? 'bg-loss hover:bg-loss/90 text-white shadow-[0_0_12px_rgba(239,68,68,0.35)]'
                : 'bg-primary hover:bg-primary/90 text-primary-foreground'
            }`}
          >
            {isDailyLocked ? <Lock className="w-3.5 h-3.5" /> : <Plus className="w-3.5 h-3.5" />}
            <span>{isDailyLocked ? 'Locked' : 'Log'}</span>
          </button>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="p-1.5 text-muted-foreground hover:text-foreground rounded-lg bg-secondary border border-border cursor-pointer ml-1"
          >
            <Menu className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-60 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'trades' && <TradesView />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'plan' && <TradingPlanView />}
      </main>

      {/* Floating Action Button: + Log Trade */}
      <button
        onClick={() => {
          if (isDailyLocked) {
            triggerDisciplineAlert('lock', todayTradesCount);
          } else {
            setIsLogTradeOpen(true);
          }
        }}
        className={`hidden md:flex fixed bottom-7 right-8 z-40 h-12 px-5 shadow-lg font-bold rounded-xl items-center gap-2 cursor-pointer transition-all duration-200 hover:-translate-y-0.5 active:translate-y-0 active:scale-95 ${
          isDailyLocked
            ? 'bg-loss hover:bg-loss/90 text-white hover:shadow-[0_0_25px_rgba(239,68,68,0.5)] animate-pulse'
            : isDailyWarning
            ? 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_0_20px_rgba(18,213,134,0.4)]'
            : 'bg-primary hover:bg-primary/90 text-primary-foreground hover:shadow-[0_0_20px_rgba(18,213,134,0.4)]'
        }`}
      >
        {isDailyLocked ? (
          <>
            <Lock className="w-4 h-4 stroke-[2.5]" />
            <span>Daily Limit Reached (5/5 Locked)</span>
          </>
        ) : (
          <>
            <Plus className="w-4 h-4 stroke-[2.5]" />
            <span>Log Trade {todayTradesCount > 0 ? `(${todayTradesCount}/5)` : ''}</span>
          </>
        )}
      </button>

      {/* Modals */}
      <LogTradeModal />
      <CloseTradeModal />
      <EditTradeModal />
      <ConfirmDeleteModal />
      <DayTradesModal />
      <ImportExportModal />
      <ScanTradesModal />
      <LightboxModal />
      <DisciplineAlertModal />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
