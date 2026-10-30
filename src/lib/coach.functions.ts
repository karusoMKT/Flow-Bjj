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
    // Busca o perfil real do atleta autenticado (não confia no cliente).
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const sb = context.supabase as any;
    const [{ data: profile }, { count }] = await Promise.all([
      sb
        .from("profiles")
        .select("full_name, belt, stripes, created_at, is_competitor")
        .eq("id", context.userId)
        .maybeSingle(),
      sb
        .from("workouts")
        .select("id", { count: "exact", head: true })
        .eq("user_id", context.userId),
    ]);

    const athlete: AthleteContext = {
      name: profile?.full_name ?? null,
      belt: profile?.belt ?? data.belt,
      stripes: profile?.stripes ?? data.stripes,
      trainingSince: profile?.created_at ?? null,
      totalWorkouts: count ?? 0,
      isCompetitor: !!profile?.is_competitor,
    };

    return generateCoachReply(data, athlete);
  });
