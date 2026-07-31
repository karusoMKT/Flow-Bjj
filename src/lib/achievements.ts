import { supabase } from "@/integrations/supabase/client";

export type Achievement = {
  id: string;
  title: string;
  description: string | null;
  icon_name: string;
  unlocked_at: string;
};

type Rule = {
  title: string;
  description: string;
  icon_name: string;
  /** Retorna true quando o marco é atingido com a contagem atual de treinos. */
  test: (totalWorkouts: number) => boolean;
};

/** Adicione novas condições aqui — a verificação é automática. */
export const ACHIEVEMENT_RULES: Rule[] = [
  {
    title: "Primeiro Treino",
    description: "Você deu o primeiro passo na sua jornada!",
    icon_name: "Trophy",
    test: (n) => n === 1,
  },
  {
    title: "10 Treinos",
    description: "Consistência é o caminho da faixa preta.",
    icon_name: "Flame",
    test: (n) => n === 10,
  },
  {
    title: "50 Treinos",
    description: "Meio século de tatame. Respeito!",
    icon_name: "Medal",
    test: (n) => n === 50,
  },
  {
    title: "100 Treinos",
    description: "Cem treinos registrados. Você é referência!",
    icon_name: "Crown",
    test: (n) => n === 100,
  },
];

/**
 * Verifica os marcos após um treino e grava as conquistas desbloqueadas.
 * Retorna as conquistas recém-desbloqueadas (para exibir o modal).
 */
export async function checkAchievements(userId: string): Promise<Achievement[]> {
  const { count, error } = await supabase
    .from("workouts")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId);

  if (error || count == null) return [];

  const matched = ACHIEVEMENT_RULES.filter((rule) => rule.test(count));
  if (!matched.length) return [];

  const { data, error: insertError } = await supabase
    .from("user_achievements")
    .insert(
      matched.map((rule) => ({
        user_id: userId,
        title: rule.title,
        description: rule.description,
        icon_name: rule.icon_name,
      })),
    )
    .select("id, title, description, icon_name, unlocked_at");

  if (insertError) return [];
  return (data ?? []) as Achievement[];
}

export async function fetchAchievements(userId: string): Promise<Achievement[]> {
  const { data, error } = await supabase
    .from("user_achievements")
    .select("id, title, description, icon_name, unlocked_at")
    .eq("user_id", userId)
    .order("unlocked_at", { ascending: false });
  if (error) throw error;
  return (data ?? []) as Achievement[];
}
