import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateCoachReply, type AthleteContext, type CoachInput } from "@/lib/coach.server";

export const askGeminiCoach = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: CoachInput) => {
    if (!data || typeof data.message !== "string" || !data.message.trim()) {
      throw new Error("Mensagem inválida");
    }
    return {
      message: data.message.slice(0, 4000),
      history: Array.isArray(data.history) ? data.history.slice(-12) : [],
      belt: data.belt ?? null,
      stripes: Number.isFinite(data.stripes) ? data.stripes : 0,
    } satisfies CoachInput;
  })
  .handler(async ({ data, context }) => {
    // Todas as consultas usam o cliente do próprio usuário (RLS) e filtram por userId.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const uid = context.userId;
    const now = new Date();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const last30 = new Date(now.getTime() - 30 * 864e5).toISOString();

    const [profileRes, totalRes, monthRes, last30Res, recentRes, memRes] = await Promise.all([
      sb.from("profiles").select("full_name, belt, stripes, created_at, is_competitor").eq("id", uid).maybeSingle(),
      sb.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", uid),
      sb.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", monthStart),
      sb.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", uid).gte("created_at", last30),
      sb
        .from("workouts")
        .select("created_at, training_type, duration_minutes, intensity")
        .eq("user_id", uid)
        .order("created_at", { ascending: false })
        .limit(10),
      sb
        .from("ai_memories")
        .select("kind, content")
        .eq("user_id", uid)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);

    const profile = profileRes.data;
    const athlete: AthleteContext = {
      name: profile?.full_name ?? null,
      belt: profile?.belt ?? data.belt,
      stripes: profile?.stripes ?? data.stripes,
      trainingSince: profile?.created_at ?? null,
      totalWorkouts: totalRes.count ?? 0,
      isCompetitor: !!profile?.is_competitor,
      workoutsThisMonth: monthRes.count ?? 0,
      workoutsLast30: last30Res.count ?? 0,
      recentWorkouts: (recentRes.data ?? []).map(
        (w: { created_at: string; training_type: string | null; duration_minutes: number; intensity: string | null }) => ({
          date: new Date(w.created_at).toLocaleDateString("pt-BR"),
          type: w.training_type,
          minutes: w.duration_minutes,
          intensity: w.intensity,
        }),
      ),
      memories: memRes.data ?? [],
    };

    return generateCoachReply(data, athlete);
  });

const KINDS = ["goal", "favorite_position", "difficulty"] as const;

export const saveCoachMemory = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((data: { kind: string; content: string }) => {
    const content = String(data?.content ?? "").trim().slice(0, 200);
    if (!KINDS.includes(data?.kind as (typeof KINDS)[number]) || !content) throw new Error("Memória inválida");
    return { kind: data.kind, content };
  })
  .handler(async ({ data, context }) => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const { error } = await sb.from("ai_memories").insert({ user_id: context.userId, ...data });
    if (error) {
      console.error("[coach-memory]", error);
      return { ok: false };
    }
    return { ok: true };
  });
