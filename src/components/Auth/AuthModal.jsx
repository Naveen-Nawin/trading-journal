import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  Sparkles,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Database,
  KeyRound,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isGate = false }) => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, finalizeAuth, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: idle, 1: connecting, 2: verifying, 3: syncing, 4: granted

  if (!isGate && !isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');
    setLoadingStep(1);

    try {
      // Step 1: Connecting to secure vault (30%)
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep(2);

      // Perform auth call with skipSetUser so the animation doesn't get unmounted prematurely
      let result;
      if (mode === 'login') {
        result = await login(email, password, { skipSetUser: true });
      } else {
        result = await register(email, password, name, { skipSetUser: true });
      }

      // Step 3: Syncing cloud database (90%)
      setLoadingStep(3);
      await new Promise((r) => setTimeout(r, 650));

      // Step 4: Access Granted & Launch (100%)
      setLoadingStep(4);
      await new Promise((r) => setTimeout(r, 600));

      // Now smoothly mount the authenticated dashboard!
      if (result?.user && result?.token) {
        finalizeAuth(result.user, result.token);
      }
    } catch (err) {
      setLoadingStep(0);
      setIsSubmitting(false);
    }
  };

  const fillDemoAccount = () => {
    setEmail('trader@forex.com');
    setPassword('trader123');
    setName('Forex Pro');
  };

  return (
    <div className={isGate ? 'w-full max-w-[440px] my-auto' : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-xs overflow-y-auto'}>
      {isGate && (
        <div className="flex flex-col items-center justify-center mb-6 text-center">
          <div className="w-12 h-12 rounded-2xl bg-[#0e271f] border border-[#00f098]/40 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,152,0.3)] mb-3">
            <TrendingUp className="w-6 h-6 text-[#00f098]" />
          </div>
          <h1 className="text-xl font-extrabold text-white tracking-wider">PIPDESK</h1>
          <p className="text-xs text-[#64748b] tracking-widest uppercase font-semibold mt-0.5">
            FOREX TRADING JOURNAL
          </p>
        </div>
      )}

      <div className="relative w-full max-w-[440px] bg-[#0c1015] border border-[#1b2533] rounded-2xl shadow-2xl overflow-hidden text-[#e2e8f0]">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-[#172230]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-[#00f098]/10 border border-[#00f098]/30 flex items-center justify-center text-[#00f098]">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-white font-bold text-base tracking-tight font-sans">
                {mode === 'login' ? 'Sign In to Your Journal' : 'Create Trader Account'}
              </h2>
              <p className="text-[11px] text-[#64748b]">
                {mode === 'login' ? 'Automatic 5-hour secure session timeout' : 'Your private database for trades and rules'}
              </p>
            </div>
          </div>
          {!isGate && (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="text-[#64748b] hover:text-white p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* LOADING ANIMATION OVERLAY */}
        {isSubmitting ? (
          <div className="p-8 py-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            {/* Animated Radar / Scanner Icon */}
            <div className="relative flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-[#00f098]/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-t-[#00f098] border-r-[#00f098]/40 border-b-transparent border-l-transparent animate-spin" />
              <div className="w-14 h-14 rounded-full bg-[#0e271f] border border-[#00f098]/50 flex items-center justify-center shadow-[0_0_20px_rgba(0,240,152,0.4)]">
                {loadingStep === 1 && <KeyRound className="w-6 h-6 text-[#00f098] animate-pulse" />}
                {loadingStep === 2 && <RefreshCw className="w-6 h-6 text-[#00f098] animate-spin" />}
                {loadingStep === 3 && <Database className="w-6 h-6 text-[#00f098] animate-bounce" />}
                {loadingStep === 4 && <CheckCircle2 className="w-7 h-7 text-[#00f098] scale-110 transition-transform" />}
              </div>
            </div>

            {/* Dynamic Status Text */}
            <div className="space-y-1.5 w-full">
              <div className="text-sm font-bold text-white tracking-wide font-sans">
                {loadingStep === 1 && 'Connecting to secure vault...'}
                {loadingStep === 2 && 'Authenticating credentials...'}
                {loadingStep === 3 && 'Syncing SQLite database...'}
                {loadingStep === 4 && 'Access Granted! Entering workspace...'}
              </div>
              <p className="text-[11px] text-[#64748b] font-mono">
                {loadingStep === 1 && 'ESTABLISHING_ENCRYPTED_TUNNEL'}
                {loadingStep === 2 && 'VERIFYING_5H_JWT_SESSION'}
                {loadingStep === 3 && 'QUERYING_USER_TRADES_AND_RULES'}
                {loadingStep === 4 && 'SESSION_ACTIVATED_5_HOURS'}
              </p>
            </div>

            {/* High-tech Progress Bar */}
            <div className="w-full bg-[#080d12] border border-[#1b2533] rounded-full h-2 p-0.5 overflow-hidden">
              <div
                className="bg-gradient-to-r from-[#00f098]/70 to-[#00f098] h-full rounded-full transition-all duration-300 shadow-[0_0_10px_#00f098]"
                style={{
                  width:
                    loadingStep === 1
                      ? '30%'
                      : loadingStep === 2
                      ? '65%'
                      : loadingStep === 3
                      ? '90%'
                      : '100%',
                }}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Tab Switcher */}
            <div className="p-6 pb-0">
              <div className="grid grid-cols-2 p-1 bg-[#080d12] border border-[#1a2837] rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-[#00f098] text-[#080d12] font-black shadow-[0_0_12px_rgba(0,240,152,0.3)]'
                      : 'text-[#8092a4] hover:text-white'
                  }`}
                >
                  Sign In
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setMode('register');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'register'
                      ? 'bg-[#00f098] text-[#080d12] font-black shadow-[0_0_12px_rgba(0,240,152,0.3)]'
                      : 'text-[#8092a4] hover:text-white'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="bg-[#291318] border border-[#ff4d4d]/40 rounded-xl p-3 flex items-center gap-2 text-xs text-[#ff8080]">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#ff4d4d]" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                    Full Name / Trader Handle
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe or FX Alpha"
                      className="w-full bg-[#080d12] text-white text-xs border border-[#1e2c3d] rounded-xl px-3.5 py-2.5 pl-9 focus:outline-hidden focus:border-[#00f098]/70"
                    />
                    <User className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full bg-[#080d12] text-white text-xs border border-[#1e2c3d] rounded-xl px-3.5 py-2.5 pl-9 focus:outline-hidden focus:border-[#00f098]/70 font-mono"
                  />
                  <Mail className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-[#94a3b8] text-xs font-medium font-sans">
                  Password
                </label>
                <div className="relative">
                  <input
                    type="password"
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-[#080d12] text-white text-xs border border-[#1e2c3d] rounded-xl px-3.5 py-2.5 pl-9 focus:outline-hidden focus:border-[#00f098]/70"
                  />
                  <Lock className="w-4 h-4 text-[#64748b] absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Session duration badge */}
              <div className="flex items-center justify-between text-[11px] text-[#64748b] px-1 font-mono">
                <span>Auto-logout timeout:</span>
                <span className="text-[#00f098] font-bold">5 Hours</span>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-[#00f098] hover:bg-[#00f098]/90 text-[#080d12] font-black text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-[0_0_15px_rgba(0,240,152,0.3)]"
              >
                <span>{mode === 'login' ? 'Sign In & Load Journal' : 'Create Account & Open Journal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              {/* Quick Demo Fill */}
              <div className="pt-2 border-t border-[#172230] flex items-center justify-between text-[11px] text-[#64748b]">
                <span>Fast test?</span>
                <button
                  type="button"
                  onClick={fillDemoAccount}
                  className="text-[#00f098] hover:underline flex items-center gap-1 cursor-pointer font-mono"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>Fill sample login</span>
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
