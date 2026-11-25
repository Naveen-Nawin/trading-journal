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
      <div>
        <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-1">
          DISCIPLINE FRAMEWORK
        </div>
        <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
          My Trading Plan
        </h1>
        <p className="text-[#8092a4] text-xs mt-1.5 max-w-2xl leading-relaxed">
          Your rules live here. Every trade you log asks &ldquo;did you follow this plan?&rdquo; — honesty builds the edge.
        </p>
      </div>

      {/* Top 2 Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Plan Compliance */}
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-2">
            PLAN COMPLIANCE
          </div>
          <div className="text-3xl font-mono font-extrabold text-[#00f098]">
            {stats.planComplianceRate.toFixed(1)}%
          </div>
          <div className="text-[#64748b] text-xs font-mono mt-2">
            of closed trades followed the plan
          </div>
        </div>

        {/* Active Rules */}
        <div className="bg-[#0b1117] border border-[#16222f] rounded-xl p-5 shadow-sm">
          <div className="text-[#64748b] text-[11px] font-bold tracking-widest uppercase mb-2">
            ACTIVE RULES
          </div>
          <div className="text-3xl font-mono font-extrabold text-white">
            {activeRulesCount}
          </div>
          <div className="text-[#64748b] text-xs font-mono mt-2">
            shown when logging a trade
          </div>
        </div>
      </div>

      {/* The Rules Card */}
      <div className="bg-[#0b1117] border border-[#16222f] rounded-2xl p-6 shadow-xl space-y-5">
        <div className="flex items-center gap-2 text-white font-bold text-sm tracking-wide">
          <CheckSquare className="w-4 h-4 text-[#00f098]" />
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
                    ? 'bg-[#080d12] border-[#16222f] hover:border-[#1e2f40]'
                    : 'bg-[#080d12]/50 border-[#121922] opacity-60'
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="font-mono text-xs px-2 py-0.5 rounded bg-[#101923] text-[#64748b] border border-[#16222f]">
                    {rule.num}
                  </span>
                  <span
                    className={`text-sm ${
                      rule.active ? 'text-white font-medium' : 'text-[#64748b] line-through'
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
                      rule.active ? 'bg-[#00f098]' : 'bg-[#1e293b]'
                    }`}
                  >
                    <span
                      aria-hidden="true"
                      className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-[#080d12] shadow-lg ring-0 transition duration-200 ease-in-out ${
                        rule.active ? 'translate-x-4' : 'translate-x-0'
                      }`}
                    />
                  </button>

                  {/* Delete Button */}
                  <button
                    onClick={() => deleteRule(rule.id)}
                    className="p-1.5 text-[#64748b] hover:text-[#ff4d4d] rounded hover:bg-[#121c27] transition"
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
            className="flex-1 bg-[#070b0f] text-sm text-white placeholder-[#546577] border border-[#16222f] rounded-xl px-4 py-2.5 focus:outline-hidden focus:border-[#00f098]/60 transition"
          />
          <button
            type="submit"
            disabled={!newRuleText.trim()}
            className="flex items-center gap-1.5 px-4 py-2.5 bg-[#00f098]/15 hover:bg-[#00f098]/25 text-[#00f098] border border-[#00f098]/40 rounded-xl text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Plus className="w-4 h-4" />
            <span>Add rule</span>
          </button>
        </form>
      </div>
    </div>
  );
};

