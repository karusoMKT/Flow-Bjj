import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { ChevronDown, Clock, Dumbbell, Flame, ChevronLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const PERIODS = ["Últimos 7 dias", "Últimos 30 dias", "Últimos 90 dias", "Este ano"] as const;

const SUMMARY = [
  { icon: Clock, label: "Tempo total", value: "24h 30m" },
  { icon: Dumbbell, label: "Treinos", value: "18" },
  { icon: Flame, label: "Calorias", value: "12.450" },
];

const TYPES = [
  { label: "Rolas", value: 42 },
  { label: "Técnica", value: 28 },
  { label: "Drilling", value: 16 },
  { label: "Físico", value: 9 },
  { label: "Open Mat", value: 5 },
];

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const LEVEL_CLASS = [
  "bg-surface-2",
  "bg-brand/25",
  "bg-brand/50",
  "bg-brand/75",
  "bg-brand",
];

function useHeatmap() {
  return useMemo(() => {
    // deterministic pseudo-random so SSR and client match
    const cells: number[][] = [];
    for (let day = 0; day < 7; day++) {
      const row: number[] = [];
      for (let week = 0; week < 26; week++) {
        const n = (day * 31 + week * 17 + ((day * week) % 7)) % 11;
        row.push(n > 6 ? 0 : Math.min(4, n));
      }
      cells.push(row);
    }
    return cells;
  }, []);
}

function StatisticsPage() {
  const [period, setPeriod] = useState<string>(PERIODS[1]);
  const heatmap = useHeatmap();
  const maxType = Math.max(...TYPES.map((t) => t.value));
  const totalType = TYPES.reduce((acc, t) => acc + t.value, 0);

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link
              to="/perfil"
              className="flex size-9 items-center justify-center rounded-full bg-surface text-muted-foreground"
              aria-label="Voltar"
            >
              <ChevronLeft className="size-5" />
            </Link>
            <h1 className="font-sans text-xl font-semibold">Estatísticas</h1>
          </div>

          <div className="relative">
            <select
              value={period}
              onChange={(e) => setPeriod(e.target.value)}
              aria-label="Selecionar período"
              className="appearance-none rounded-full border border-white/10 bg-surface py-2 pl-3 pr-8 text-xs font-medium text-foreground outline-none focus:border-brand/60"
            >
              {PERIODS.map((p) => (
                <option key={p} value={p} className="bg-surface">
                  {p}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-brand" />
          </div>
        </header>

        <section className="mt-5 grid grid-cols-3 gap-2">
          {SUMMARY.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card-elevated rounded-2xl px-2 py-3 text-center">
              <Icon className="mx-auto size-4 text-brand" />
              <p className="mt-1.5 text-base font-bold leading-none">{value}</p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="card-elevated mt-4 rounded-2xl p-4">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Mapa de calor</h2>
            <div className="flex items-center gap-1">
              <span className="mr-1 text-[10px] text-muted-foreground">Menos</span>
              {LEVEL_CLASS.map((c, i) => (
                <span key={i} className={`size-2.5 rounded-[3px] ${c}`} />
              ))}
              <span className="ml-1 text-[10px] text-muted-foreground">Mais</span>
            </div>
          </div>

          <div className="mt-3 flex gap-1">
            <div className="flex shrink-0 flex-col gap-[3px]">
              {WEEKDAYS.map((d) => (
                <span
                  key={d}
                  className="flex h-[9px] items-center text-[9px] leading-none text-muted-foreground"
                >
                  {d}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex flex-col gap-[3px]">
                {heatmap.map((row, day) => (
                  <div key={day} className="flex gap-[3px]">
                    {row.map((level, week) => (
                      <span
                        key={week}
                        title={`${WEEKDAYS[day]} · semana ${week + 1}`}
                        className={`size-[9px] shrink-0 rounded-[2px] ${LEVEL_CLASS[level]}`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                {MONTHS.slice(0, 6).map((m) => (
                  <span key={m}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card-elevated mt-4 rounded-2xl p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Treinos por tipo</h2>

          <div className="mt-4 flex items-center gap-4">
            <ul className="flex-1 space-y-3">
              {TYPES.map((t) => (
                <li key={t.label}>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-foreground/90">{t.label}</span>
                    <span className="text-muted-foreground">{t.value}</span>
                  </div>
                  <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                    <div
                      className="h-full rounded-full bg-brand"
                      style={{ width: `${(t.value / maxType) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>

            <div className="relative size-24 shrink-0">
              <svg viewBox="0 0 36 36" className="size-24 -rotate-90">
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  className="stroke-surface-2"
                  strokeWidth="4"
                />
                <circle
                  cx="18"
                  cy="18"
                  r="15.9155"
                  fill="none"
                  className="stroke-brand"
                  strokeWidth="4"
                  strokeLinecap="round"
                  strokeDasharray={`${(TYPES[0].value / totalType) * 100} 100`}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold leading-none">{TYPES[0].value}</span>
                <span className="text-[9px] text-muted-foreground">rolas</span>
              </div>
            </div>
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/statistics")({
  head: () => ({
    meta: [
      { title: "Estatísticas | Flow Jiu-Jitsu" },
      { name: "description", content: "Acompanhe tempo no tatame, treinos, calorias e o mapa de calor dos seus treinos." },
      { property: "og:title", content: "Estatísticas | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Acompanhe tempo no tatame, treinos, calorias e o mapa de calor dos seus treinos." },
    ],
  }),
  component: StatisticsPage,
});
