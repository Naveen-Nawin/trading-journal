import React from 'react';
import {
  LayoutDashboard,
  Layers,
  Calendar as CalendarIcon,
  CheckSquare,
  TrendingUp,
  LogIn,
  LogOut,
  User,
  ShieldCheck,
} from 'lucide-react';
import { useTrading } from '../context/TradingContext';
import { useAuth } from '../context/AuthContext';

export const Sidebar = ({ mobileOpen, setMobileOpen }) => {
  const { currentTab, setCurrentTab, currency, setCurrency, trades, usdToInrRate } = useTrading();
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
        className={`fixed top-0 bottom-0 left-0 z-50 w-60 bg-card/85 backdrop-blur-xl border-r border-border flex flex-col justify-between p-4 md:p-5 transition-transform duration-300 lg:translate-x-0 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div>
          {/* Logo */}
          <div className="flex items-center gap-2.5 px-2 py-3 mb-4 cursor-pointer" onClick={() => handleNavClick('dashboard')}>
            <div className="w-9 h-9 rounded-lg bg-primary/15 border border-primary/40 flex items-center justify-center">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                <path d="M3 17.5 8 11l4 3.5L21 5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M15.5 5H21v5.5" stroke="hsl(160 84% 45%)" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <div className="font-num font-bold text-[15px] tracking-tight text-white leading-none">PIPDESK</div>
              <div className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mt-1">
                Forex Journal
              </div>
            </div>
          </div>

          {/* User Account / DB Status Card */}
          <div className="mb-5 px-1">
            {isAuthenticated ? (
              <div className="bg-card/70 border border-border rounded-xl p-3 space-y-2 backdrop-blur-xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <div className="w-6 h-6 rounded-full bg-primary/20 text-profit flex items-center justify-center text-[11px] font-bold shrink-0 font-num">
                      {(user?.name || user?.email || 'T')[0].toUpperCase()}
                    </div>
                    <div className="truncate">
                      <div className="text-xs font-bold text-white truncate font-sans">{user?.name || 'Trader'}</div>
                      <div className="text-[10px] text-muted-foreground font-num truncate">{user?.email}</div>
                    </div>
                  </div>
                  <span className="w-2 h-2 rounded-full bg-profit shadow-[0_0_8px_hsl(160_84%_45%)]" title="DB Connected" />
                </div>
                <div className="flex items-center justify-end pt-1 border-t border-border/60 text-[11px]">
                  <button
                    onClick={() => logout()}
                    className="text-muted-foreground hover:text-loss flex items-center gap-1 transition cursor-pointer"
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
                className="w-full py-2.5 px-3 bg-primary/15 hover:bg-primary/25 text-profit border border-primary/40 rounded-xl text-xs font-bold transition flex items-center justify-center gap-2 cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>Sign In / Create DB</span>
              </button>
            )}
          </div>

          {/* Navigation Links */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavClick(item.id)}
                  className={`w-full flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors duration-200 cursor-pointer ${
                    isActive
                      ? 'bg-primary/12 text-profit border border-primary/25 font-semibold'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary border border-transparent'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${isActive ? 'text-profit' : 'text-muted-foreground'}`} strokeWidth={2} />
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Section */}
        <div className="px-3 py-4 border-t border-border/70 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[11px] font-num">
              <span className={currency === 'USD' ? 'text-foreground font-semibold' : 'text-muted-foreground'}>USD</span>
              <div className="flex items-center bg-secondary border border-border rounded-full p-0.5">
                <button
                  type="button"
                  onClick={() => setCurrency('USD')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    currency === 'USD'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  $
                </button>
                <button
                  type="button"
                  onClick={() => setCurrency('INR')}
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-semibold transition cursor-pointer ${
                    currency === 'INR'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  ₹
                </button>
              </div>
              <span className={currency === 'INR' ? 'text-foreground font-semibold' : 'text-muted-foreground'}>INR</span>
            </div>
            <span className="text-[10px] font-num text-muted-foreground">
              ₹{(usdToInrRate || 93.51).toFixed(1)}
            </span>
          </div>

          <p className="text-[10px] text-muted-foreground leading-relaxed">
            <span className="live-dot text-profit mr-1">●</span> Journal live — every trade logged here sharpens your edge.
          </p>
        </div>
      </aside>
    </>
  );
};

