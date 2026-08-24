import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  ChevronDown,
  Clock,
  Dumbbell,
  Loader2,
  Medal,
  ChevronLeft,
  Share2,
  Zap,
  BarChart3,
} from "lucide-react";
import { toast } from "sonner";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
} from "recharts";
import { BottomNav } from "@/components/BottomNav";
import { StatsStoryCard } from "@/components/StatsStoryCard";
import { downloadBlob, nodeToPngBlob } from "@/lib/shareService";
import { supabase } from "@/integrations/supabase/client";


const PERIODS = [
  { label: "Últimos 7 dias", days: 7 },
  { label: "Últimos 30 dias", days: 30 },
  { label: "Últimos 90 dias", days: 90 },
  { label: "Este ano", days: 365 },
] as const;

const WEEKDAYS = ["Seg", "Ter", "Qua", "Qui", "Sex", "Sáb", "Dom"];
const MONTHS_SHORT = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];

const LEVEL_CLASS = ["bg-surface-2", "bg-brand/25", "bg-brand/50", "bg-brand/75", "bg-brand"];

type WorkoutRow = { id: string; created_at: string; duration_minutes: number | null; training_type: string | null };

function dayKey(d: Date | string): string {
  const date = typeof d === "string" ? new Date(d) : d;
  return date.toISOString().slice(0, 10);
}

async function fetchStats(days: number) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");

  const since = new Date();
  since.setDate(since.getDate() - (days - 1));
  since.setHours(0, 0, 0, 0);

  const [workoutsRes, compRes, profileRes] = await Promise.all([
    supabase
      .from("workouts")
      .select("id, created_at, duration_minutes, training_type")
      .eq("user_id", uid)
      .gte("created_at", since.toISOString())
      .order("created_at", { ascending: true }),
    supabase
      .from("posts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", uid)
      .like("content", "[COMP]%")
      .gte("created_at", since.toISOString()),
    supabase
      .from("profiles")
      .select("xp, full_name, username, belt, avatar_url")
      .eq("id", uid)
      .maybeSingle(),

  ]);

  if (workoutsRes.error) throw workoutsRes.error;

  const workouts = (workoutsRes.data ?? []) as WorkoutRow[];
  const totalMinutes = workouts.reduce((acc, w) => acc + (w.duration_minutes ?? 0), 0);

  // Contagem agrupada por tipo de treino real
  const byType = workouts.reduce<Record<string, number>>((acc, w) => {
    const key = (w.training_type ?? "Outro").trim() || "Outro";
    acc[key] = (acc[key] ?? 0) + 1;
    return acc;
  }, {});
  const types = Object.entries(byType)
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value);

  // Treinos por dia (para o mapa de calor)
  const perDay = workouts.reduce<Record<string, number>>((acc, w) => {
    const k = dayKey(w.created_at);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

  // Frequência por dia da semana (Seg..Dom)
  const weekdayCounts = [0, 0, 0, 0, 0, 0, 0];
  for (const w of workouts) {
    const idx = (new Date(w.created_at).getDay() + 6) % 7;
    weekdayCounts[idx] += 1;
  }
  const byWeekday = WEEKDAYS.map((label, i) => ({ label, value: weekdayCounts[i] }));

  // Gi x No-Gi
  let gi = 0;
  let noGi = 0;
  for (const w of workouts) {
    const t = (w.training_type ?? "").toLowerCase();
    if (t.includes("no-gi") || t.includes("nogi") || t.includes("no gi")) noGi += 1;
    else if (t.includes("kimono") || t === "gi") gi += 1;
  }

  return {
    totalWorkouts: workouts.length,
    totalCompetitions: compRes.count ?? 0,
    totalMinutes,
    totalXp: profileRes.data?.xp ?? 0,
    profile: {
      athlete: profileRes.data?.full_name ?? "Atleta Flow",
      username: profileRes.data?.username ?? null,
      belt: profileRes.data?.belt ?? null,
      avatarUrl: profileRes.data?.avatar_url ?? null,
    },

    types,
    perDay,
    byWeekday,
    gi,
    noGi,
    since: since.toISOString(),
  };
}

function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (!h) return `${m}m`;
  return m ? `${h}h ${m}m` : `${h}h`;
}

/** Grid semanal (colunas = semanas, linhas = seg..dom) cobrindo o período. */
function buildHeatmap(perDay: Record<string, number>, days: number) {
  const end = new Date();
  end.setHours(0, 0, 0, 0);
  const start = new Date(end);
  start.setDate(start.getDate() - (days - 1));
  // alinha o início na segunda-feira
  const startOffset = (start.getDay() + 6) % 7;
  start.setDate(start.getDate() - startOffset);

  const weeks = Math.ceil((end.getTime() - start.getTime()) / (7 * 86400000)) + 1;
  const rows: { key: string; count: number; inRange: boolean; label: string }[][] = [];
  const monthLabels: string[] = [];

  for (let day = 0; day < 7; day++) {
    const row: { key: string; count: number; inRange: boolean; label: string }[] = [];
    for (let week = 0; week < weeks; week++) {
      const d = new Date(start);
      d.setDate(start.getDate() + week * 7 + day);
      const key = dayKey(d);
      row.push({
        key,
        count: perDay[key] ?? 0,
        inRange: d <= end,
        label: d.toLocaleDateString("pt-BR"),
      });
      if (day === 0) monthLabels.push(MONTHS_SHORT[d.getMonth()]);
    }
    rows.push(row);
  }

  const months = monthLabels.filter((m, i) => i === 0 || m !== monthLabels[i - 1]);
  return { rows, months };
}

function intensityClass(count: number): string {
  if (count <= 0) return LEVEL_CLASS[0];
  if (count === 1) return LEVEL_CLASS[1];
  if (count === 2) return LEVEL_CLASS[2];
  if (count === 3) return LEVEL_CLASS[3];
  return LEVEL_CLASS[4];
}

function ChartTooltip({
  active,
  payload,
  label,
  suffix,
}: {
  active?: boolean;
  payload?: Array<{ name?: string; value?: number }>;
  label?: string;
  suffix?: string;
}) {
  if (!active || !payload?.length) return null;
  const item = payload[0];
  return (
    <div className="rounded-xl border border-brand/30 bg-zinc-900/95 px-3 py-2 shadow-[0_8px_24px_-12px_var(--brand)]">
      <p className="text-[11px] font-semibold text-foreground">{label ?? item.name}</p>
      <p className="text-[11px] text-brand">
        {item.value} {suffix}
      </p>
    </div>
  );
}

function StatisticsPage() {
  const [periodLabel, setPeriodLabel] = useState<string>(PERIODS[1].label);
  const days = PERIODS.find((p) => p.label === periodLabel)?.days ?? 30;

  const { data, isLoading } = useQuery({
    queryKey: ["statistics", days],
    queryFn: () => fetchStats(days),
  });

  const types = data?.types ?? [];
  const maxType = Math.max(1, ...types.map((t) => t.value));
  const totalTypeCount = types.reduce((acc, t) => acc + t.value, 0);
  const topType = types[0];

  const { rows: heatmap, months } = useMemo(
    () => buildHeatmap(data?.perDay ?? {}, days),
    [data?.perDay, days],
  );

  const summary = [
    { icon: Dumbbell, label: "Total de Treinos", value: String(data?.totalWorkouts ?? 0) },
    { icon: Clock, label: "Horas no Tatame", value: formatDuration(data?.totalMinutes ?? 0) },
    { icon: Zap, label: "XP Acumulado", value: String(data?.totalXp ?? 0) },
  ];

  const weekdayData = data?.byWeekday ?? [];
  const gi = data?.gi ?? 0;
  const noGi = data?.noGi ?? 0;
  const modalityTotal = gi + noGi;
  const modalityData = [
    { name: "Gi (Kimono)", value: gi, color: "var(--brand)" },
    { name: "No-Gi", value: noGi, color: "#9ca3af" },
  ].filter((d) => d.value > 0);
  const hasData = (data?.totalWorkouts ?? 0) > 0;

  const shareRef = useRef<HTMLDivElement>(null);
  const [sharing, setSharing] = useState(false);

  const shareData = {
    athlete: data?.profile.athlete ?? "Atleta Flow",
    username: data?.profile.username ?? null,
    belt: data?.profile.belt ?? null,
    avatarUrl: data?.profile.avatarUrl ?? null,
    periodLabel,
    summary: summary.map((s) => ({ label: s.label, value: s.value })),
    weekdays: weekdayData,
    heatmap,
    gi,
    noGi,
  };

  async function handleShare() {
    if (sharing || !shareRef.current) return;
    setSharing(true);
    try {
      const blob = await nodeToPngBlob(shareRef.current);
      if (!blob) throw new Error("Não foi possível gerar a imagem");

      const file = new File([blob], "flow-estatisticas.png", { type: "image/png" });
      const text = `Minhas estatísticas no tatame (${periodLabel}) 🥋 #Flow`;

      if (typeof navigator !== "undefined" && navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], text, title: "Flow" });
          return;
        } catch (e) {
          if ((e as Error)?.name === "AbortError") return;
        }
      }

      downloadBlob(blob, "flow-estatisticas.png");
      toast.success("Imagem salva! Poste no seu Story 🔥");
    } catch (e) {
      toast.error((e as Error)?.message ?? "Não foi possível compartilhar");
    } finally {
      setSharing(false);
    }
  }


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

          <div className="flex items-center gap-2">
            <div className="relative">
              <select
                value={periodLabel}
                onChange={(e) => setPeriodLabel(e.target.value)}
                aria-label="Selecionar período"
                className="appearance-none rounded-full border border-white/10 bg-surface py-2 pl-3 pr-8 text-xs font-medium text-foreground outline-none focus:border-brand/60"
              >
                {PERIODS.map((p) => (
                  <option key={p.label} value={p.label} className="bg-surface">
                    {p.label}
                  </option>
                ))}
              </select>
              <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-3.5 -translate-y-1/2 text-brand" />
            </div>

            <button
              type="button"
              onClick={handleShare}
              disabled={sharing || isLoading}
              aria-label="Compartilhar estatísticas"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-brand text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {sharing ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
            </button>
          </div>
        </header>


        <section className="mt-5 grid grid-cols-3 gap-2">
          {summary.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card-elevated rounded-2xl px-2 py-3 text-center">
              <Icon className="mx-auto size-4 text-brand" />
              {isLoading ? (
                <div className="mx-auto mt-2 h-4 w-10 animate-pulse rounded bg-white/10" />
              ) : (
                <p className="mt-1.5 text-base font-bold leading-none">{value}</p>
              )}
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
          <Medal className="size-3.5 text-brand" />
          {data?.totalCompetitions ?? 0} competição(ões) no período
        </div>

        {!isLoading && !hasData ? (
          <section className="card-elevated mt-4 flex flex-col items-center rounded-2xl px-6 py-10 text-center">
            <span className="flex size-14 items-center justify-center rounded-full bg-brand/10">
              <BarChart3 className="size-7 text-brand" />
            </span>
            <p className="mt-4 text-sm font-semibold">Continue treinando para desbloquear suas estatísticas!</p>
            <p className="mt-1 text-xs text-muted-foreground">
              Seus gráficos aparecem assim que você registrar o primeiro check-in.
            </p>
            <Link
              to="/create"
              className="mt-5 rounded-full bg-brand px-5 py-2.5 text-xs font-bold text-brand-foreground"
            >
              Fazer check-in
            </Link>
          </section>
        ) : (
          <>
            <section className="card-elevated mt-4 rounded-2xl bg-zinc-900/60 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Consistência por dia
              </h2>
              <div className="mt-3 h-44 w-full">
                {isLoading ? (
                  <div className="h-full w-full animate-pulse rounded-xl bg-white/5" />
                ) : (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={weekdayData} margin={{ top: 8, right: 4, left: 4, bottom: 0 }}>
                      <XAxis
                        dataKey="label"
                        tickLine={false}
                        axisLine={false}
                        tick={{ fill: "hsl(0 0% 60%)", fontSize: 11 }}
                      />
                      <Tooltip
                        cursor={{ fill: "rgba(255,255,255,0.05)" }}
                        content={<ChartTooltip suffix="treino(s)" />}
                      />
                      <Bar dataKey="value" radius={[6, 6, 2, 2]} fill="var(--brand)" maxBarSize={26} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </div>
            </section>

            <section className="card-elevated mt-4 rounded-2xl bg-zinc-900/60 p-4">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                Gi vs No-Gi
              </h2>
              {modalityTotal === 0 ? (
                <p className="mt-4 text-xs text-muted-foreground">
                  Registre treinos de Kimono ou No-Gi para ver a distribuição.
                </p>
              ) : (
                <div className="mt-2 flex items-center gap-4">
                  <div className="h-36 w-36 shrink-0">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={modalityData}
                          dataKey="value"
                          nameKey="name"
                          innerRadius={44}
                          outerRadius={64}
                          paddingAngle={3}
                          stroke="none"
                        >
                          {modalityData.map((d) => (
                            <Cell key={d.name} fill={d.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<ChartTooltip suffix="treino(s)" />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <ul className="flex-1 space-y-3 text-xs">
                    {[
                      { label: "Gi (Kimono)", value: gi, color: "var(--brand)" },
                      { label: "No-Gi", value: noGi, color: "#9ca3af" },
                    ].map((m) => (
                      <li key={m.label}>
                        <div className="flex items-center justify-between">
                          <span className="flex items-center gap-2">
                            <span className="size-2.5 rounded-full" style={{ background: m.color }} />
                            {m.label}
                          </span>
                          <span className="font-semibold">
                            {Math.round((m.value / modalityTotal) * 100)}%
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 overflow-hidden rounded-full bg-surface-2">
                          <div
                            className="h-full rounded-full"
                            style={{ width: `${(m.value / modalityTotal) * 100}%`, background: m.color }}
                          />
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </>
        )}

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
                <span key={d} className="flex h-[9px] items-center text-[9px] leading-none text-muted-foreground">
                  {d}
                </span>
              ))}
            </div>
            <div className="min-w-0 flex-1 overflow-x-auto scrollbar-hide">
              <div className="flex flex-col gap-[3px]">
                {heatmap.map((row, day) => (
                  <div key={day} className="flex gap-[3px]">
                    {row.map((cell) => (
                      <span
                        key={cell.key}
                        title={`${cell.label} · ${cell.count} treino(s)`}
                        className={`size-[9px] shrink-0 rounded-[2px] ${
                          cell.inRange ? intensityClass(cell.count) : "bg-transparent"
                        }`}
                      />
                    ))}
                  </div>
                ))}
              </div>
              <div className="mt-2 flex justify-between text-[9px] text-muted-foreground">
                {months.map((m, i) => (
                  <span key={`${m}-${i}`}>{m}</span>
                ))}
              </div>
            </div>
          </div>
        </section>

        <section className="card-elevated mt-4 rounded-2xl p-4">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Treinos por tipo</h2>

          {isLoading ? (
            <div className="mt-4 space-y-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-4 w-full animate-pulse rounded bg-white/5" />
              ))}
            </div>
          ) : types.length === 0 ? (
            <p className="mt-4 text-xs text-muted-foreground">
              Nenhum treino registrado neste período. Faça um check-in para começar.
            </p>
          ) : (
            <div className="mt-4 flex items-center gap-6">
              <ul className="flex-1 space-y-3">
                {types.map((t) => (
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

              {topType && (
                <div className="relative size-24 shrink-0">
                  <svg viewBox="0 0 36 36" className="size-24 -rotate-90">
                    <circle cx="18" cy="18" r="15.9155" fill="none" className="stroke-surface-2" strokeWidth="4" />
                    <circle
                      cx="18"
                      cy="18"
                      r="15.9155"
                      fill="none"
                      className="stroke-brand"
                      strokeWidth="4"
                      strokeLinecap="round"
                      strokeDasharray={`${(topType.value / Math.max(1, totalTypeCount)) * 100} 100`}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-sm font-bold leading-none">{topType.value}</span>
                    <span className="max-w-[60px] truncate text-[9px] text-muted-foreground">{topType.label}</span>
                  </div>
                </div>
              )}
            </div>
          )}
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
      {
        name: "description",
        content: "Tempo no tatame, treinos por tipo, competições e o mapa de calor real dos seus treinos.",
      },
      { property: "og:title", content: "Estatísticas | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Tempo no tatame, treinos por tipo, competições e o mapa de calor real dos seus treinos.",
      },
    ],
  }),
  component: StatisticsPage,
});
