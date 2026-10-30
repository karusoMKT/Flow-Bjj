import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateCoachJson } from "@/lib/coach.server";

type Activity = { text: string; done: boolean };
type PlanJson = { title: string; weeks: { title: string; focus: string; activities: string[] }[] };
type AnalysisJson = { summary: string; next_focus: string[]; new_activity: string | null };

const clip = (v: unknown, n: number) => String(v ?? "").trim().slice(0, n);

export const createStudyPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { goal: string; weeks?: number }) => {
    const goal = clip(d?.goal, 300);
    if (!goal) throw new Error("Objetivo inválido");
    const weeks = Math.min(8, Math.max(2, Math.round(Number(d?.weeks) || 4)));
    return { goal, weeks };
  })
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;
    const [{ data: profile }, { data: mems }] = await Promise.all([
      sb.from("profiles").select("belt, stripes, is_competitor").eq("id", uid).maybeSingle(),
      sb.from("ai_memories").select("kind, content").eq("user_id", uid).eq("is_active", true).limit(15),
    ]);
    const memText = (mems ?? []).map((m: { kind: string; content: string }) => `- ${m.kind}: ${m.content}`).join("\n") || "nenhuma";
    const prompt = `Crie um plano de estudo de Jiu-Jitsu com ${data.weeks} semanas.
Atleta: faixa ${profile?.belt ?? "Branca"}, ${profile?.stripes ?? 0} grau(s), competidor: ${profile?.is_competitor ? "sim" : "não"}.
Memória esportiva:\n${memText}
Objetivo geral: "${data.goal}"
Progressão sugerida: fundamentos e distância → controle → progressão/finalização → revisão e aplicação no rola.
Retorne JSON: {"title": string (máx 60 caracteres), "weeks": [{"title": string curto, "focus": string (1 frase), "activities": string[] (3 a 4 atividades práticas e curtas, ex: drills, posicional, revisão)}]} com exatamente ${data.weeks} semanas.`;

    const { data: plan, error } = await generateCoachJson<PlanJson>(prompt);
    if (error || !plan?.weeks?.length) return { ok: false, error: error ?? "O Coach não conseguiu montar o plano. Tente de novo." };

    // Apenas um plano ativo por vez: pausa os demais.
    await sb.from("study_plans").update({ status: "paused" }).eq("user_id", uid).eq("status", "active");
    const { data: created, error: pErr } = await sb
      .from("study_plans")
      .insert({ user_id: uid, goal: data.goal, title: clip(plan.title, 120) || clip(data.goal, 120) })
      .select("id")
      .single();
    if (pErr) {
      console.error("[study-plan]", pErr);
      return { ok: false, error: "Não foi possível salvar o plano." };
    }
    const rows = plan.weeks.slice(0, data.weeks).map((w, i) => ({
      plan_id: created.id,
      user_id: uid,
      week_number: i + 1,
      title: clip(w.title, 80) || `Semana ${i + 1}`,
      focus: clip(w.focus, 240) || null,
      activities: (w.activities ?? []).slice(0, 6).map((t) => ({ text: clip(t, 160), done: false })).filter((a) => a.text),
    }));
    const { error: wErr } = await sb.from("study_plan_weeks").insert(rows);
    if (wErr) {
      console.error("[study-plan-weeks]", wErr);
      await sb.from("study_plans").delete().eq("id", created.id);
      return { ok: false, error: "Não foi possível salvar as semanas do plano." };
    }
    return { ok: true, error: null as string | null };
  });

export const analyzeTraining = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { workoutId: string | null; position: string; difficulty: string; highlight: string }) => ({
    workoutId: d?.workoutId ? clip(d.workoutId, 64) : null,
    position: clip(d?.position, 120),
    difficulty: clip(d?.difficulty, 160),
    highlight: clip(d?.highlight, 200),
  }))
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;
    if (!data.position && !data.difficulty && !data.highlight) return { ok: false, error: "Responda ao menos uma pergunta." };

    const [{ data: profile }, { data: plans }] = await Promise.all([
      sb.from("profiles").select("belt, stripes").eq("id", uid).maybeSingle(),
      sb.from("study_plans").select("id, title, goal").eq("user_id", uid).eq("status", "active").limit(1),
    ]);
    const plan = plans?.[0] ?? null;
    let weeks: { id: string; week_number: number; title: string; activities: Activity[] }[] = [];
    if (plan) {
      const { data: w } = await sb.from("study_plan_weeks").select("id, week_number, title, activities").eq("plan_id", plan.id).order("week_number");
      weeks = w ?? [];
    }
    const current = weeks.find((w) => (w.activities ?? []).some((a) => !a.done)) ?? weeks.at(-1) ?? null;

    const prompt = `Análise pós-treino de um atleta faixa ${profile?.belt ?? "Branca"} (${profile?.stripes ?? 0} grau(s)).
Posição mais trabalhada: ${data.position || "não informado"}
Principal dificuldade: ${data.difficulty || "não informado"}
Destaque do treino: ${data.highlight || "não informado"}
${plan ? `Plano ativo: "${plan.title}" (objetivo: ${plan.goal}). Semana atual: ${current?.title ?? "-"}.` : "Sem plano de estudo ativo."}
Retorne JSON: {"summary": string (2 frases, resumo das observações), "next_focus": string[] (2 a 3 pontos de atenção curtos para a próxima sessão), "new_activity": string | null (uma atividade prática curta para adicionar à semana atual do plano, ou null se não houver plano ou não fizer sentido)}.`;

    const { data: a, error } = await generateCoachJson<AnalysisJson>(prompt);
    if (error || !a) return { ok: false, error: error ?? "O Coach não conseguiu analisar agora." };

    const summary = clip(a.summary, 600);
    const nextFocus = (Array.isArray(a.next_focus) ? a.next_focus : []).map((x) => clip(x, 140)).filter(Boolean).slice(0, 3);

    await sb.from("training_reflections").insert({
      user_id: uid,
      workout_id: data.workoutId,
      position_worked: data.position || null,
      main_difficulty: data.difficulty || null,
      highlight: data.highlight || null,
      ai_summary: summary || null,
      next_focus: nextFocus.join(" · ") || null,
    });

    // Atualiza o plano ativo com o pós-treino.
    let planUpdated = false;
    if (plan) {
      await sb.from("study_plans").update({ attention_notes: nextFocus.join(" · ") || null }).eq("id", plan.id);
      const act = a.new_activity ? clip(a.new_activity, 160) : "";
      if (current && act && !(current.activities ?? []).some((x) => x.text.toLowerCase() === act.toLowerCase())) {
        await sb.from("study_plan_weeks").update({ activities: [...(current.activities ?? []), { text: act, done: false }] }).eq("id", current.id);
        planUpdated = true;
      }
    }

    // Sincroniza com a memória esportiva (sem duplicar).
    const { data: mems } = await sb.from("ai_memories").select("kind, content").eq("user_id", uid).eq("is_active", true);
    const has = (kind: string, c: string) => (mems ?? []).some((m: { kind: string; content: string }) => m.kind === kind && m.content.toLowerCase() === c.toLowerCase());
    const inserts: { user_id: string; kind: string; content: string }[] = [];
    if (data.difficulty && !has("difficulty", data.difficulty)) inserts.push({ user_id: uid, kind: "difficulty", content: data.difficulty });
    if (inserts.length) await sb.from("ai_memories").insert(inserts);

    return { ok: true, error: null as string | null, summary, nextFocus, planUpdated, newActivity: planUpdated ? clip(a.new_activity, 160) : null };
  });
