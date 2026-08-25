import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { generateCoachReply, type CoachInput } from "@/lib/coach.server";

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
  .handler(async ({ data }) => generateCoachReply(data));
