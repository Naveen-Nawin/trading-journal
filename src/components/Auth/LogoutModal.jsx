import React, { useEffect, useState } from 'react';
import { Lock, ShieldCheck, CheckCircle2, Sparkles, Terminal, LogOut } from 'lucide-react';

export const LogoutModal = ({ isOpen, userName = 'Trader', reason = '', onComplete }) => {
  const [step, setStep] = useState(1);
  const [progress, setProgress] = useState(15);

  useEffect(() => {
    if (!isOpen) {
      setStep(1);
      setProgress(15);
      return;
    }

    // Step 1: Encrypting
    const t1 = setTimeout(() => {
      setStep(2);
      setProgress(55);
    }, 450);

    // Step 2: Cloud sync
    const t2 = setTimeout(() => {
      setStep(3);
      setProgress(88);
    }, 950);

    // Step 3: Vault locked
    const t3 = setTimeout(() => {
      setStep(4);
      setProgress(100);
    }, 1450);

    // Final: Complete callback
    const t4 = setTimeout(() => {
      if (onComplete) onComplete();
    }, 2000);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
    };
  }, [isOpen, onComplete]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-300">
      {/* Background Cyber Glow */}
      <div className="absolute w-96 h-96 bg-[#ff4d4d]/10 rounded-full blur-3xl pointer-events-none -top-12 -left-12 animate-pulse" />
      <div className="absolute w-96 h-96 bg-[#00f098]/10 rounded-full blur-3xl pointer-events-none -bottom-12 -right-12 animate-pulse" />

      <div className="relative w-full max-w-[420px] bg-[#0c1015] border border-[#1e293b] rounded-2xl p-7 shadow-[0_0_50px_rgba(0,0,0,0.8)] overflow-hidden text-center text-[#e2e8f0]">
        {/* Subtle grid lines background */}
        <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />

        {/* Animated Cyber Lock Hexagon */}
        <div className="relative mx-auto w-20 h-20 mb-5 flex items-center justify-center">
          {/* Pulsing shockwave ring */}
          <div
            className={`absolute inset-0 rounded-2xl border transition-all duration-700 ${
              step >= 4
                ? 'border-[#00f098]/60 bg-[#0e271f]/50 scale-105 shadow-[0_0_25px_rgba(0,240,152,0.4)]'
                : 'border-[#ff4d4d]/50 bg-[#2a1215]/50 animate-pulse shadow-[0_0_20px_rgba(255,77,77,0.3)]'
            }`}
          />
          {/* Rotating radar ring */}
          <div className="absolute inset-[-4px] rounded-2xl border border-dashed border-[#ff4d4d]/30 animate-spin" style={{ animationDuration: '6s' }} />

          {step < 4 ? (
            <LogOut className="w-8 h-8 text-[#ff4d4d] animate-bounce" />
          ) : (
            <Lock className="w-8 h-8 text-[#00f098] animate-in zoom-in duration-300" />
          )}
        </div>

        {/* Title */}
        <div className="space-y-1 mb-4">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-mono tracking-widest uppercase bg-[#182332] text-[#94a3b8] border border-[#27384e]">
            <Terminal className="w-3 h-3 text-[#38bdf8]" />
            Session Termination
          </span>
          <h3 className="text-xl font-extrabold text-white tracking-wide pt-1">
            {step < 4 ? 'Disconnecting Vault...' : 'Session Securely Locked'}
          </h3>
          <p className="text-xs text-[#8092a4]">
            {reason ? (
              <span className="text-[#f59e0b] font-medium">{reason}</span>
            ) : (
              `Safely signing out ${userName}`
            )}
          </p>
        </div>

        {/* Cyber Progress Tracker */}
        <div className="bg-[#070b0f] border border-[#1b2533] rounded-xl p-3.5 mb-4 text-left font-mono">
          <div className="flex items-center justify-between text-[11px] mb-2">
            <span className="text-[#64748b] flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-[#ff4d4d] animate-ping" />
              STATUS
            </span>
            <span className="text-white font-bold">{progress}%</span>
          </div>

          {/* Progress Bar */}
          <div className="w-full h-2 bg-[#121922] rounded-full overflow-hidden p-0.5 border border-[#1e2a38]">
            <div
              className={`h-full rounded-full transition-all duration-500 ease-out ${
                step >= 4
                  ? 'bg-gradient-to-r from-[#00f098] to-[#10b981] shadow-[0_0_12px_#00f098]'
                  : 'bg-gradient-to-r from-[#ff4d4d] via-[#f59e0b] to-[#00f098]'
              }`}
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Dynamic Step Logs */}
          <div className="mt-3 text-[11px] space-y-1">
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
              <span className="text-[10px]">{step > 1 ? '✓' : '●'}</span>
              <span>Syncing trades & journal state...</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
              <span className="text-[10px]">{step > 2 ? '✓' : '●'}</span>
              <span>Revoking active session tokens...</span>
            </div>
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-[#e2e8f0]' : 'text-[#475569]'}`}>
              <span className="text-[10px]">{step > 3 ? '✓' : '●'}</span>
              <span>Clearing local cryptographic cache...</span>
            </div>
            {step >= 4 && (
              <div className="flex items-center gap-2 text-[#00f098] font-bold animate-in fade-in duration-300">
                <CheckCircle2 className="w-3.5 h-3.5 text-[#00f098]" />
                <span>Vault locked! See you on your next trade.</span>
              </div>
            )}
          </div>
        </div>

        {/* Footer reassurance */}
        <p className="text-[11px] text-[#64748b]">
          All data encrypted and saved to Supabase Cloud DB.
        </p>
      </div>
    </div>
  );
};
