import React, { useState } from 'react';
import {
  X,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  ShieldCheck,
  TrendingUp,
  RefreshCw,
  CheckCircle2,
  Database,
  KeyRound,
  Eye,
  EyeOff,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const AuthModal = ({ isGate = false }) => {
  const { isAuthModalOpen, setIsAuthModalOpen, login, register, finalizeAuth, authError, setAuthError } = useAuth();

  const [mode, setMode] = useState('login'); // 'login' | 'register'
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loadingStep, setLoadingStep] = useState(0); // 0: idle, 1: connecting, 2: verifying, 3: syncing, 4: granted

  if (!isGate && !isAuthModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setAuthError('');
    setLoadingStep(1);

    try {
      // Step 1: Connecting to secure vault
      await new Promise((r) => setTimeout(r, 400));
      setLoadingStep(2);

      let result;
      if (mode === 'login') {
        result = await login(email, password, { skipSetUser: true });
      } else {
        result = await register(email, password, name, { skipSetUser: true });
      }

      // Step 3: Syncing cloud database
      setLoadingStep(3);
      await new Promise((r) => setTimeout(r, 650));

      // Step 4: Access Granted & Launch
      setLoadingStep(4);
      await new Promise((r) => setTimeout(r, 600));

      if (result?.user && result?.token) {
        finalizeAuth(result.user, result.token);
      }
    } catch (err) {
      setLoadingStep(0);
      setIsSubmitting(false);
    }
  };

  return (
    <div className={isGate ? 'w-full max-w-[440px] my-auto' : 'fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm overflow-y-auto'}>
      {isGate && (
        <div className="flex flex-col items-center justify-center mb-6 text-center animate-rise">
          <div className="w-12 h-12 rounded-2xl bg-profit/15 border border-profit/40 flex items-center justify-center shadow-xs mb-3">
            <TrendingUp className="w-6 h-6 text-profit" />
          </div>
          <h1 className="text-xl font-extrabold text-foreground tracking-wider font-num">PIPDESK</h1>
          <p className="text-xs text-muted-foreground tracking-widest uppercase font-semibold mt-0.5">
            FOREX TRADING JOURNAL
          </p>
        </div>
      )}

      <div className="relative w-full max-w-[440px] bg-card border border-border rounded-xl shadow-2xl overflow-hidden text-foreground animate-rise">
        {/* Header */}
        <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-border bg-card/90">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-profit/10 border border-profit/30 flex items-center justify-center text-profit">
              <ShieldCheck className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-foreground font-bold text-base tracking-tight">
                {mode === 'login' ? 'Sign In to Your Journal' : 'Create Trader Account'}
              </h2>
              <p className="text-[11px] text-muted-foreground">
                {mode === 'login' ? 'Access your private trading journal' : 'Your private database for trades and rules'}
              </p>
            </div>
          </div>
          {!isGate && (
            <button
              type="button"
              onClick={() => setIsAuthModalOpen(false)}
              className="text-muted-foreground hover:text-foreground p-1 rounded-lg transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* LOADING ANIMATION OVERLAY */}
        {isSubmitting ? (
          <div className="p-8 py-10 flex flex-col items-center justify-center text-center space-y-6 animate-fade-in">
            <div className="relative flex items-center justify-center w-20 h-20">
              <div className="absolute inset-0 rounded-full border border-profit/20 animate-ping" />
              <div className="absolute inset-2 rounded-full border-2 border-t-profit border-r-profit/40 border-b-transparent border-l-transparent animate-spin" />
              <div className="w-14 h-14 rounded-full bg-profit/15 border border-profit/50 flex items-center justify-center shadow-xs">
                {loadingStep === 1 && <KeyRound className="w-6 h-6 text-profit animate-pulse" />}
                {loadingStep === 2 && <RefreshCw className="w-6 h-6 text-profit animate-spin" />}
                {loadingStep === 3 && <Database className="w-6 h-6 text-profit animate-bounce" />}
                {loadingStep === 4 && <CheckCircle2 className="w-7 h-7 text-profit scale-110 transition-transform" />}
              </div>
            </div>

            <div className="space-y-1.5 w-full">
              <div className="text-sm font-bold text-foreground tracking-wide">
                {loadingStep === 1 && 'Connecting to secure vault...'}
                {loadingStep === 2 && 'Authenticating credentials...'}
                {loadingStep === 3 && 'Syncing database...'}
                {loadingStep === 4 && 'Access Granted! Entering workspace...'}
              </div>
              <p className="text-[11px] text-muted-foreground font-num">
                {loadingStep === 1 && 'ESTABLISHING_ENCRYPTED_TUNNEL'}
                {loadingStep === 2 && 'VERIFYING_JWT_SESSION'}
                {loadingStep === 3 && 'QUERYING_USER_TRADES_AND_RULES'}
                {loadingStep === 4 && 'SESSION_ACTIVATED'}
              </p>
            </div>

            <div className="w-full bg-secondary/50 border border-border rounded-full h-2 p-0.5 overflow-hidden">
              <div
                className="bg-primary h-full rounded-full transition-all duration-300 shadow-xs"
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
              <div className="grid grid-cols-2 p-1 bg-secondary/40 border border-border rounded-xl text-xs font-semibold">
                <button
                  type="button"
                  onClick={() => {
                    setMode('login');
                    setAuthError('');
                  }}
                  className={`py-2 rounded-lg transition-all cursor-pointer ${
                    mode === 'login'
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
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
                      ? 'bg-primary text-primary-foreground font-bold shadow-xs'
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Create Account
                </button>
              </div>
            </div>

            {/* Form Body */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              {authError && (
                <div className="bg-loss/10 border border-loss/40 rounded-xl p-3 flex items-center gap-2 text-xs text-loss">
                  <AlertCircle className="w-4 h-4 shrink-0 text-loss" />
                  <span>{authError}</span>
                </div>
              )}

              {/* Full Name (Register only) */}
              {mode === 'register' && (
                <div className="space-y-1.5">
                  <label className="block text-muted-foreground text-xs font-medium">
                    Full Name / Trader Handle
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. John Doe or FX Alpha"
                      className="w-full bg-secondary/40 text-foreground text-xs border border-border rounded-xl px-3.5 py-2.5 pl-9 focus:outline-hidden focus:border-primary"
                    />
                    <User className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  </div>
                </div>
              )}

              {/* Email */}
              <div className="space-y-1.5">
                <label className="block text-muted-foreground text-xs font-medium">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="trader@example.com"
                    className="w-full bg-secondary/40 text-foreground text-xs border border-border rounded-xl px-3.5 py-2.5 pl-9 focus:outline-hidden focus:border-primary font-num"
                  />
                  <Mail className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Password */}
              <div className="space-y-1.5">
                <label className="block text-muted-foreground text-xs font-medium">
                  Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    minLength={6}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-secondary/40 text-foreground text-xs border border-border rounded-xl px-3.5 py-2.5 pl-9 pr-10 focus:outline-hidden focus:border-primary font-num"
                  />
                  <Lock className="w-4 h-4 text-muted-foreground absolute left-3 top-1/2 -translate-y-1/2" />
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-profit p-1 transition cursor-pointer"
                    title={showPassword ? 'Hide password' : 'Show password'}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <EyeOff className="w-4 h-4" />
                    ) : (
                      <Eye className="w-4 h-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                className="w-full py-2.5 px-4 bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-xs rounded-xl transition flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <span>{mode === 'login' ? 'Sign In & Load Journal' : 'Create Account & Open Journal'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
};
