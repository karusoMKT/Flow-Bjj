import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Pencil, Settings, Flame, Clock, Dumbbell, Trophy, Medal, Target } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { beltClass } from "@/lib/feed";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Sua faixa, equipe, professor, nível de XP e o histórico completo dos seus treinos.",
      },
      { property: "og:title", content: "Meu perfil | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Sua faixa, equipe, professor, nível de XP e o histórico completo dos seus treinos.",
      },
    ],
  }),
  component: Perfil,
});

type SessionRow = {
  id: string;
  session_date: string;
  session_type: string | null;
  duration_minutes: number;
  image_url: string | null;
  gymName?: string;
};

async function fetchProfile() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");

  const [profileRes, sessionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("session_date", { ascending: false })
      .limit(30),
  ]);

  const rows = sessionsRes.data ?? [];
  const gymIds = [...new Set(rows.map((s) => s.gym_id).filter(Boolean) as string[])];
  const gymsRes = gymIds.length
    ? await supabase.from("gyms").select("id, name").in("id", gymIds)
    : { data: [] as { id: string; name: string }[] };
  const gyms = new Map((gymsRes.data ?? []).map((g) => [g.id, g.name]));

  return {
    profile: profileRes.data,
    sessions: rows.map((s) => ({ ...s, gymName: s.gym_id ? gyms.get(s.gym_id) : undefined })) as SessionRow[],
  };
}

/** Contagem de dias consecutivos de treino a partir das datas das sessões. */
function currentStreak(dates: string[]): number {
  const set = new Set(dates);
  let streak = 0;
  const cursor = new Date();
  // tolera não ter treinado hoje ainda
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function Perfil() {
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const profile = data?.profile;
  const sessions = data?.sessions ?? [];
  const totalMin = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);
  const streak = currentStreak(sessions.map((s) => s.session_date));

  // Gamificação — derivada dos treinos (mock até termos tabela de XP/conquistas)
  const xp = sessions.length * 150 + Math.round(totalMin * 1.5);
  const level = Math.max(1, Math.floor(xp / 250) + 1);
  const xpInLevel = xp % 250;
  const xpToNext = 250;
  const achievements = Math.min(15, Math.floor(sessions.length / 2));

  const identity = [profile?.belt && `Faixa ${profile.belt}`, profile?.team, profile?.professor]
    .filter(Boolean)
    .join(" • ");

  const metrics = [
    { icon: Dumbbell, label: "Treinos", value: String(sessions.length) },
    { icon: Clock, label: "No tatame", value: `${Math.round(totalMin / 60)}h` },
    { icon: Flame, label: "Dias seguidos", value: String(streak) },
    { icon: Trophy, label: "Conquistas", value: String(achievements) },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-6">
        <button
          aria-label="Configurações"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="size-5" />
        </button>
        <h1 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground">Perfil</h1>
        <button
          onClick={signOut}
          aria-label="Sair"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <LogOut className="size-5" />
        </button>
      </header>

      <main className="mx-auto max-w-md px-4">
        <section className="mt-6 flex flex-col items-center text-center">
          <div className="relative">
            <div className="size-24 overflow-hidden rounded-full bg-surface-2 ring-2 ring-brand/70">
              {profile?.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.full_name ?? "Foto de perfil"}
                  className="size-full object-cover"
                />
              ) : null}
            </div>
            <button
              aria-label="Editar perfil"
              className="absolute -bottom-1 -right-1 rounded-full bg-brand p-1.5 text-brand-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>

          <h2 className="mt-4 text-2xl font-black italic">
            {isLoading ? "Carregando..." : (profile?.full_name ?? profile?.username ?? "Atleta")}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">{identity || "—"}</p>
          <p className="text-xs text-muted-foreground">{profile?.city ?? "—"}</p>
          <span
            className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${beltClass(profile?.belt)}`}
          >
            @{profile?.username ?? "—"}
          </span>
        </section>

        <section className="mt-6 grid grid-cols-4 gap-2">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card-elevated rounded-2xl px-2 py-3 text-center">
              <Icon className="mx-auto size-4 text-brand" />
              <p className="mt-1.5 text-lg font-bold leading-none">{value}</p>
              <p className="mt-1 text-[10px] leading-tight text-muted-foreground">{label}</p>
            </div>
          ))}
        </section>

        <section className="card-elevated mt-4 rounded-2xl p-4">
          <div className="flex items-baseline justify-between">
            <p className="text-sm font-bold uppercase tracking-wide text-brand">Nível {level}</p>
            <p className="text-xs text-muted-foreground">
              {xpInLevel} / {xpToNext} XP
            </p>
          </div>
          <div className="mt-3 h-2 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand transition-all"
              style={{ width: `${Math.min(100, (xpInLevel / xpToNext) * 100)}%` }}
            />
          </div>
          <p className="mt-2 text-[11px] text-muted-foreground">
            Faltam {xpToNext - xpInLevel} XP para o nível {level + 1}
          </p>
          <Link
            to="/statistics"
            className="mt-3 flex items-center justify-center rounded-xl border border-white/10 bg-surface-2/60 py-2 text-xs font-semibold text-brand"
          >
            Ver estatísticas
          </Link>
        </section>

        <section className="mt-4 grid grid-cols-2 gap-3">
          <Link
            to="/achievements"
            className="card-elevated flex items-center justify-between rounded-2xl p-3.5 transition-colors hover:border-white/10"
          >
            <div>
              <p className="text-xs font-semibold text-foreground">Conquistas</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">12 / 15 emblemas</p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand">
              <Medal className="size-5" />
            </div>
          </Link>

          <Link
            to="/challenges"
            className="card-elevated flex items-center justify-between rounded-2xl p-3.5 transition-colors hover:border-white/10"
          >
            <div>
              <p className="text-xs font-semibold text-foreground">Desafios</p>
              <p className="mt-0.5 text-[10px] text-muted-foreground">4 ativos</p>
            </div>
            <div className="grid size-9 place-items-center rounded-full bg-brand/10 text-brand">
              <Target className="size-5" />
            </div>
          </Link>
        </section>


        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Atividade recente</h3>
            <span className="text-xs font-medium text-brand">Ver tudo</span>
          </div>

          {sessions.length === 0 && !isLoading ? (
            <p className="mt-3 rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
              Nenhum treino registrado ainda.
            </p>
          ) : (
            <ul className="-mx-4 mt-3 flex snap-x gap-3 overflow-x-auto px-4 pb-2">
              {sessions.slice(0, 10).map((s) => (
                <li
                  key={s.id}
                  className="card-elevated relative h-32 w-40 shrink-0 snap-start overflow-hidden rounded-2xl"
                >
                  {s.image_url ? (
                    <img src={s.image_url} alt={s.session_type ?? "Treino"} className="size-full object-cover" />
                  ) : (
                    <div className="size-full bg-surface-2" />
                  )}
                  <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-background to-transparent p-2.5">
                    <p className="truncate text-xs font-semibold">{s.gymName ?? "Academia"}</p>
                    <p className="truncate text-[10px] text-muted-foreground">
                      {new Date(s.session_date).toLocaleDateString("pt-BR")} · {s.duration_minutes}min
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
