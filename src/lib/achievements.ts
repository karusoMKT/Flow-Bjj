import { supabase } from "@/integrations/supabase/client";

export type Achievement = {
  id: string;
  title: string;
  description: string | null;
  icon_name: string;
  unlocked_at: string;
};

export type AchievementDef = {
  key: string;
  title: string;
  description: string;
  icon_name: string;
};

/** Catálogo de conquistas do Flow. */
export const ACHIEVEMENTS = {
  first_training: {
    key: "first_training",
    title: "Primeiro Treino",
    description: "Você deu o primeiro passo na sua jornada!",
    icon_name: "Trophy",
  },
  ten_trainings: {
    key: "10_trainings",
    title: "Constância (10 Treinos)",
    description: "Dez treinos no tatame. A consistência começou.",
    icon_name: "Flame",
  },
  hundred_trainings: {
    key: "100_trainings",
    title: "Centurião (100 Treinos)",
    description: "Cem treinos registrados. Você é referência!",
    icon_name: "Crown",
  },
  seven_days_streak: {
    key: "7_days_streak",
    title: "Semana Perfeita",
    description: "Sete dias seguidos de treino. Ofensiva impecável!",
    icon_name: "CalendarCheck",
  },
  first_competition: {
    key: "first_competition",
    title: "Primeira Competição",
    description: "Sua primeira vez nos tatames de guerra! A glória te espera.",
    icon_name: "Swords",
  },
  first_victory: {
    key: "first_victory",
    title: "Primeira Medalha",
    description: "Você subiu ao pódio pela primeira vez. Oss!",
    icon_name: "Medal",
  },
  stripe_promotion: {
    key: "stripe_promotion",
    title: "Novo Grau",
    description: "Mais um grau na faixa. Evolução reconhecida!",
    icon_name: "Star",
  },
  belt_promotion: {
    key: "belt_promotion",
    title: "Nova Faixa",
    description: "Graduação conquistada. Uma nova etapa começa.",
    icon_name: "Award",
  },
} satisfies Record<string, AchievementDef>;

/* ------------------------------------------------------------------ */
/* Concessão segura (sem duplicidade)                                  */
/* ------------------------------------------------------------------ */

/** Títulos que o usuário já possui. */
export async function fetchOwnedTitles(userId: string): Promise<Set<string>> {
  const { data } = await supabase
    .from("user_achievements")
    .select("title")
    .eq("user_id", userId);
  return new Set((data ?? []).map((r) => r.title));
}

/**
 * Concede uma conquista única.
 * Só insere quando a condição é verdadeira e o usuário ainda não a possui
 * (índice único em user_id+title garante a integridade no banco).
 */
export async function grantOnce(
  userId: string,
  def: AchievementDef,
  condition: boolean,
  owned?: Set<string>,
): Promise<Achievement | null> {
  if (!condition) return null;
  if (owned?.has(def.title)) return null;

  if (!owned) {
    const { data: existing } = await supabase
      .from("user_achievements")
      .select("id")
      .eq("user_id", userId)
      .eq("title", def.title)
      .maybeSingle();
    if (existing) return null;
  }

  const { data, error } = await supabase
    .from("user_achievements")
    .insert({
      user_id: userId,
      title: def.title,
      description: def.description,
      icon_name: def.icon_name,
    })
    .select("id, title, description, icon_name, unlocked_at")
    .maybeSingle();

  if (error || !data) return null;
  owned?.add(def.title);
  return data as Achievement;
}

/* ------------------------------------------------------------------ */
/* Consultas de progresso                                              */
/* ------------------------------------------------------------------ */

export async function countWorkouts(userId: string): Promise<number> {
  const { count } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);
  return count ?? 0;
}

export async function countCompetitions(userId: string): Promise<number> {
  const { count } = await supabase
    .from("posts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .like("content", "[COMP]%");
  return count ?? 0;
}

const DAY = 86_400_000;
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

/** True quando há treino em cada um dos últimos 7 dias (incluindo hoje). */
export async function hasSevenDayStreak(userId: string): Promise<boolean> {
  const since = new Date(Date.now() - 8 * DAY).toISOString();
  const { data } = await supabase
    .from("workouts")
    .select("created_at")
    .eq("user_id", userId)
    .gte("created_at", since);

  const days = new Set((data ?? []).map((w) => dayKey(w.created_at)));
  for (let i = 0; i < 7; i++) {
    if (!days.has(dayKey(new Date(Date.now() - i * DAY)))) return false;
  }
  return true;
}

/** Um resultado é medalha quando não é apenas participação. */
export function isMedal(placement: string): boolean {
  return /ouro|prata|bronze|1º|2º|3º/i.test(placement);
}

/* ------------------------------------------------------------------ */
/* Motor de conquistas                                                 */
/* ------------------------------------------------------------------ */

/** Roda após um check-in de TREINO. Retorna as conquistas recém-desbloqueadas. */
export async function runWorkoutAchievements(userId: string): Promise<Achievement[]> {
  const [owned, total, streak] = await Promise.all([
    fetchOwnedTitles(userId),
    countWorkouts(userId),
    hasSevenDayStreak(userId),
  ]);

  const unlocked: Achievement[] = [];
  const checks: Array<[AchievementDef, boolean]> = [
    [ACHIEVEMENTS.first_training, total >= 1],
    [ACHIEVEMENTS.ten_trainings, total >= 10],
    [ACHIEVEMENTS.hundred_trainings, total >= 100],
    [ACHIEVEMENTS.seven_days_streak, streak],
  ];

  for (const [def, condition] of checks) {
    const earned = await grantOnce(userId, def, condition, owned);
    if (earned) unlocked.push(earned);
  }
  return unlocked;
}

/** Roda após um check-in de COMPETIÇÃO. */
export async function runCompetitionAchievements(
  userId: string,
  placement: string,
): Promise<Achievement[]> {
  const [owned, total] = await Promise.all([fetchOwnedTitles(userId), countCompetitions(userId)]);

  const unlocked: Achievement[] = [];
  const checks: Array<[AchievementDef, boolean]> = [
    [ACHIEVEMENTS.first_competition, total >= 1],
    [ACHIEVEMENTS.first_victory, isMedal(placement)],
  ];

  for (const [def, condition] of checks) {
    const earned = await grantOnce(userId, def, condition, owned);
    if (earned) unlocked.push(earned);
  }
  return unlocked;
}

/** Gatilho pronto para a tela de Editar Perfil: ganhou um grau. */
export async function runStripePromotionAchievement(userId: string): Promise<Achievement[]> {
  const earned = await grantOnce(userId, ACHIEVEMENTS.stripe_promotion, true);
  return earned ? [earned] : [];
}

/** Gatilho pronto para a tela de Editar Perfil: nova faixa. */
export async function runBeltPromotionAchievement(userId: string): Promise<Achievement[]> {
  const earned = await grantOnce(userId, ACHIEVEMENTS.belt_promotion, true);
  return earned ? [earned] : [];
}

/* ------------------------------------------------------------------ */

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select("id, title, description, icon_name, unlocked_at")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Achievement[];
}
