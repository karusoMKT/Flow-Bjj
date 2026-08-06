import { supabase } from "@/integrations/supabase/client";

export type RankingPeriod = "week" | "lastMonth";
export type RankingScope = "academia" | "geral";

export type RankingRow = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  belt: string | null;
  stripes: number;
  team: string | null;
  academy: string | null;
  isCompetitor: boolean;
  isChampion: boolean;
  total: number;
  minutes: number;
  xp: number;
};

export const BELT_COLORS: Record<string, string> = {
  branca: "#E5E5E5",
  azul: "#2563EB",
  roxa: "#7C3AED",
  marrom: "#78350F",
  preta: "#111111",
  coral: "#FB7185",
  vermelha: "#DC2626",
};

export function beltColor(belt: string | null): string {
  if (!belt) return BELT_COLORS.branca;
  return BELT_COLORS[belt.trim().toLowerCase()] ?? BELT_COLORS.branca;
}

/** XP por treino registrado (competição vale mais). */
function workoutXp(trainingType: string | null): number {
  return (trainingType ?? "").toLowerCase().startsWith("competi") ? 150 : 50;
}

/** Intervalo do período: semana atual (seg→dom) ou mês passado inteiro. */
export function periodRange(period: RankingPeriod): { from: Date; to: Date } {
  const now = new Date();
  if (period === "week") {
    const day = (now.getDay() + 6) % 7; // 0 = segunda
    const from = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
    const to = new Date(from.getFullYear(), from.getMonth(), from.getDate() + 7);
    return { from, to };
  }
  const from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const to = new Date(now.getFullYear(), now.getMonth(), 1);
  return { from, to };
}

export function normalizeAcademy(value: string | null | undefined): string | null {
  const v = (value ?? "").trim().toLowerCase();
  return v.length ? v : null;
}

export async function fetchRanking(period: RankingPeriod): Promise<RankingRow[]> {
  const { from, to } = periodRange(period);

  const { data: workouts, error } = await supabase
    .from("workouts")
    .select("user_id, duration_minutes, training_type, created_at")
    .gte("created_at", from.toISOString())
    .lt("created_at", to.toISOString())
    .limit(5000);
  if (error) throw error;

  const stats = new Map<string, { total: number; minutes: number; xp: number }>();
  for (const w of workouts ?? []) {
    const s = stats.get(w.user_id) ?? { total: 0, minutes: 0, xp: 0 };
    s.total += 1;
    s.minutes += w.duration_minutes ?? 0;
    s.xp += workoutXp(w.training_type);
    stats.set(w.user_id, s);
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, belt, stripes, team, home_academy, is_competitor, is_weekly_champion");
  if (profilesError) throw profilesError;

  return (profiles ?? [])
    .map((p) => {
      const s = stats.get(p.id) ?? { total: 0, minutes: 0, xp: 0 };
      return {
        id: p.id,
        name: p.full_name || p.username,
        username: p.username,
        avatarUrl: p.avatar_url,
        belt: p.belt,
        stripes: p.stripes ?? 0,
        team: p.team,
        academy: p.home_academy ?? p.team ?? null,
        isCompetitor: p.is_competitor,
        isChampion: !!p.is_weekly_champion,
        total: s.total,
        minutes: s.minutes,
        xp: s.xp,
      };
    })
    .filter((r) => r.total > 0)
    .sort((a, b) => b.xp - a.xp || b.minutes - a.minutes || a.name.localeCompare(b.name));
}
