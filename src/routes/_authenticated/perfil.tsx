import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut, Pencil, Settings, Flame, Clock, Crown, Dumbbell, Trophy, Medal, Target, Zap } from "lucide-react";
import { DevRoutesMenu } from "@/components/DevRoutesMenu";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { PostCard, PostCardSkeleton, AvatarBubble, type FeedPost } from "@/components/PostCard";
import { beltClass } from "@/lib/feed";
import { AchievementIcon } from "@/components/AchievementModal";
import { fetchAchievements } from "@/lib/achievements";

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

async function fetchProfileData() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");

  const [profileRes, workoutsRes, postsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase.from("workouts").select("id, duration_minutes, created_at").eq("user_id", uid),
    supabase
      .from("posts")
      .select(
        "id, content, image_url, likes_count, created_at, profiles:user_id (full_name, username, avatar_url, belt), workouts:workout_id (duration_minutes, training_type, intensity, location)",
      )
      .eq("user_id", uid)
      .order("created_at", { ascending: false })
      .limit(30),
  ]);

  if (profileRes.error) throw profileRes.error;
  if (workoutsRes.error) throw workoutsRes.error;
  if (postsRes.error) throw postsRes.error;

  const workouts = workoutsRes.data ?? [];
  return {
    profile: profileRes.data,
    workouts,
    totalWorkouts: workouts.length,
    totalMinutes: workouts.reduce((acc, w) => acc + (w.duration_minutes ?? 0), 0),
    posts: (postsRes.data ?? []) as unknown as FeedPost[],
  };
}

/** Contagem de dias consecutivos de treino a partir das datas dos treinos. */
function currentStreak(dates: string[]): number {
  const set = new Set(dates.map((d) => new Date(d).toISOString().slice(0, 10)));
  let streak = 0;
  const cursor = new Date();
  if (!set.has(cursor.toISOString().slice(0, 10))) cursor.setDate(cursor.getDate() - 1);
  while (set.has(cursor.toISOString().slice(0, 10))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

function formatMat(minutes: number): string {
  if (minutes < 60) return `${minutes}min`;
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return m ? `${h}h${String(m).padStart(2, "0")}` : `${h}h`;
}

function Perfil() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["profile"], queryFn: fetchProfileData });
  const { data: trophies = [], isLoading: trophiesLoading } = useQuery({
    queryKey: ["achievements"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user?.id) return [];
      return fetchAchievements(auth.user.id);
    },
  });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const profile = data?.profile;
  const posts = data?.posts ?? [];
  const totalWorkouts = data?.totalWorkouts ?? 0;
  const totalMinutes = data?.totalMinutes ?? 0;
  const streak = currentStreak((data?.workouts ?? []).map((w) => w.created_at));

  const xp = profile?.total_xp ?? 0;
  const xpToNext = 250;
  const level = Math.max(1, Math.floor(xp / xpToNext) + 1);
  const xpInLevel = xp % xpToNext;
  

  const name = profile?.full_name ?? profile?.username ?? "Atleta";
  const identity = [profile?.belt && `Faixa ${profile.belt}`, profile?.team, profile?.professor]
    .filter(Boolean)
    .join(" • ");

  const metrics = [
    { icon: Dumbbell, label: "Treinos", value: String(totalWorkouts) },
    { icon: Clock, label: "No tatame", value: formatMat(totalMinutes) },
    { icon: Flame, label: "Dias seguidos", value: String(streak) },
    { icon: Zap, label: "XP total", value: String(xp) },
  ];

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto flex max-w-md items-center justify-between px-4 pt-6">
        <Link
          to="/settings"
          aria-label="Configurações"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Settings className="size-5" />
        </Link>
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
        {error ? (
          <div className="mt-6 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-foreground">Não foi possível carregar seu perfil.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
            >
              Tentar novamente
            </button>
          </div>
        ) : null}

        <section className="mt-6 flex flex-col items-center text-center">
          <div className="relative">
            {isLoading ? (
              <div className="size-24 animate-pulse rounded-full bg-white/10" />
            ) : (
              <div className="rounded-full ring-2 ring-brand/70">
                <AvatarBubble src={profile?.avatar_url} name={name} className="size-24 text-2xl" />
              </div>
            )}
            <button
              aria-label="Editar perfil"
              className="absolute -bottom-1 -right-1 rounded-full bg-brand p-1.5 text-brand-foreground"
            >
              <Pencil className="size-3.5" />
            </button>
          </div>

          {isLoading ? (
            <>
              <div className="mt-4 h-6 w-40 animate-pulse rounded bg-white/10" />
              <div className="mt-2 h-3 w-52 animate-pulse rounded bg-white/5" />
            </>
          ) : (
            <>
              <h2 className="mt-4 text-2xl font-black italic">{name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{identity || "—"}</p>
              <p className="text-xs text-muted-foreground">{profile?.city ?? "—"}</p>
              <span
                className={`mt-3 inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${beltClass(profile?.belt)}`}
              >
                @{profile?.username ?? "—"}
              </span>
            </>
          )}
        </section>

        <section className="mt-6 grid grid-cols-4 gap-2">
          {metrics.map(({ icon: Icon, label, value }) => (
            <div key={label} className="card-elevated rounded-2xl px-2 py-3 text-center">
              <Icon className="mx-auto size-4 text-brand" />
              {isLoading ? (
                <div className="mx-auto mt-2 h-4 w-8 animate-pulse rounded bg-white/10" />
              ) : (
                <p className="mt-1.5 text-lg font-bold leading-none">{value}</p>
              )}
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
              <p className="mt-0.5 text-[10px] text-muted-foreground">{trophies.length} desbloqueadas</p>
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

        <Link
          to="/premium"
          className="mt-4 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-3.5"
        >
          <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
            <Crown className="size-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold">
              Flow <span className="text-brand">Premium</span>
            </p>
            <p className="text-[11px] text-muted-foreground">IA Coach ilimitado e análise avançada.</p>
          </div>
        </Link>

        <DevRoutesMenu />

        <section className="mt-8">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Minhas conquistas
          </h3>

          {trophiesLoading ? (
            <div className="mt-3 grid grid-cols-3 gap-3">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-28 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : trophies.length === 0 ? (
            <p className="mt-3 rounded-2xl border border-white/5 bg-surface p-6 text-center text-sm text-muted-foreground">
              Nenhum troféu ainda. Registre um treino para desbloquear o primeiro!
            </p>
          ) : (
            <ul className="mt-3 grid grid-cols-3 gap-3">
              {trophies.map((t) => (
                <li
                  key={t.id}
                  className="flex flex-col items-center gap-2 rounded-2xl border border-brand/30 bg-brand/[0.06] px-2 py-4 text-center"
                >
                  <span className="grid size-12 place-items-center rounded-full border border-brand/40 bg-brand/10 text-brand">
                    <AchievementIcon name={t.icon_name} className="size-6" />
                  </span>
                  <p className="text-[11px] font-semibold leading-tight text-foreground">{t.title}</p>
                </li>
              ))}
            </ul>
          )}
        </section>



        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Meus treinos</h3>
            <span className="text-xs font-medium text-brand">
              <Trophy className="mr-1 inline size-3.5" />
              {posts.length}
            </span>
          </div>

          {isLoading ? (
            <ul className="mt-3 flex flex-col gap-4" aria-busy="true">
              <PostCardSkeleton />
              <PostCardSkeleton />
            </ul>
          ) : posts.length === 0 ? (
            <div className="mt-3 rounded-2xl border border-white/5 bg-surface p-6 text-center">
              <p className="text-sm text-muted-foreground">Nenhum treino registrado ainda.</p>
              <Link
                to="/create"
                className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
              >
                Fazer check-in
              </Link>
            </div>
          ) : (
            <ul className="mt-3 flex flex-col gap-4">
              {posts.map((p) => (
                <PostCard key={p.id} post={p} />
              ))}
            </ul>
          )}
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
