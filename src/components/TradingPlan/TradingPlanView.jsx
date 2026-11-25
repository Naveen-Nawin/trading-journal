import React, { useState } from 'react';
import { CheckSquare, Trash2, Plus } from 'lucide-react';
import { useTrading } from '../../context/TradingContext';

export const TradingPlanView = () => {
  const { rules, toggleRule, addRule, deleteRule, stats } = useTrading();
  const [newRuleText, setNewRuleText] = useState('');

  const activeRulesCount = rules.filter((r) => r.active).length;

  const handleAdd = (e) => {
    e.preventDefault();
    if (newRuleText.trim()) {
      addRule(newRuleText.trim());
      setNewRuleText('');
    }
  };

  return (
    <div className="space-y-6 pb-20">
      {/* Header */}
      <div className="animate-rise">
        <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-1">
          Discipline Framework
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-foreground tracking-tight">
          My <span className="text-profit glow-green">Trading Plan</span>
        </h1>
        <p className="text-muted-foreground text-xs mt-1.5 max-w-2xl leading-relaxed">
          Your rules live here. Every trade you log asks &ldquo;did you follow this plan?&rdquo; — honesty builds the edge.
        </p>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Compliance */}
        <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs animate-rise">
          <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-2">
            Plan Compliance
          </div>
          <div className="text-3xl font-num font-extrabold text-profit">
            {stats.planComplianceRate.toFixed(1)}%
          </div>
          <div className="text-muted-foreground text-xs font-num mt-2">
            of closed trades followed the plan
          </div>
        </div>

        {/* Active Rules */}
        <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-5 shadow-xs animate-rise">
          <div className="text-muted-foreground text-[11px] font-bold tracking-widest uppercase mb-2">
            Active Rules
          </div>
          <div className="text-3xl font-num font-extrabold text-foreground">
            {activeRulesCount}
          </div>
          <div className="text-muted-foreground text-xs font-num mt-2">
            shown when logging a trade
          </div>
        </div>
      </div>

      {/* The Rules Card */}
      <div className="rounded-xl border border-border bg-card/70 backdrop-blur-sm p-6 shadow-xs space-y-5 animate-rise">
        <div className="flex items-center gap-2 text-foreground font-bold text-sm tracking-wide">
          <CheckSquare className="w-4 h-4 text-profit" />
          <span>The rules</span>
        </div>

        {/* Rules List */}
        <div className="space-y-3">
          {rules.map((rule) => {
            return (
              <div
                key={rule.id}
                className={`flex items-center justify-between p-3.5 rounded-xl border transition-all ${
                  rule.active
                    ? 'bg-secondary/40 border-border hover:border-border/80'
                    : 'bg-secondary/20 border-border/40 opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-num text-xs px-2 py-0.5 rounded-md bg-secondary text-muted-foreground border border-border">
                    {rule.num}
                  </span>
                  <span
                    className={`text-sm ${
                      rule.active ? 'text-foreground font-medium' : 'text-muted-foreground line-through'
                    }`}
                  >
                    {rule.text}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  {/* Toggle Switch */}
                  <button
                    onClick={() => toggleRule(rule.id)}
                    className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-hidden ${
                      rule.active ? 'bg-primary' : 'bg-secondary'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-card shadow-lg ring-0 transition duration-200 ease-in-out ${
                        rule.active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 text-muted-foreground hover:text-loss rounded-lg hover:bg-secondary transition cursor-pointer"
                    title="Delete rule"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Add Rule Form */}
        <form onSubmit={handleAdd} className="flex gap-2 pt-2">
          <input
            type="text"
            value={newRuleText}
            onChange={(e) => setNewRuleText(e.target.value)}
            placeholder="e.g. Never move my stop-loss against me"
            className="flex-1 bg-secondary/40 text-sm text-foreground placeholder-muted-foreground/60 border border-border rounded-xl px-4 py-2.5 focus:outline-hidden focus:border-primary transition"
          />
          <button
            type="submit"
            disabled={!newRuleText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-profit/15 hover:bg-profit/25 text-profit border border-profit/40 hover:border-profit/70 rounded-xl text-xs font-bold transition-all duration-150 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer active:scale-95 hover:shadow-[0_0_12px_rgba(18,213,134,0.25)]"
          >
            <Plus className="w-4 h-4" />
            <span>Add rule</span>
          </button>
        </form>
      </div>
    </div>
  );
};
