import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import {
  Bell,
  Bot,
  Calendar,
  ChevronRight,
  Crown,
  Hand,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Share2,
  Trophy,
} from "lucide-react";
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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: HomeFeed,
});

const EVENTS = [
  { id: "1", title: "Campeonato Regional", meta: "12 ago · São Paulo", icon: Trophy },
  { id: "2", title: "Desafio 30 Dias", meta: "Faltam 11 dias", icon: Calendar },
  { id: "3", title: "Open Interno", meta: "24 ago · Sua academia", icon: Trophy },
  { id: "4", title: "Semana do Drill", meta: "Começa segunda", icon: Calendar },
];

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
        <Link
          to="/notifications"
          aria-label="Ver notificações"
          className="rounded-xl p-1.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <Bell className="size-5" />
        </Link>
      </header>

      <main className="mx-auto max-w-md px-4 py-4">
        <h1 className="sr-only">Feed de treinos</h1>

        {/* Composer */}
        <section className="rounded-2xl border border-white/5 bg-surface p-3.5">
          <Link
            to="/checkin"
            className="block w-full rounded-xl bg-surface-2 px-3.5 py-2.5 text-left text-sm text-muted-foreground"
          >
            Compartilhe seu treino ou pensamento...
          </Link>
          <div className="mt-3 flex items-center gap-2">
            <Link
              to="/checkin"
              className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <ImageIcon className="size-4" /> Foto
            </Link>
            <Link
              to="/checkin"
              className="flex items-center gap-1.5 rounded-full bg-surface-2 px-3 py-1.5 text-[11px] font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              <MapPin className="size-4" /> Academia
            </Link>
            <Link
              to="/checkin"
              className="ml-auto rounded-full bg-brand px-4 py-1.5 text-[11px] font-bold text-brand-foreground"
            >
              Postar
            </Link>
          </div>
        </section>

        {/* Eventos */}
        <section className="mt-5">
          <h2 className="mb-2.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
            Próximos Desafios &amp; Eventos
          </h2>
          <ul className="scrollbar-hide -mx-4 flex gap-2.5 overflow-x-auto px-4 pb-1">
            {EVENTS.map(({ id, title, meta, icon: Icon }) => (
              <li key={id} className="shrink-0">
                <Link
                  to="/challenges"
                  className="flex w-52 items-center gap-2.5 rounded-xl border border-white/5 bg-surface px-3 py-2.5"
                >
                  <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-brand/10 text-brand">
                    <Icon className="size-4" />
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold">{title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{meta}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <Link
          to="/premium"
          className="mt-5 flex items-center gap-3 rounded-2xl border border-brand/30 bg-brand/5 p-3.5"
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

        {isLoading && (
          <div className="mt-5 space-y-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className="h-40 animate-pulse rounded-2xl bg-surface" />
            ))}
          </div>
        )}

        {error && (
          <p className="mt-5 rounded-xl bg-surface p-4 text-sm text-destructive">
            Não foi possível carregar o feed.
          </p>
        )}

        {data && data.length === 0 && (
          <div className="mt-5 rounded-2xl bg-surface p-6 text-center">
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

        <ul className="mt-5 space-y-4">
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
                    {s.gym?.name ?? "Academia"} · há {timeAgo(s.created_at)}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${beltClass(s.profile?.belt)}`}>
                  {s.profile?.belt ?? "Faixa"}
                </span>
              </div>

              <div className="px-4">
                <span className="inline-flex rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                  {s.session_type ?? "Treino"} · {s.duration_minutes} min
                </span>
              </div>

              {s.notes && <p className="px-4 pt-3 text-sm leading-relaxed text-foreground/80">{s.notes}</p>}

              {s.image_url && (
                <img src={s.image_url} alt="Treino" className="mt-3 h-52 w-full object-cover" loading="lazy" />
              )}

              <div className="mt-1 flex items-center gap-1 border-t border-white/5 px-2 py-1.5">
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-brand"
                >
                  <Hand className="size-4" /> Oss!
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <MessageCircle className="size-4" /> Comentar
                </button>
                <button
                  type="button"
                  className="flex flex-1 items-center justify-center gap-1.5 rounded-lg py-2 text-xs font-semibold text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground"
                >
                  <Share2 className="size-4" /> Compartilhar
                </button>
              </div>
            </li>
          ))}
        </ul>
      </main>

      <Link
        to="/coach"
        aria-label="Abrir IA Coach"
        className="fixed bottom-24 right-4 z-50 grid size-14 place-items-center rounded-full bg-brand text-brand-foreground shadow-[0_10px_30px_-8px_var(--brand)]"
      >
        <span className="absolute inset-0 animate-ping rounded-full bg-brand/40" aria-hidden="true" />
        <Bot className="relative size-6" />
      </Link>

      <BottomNav />
    </div>
  );
}
