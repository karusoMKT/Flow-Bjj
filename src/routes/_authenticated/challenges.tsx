import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Gift, Trophy, icons } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { fetchChallenges, type Challenge, type ChallengeStatus } from "@/lib/challenges";

const TABS = ["Ativos", "Disponíveis", "Concluídos"] as const;
type Tab = (typeof TABS)[number];

const TAB_STATUS: Record<Tab, ChallengeStatus> = {
  Ativos: "active",
  "Disponíveis": "available",
  "Concluídos": "completed",
};

async function loadChallenges(): Promise<Challenge[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");
  return fetchChallenges(uid);
}

function ChallengeIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (icons as Record<string, React.ElementType>)[name] ?? Trophy;
  return <Icon className={className} strokeWidth={1.8} />;
}

function ChallengeCard({ challenge }: { challenge: Challenge }) {
  const progress = Math.min(100, (challenge.current / challenge.target) * 100);
  const done = challenge.status === "completed";

  return (
    <div
      className={`relative overflow-hidden rounded-2xl border p-4 transition-colors ${
        done ? "border-brand/40 bg-brand/5" : "border-white/5 bg-surface hover:border-white/10"
      }`}
    >
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
              {done ? (
                <span className="font-semibold text-brand">Concluído • recompensa liberada</span>
              ) : (
                challenge.daysLeft !== null && (
                  <span className="text-muted-foreground">{challenge.daysLeft} dias restantes</span>
                )
              )}
            </div>
            <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-surface-2">
              <div
                className={`h-full rounded-full transition-all ${done ? "bg-brand shadow-[0_0_12px_var(--brand)]" : "bg-brand"}`}
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        <div
          className={`grid size-10 shrink-0 place-items-center rounded-full ${
            done ? "bg-brand text-brand-foreground" : "bg-brand/10 text-brand"
          }`}
        >
          {done ? <Gift className="size-5" /> : <ChallengeIcon name={challenge.icon_name} className="size-5" />}
        </div>
      </div>

      <div className="absolute left-0 top-0 h-full w-1 bg-gradient-to-b from-brand/60 to-transparent" />
    </div>
  );
}

function ChallengesPage() {
  const [tab, setTab] = useState<Tab>("Ativos");
  const { data, isLoading } = useQuery({ queryKey: ["challenges"], queryFn: loadChallenges });

  const filtered = useMemo(
    () => (data ?? []).filter((c) => c.status === TAB_STATUS[tab]),
    [data, tab],
  );

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
          {isLoading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
            ))
          ) : filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Nenhum desafio nesta aba por enquanto.
            </p>
          ) : (
            filtered.map((challenge) => <ChallengeCard key={challenge.id} challenge={challenge} />)
          )}
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
