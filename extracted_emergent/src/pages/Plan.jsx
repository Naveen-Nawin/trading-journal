import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/lib/api";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Plus, Trash2, ClipboardCheck } from "lucide-react";
import { cn } from "@/lib/utils";

export default function Plan() {
  const queryClient = useQueryClient();
  const [ruleText, setRuleText] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["plan"], queryFn: async () => (await api.get("/plan")).data });
  const { data: stats } = useQuery({ queryKey: ["stats"], queryFn: async () => (await api.get("/stats")).data });

  const saveRules = useMutation({
    mutationFn: (rules) => api.put("/plan", { rules }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["plan"] });
      queryClient.invalidateQueries({ queryKey: ["stats"] });
    },
    onError: () => toast.error("Could not save plan"),
  });

  const rules = data?.rules || [];

  const addRule = (e) => {
    e.preventDefault();
    if (!ruleText.trim()) return;
    saveRules.mutate([...rules, { id: crypto.randomUUID(), text: ruleText.trim(), active: true }]);
    setRuleText("");
  };

  const toggleRule = (id) =>
    saveRules.mutate(rules.map((r) => (r.id === id ? { ...r, active: !r.active } : r)));

  const removeRule = (id) => saveRules.mutate(rules.filter((r) => r.id !== id));

  const compliance = stats?.kpis?.plan_compliance;
  const activeRules = rules.filter((r) => r.active);

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="animate-rise">
        <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mb-1.5">Discipline framework</p>
        <h1 className="text-2xl md:text-3xl font-bold font-num tracking-tight">
          My <span className="text-profit glow-green">Trading Plan</span>
        </h1>
        <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
          Your rules live here. Every trade you log asks "did you follow this plan?" — honesty builds the edge.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div className="rounded-xl border border-primary/30 bg-card/70 p-4 animate-rise" data-testid="plan-compliance-card">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Plan compliance</p>
          <p className={cn("font-num font-bold text-2xl mt-2", compliance >= 70 ? "text-profit" : compliance != null ? "text-loss" : "")}>
            {compliance != null ? `${compliance}%` : "—"}
          </p>
          <p className="text-[11px] text-muted-foreground mt-1">of closed trades followed the plan</p>
        </div>
        <div className="rounded-xl border border-border bg-card/70 p-4 animate-rise" style={{ animationDelay: "60ms" }} data-testid="plan-active-rules-card">
          <p className="text-[10px] uppercase tracking-[0.16em] text-muted-foreground">Active rules</p>
          <p className="font-num font-bold text-2xl mt-2">{activeRules.length}</p>
          <p className="text-[11px] text-muted-foreground mt-1">shown when logging a trade</p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card/70 p-4 md:p-6">
        <div className="flex items-center gap-2 mb-4">
          <ClipboardCheck size={15} className="text-accent" />
          <p className="text-sm font-semibold">The rules</p>
        </div>

        {isLoading ? (
          <p className="text-xs text-muted-foreground py-4">Loading rules…</p>
        ) : rules.length === 0 ? (
          <p className="text-xs text-muted-foreground py-4">No rules yet — write your first one below.</p>
        ) : (
          <div className="space-y-2.5" data-testid="plan-rules-list">
            {rules.map((r, i) => (
              <div
                key={r.id}
                data-testid={`plan-rule-${r.id}`}
                className={cn(
                  "flex items-center gap-3 rounded-lg border px-3.5 py-3 transition-colors duration-200",
                  r.active ? "border-border bg-secondary/30" : "border-border/50 opacity-55"
                )}
              >
                <span className="font-num text-[11px] text-muted-foreground w-5 shrink-0">{String(i + 1).padStart(2, "0")}</span>
                <p className={cn("text-sm flex-1", !r.active && "line-through text-muted-foreground")}>{r.text}</p>
                <Switch data-testid={`plan-rule-toggle-${r.id}`} checked={r.active} onCheckedChange={() => toggleRule(r.id)} className="scale-90" />
                <button data-testid={`plan-rule-delete-${r.id}`} onClick={() => removeRule(r.id)} className="text-muted-foreground hover:text-loss transition-colors">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        )}

        <form onSubmit={addRule} className="flex gap-2 mt-5">
          <Input
            data-testid="plan-rule-input"
            value={ruleText}
            onChange={(e) => setRuleText(e.target.value)}
            placeholder="e.g. Never move my stop-loss against me"
            className="text-sm"
          />
          <Button type="submit" data-testid="plan-rule-add" disabled={saveRules.isPending || !ruleText.trim()}>
            <Plus size={15} className="mr-1" /> Add rule
          </Button>
        </form>
      </div>
    </div>
  );
}
