import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Calendar as CalendarIcon,
  CheckSquare,
  TrendingUp,
  Trash2,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { currentTab, setCurrentTab, currency, setCurrency, clearAllTrades, trades, usdToInrRate } = useTrading();
  const { user, isAuthenticated, logout, setIsAuthModalOpen } = useAuth();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'trades', label: 'Trades', icon: Layers },
    { id: 'calendar', label: 'Calendar', icon: CalendarIcon },
    { id: 'plan', label: 'Trading Plan', icon: CheckSquare },
  ];

  const handleNavClick = (id) => {
    setCurrentTab(id);
    if (setMobileOpen) setMobileOpen(false);
  };

  return (
    <>
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-xs z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 w-64 bg-[#080d12]/95 border-r border-[#15202b] flex flex-col justify-between p-5 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-3 px-2 py-3 mb-4 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-[#0e271f] border border-[#00f098]/40 flex items-center justify-center shadow-[0_0_15px_rgba(0,240,152,0.2)]">
              <TrendingUp className="w-5 h-5 text-[#00f098]" />
            </div>
            <div>
              <div className="text-white font-extrabold tracking-wider text-base">PIPDESK</div>
              <div className="text-[#64748b] text-[10px] font-semibold tracking-widest uppercase">
                FOREX JOURNAL
              </div>
            </div>
          </div>

          {/* User Account / DB Status Card */}
          <div className="mb-6 px-1">
            {isAuthenticated ? (
              <div className="bg-[#0b1219] border border-[#172332] rounded-xl p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-[#00f098]/20 text-[#00f098] flex items-center justify-center text-[11px] font-bold shrink-0">
                      {(user?.name || user?.email || 'T')[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate">{user?.name || 'Trader'}</div>
                      <div className="text-[10px] text-[#64748b] font-mono truncate">{user?.email}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-[#00f098] shadow-[0_0_8px_#00f098]" title="DB Connected" />
                </div>
                <div className="flex items-center justify-between pt-1 border-t border-[#131d2a] text-[11px]">
                  <span className="text-[10px] text-[#00f098] font-mono font-medium">● DB Synced</span>
                  <button
                    onClick={() => logout()}
                    className="text-[#8092a4] hover:text-[#ff4d4d] flex items-center gap-1 transition cursor-pointer"
                    title="Sign Out"
                  >
                    <LogOut className="w-3 h-3" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="w-full py-2.5 px-3 bg-[#0e271f] hover:bg-[#13372b] text-[#00f098] border border-[#00f098]/40 hover:border-[#00f098] rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_12px_rgba(0,240,152,0.15)]"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Create DB</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1.5">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                    isActive
                      ? 'bg-[#00f098]/10 text-[#00f098] border border-[#00f098]/30 shadow-[0_0_12px_rgba(0,240,152,0.15)]'
                      : 'text-[#8b9bb4] hover:text-white hover:bg-[#121c27]'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-[#00f098]' : 'text-[#64748b]'}`} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="space-y-4 pt-4 border-t border-[#15202b]/80">
          {/* Currency Toggle Switch */}
          <div className="flex items-center justify-between px-2 text-xs">
            <span className="text-[#64748b] font-medium">CURRENCY</span>
            <div className="flex items-center bg-[#0d151e] border border-[#1b2837] rounded-full p-0.5">
              <button
                onClick={() => setCurrency('USD')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ${
                  currency === 'USD'
                    ? 'bg-[#00f098] text-[#080d12] font-bold shadow-[0_0_8px_rgba(0,240,152,0.4)]'
                    : 'text-[#8092a4] hover:text-white'
                }`}
              >
                USD
              </button>
              <button
                onClick={() => setCurrency('INR')}
                className={`px-2.5 py-1 text-[11px] font-semibold rounded-full transition-all ${
                  currency === 'INR'
                    ? 'bg-[#00f098] text-[#080d12] font-bold shadow-[0_0_8px_rgba(0,240,152,0.4)]'
                    : 'text-[#8092a4] hover:text-white'
                }`}
              >
                INR
              </button>
            </div>
          </div>

          {/* Real-time Exchange Rate Info */}
          <div className="flex items-center justify-between px-2 text-[10px] text-[#64748b] font-mono">
            <span>1 USD = ₹{(usdToInrRate || 93.51).toFixed(2)}</span>
            <span className="text-[#00f098] font-semibold flex items-center gap-1">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#00f098] animate-pulse" /> LIVE
            </span>
          </div>

          {/* Clear All Trades Button */}
          <button
            onClick={() => {
              if (window.confirm('Are you sure you want to clear all trades? This will start a completely fresh journal.')) {
                clearAllTrades();
              }
            }}
            className="w-full flex items-center justify-center gap-1.5 px-2 py-1.5 text-[11px] text-[#64748b] hover:text-[#ff4d4d] hover:bg-[#1f1317] rounded transition"
            title="Clear all trades from journal"
          >
            <Trash2 className="w-3 h-3" />
            <span>Clear All Trades ({trades.length})</span>
          </button>

          {/* Live Status */}
          <div className="px-2">
            <div className="flex items-start gap-2 text-[11px] text-[#64748b] leading-tight">
              <span className="relative flex h-2 w-2 mt-0.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#00f098] opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-[#00f098]"></span>
              </span>
              <span>Journal live — every trade logged here sharpens your edge.</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
};

