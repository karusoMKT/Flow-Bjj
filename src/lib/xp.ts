import { supabase } from "@/integrations/supabase/client";

/** Ganhos de XP por tipo de check-in. */
export const XP_REWARDS = {
  treino: 50,
  competicao: 150,
} as const;

/** Nível a partir do XP total: cada nível exige mais que o anterior. */
export function levelFromXp(xp: number): number {
  return Math.max(1, Math.floor(0.1 * Math.sqrt(Math.max(0, xp))) + 1);
}

/** XP total necessário para alcançar um nível. */
export function xpForLevel(level: number): number {
  return Math.pow((Math.max(1, level) - 1) * 10, 2);
}

export type LevelProgress = {
  level: number;
  xp: number;
  currentLevelXp: number;
  nextLevelXp: number;
  xpInLevel: number;
  xpNeeded: number;
  percent: number;
};

/** Progresso detalhado dentro do nível atual (sempre derivado do XP). */
export function levelProgress(xp: number, _savedLevel?: number | null): LevelProgress {
  const level = levelFromXp(xp);
  const currentLevelXp = xpForLevel(level);
  const nextLevelXp = xpForLevel(level + 1);
  const span = Math.max(1, nextLevelXp - currentLevelXp);
  const xpInLevel = Math.max(0, Math.min(span, xp - currentLevelXp));
  return {
    level,
    xp,
    currentLevelXp,
    nextLevelXp,
    xpInLevel,
    xpNeeded: Math.max(0, nextLevelXp - xp),
    percent: Math.max(0, Math.min(100, (xpInLevel / span) * 100)),
  };
}

export type XpAward = {
  gained: number;
  xp: number;
  level: number;
  leveledUp: boolean;
};

/**
 * Concede XP ao usuário e recalcula o nível.
 * Retorna null quando não foi possível ler/gravar o perfil.
 */
export async function awardXp(
  userId: string,
  kind: keyof typeof XP_REWARDS,
): Promise<XpAward | null> {
  const gained = XP_REWARDS[kind];

  const { data: profile, error } = await supabase
    .from("profiles")
    .select("xp, level")
    .eq("id", userId)
    .maybeSingle();

  if (error || !profile) return null;

  const xp = (profile.xp ?? 0) + gained;
  const previousLevel = profile.level ?? 1;
  const level = Math.max(previousLevel, levelFromXp(xp));

  const { error: updateError } = await supabase
    .from("profiles")
    .update({ xp, level, total_xp: xp })
    .eq("id", userId);

  if (updateError) return null;

  return { gained, xp, level, leveledUp: level > previousLevel };
}

/**
 * Recalcula o XP canônico a partir do histórico real:
 * (treinos * 50) + (competições * 150). Grava no perfil quando divergir.
 */
export function computeXp(totalWorkouts: number, totalCompetitions: number): number {
  return totalWorkouts * XP_REWARDS.treino + totalCompetitions * XP_REWARDS.competicao;
}

export async function syncXp(
  userId: string,
  totalWorkouts: number,
  totalCompetitions: number,
  current?: { xp?: number | null; level?: number | null },
): Promise<{ xp: number; level: number }> {
  const xp = computeXp(totalWorkouts, totalCompetitions);
  const level = levelFromXp(xp);

  if (current && current.xp === xp && current.level === level) return { xp, level };

  await supabase.from("profiles").update({ xp, level, total_xp: xp }).eq("id", userId);
  return { xp, level };
}
