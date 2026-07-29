import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Crown } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const TABS = ["Global", "Brasil", "Amigos"] as const;
type Tab = (typeof TABS)[number];

type Athlete = { name: string; team: string; xp: number };

const DATA: Record<Tab, Athlete[]> = {
  Global: [
    { name: "João Santos", team: "Alliance", xp: 2950 },
    { name: "Lucas Mendes", team: "Gracie Barra", xp: 2460 },
    { name: "Pedro Henrique", team: "GFTeam", xp: 2120 },
    { name: "Carlos Oliveira", team: "Checkmat", xp: 1870 },
    { name: "Gabriel Rocha", team: "Atos", xp: 1650 },
    { name: "Rafael Barbosa", team: "Dream Art", xp: 1420 },
    { name: "Felipe Lima", team: "Nova União", xp: 1300 },
  ],
  Brasil: [
    { name: "João Santos", team: "Alliance", xp: 2950 },
    { name: "Lucas Mendes", team: "Gracie Barra", xp: 2460 },
    { name: "Pedro Henrique", team: "GFTeam", xp: 2120 },
    { name: "Carlos Oliveira", team: "Checkmat", xp: 1870 },
    { name: "Gabriel Rocha", team: "Atos", xp: 1650 },
    { name: "Rafael Barbosa", team: "BTT", xp: 1420 },
    { name: "Felipe Lima", team: "Nova União", xp: 1300 },
  ],
  Amigos: [
    { name: "Carlos Oliveira", team: "Checkmat", xp: 1870 },
    { name: "Gabriel Rocha", team: "Atos", xp: 1650 },
    { name: "Felipe Lima", team: "Nova União", xp: 1300 },
    { name: "Marina Souza", team: "Fight Sports", xp: 1180 },
    { name: "Thiago Alves", team: "Alliance", xp: 990 },
  ],
};

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f1f22&color=d7ff3e&bold=true&size=160`;

const PODIUM_STYLE = [
  { ring: "ring-brand", chip: "bg-brand text-brand-foreground", size: "size-20", order: "order-2" },
  { ring: "ring-white/50", chip: "bg-white/80 text-black", size: "size-14", order: "order-1" },
  { ring: "ring-amber-600/70", chip: "bg-amber-600 text-black", size: "size-14", order: "order-3" },
];

function RankingPage() {
  const [tab, setTab] = useState<Tab>("Brasil");
  const list = DATA[tab];
  const podium = list.slice(0, 3);
  const rest = list.slice(3);
  // display order: 2nd, 1st, 3rd
  const podiumDisplay = [podium[1], podium[0], podium[2]];

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center font-sans text-lg font-semibold not-italic tracking-tight">Ranking</h1>

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

        <section className="mt-6 flex items-end justify-center gap-4">
          {podiumDisplay.map((athlete, i) => {
            if (!athlete) return null;
            const rank = podium.indexOf(athlete) + 1;
            const style = PODIUM_STYLE[rank - 1];
            return (
              <div key={athlete.name} className={`flex flex-1 flex-col items-center ${style.order}`}>
                {rank === 1 && <Crown className="mb-1 size-5 text-brand" />}
                <img
                  src={avatarUrl(athlete.name)}
                  alt={athlete.name}
                  loading="lazy"
                  className={`${style.size} rounded-full object-cover ring-2 ${style.ring}`}
                />
                <span
                  className={`-mt-2 rounded-full px-2 py-0.5 text-[10px] font-black ${style.chip}`}
                >
                  {rank}
                </span>
                <p className="mt-1.5 line-clamp-1 text-[11px] font-semibold">{athlete.name}</p>
                <p className="text-[10px] text-muted-foreground">{athlete.xp.toLocaleString("pt-BR")} XP</p>
              </div>
            );
          })}
        </section>

        <ul className="mt-7">
          {rest.map((athlete, i) => (
            <li
              key={athlete.name}
              className="flex items-center gap-3 border-b border-white/5 px-1 py-3 transition-colors last:border-b-0 hover:bg-white/5"
            >
              <span className="w-4 text-center text-xs font-bold text-muted-foreground">{i + 4}</span>
              <img
                src={avatarUrl(athlete.name)}
                alt={athlete.name}
                loading="lazy"
                className="size-9 rounded-full object-cover"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{athlete.name}</p>
                <p className="truncate text-[11px] text-muted-foreground">{athlete.team}</p>
              </div>
              <span className="ml-auto shrink-0 text-right text-xs font-bold tabular-nums text-brand">
                {athlete.xp.toLocaleString("pt-BR")} XP
              </span>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/ranking")({
  head: () => ({
    meta: [
      { title: "Ranking | Flow Jiu-Jitsu" },
      { name: "description", content: "Pódio e ranking de XP dos atletas: global, Brasil e amigos." },
      { property: "og:title", content: "Ranking | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Pódio e ranking de XP dos atletas: global, Brasil e amigos." },
    ],
  }),
  component: RankingPage,
});
