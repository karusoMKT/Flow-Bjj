import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Veja o pódio e a classificação de XP dos atletas de Jiu-Jitsu entre amigos e global.",
      },
      { property: "og:title", content: "Ranking | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Veja o pódio e a classificação de XP dos atletas de Jiu-Jitsu entre amigos e global.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Ranking,
});

const TABS = ["Amigos", "Global"] as const;
type Tab = (typeof TABS)[number];

type Athlete = { name: string; team: string; xp: number; me?: boolean };

const DATA: Record<Tab, Athlete[]> = {
  Amigos: [
    { name: "João Santos", team: "Alliance", xp: 2950 },
    { name: "Maria Almeida", team: "Gracie Barra", xp: 2180 },
    { name: "Lucas Mendes", team: "GFTeam", xp: 1940 },
    { name: "Você", team: "Alliance Barra", xp: 1720, me: true },
    { name: "Carla Dias", team: "Checkmat", xp: 1480 },
    { name: "Rafael Barbosa", team: "Dream Art", xp: 1210 },
  ],
  Global: [
    { name: "Pedro Henrique", team: "GFTeam", xp: 5820 },
    { name: "João Santos", team: "Alliance", xp: 5410 },
    { name: "Gabriel Rocha", team: "Atos", xp: 4990 },
    { name: "Carlos Oliveira", team: "Checkmat", xp: 4320 },
    { name: "Maria Almeida", team: "Gracie Barra", xp: 3870 },
    { name: "Felipe Lima", team: "Nova União", xp: 3510 },
    { name: "Você", team: "Alliance Barra", xp: 1720, me: true },
  ],
};

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?background=1A1A1A&color=D7FF3E&bold=true&name=${encodeURIComponent(name)}`;

const PODIUM_STYLE = [
  { ring: "ring-brand", text: "text-brand", label: "1", size: "size-20", pad: "pt-0" },
  { ring: "ring-zinc-300", text: "text-zinc-300", label: "2", size: "size-16", pad: "pt-8" },
  { ring: "ring-amber-700", text: "text-amber-600", label: "3", size: "size-16", pad: "pt-10" },
];

function Ranking() {
  const [tab, setTab] = useState<Tab>("Amigos");
  const list = DATA[tab];
  const [first, second, third] = list;
  const rest = list.slice(3);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 flex flex-col gap-4 bg-background/95 px-4 py-4 backdrop-blur">
        <h1 className="text-center text-lg font-semibold text-foreground">Ranking</h1>
        <div
          role="tablist"
          aria-label="Escopo do ranking"
          className="mx-auto flex rounded-full border border-white/10 bg-white/[0.04] p-1"
        >
          {TABS.map((t) => (
            <button
              key={t}
              role="tab"
              aria-selected={tab === t}
              onClick={() => setTab(t)}
              className={`rounded-full px-8 py-2 text-sm font-medium transition-colors ${
                tab === t ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4">
        {/* Pódio */}
        <section aria-label="Top 3" className="mt-4 grid grid-cols-3 items-end gap-2">
          {[second, first, third].map((a, i) => {
            const style = PODIUM_STYLE[[1, 0, 2][i]];
            return (
              <div key={a.name} className={`flex flex-col items-center gap-2 ${style.pad}`}>
                <div className="relative">
                  {style.label === "1" && (
                    <Crown className="absolute -top-6 left-1/2 size-6 -translate-x-1/2 fill-brand text-brand" />
                  )}
                  <img
                    src={avatar(a.name)}
                    alt={`Avatar de ${a.name}`}
                    loading="lazy"
                    className={`${style.size} rounded-full ring-2 ${style.ring} ring-offset-2 ring-offset-background`}
                  />
                  <span
                    className={`absolute -bottom-2 left-1/2 flex size-6 -translate-x-1/2 items-center justify-center rounded-full border border-white/10 bg-card text-[11px] font-bold ${style.text}`}
                  >
                    {style.label}
                  </span>
                </div>
                <p className="mt-2 max-w-full truncate text-center text-xs font-medium text-foreground">{a.name}</p>
                <p className={`text-xs font-bold ${style.text}`}>{a.xp.toLocaleString("pt-BR")} XP</p>
              </div>
            );
          })}
        </section>

        {/* Lista */}
        <ul className="mt-10 flex flex-col gap-1">
          {rest.map((a, i) => (
            <li
              key={a.name}
              className={`flex items-center gap-3 rounded-2xl px-3 py-3 ${
                a.me ? "border border-brand/40 bg-white/[0.06]" : "border border-transparent"
              }`}
            >
              <span className="w-5 text-center text-sm font-semibold text-muted-foreground">{i + 4}</span>
              <img src={avatar(a.name)} alt={`Avatar de ${a.name}`} loading="lazy" className="size-10 rounded-full" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">{a.name}</p>
                <p className="truncate text-xs text-muted-foreground">{a.team}</p>
              </div>
              <span className="text-sm font-bold text-brand">{a.xp.toLocaleString("pt-BR")} XP</span>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}
