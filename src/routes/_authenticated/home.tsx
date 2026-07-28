import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle } from "lucide-react";
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
        <Logo />
        <Bell className="size-5 text-muted-foreground" />
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        <h1 className="sr-only">Feed de treinos</h1>

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
