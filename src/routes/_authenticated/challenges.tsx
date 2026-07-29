import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import {
  Award,
  CalendarCheck,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Gift,
  Target,
  Trophy,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const TABS = ["Ativos", "Disponíveis", "Concluídos"] as const;
type Tab = (typeof TABS)[number];

type Challenge = {
  id: string;
  title: string;
  description: string;
  current: number;
  target: number;
  daysLeft: number | null;
  reward: string;
  icon: React.ElementType;
  status: Exclude<Tab, "Disponíveis"> | "available";
};

const CHALLENGES: Challenge[] = [
  {
    id: "1",
    title: "Desafio 20 Treinos",
    description: "Treine 20 vezes este mês.",
    current: 16,
    target: 20,
    daysLeft: 4,
    reward: "500 XP",
    icon: Dumbbell,
    status: "Ativos",
  },
  {
    id: "2",
    title: "100 Horas no Tatame",
    description: "Acumule 100 horas de treino.",
    current: 78,
    target: 100,
    daysLeft: 12,
    reward: "Emblema Lendário",
    icon: Clock,
    status: "Ativos",
  },
  {
    id: "3",
    title: "Semana Sem Faltar",
    description: "Treine todos os dias da semana.",
    current: 5,
    target: 7,
    daysLeft: 1,
    reward: "250 XP",
    icon: CalendarCheck,
    status: "Ativos",
  },
  {
    id: "4",
    title: "50 Quedas Treinadas",
    description: "Treine 50 quedas diferentes.",
    current: 26,
    target: 50,
    daysLeft: 7,
    reward: "Emblema Mítico",
    icon: Footprints,
    status: "Ativos",
  },
  {
    id: "5",
    title: "Faixa Azul",
    description: "Conquiste a faixa azul com seu professor.",
    current: 0,
    target: 1,
    daysLeft: null,
    reward: "Título especial",
    icon: Award,
    status: "available",
  },
  {
    id: "6",
    title: "Primeira Competição",
    description: "Participe de uma competição oficial.",
    current: 0,
    target: 1,
    daysLeft: null,
    reward: "Emblema Épico",
    icon: Trophy,
    status: "available",
  },
  {
    id: "7",
    title: "30 Dias Seguidos",
    description: "Complete 30 dias de treino consecutivos.",
    current: 30,
    target: 30,
    daysLeft: null,
    reward: "750 XP",
    icon: Flame,
    status: "Concluídos",
  },
  {
    id: "8",
    title: "10 Rolas",
    description: "Complete 10 rolas de sparring.",
    current: 10,
    target: 10,
    daysLeft: null,
    reward: "200 XP",
    icon: Target,
    status: "Concluídos",
  },
];

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const progress = Math.min(100, (challenge.current / challenge.target) * 100);

  return (
    <div className="relative overflow-hidden rounded-2xl border border-white/5 bg-surface p-4 transition-colors hover:border-white/10">
      <div className="flex items-start gap-3">
        <div className="flex min-w-0 flex-1 flex-col">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-semibold">{challenge.title}</h3>
            <span className="shrink-0 text-[10px] font-medium text-brand">{challenge.reward}</span>
          </div>
          <p className="mt-0.5 text-xs text-muted-foreground">{challenge.description}</p>

          <div className="mt-3">
            <div className="flex items-center justify-between text-[11px]">
              <span className="font-semibold text-foreground">
                {challenge.current} / {challenge.target}
              </span>
              {challenge.daysLeft !== null && (
                <span className="text-muted-foreground">{challenge.daysLeft} dias restantes</span>
              )}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div className="h-full rounded-full bg-brand transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>

        <div className="grid size-10 shrink-0 place-items-center rounded-full bg-brand/10 text-brand">
          <Gift className="size-5" />
        </div>
      </div>

      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand/60 to-transparent" />
    </div>
  );
}

function ChallengesPage() {
  const [tab, setTab] = useState<Tab>("Ativos");

  const filtered = CHALLENGES.filter((c) => (tab === "Disponíveis" ? c.status === "available" : c.status === tab));

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center font-sans text-lg font-semibold tracking-tight">Desafios</h1>

        <div className="mt-4 flex rounded-full bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                tab === t ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="mt-6 space-y-3">
          {filtered.map((challenge) => (
            <ChallengeCard key={challenge.id} challenge={challenge} />
          ))}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/challenges")({
  head: () => ({
    meta: [
      { title: "Desafios | Flow Jiu-Jitsu" },
      { name: "description", content: "Desafios ativos, disponíveis e concluídos para impulsionar sua evolução no Jiu-Jitsu." },
      { property: "og:title", content: "Desafios | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Desafios ativos, disponíveis e concluídos para impulsionar sua evolução no Jiu-Jitsu." },
    ],
  }),
  component: ChallengesPage,
});
