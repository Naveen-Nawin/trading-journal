import React, { useState } from 'react';
import { Menu, Plus } from 'lucide-react';
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
import { AuthModal } from './components/Auth/AuthModal';
import { useAuth } from './context/AuthContext';

export function AppContent() {
  const { currentTab, setIsLogTradeOpen } = useTrading();
  const { isAuthenticated, isLoading } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  // If verifying session on startup
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#070a0e] bg-grid-pattern text-slate-100 flex flex-col items-center justify-center p-4">
        <div className="w-12 h-12 rounded-2xl bg-[#0e271f] border border-[#00f098]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,152,0.3)] mb-4 animate-pulse">
          <span className="text-[#00f098] font-black text-xl">▲</span>
        </div>
        <div className="text-white font-extrabold tracking-wider text-base mb-1">PIPDESK</div>
        <div className="text-xs text-[#00f098] font-mono animate-pulse">Connecting to secure database...</div>
      </div>
    );
  }

  // Gate: When opening the website without being logged in, pop up the login page directly!
  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-[#070a0e] bg-grid-pattern text-slate-100 flex flex-col items-center justify-center p-4 relative selection:bg-[#00f098]/30 selection:text-[#00f098]">
        <AuthModal isGate={true} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-grid-pattern text-slate-100 flex flex-col lg:flex-row relative selection:bg-[#00f098]/30 selection:text-[#00f098]">
      {/* Mobile Header Bar */}
      <div className="lg:hidden flex items-center justify-between p-4 bg-[#080d12]/95 border-b border-[#15202b] sticky top-0 z-30 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-md bg-[#0e271f] border border-[#00f098]/40 flex items-center justify-center">
            <span className="text-[#00f098] font-bold text-xs">▲</span>
          </div>
          <span className="font-extrabold tracking-wider text-sm text-white">PIPDESK</span>
        </div>
        <button
          onClick={() => setMobileOpen(!mobileOpen)}
          className="p-2 text-[#8092a4] hover:text-white rounded-lg bg-[#0d1620] border border-[#1a2837]"
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {/* Sidebar Navigation */}
      <Sidebar mobileOpen={mobileOpen} setMobileOpen={setMobileOpen} />

      {/* Main Content Area */}
      <main className="flex-1 lg:ml-64 p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto w-full">
        {currentTab === 'dashboard' && <DashboardView />}
        {currentTab === 'trades' && <TradesView />}
        {currentTab === 'calendar' && <CalendarView />}
        {currentTab === 'plan' && <TradingPlanView />}
      </main>

      {/* Floating Action Button: + Log Trade */}
      <button
        onClick={() => setIsLogTradeOpen(true)}
        className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-5 py-3 bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] font-black text-xs md:text-sm rounded-xl shadow-[0_0_20px_rgba(0,240,152,0.45)] hover:shadow-[0_0_25px_rgba(0,240,152,0.6)] transform hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
      >
        <Plus className="w-4 h-4 stroke-[3]" />
        <span>Log Trade</span>
      </button>

      {/* Modals */}
      <LogTradeModal />
      <CloseTradeModal />
      <EditTradeModal />
      <ConfirmDeleteModal />
      <DayTradesModal />
      <ImportExportModal />
      <ScanTradesModal />
      <AuthModal />
    </div>
  );
}

export default function App() {
  return <AppContent />;
}
