import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarCheck, Check, Loader2, Pause, Pencil, Play, Plus, Sparkles, Trash2, Trophy, X } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";
import { createStudyPlan } from "@/lib/study.functions";

type Activity = { text: string; done: boolean };
type Week = { id: string; week_number: number; title: string; focus: string | null; activities: Activity[] };
type Plan = { id: string; goal: string; title: string; status: "active" | "paused" | "completed"; attention_notes: string | null; weeks: Week[] };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function StudyPlanPanel() {
  const qc = useQueryClient();
  const createFn = useServerFn(createStudyPlan);
  const [open, setOpen] = useState(false);
  const [goal, setGoal] = useState("");
  const [weeks, setWeeks] = useState(4);
  const [editing, setEditing] = useState<string | null>(null);
  const [editText, setEditText] = useState("");

  const { data: plans = [], isLoading } = useQuery<Plan[]>({
    queryKey: ["study-plans"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await db
        .from("study_plans")
        .select("id, goal, title, status, attention_notes, weeks:study_plan_weeks(id, week_number, title, focus, activities)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []).map((p: Plan) => ({ ...p, weeks: [...(p.weeks ?? [])].sort((a, b) => a.week_number - b.week_number) }));
    },
  });
  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["study-plans"] });
    qc.invalidateQueries({ queryKey: ["ai-memories"] });
  };

  const create = useMutation({
    mutationFn: async () => {
      const r = await createFn({ data: { goal, weeks } });
      if (!r.ok) throw new Error(r.error ?? "Falha");
    },
    onSuccess: () => {
      setGoal("");
      refresh();
      toast.success("Plano de estudo criado!");
    },
    onError: (e: Error) => toast.error(e.message),
  });

  async function completePlan(plan: Plan) {
    await db.from("study_plans").update({ status: "completed" }).eq("id", plan.id);
    // Sincroniza a conclusão com a memória esportiva.
    const { data: auth } = await supabase.auth.getUser();
    if (auth.user)
      await db.from("ai_memories").insert({
        user_id: auth.user.id,
        kind: "goal",
        content: `Plano concluído: ${plan.goal}`.slice(0, 200),
        is_active: false,
      });
    confetti({ particleCount: 110, spread: 80, origin: { y: 0.7 }, colors: ["#d4ff3a", "#facc15", "#ffffff"] });
    toast.success("Plano concluído! O Coach vai reconhecer essa evolução.");
  }

  const toggleActivity = useMutation({
    mutationFn: async ({ plan, week, idx }: { plan: Plan; week: Week; idx: number }) => {
      const activities = week.activities.map((a, i) => (i === idx ? { ...a, done: !a.done } : a));
      const { error } = await db.from("study_plan_weeks").update({ activities }).eq("id", week.id);
      if (error) throw error;
      const allDone = plan.weeks.every((w) => (w.id === week.id ? activities : w.activities).every((a) => a.done));
      if (allDone && plan.status !== "completed") await completePlan(plan);
    },
    onSuccess: refresh,
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const saveActivities = async (week: Week, activities: Activity[]) => {
    const { error } = await db.from("study_plan_weeks").update({ activities }).eq("id", week.id);
    if (error) toast.error("Não foi possível salvar.");
    refresh();
  };

  const setStatus = async (plan: Plan, status: Plan["status"]) => {
    if (status === "active") await db.from("study_plans").update({ status: "paused" }).eq("status", "active").neq("id", plan.id);
    await db.from("study_plans").update({ status }).eq("id", plan.id);
    refresh();
  };

  const removePlan = async (id: string) => {
    if (!window.confirm("Excluir este plano de estudo?")) return;
    await db.from("study_plans").delete().eq("id", id);
    refresh();
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Planos de estudo"
          className="grid size-11 place-items-center rounded-full border border-brand/30 text-brand transition hover:bg-brand/10"
        >
          <CalendarCheck className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-brand/20 bg-background pb-10">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <CalendarCheck className="size-5 text-brand" /> Planos de Estudo
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Transforme um objetivo em um plano semanal guiado pelo Flow AI.</p>
        </SheetHeader>

        <form
          className="mx-4 space-y-2 rounded-2xl border border-brand/20 bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (goal.trim() && !create.isPending) create.mutate();
          }}
        >
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            maxLength={200}
            placeholder="Ex: Melhorar minha passagem de guarda"
            className="min-h-11 w-full rounded-lg border border-white/10 bg-background px-3 text-sm outline-none focus:border-brand"
          />
          <div className="flex items-center gap-2">
            <select
              value={weeks}
              onChange={(e) => setWeeks(Number(e.target.value))}
              className="min-h-11 rounded-lg border border-white/10 bg-background px-2 text-sm"
              aria-label="Duração"
            >
              {[2, 3, 4, 6, 8].map((n) => (
                <option key={n} value={n}>{n} semanas</option>
              ))}
            </select>
            <button
              type="submit"
              disabled={!goal.trim() || create.isPending}
              className="flex min-h-11 flex-1 items-center justify-center gap-2 rounded-lg bg-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
            >
              {create.isPending ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
              {create.isPending ? "Montando plano..." : "Gerar plano"}
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-4 px-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading && plans.length === 0 && <p className="text-xs text-muted-foreground/70">Nenhum plano ainda.</p>}
          {plans.map((plan) => {
            const total = plan.weeks.reduce((s, w) => s + w.activities.length, 0);
            const done = plan.weeks.reduce((s, w) => s + w.activities.filter((a) => a.done).length, 0);
            const pct = total ? Math.round((done / total) * 100) : 0;
            const isDone = plan.status === "completed";
            return (
              <article
                key={plan.id}
                className={`rounded-2xl border p-3 ${isDone ? "border-gold/40 bg-gold/5" : plan.status === "paused" ? "border-white/5 bg-surface opacity-70" : "border-brand/30 bg-surface"}`}
              >
                <div className="flex items-start gap-2">
                  <div className="min-w-0 flex-1">
                    <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
                      {isDone ? <><Trophy className="size-3 text-gold" /> Concluído</> : plan.status === "paused" ? "Pausado" : "Ativo"}
                    </p>
                    <h3 className="truncate font-semibold">{plan.title}</h3>
                    <p className="truncate text-xs text-muted-foreground">{plan.goal}</p>
                  </div>
                  {!isDone && (
                    <button
                      type="button"
                      aria-label={plan.status === "paused" ? "Retomar" : "Pausar"}
                      onClick={() => setStatus(plan, plan.status === "paused" ? "active" : "paused")}
                      className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:text-brand"
                    >
                      {plan.status === "paused" ? <Play className="size-4" /> : <Pause className="size-4" />}
                    </button>
                  )}
                  <button type="button" aria-label="Excluir plano" onClick={() => removePlan(plan.id)} className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:text-destructive">
                    <Trash2 className="size-4" />
                  </button>
                </div>
                <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-background">
                  <div className={`h-full ${isDone ? "bg-gold" : "bg-brand"} transition-all`} style={{ width: `${pct}%` }} />
                </div>
                <p className="mt-1 text-[11px] text-muted-foreground">{done}/{total} atividades · {pct}%</p>
                {plan.attention_notes && !isDone && (
                  <p className="mt-2 rounded-lg bg-brand/10 px-2 py-1.5 text-[11px] text-brand">⚡ Atenção: {plan.attention_notes}</p>
                )}

                <div className="mt-3 space-y-3">
                  {plan.weeks.map((w) => (
                    <div key={w.id} className="rounded-xl bg-background/60 p-2.5">
                      <p className="text-xs font-bold">Semana {w.week_number}: {w.title}</p>
                      {w.focus && <p className="text-[11px] text-muted-foreground">{w.focus}</p>}
                      <ul className="mt-1.5 space-y-1">
                        {w.activities.map((a, idx) => {
                          const key = `${w.id}-${idx}`;
                          return (
                            <li key={key} className="flex items-center gap-1">
                              <button
                                type="button"
                                aria-label={a.done ? "Desmarcar" : "Concluir atividade"}
                                disabled={isDone}
                                onClick={() => toggleActivity.mutate({ plan, week: w, idx })}
                                className="grid size-9 shrink-0 place-items-center"
                              >
                                <span className={`grid size-5 place-items-center rounded-md border ${a.done ? "border-brand bg-brand text-brand-foreground" : "border-white/20"}`}>
                                  {a.done && <Check className="size-3.5" />}
                                </span>
                              </button>
                              {editing === key ? (
                                <form
                                  className="flex min-w-0 flex-1 gap-1"
                                  onSubmit={(e) => {
                                    e.preventDefault();
                                    if (!editText.trim()) return;
                                    saveActivities(w, w.activities.map((x, i) => (i === idx ? { ...x, text: editText.trim().slice(0, 160) } : x)));
                                    setEditing(null);
                                  }}
                                >
                                  <input autoFocus value={editText} onChange={(e) => setEditText(e.target.value)} className="min-h-9 min-w-0 flex-1 rounded-md border border-brand/40 bg-background px-2 text-xs outline-none" />
                                  <button type="submit" aria-label="Salvar" className="grid size-9 place-items-center text-brand"><Check className="size-4" /></button>
                                  <button type="button" aria-label="Cancelar" onClick={() => setEditing(null)} className="grid size-9 place-items-center text-muted-foreground"><X className="size-4" /></button>
                                </form>
                              ) : (
                                <>
                                  <span className={`min-w-0 flex-1 text-xs ${a.done ? "text-muted-foreground line-through" : ""}`}>{a.text}</span>
                                  {!isDone && (
                                    <>
                                      <button type="button" aria-label="Editar atividade" onClick={() => { setEditing(key); setEditText(a.text); }} className="grid size-9 shrink-0 place-items-center text-muted-foreground hover:text-brand"><Pencil className="size-3.5" /></button>
                                      <button type="button" aria-label="Remover atividade" onClick={() => saveActivities(w, w.activities.filter((_, i) => i !== idx))} className="grid size-9 shrink-0 place-items-center text-muted-foreground hover:text-destructive"><Trash2 className="size-3.5" /></button>
                                    </>
                                  )}
                                </>
                              )}
                            </li>
                          );
                        })}
                      </ul>
                      {!isDone && (
                        <button
                          type="button"
                          onClick={() => {
                            const t = window.prompt("Nova atividade para esta semana:");
                            if (t?.trim()) saveActivities(w, [...w.activities, { text: t.trim().slice(0, 160), done: false }]);
                          }}
                          className="mt-1 flex min-h-9 items-center gap-1 text-[11px] font-semibold text-brand"
                        >
                          <Plus className="size-3.5" /> Atividade
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              </article>
            );
          })}
        </div>
      </SheetContent>
    </Sheet>
  );
}
