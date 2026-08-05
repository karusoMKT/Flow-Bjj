import { supabase } from "@/integrations/supabase/client";

export type RankingPeriod = "month" | "all";
export type RankingScope = "geral" | "competidores";

export type RankingRow = {
  id: string;
  name: string;
  username: string;
  avatarUrl: string | null;
  belt: string | null;
  stripes: number;
  team: string | null;
  isCompetitor: boolean;
  total: number;
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

function startOfMonthISO(): string {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
}

export async function fetchRanking(period: RankingPeriod): Promise<RankingRow[]> {
  let query = supabase.from("workouts").select("user_id, created_at").limit(5000);
  if (period === "month") query = query.gte("created_at", startOfMonthISO());

  const { data: workouts, error } = await query;
  if (error) throw error;

  const counts = new Map<string, number>();
  for (const w of workouts ?? []) {
    counts.set(w.user_id, (counts.get(w.user_id) ?? 0) + 1);
  }

  const { data: profiles, error: profilesError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, belt, stripes, team, is_competitor");
  if (profilesError) throw profilesError;

  return (profiles ?? [])
    .map((p) => ({
      id: p.id,
      name: p.full_name || p.username,
      username: p.username,
      avatarUrl: p.avatar_url,
      belt: p.belt,
      stripes: p.stripes ?? 0,
      team: p.team,
      isCompetitor: p.is_competitor,
      total: counts.get(p.id) ?? 0,
    }))
    .filter((r) => r.total > 0)
    .sort((a, b) => b.total - a.total || a.name.localeCompare(b.name));
}
