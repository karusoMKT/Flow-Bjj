import { supabase } from "@/integrations/supabase/client";
import { beltIndex, fetchOwnedTitles, grantOnce, type AchievementDef } from "@/lib/achievements";

export type ChallengeStatus = "active" | "available" | "completed";

export type Challenge = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  daysLeft: number | null;
  reward: string;
  icon_name: string;
  status: ChallengeStatus;
};

const DAY = 86_400_000;
const dayKey = (d: Date | string) => new Date(d).toISOString().slice(0, 10);

function startOfMonth(): Date {
  const now = new Date();
  return new Date(now.getFullYear(), now.getMonth(), 1);
}

function daysLeftInMonth(): number {
  const now = new Date();
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return Math.max(0, Math.ceil((end.getTime() - now.getTime()) / DAY));
}

/** Segunda-feira da semana atual. */
function startOfWeek(): Date {
  const now = new Date();
  const day = (now.getDay() + 6) % 7; // 0 = segunda
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
  return d;
}

function daysLeftInWeek(): number {
  const start = startOfWeek().getTime();
  const end = start + 7 * DAY;
  return Math.max(0, Math.ceil((end - Date.now()) / DAY));
}

/** Maior ofensiva atual (dias consecutivos terminando hoje ou ontem). */
function currentStreak(dates: Set<string>): number {
  const today = dayKey(new Date());
  const yesterday = dayKey(new Date(Date.now() - DAY));
  let cursor = dates.has(today) ? 0 : dates.has(yesterday) ? 1 : -1;
  if (cursor < 0) return 0;

  let streak = 0;
  while (dates.has(dayKey(new Date(Date.now() - cursor * DAY)))) {
    streak++;
    cursor++;
  }
  return streak;
}

function statusFor(current: number, target: number): ChallengeStatus {
  if (current >= target) return "completed";
  return current > 0 ? "active" : "available";
}

/** Emblema concedido ao concluir um desafio (registrado em user_achievements). */
function rewardDef(challenge: Challenge): AchievementDef {
  return {
    key: `challenge_${challenge.id}`,
    title: `Desafio: ${challenge.title}`,
    description: `Desafio concluído — recompensa: ${challenge.reward}.`,
    icon_name: challenge.icon_name,
    category: "Jornada",
  };
}

/** Registra a recompensa dos desafios recém-concluídos (uma única vez). */
export async function grantChallengeRewards(userId: string, challenges: Challenge[]) {
  const completed = challenges.filter((c) => c.status === "completed");
  if (completed.length === 0) return;
  const owned = await fetchOwnedTitles(userId);
  for (const c of completed) {
    await grantOnce(userId, rewardDef(c), true, owned);
  }
}

/** Calcula todos os desafios a partir dos dados reais do usuário. */
export async function fetchChallenges(userId: string): Promise<Challenge[]> {
  const since = new Date(Date.now() - 60 * DAY).toISOString();

  const [workoutsRes, monthRes, profileRes, compRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("created_at, duration_minutes")
      .eq("user_id", userId)
      .gte("created_at", since),
    supabase
      .from("workouts")
      .select("id, duration_minutes", { count: "exact" })
      .eq("user_id", userId)
      .gte("created_at", startOfMonth().toISOString()),
    supabase.from("profiles").select("belt").eq("id", userId).maybeSingle(),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .like("content", "[COMP]%"),
  ]);

  const recent = workoutsRes.data ?? [];
  const days = new Set(recent.map((w) => dayKey(w.created_at)));
  const weekStart = startOfWeek().getTime();
  const weekDays = new Set(
    recent.filter((w) => new Date(w.created_at).getTime() >= weekStart).map((w) => dayKey(w.created_at)),
  );

  const monthCount = monthRes.count ?? 0;

  // Horas totais acumuladas (todas as sessões registradas).
  const { data: allDurations } = await supabase
    .from("workouts")
    .select("duration_minutes")
    .eq("user_id", userId);
  const totalHours = Math.floor(
    (allDurations ?? []).reduce((sum, w) => sum + (w.duration_minutes ?? 0), 0) / 60,
  );

  const competitions = compRes.count ?? 0;
  const belt = beltIndex(profileRes.data?.belt);
  const streak = currentStreak(days);

  const base: Array<Omit<Challenge, "status">> = [
    {
      id: "20_treinos_mes",
      title: "Desafio 20 Treinos",
      description: "Treine 20 vezes este mês.",
      current: Math.min(monthCount, 20),
      target: 20,
      daysLeft: daysLeftInMonth(),
      reward: "500 XP",
      icon_name: "Dumbbell",
    },
    {
      id: "100_horas",
      title: "100 Horas no Tatame",
      description: "Acumule 100 horas de treino.",
      current: Math.min(totalHours, 100),
      target: 100,
      daysLeft: null,
      reward: "Emblema Lendário",
      icon_name: "Clock",
    },
    {
      id: "semana_sem_faltar",
      title: "Semana Sem Faltar",
      description: "Treine todos os dias da semana.",
      current: Math.min(weekDays.size, 7),
      target: 7,
      daysLeft: daysLeftInWeek(),
      reward: "250 XP",
      icon_name: "CalendarCheck",
    },
    {
      id: "30_dias_seguidos",
      title: "30 Dias Seguidos",
      description: "Complete 30 dias de treino consecutivos.",
      current: Math.min(streak, 30),
      target: 30,
      daysLeft: null,
      reward: "750 XP",
      icon_name: "Flame",
    },
    {
      id: "primeira_competicao",
      title: "Primeira Competição",
      description: "Participe de uma competição oficial.",
      current: Math.min(competitions, 1),
      target: 1,
      daysLeft: null,
      reward: "Emblema Épico",
      icon_name: "Trophy",
    },
    {
      id: "faixa_azul",
      title: "Faixa Azul",
      description: "Conquiste a faixa azul com seu professor.",
      current: belt >= 1 ? 1 : 0,
      target: 1,
      daysLeft: null,
      reward: "Título especial",
      icon_name: "Award",
    },
  ];

  const challenges = base.map((c) => ({ ...c, status: statusFor(c.current, c.target) }));

  await grantChallengeRewards(userId, challenges);

  return challenges;
}
