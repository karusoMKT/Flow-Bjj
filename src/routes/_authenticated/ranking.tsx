import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Crown, Medal, Trophy } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { beltColor, fetchRanking, type RankingPeriod, type RankingScope } from "@/lib/ranking";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Veja quem mais treinou no mês: ranking de treinos de Jiu-Jitsu geral e entre competidores.",
      },
      { property: "og:title", content: "Ranking | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Veja quem mais treinou no mês: ranking de treinos de Jiu-Jitsu geral e entre competidores.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ranking,
});

const SCOPES: { key: RankingScope; label: string }[] = [
  { key: "geral", label: "Geral" },
  { key: "competidores", label: "Competidores" },
];

const PERIODS: { key: RankingPeriod; label: string }[] = [
  { key: "month", label: "Este Mês" },
  { key: "all", label: "Sempre" },
];

const PODIUM = [
  { ring: "ring-[#FFD700]", text: "text-[#FFD700]", size: "size-20", pad: "pt-0" },
  { ring: "ring-[#C0C0C0]", text: "text-[#C0C0C0]", size: "size-16", pad: "pt-8" },
  { ring: "ring-[#CD7F32]", text: "text-[#CD7F32]", size: "size-16", pad: "pt-10" },
];

const fallbackAvatar = (name: string) =>
  `https://ui-avatars.com/api/?background=1A1A1A&color=D7FF3E&bold=true&name=${encodeURIComponent(name)}`;

function BeltDot({ belt }: { belt: string | null }) {
  if (!belt) return null;
  return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <span
        className="size-2 rounded-full ring-1 ring-white/20"
        style={{ backgroundColor: beltColor(belt) }}
        aria-hidden
      />
      {belt}
    </span>
  );
}

function Skeletons() {
  return (
    <div className="animate-pulse">
      <div className="mt-4 grid grid-cols-3 items-end gap-2">
        {[8, 0, 10].map((pad, i) => (
          <div key={i} className="flex flex-col items-center gap-2" style={{ paddingTop: pad * 4 }}>
            <div className={`${i === 1 ? "size-20" : "size-16"} rounded-full bg-white/[0.06]`} />
            <div className="h-3 w-16 rounded bg-white/[0.06]" />
            <div className="h-3 w-10 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
      <div className="mt-10 flex flex-col gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-2xl px-3 py-3">
            <div className="size-5 rounded bg-white/[0.06]" />
            <div className="size-10 rounded-full bg-white/[0.06]" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-32 rounded bg-white/[0.06]" />
              <div className="h-3 w-20 rounded bg-white/[0.06]" />
            </div>
            <div className="h-3 w-12 rounded bg-white/[0.06]" />
          </div>
        ))}
      </div>
    </div>
  );
}

function Ranking() {
  const [scope, setScope] = useState<RankingScope>("geral");
  const [period, setPeriod] = useState<RankingPeriod>("month");
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    supabase.auth.getUser().then(({ data }) => {
      if (active) setMyId(data.user?.id ?? null);
    });
    return () => {
      active = false;
    };
  }, []);

  const { data, isPending, isError } = useQuery({
    queryKey: ["ranking", period],
    queryFn: () => fetchRanking(period),
    staleTime: 60_000,
  });

  const list = (data ?? []).filter((r) => (scope === "competidores" ? r.isCompetitor : true));
  const top3 = list.slice(0, 3);
  const rest = list.slice(3);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 flex flex-col gap-3 bg-background/95 px-4 py-4 backdrop-blur">
        <h1 className="text-center text-lg font-semibold text-foreground">Ranking</h1>
        <div
          role="tablist"
          aria-label="Escopo do ranking"
          className="mx-auto flex rounded-full border border-white/10 bg-white/[0.04] p-1"
        >
          {SCOPES.map((s) => (
            <button
              key={s.key}
              role="tab"
              aria-selected={scope === s.key}
              onClick={() => setScope(s.key)}
              className={`rounded-full px-7 py-2 text-sm font-medium transition-colors ${
                scope === s.key ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>
        <div className="mx-auto flex gap-2">
          {PERIODS.map((p) => (
            <button
              key={p.key}
              aria-pressed={period === p.key}
              onClick={() => setPeriod(p.key)}
              className={`rounded-full border px-4 py-1.5 text-xs font-medium transition-colors ${
                period === p.key
                  ? "border-brand/60 bg-brand/10 text-brand"
                  : "border-white/10 text-muted-foreground hover:text-foreground"
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4">
        {isPending ? (
          <Skeletons />
        ) : isError ? (
          <p className="mt-16 text-center text-sm text-muted-foreground">
            Não foi possível carregar o ranking. Tente novamente.
          </p>
        ) : list.length === 0 ? (
          <div className="mt-20 flex flex-col items-center gap-3 text-center">
            <Trophy className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              Nenhum treino registrado {period === "month" ? "neste mês" : "ainda"}. Faça seu check-in e lidere o
              ranking.
            </p>
          </div>
        ) : (
          <>
            <section aria-label="Top 3" className="mt-4 grid grid-cols-3 items-end gap-2">
              {[top3[1], top3[0], top3[2]].map((a, i) => {
                const style = PODIUM[[1, 0, 2][i]];
                const place = [2, 1, 3][i];
                if (!a) return <div key={`empty-${i}`} />;
                return (
                  <div key={a.id} className={`flex flex-col items-center gap-2 ${style.pad}`}>
                    <div className="relative">
                      {place === 1 ? (
                        <Crown className="absolute -top-6 left-1/2 size-6 -translate-x-1/2 fill-[#FFD700] text-[#FFD700]" />
                      ) : (
                        <Medal className={`absolute -top-5 left-1/2 size-5 -translate-x-1/2 ${style.text}`} />
                      )}
                      <img
                        src={a.avatarUrl || fallbackAvatar(a.name)}
                        alt={`Avatar de ${a.name}`}
                        loading="lazy"
                        className={`${style.size} rounded-full object-cover ring-2 ${style.ring} ring-offset-2 ring-offset-background`}
                      />
                      <span
                        className={`absolute -bottom-2 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-card text-[11px] font-bold ${style.text}`}
                      >
                        {place}
                      </span>
                    </div>
                    <p className="mt-2 max-w-full truncate text-center text-xs font-medium text-foreground">{a.name}</p>
                    <BeltDot belt={a.belt} />
                    <p className={`text-xs font-bold ${style.text}`}>{a.total} treinos</p>
                  </div>
                );
              })}
            </section>

            <ul className="mt-10 flex flex-col gap-1">
              {rest.map((a, i) => (
                <li
                  key={a.id}
                  className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                    a.id === myId ? "border border-brand/40 bg-white/[0.06]" : "border border-transparent"
                  }`}
                >
                  <span className="w-6 text-center text-sm font-semibold text-muted-foreground">{i + 4}º</span>
                  <img
                    src={a.avatarUrl || fallbackAvatar(a.name)}
                    alt={`Avatar de ${a.name}`}
                    loading="lazy"
                    className="size-10 rounded-full object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                    <div className="flex items-center gap-2 truncate">
                      <BeltDot belt={a.belt} />
                      {a.team && <span className="truncate text-xs text-muted-foreground">· {a.team}</span>}
                    </div>
                  </div>
                  <span className="text-sm font-bold text-brand">{a.total}</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </main>

      <BottomNav />
    </div>
  );
}
