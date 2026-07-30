import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Bot, ChevronRight, Crown, Heart, MessageCircle, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { Logo } from "@/components/Logo";
import { beltClass, timeAgo } from "@/lib/feed";

export const Route = createFileRoute("/_authenticated/home")({
  head: () => ({
    meta: [
      { title: "Feed de treinos | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Veja os treinos recentes da sua equipe e acompanhe a evolução no tatame.",
      },
      { property: "og:title", content: "Feed de treinos | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Veja os treinos recentes da sua equipe e acompanhe a evolução no tatame.",
      },
    ],
  }),
  component: HomeFeed,
});

async function fetchFeed() {
  const { data: sessions, error } = await supabase
    .from("sessions")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  const rows = sessions ?? [];

  const userIds = [...new Set(rows.map((s) => s.user_id))];
  const gymIds = [...new Set(rows.map((s) => s.gym_id).filter(Boolean) as string[])];

  const [profilesRes, gymsRes] = await Promise.all([
    userIds.length
      ? supabase.from("profiles").select("id, username, full_name, belt, team, avatar_url").in("id", userIds)
      : Promise.resolve({ data: [], error: null } as const),
    gymIds.length
      ? supabase.from("gyms").select("id, name, city").in("id", gymIds)
      : Promise.resolve({ data: [], error: null } as const),
  ]);

  const profiles = new Map((profilesRes.data ?? []).map((p) => [p.id, p]));
  const gyms = new Map((gymsRes.data ?? []).map((g) => [g.id, g]));

  return rows.map((s) => ({
    ...s,
    profile: profiles.get(s.user_id),
    gym: s.gym_id ? gyms.get(s.gym_id) : undefined,
  }));
}

function HomeFeed() {
  const { data, isLoading, error } = useQuery({ queryKey: ["feed"], queryFn: fetchFeed });

  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <Logo className="h-8 w-auto" />
        <div className="flex items-center gap-1">
          <Link
            to="/coach"
            aria-label="Abrir IA Coach"
            className="rounded-xl p-1.5 text-brand transition-opacity hover:opacity-80"
          >
            <Sparkles className="size-5" />
          </Link>
          <Link
            to="/notifications"
            aria-label="Ver notificações"
            className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="size-5" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        <h1 className="sr-only">Feed de treinos</h1>

        <Link
          to="/premium"
          className="mb-4 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-3.5"
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
          <ChevronRight className="size-4 shrink-0 text-brand" />
        </Link>

        <Link
          to="/coach"
          className="mb-5 flex items-center gap-3 rounded-2xl border border-brand/40 bg-surface p-4 shadow-[0_0_24px_-12px_var(--brand)]"
        >
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
            <Bot className="size-6" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-bold">IA Coach</p>
            <p className="mt-0.5 text-xs leading-snug text-muted-foreground">
              Analise seus treinos e monte sua estratégia
            </p>
          </div>
          <span className="grid size-8 shrink-0 place-items-center rounded-full bg-brand text-brand-foreground">
            <ChevronRight className="size-4" />
          </span>
        </Link>




        {isLoading && (
          <div className="space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}

        {error && (
          <p className="rounded-xl bg-surface p-4 text-sm text-destructive">
            Não foi possível carregar o feed.
          </p>
        )}

        {data && data.length === 0 && (
          <div className="rounded-2xl bg-surface p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum treino registrado ainda. Faça o seu primeiro check-in!
            </p>
            <Link
              to="/checkin"
              className="mt-4 inline-flex rounded-xl bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground"
            >
              Fazer check-in
            </Link>
          </div>
        )}

        <ul className="space-y-4">
          {data?.map((s) => (
            <li key={s.id} className="card-elevated overflow-hidden rounded-2xl">
              <div className="flex items-center gap-3 p-4">
                <div className="size-11 shrink-0 overflow-hidden rounded-full bg-surface-2">
                  {s.profile?.avatar_url ? (
                    <img
                      src={s.profile.avatar_url}
                      alt={s.profile.full_name ?? "Atleta"}
                      className="size-full object-cover"
                      loading="lazy"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">
                    {s.profile?.full_name ?? s.profile?.username ?? "Atleta"}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    Treinou {Math.floor(s.duration_minutes / 60)}h{s.duration_minutes % 60 || ""} ·{" "}
                    {s.gym?.name ?? "Academia"}
                  </p>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(s.created_at)}</span>
              </div>

              {s.image_url && (
                <img src={s.image_url} alt="Treino" className="h-52 w-full object-cover" loading="lazy" />
              )}

              <div className="flex flex-wrap items-center gap-2 px-4 pt-3">
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${beltClass(s.profile?.belt)}`}>
                  {s.profile?.belt ?? "Faixa"}
                </span>
                {s.session_type && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {s.session_type}
                  </span>
                )}
                {s.profile?.team && (
                  <span className="rounded-full bg-surface-2 px-2.5 py-1 text-[11px] text-muted-foreground">
                    {s.profile.team}
                  </span>
                )}
              </div>

              {s.notes && <p className="px-4 pt-3 text-sm text-foreground/80">{s.notes}</p>}

              <div className="flex items-center gap-5 px-4 py-3 text-muted-foreground">
                <span className="flex items-center gap-1.5 text-xs">
                  <Heart className="size-4" /> Curtir
                </span>
                <span className="flex items-center gap-1.5 text-xs">
                  <MessageCircle className="size-4" /> Comentar
                </span>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}
