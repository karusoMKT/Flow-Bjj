import { createFileRoute, Link } from "@tanstack/react-router";
import { queryOptions, useQuery, useSuspenseQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Building2, CalendarDays, ChevronRight, MapPin, Search, Users } from "lucide-react";
import { ConnectionButton } from "@/components/ConnectionButton";

import { BottomNav } from "@/components/BottomNav";
import { ChampionBadge } from "@/components/ChampionBadge";
import { ProBadge, CompetitorTag } from "@/components/ProBadge";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { fetchRanking, beltColor } from "@/lib/ranking";
import { timeAgo } from "@/lib/feed";

type Author = {
  full_name: string | null;
  username: string;
  avatar_url: string | null;
  belt: string | null;
  is_weekly_champion: boolean | null;
  is_pro: boolean | null;
};

type EventPost = {
  id: string;
  event_title: string | null;
  event_date: string | null;
  event_location: string | null;
  image_url: string | null;
  profiles: Author | null;
};

type MediaPost = {
  id: string;
  content: string | null;
  image_url: string | null;
  created_at: string;
  likes_count: number;
  location: string | null;
  profiles: Author | null;
};

type ProfileRow = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  belt: string | null;
  home_academy: string | null;
  team: string | null;
  is_weekly_champion: boolean | null;
  is_pro: boolean | null;
  is_competitor: boolean | null;
};

const AUTHOR = "profiles:user_id (full_name, username, avatar_url, belt, is_weekly_champion, is_pro)";

async function fetchTrendingEvents(): Promise<EventPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`id, event_title, event_date, event_location, image_url, ${AUTHOR}`)
    .eq("post_type", "event")
    .gte("event_date", new Date().toISOString())
    .order("event_date", { ascending: true })
    .limit(12);
  if (error) throw error;
  return (data ?? []) as unknown as EventPost[];
}

async function fetchMedia(): Promise<MediaPost[]> {
  const { data, error } = await supabase
    .from("posts")
    .select(`id, content, image_url, created_at, likes_count, location, ${AUTHOR}`)
    .not("image_url", "is", null)
    .order("created_at", { ascending: false })
    .limit(30);
  if (error) throw error;
  return (data ?? []) as unknown as MediaPost[];
}

async function fetchAthletes(): Promise<{ champions: ProfileRow[]; newcomers: ProfileRow[] }> {
  const ranking = await fetchRanking("week");
  const topIds = ranking.slice(0, 3).map((r) => r.id);

  const { data: recent, error } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, belt, home_academy, team, is_weekly_champion, is_pro, is_competitor")
    .order("created_at", { ascending: false })
    .limit(12);
  if (error) throw error;

  const all = (recent ?? []) as ProfileRow[];
  const byId = new Map(all.map((p) => [p.id, p]));

  let champions = topIds.map((id) => byId.get(id)).filter(Boolean) as ProfileRow[];
  if (champions.length < topIds.length) {
    const missing = topIds.filter((id) => !byId.has(id));
    if (missing.length) {
      const { data: extra } = await supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, belt, home_academy, team, is_weekly_champion, is_pro, is_competitor")
        .in("id", missing);
      champions = topIds
        .map((id) => byId.get(id) ?? (extra as ProfileRow[] | null)?.find((p) => p.id === id))
        .filter(Boolean) as ProfileRow[];
    }
  }

  const championIds = new Set(champions.map((c) => c.id));
  const newcomers = all.filter((p) => !championIds.has(p.id)).slice(0, 8);
  return { champions, newcomers };
}

const eventsQuery = queryOptions({ queryKey: ["explore", "events"], queryFn: fetchTrendingEvents });
const mediaQuery = queryOptions({ queryKey: ["explore", "media"], queryFn: fetchMedia });
const athletesQuery = queryOptions({ queryKey: ["explore", "athletes"], queryFn: fetchAthletes });

export type GymResult = { id: string; name: string; address: string | null; source: "custom" | "gym" };

async function searchGyms(like: string): Promise<GymResult[]> {
  const [customRes, gymsRes] = await Promise.all([
    supabase.from("custom_locations").select("id, name, address").ilike("name", like).limit(10),
    supabase.from("gyms").select("id, name, address, city, state").ilike("name", like).limit(10),
  ]);
  const custom: GymResult[] = (customRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    address: g.address,
    source: "custom" as const,
  }));
  const gyms: GymResult[] = (gymsRes.data ?? []).map((g) => ({
    id: g.id,
    name: g.name,
    address: g.address ?? ([g.city, g.state].filter(Boolean).join(", ") || null),
    source: "gym" as const,
  }));
  return [...custom, ...gyms];
}

async function search(term: string) {
  const like = `%${term}%`;
  const [profilesRes, eventsRes, gyms] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, username, full_name, avatar_url, belt, home_academy, team, is_weekly_champion, is_pro, is_competitor")
      .or(`full_name.ilike.${like},username.ilike.${like}`)
      .limit(15),
    supabase
      .from("posts")
      .select(`id, event_title, event_date, event_location, image_url, ${AUTHOR}`)
      .eq("post_type", "event")
      .ilike("event_title", like)
      .order("event_date", { ascending: true })
      .limit(15),
    searchGyms(like),
  ]);
  if (profilesRes.error) throw profilesRes.error;
  if (eventsRes.error) throw eventsRes.error;
  return {
    athletes: (profilesRes.data ?? []) as ProfileRow[],
    events: (eventsRes.data ?? []) as unknown as EventPost[],
    gyms,
  };
}


function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("");
}

function Avatar({ profile, className = "size-11" }: { profile: Partial<ProfileRow> & { full_name?: string | null; username?: string }; className?: string }) {
  const name = profile.full_name || profile.username || "?";
  return profile.avatar_url ? (
    <img
      src={profile.avatar_url}
      alt={`Foto de ${name}`}
      loading="lazy"
      className={`${className} shrink-0 rounded-full object-cover ring-2`}
      style={{ ["--tw-ring-color" as string]: beltColor(profile.belt ?? null) }}
    />
  ) : (
    <span
      className={`${className} flex shrink-0 items-center justify-center rounded-full bg-surface-2 text-xs font-bold text-foreground ring-2`}
      style={{ ["--tw-ring-color" as string]: beltColor(profile.belt ?? null) }}
    >
      {initials(name)}
    </span>
  );
}

function EventDate({ iso }: { iso: string | null }) {
  if (!iso) return null;
  const d = new Date(iso);
  return (
    <div className="flex flex-col items-center rounded-xl bg-background/85 px-2 py-1 text-center backdrop-blur">
      <span className="text-base font-black leading-none text-brand">{d.getDate().toString().padStart(2, "0")}</span>
      <span className="text-[10px] font-semibold uppercase leading-tight text-muted-foreground">
        {d.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "")}
      </span>
    </div>
  );
}

function EventCardCompact({ event }: { event: EventPost }) {
  return (
    <Link
      to="/event"
      className="relative flex w-52 shrink-0 flex-col overflow-hidden rounded-2xl border border-brand/25 bg-surface"
    >
      <div className="relative h-28 w-full bg-surface-2">
        {event.image_url ? (
          <img src={event.image_url} alt={event.event_title ?? "Evento"} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center text-muted-foreground">
            <CalendarDays className="size-7" />
          </div>
        )}
        <div className="absolute left-2 top-2">
          <EventDate iso={event.event_date} />
        </div>
      </div>
      <div className="flex flex-col gap-1 p-3">
        <p className="line-clamp-2 text-sm font-bold leading-snug text-foreground">{event.event_title ?? "Evento"}</p>
        {event.event_location && (
          <p className="flex items-center gap-1 truncate text-[11px] text-muted-foreground">
            <MapPin className="size-3 shrink-0" /> {event.event_location}
          </p>
        )}
      </div>
    </Link>
  );
}

function GymRow({ gym }: { gym: GymResult }) {
  return (
    <li>
      <Link
        to="/gym/$gymId"
        params={{ gymId: gym.id }}
        className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5 transition-colors hover:border-brand/50"
      >
        <span className="grid size-11 shrink-0 place-items-center rounded-xl border border-brand/30 bg-brand/10 text-brand">
          <Building2 className="size-5" />
        </span>
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-foreground">{gym.name}</span>
          <span className="flex items-center gap-1 truncate text-xs text-muted-foreground">
            <MapPin className="size-3 shrink-0" />
            {gym.address ?? "Academia da comunidade"}
          </span>
        </span>
        <ChevronRight className="size-4 shrink-0 text-muted-foreground" />
      </Link>
    </li>
  );
}

function AthleteRow({ profile, badge }: { profile: ProfileRow; badge?: string }) {
  return (
    <li className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
      <Link to="/atleta/$userId" params={{ userId: profile.id }} className="flex min-w-0 flex-1 items-center gap-3">
        <Avatar profile={profile} />
        <div className="min-w-0 flex-1">
          <p className="flex flex-wrap items-center gap-1 truncate text-sm font-semibold text-foreground">
            {profile.full_name || profile.username}
            {profile.is_pro && <ProBadge className="size-3" />}
            <ChampionBadge active={profile.is_weekly_champion} />
          </p>
          <p className="truncate text-xs text-muted-foreground">
            {[profile.belt, profile.home_academy || profile.team].filter(Boolean).join(" • ") || `@${profile.username}`}
          </p>
          {profile.is_competitor && profile.is_pro && <CompetitorTag className="mt-1" />}
        </div>
      </Link>

      {badge && (
        <span className="rounded-full bg-brand/15 px-2 py-1 text-[10px] font-bold uppercase text-brand">{badge}</span>
      )}
      <ConnectionButton targetId={profile.id} />
    </li>
  );
}



function Explore() {
  const [term, setTerm] = useState("");
  const [debounced, setDebounced] = useState("");
  const [openPost, setOpenPost] = useState<MediaPost | null>(null);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(term.trim()), 300);
    return () => clearTimeout(id);
  }, [term]);

  const { data: events } = useSuspenseQuery(eventsQuery);
  const { data: media } = useSuspenseQuery(mediaQuery);
  const { data: athletes } = useSuspenseQuery(athletesQuery);

  const searching = debounced.length >= 2;
  const { data: results, isFetching } = useQuery({
    queryKey: ["explore", "search", debounced],
    queryFn: () => search(debounced),
    enabled: searching,
  });

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 border-b border-border bg-background/95 px-4 py-3 backdrop-blur">
        <h1 className="sr-only">Explorar</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={term}
            onChange={(e) => setTerm(e.target.value)}
            aria-label="Buscar atletas ou eventos"
            placeholder="Buscar atletas ou eventos..."
            className="w-full rounded-full border border-border bg-surface py-3 pl-11 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-8 pt-5">
        {searching ? (
          <section className="flex flex-col gap-4 px-4">
            {isFetching && !results && <Skeleton className="h-16 w-full rounded-2xl" />}
            {results && (
              <>
                <div>
                  <h2 className="mb-2 text-sm font-semibold text-muted-foreground">Atletas</h2>
                  <ul className="flex flex-col gap-2">
                    {results.athletes.map((p) => (
                      <AthleteRow key={p.id} profile={p} />
                    ))}
                  </ul>
                  {results.athletes.length === 0 && <p className="text-xs text-muted-foreground">Nenhum atleta encontrado.</p>}
                </div>
                <div>
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <Building2 className="size-4 text-brand" /> Academias
                  </h2>
                  <ul className="flex flex-col gap-2">
                    {results.gyms.map((g) => (
                      <GymRow key={`${g.source}-${g.id}`} gym={g} />
                    ))}
                  </ul>
                  {results.gyms.length === 0 && (
                    <p className="text-xs text-muted-foreground">Nenhuma academia encontrada.</p>
                  )}
                </div>
                <div>
                  <h2 className="mb-2 flex items-center gap-1.5 text-sm font-semibold text-muted-foreground">
                    <CalendarDays className="size-4 text-brand" /> Eventos
                  </h2>
                  <div className="scrollbar-hide flex gap-3 overflow-x-auto">
                    {results.events.map((e) => (
                      <EventCardCompact key={e.id} event={e} />
                    ))}
                  </div>
                  {results.events.length === 0 && <p className="text-xs text-muted-foreground">Nenhum evento encontrado.</p>}
                </div>

              </>
            )}
          </section>
        ) : (
          <>
            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 px-4 text-sm font-semibold text-foreground">
                <CalendarDays className="size-4 text-brand" /> Eventos em destaque
              </h2>
              {events.length ? (
                <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4 pb-1">
                  {events.map((e) => (
                    <EventCardCompact key={e.id} event={e} />
                  ))}
                </div>
              ) : (
                <p className="px-4 text-xs text-muted-foreground">Nenhum evento próximo por aqui ainda.</p>
              )}
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="flex items-center gap-2 px-4 text-sm font-semibold text-foreground">
                <Users className="size-4 text-brand" /> Atletas em destaque
              </h2>
              <ul className="flex flex-col gap-2 px-4">
                {athletes.champions.map((p, i) => (
                  <AthleteRow key={p.id} profile={p} badge={`Top ${i + 1}`} />
                ))}
                {athletes.newcomers.map((p) => (
                  <AthleteRow key={p.id} profile={p} badge="Novo" />
                ))}
              </ul>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="px-4 text-sm font-semibold text-foreground">Descobrir</h2>
              {media.length ? (
                <div className="grid grid-cols-3 gap-0.5">
                  {media.map((post) => (
                    <button
                      key={post.id}
                      type="button"
                      onClick={() => setOpenPost(post)}
                      className="relative aspect-square overflow-hidden bg-surface-2"
                    >
                      <img
                        src={post.image_url ?? ""}
                        alt={post.content?.slice(0, 60) || "Publicação da comunidade"}
                        loading="lazy"
                        className="size-full object-cover transition-transform duration-200 active:scale-105"
                      />
                    </button>
                  ))}
                </div>
              ) : (
                <p className="px-4 text-xs text-muted-foreground">Ainda não há mídias publicadas.</p>
              )}
            </section>
          </>
        )}
      </main>

      <Dialog open={!!openPost} onOpenChange={(o) => !o && setOpenPost(null)}>
        <DialogContent className="max-w-sm overflow-hidden border-border bg-surface p-0">
          <DialogTitle className="sr-only">Publicação</DialogTitle>
          {openPost && (
            <div className="flex flex-col">
              <img src={openPost.image_url ?? ""} alt={openPost.content?.slice(0, 60) || "Publicação"} className="max-h-[55vh] w-full object-cover" />
              <div className="flex flex-col gap-2 p-4">
                <div className="flex items-center gap-2">
                  <Avatar profile={openPost.profiles ?? {}} className="size-9" />
                <div className="min-w-0">
                    <p className="flex flex-wrap items-center gap-1 truncate text-sm font-semibold">
                      {openPost.profiles?.full_name || openPost.profiles?.username || "Atleta"}
                      {openPost.profiles?.is_pro && <ProBadge className="size-3" />}
                      <ChampionBadge active={openPost.profiles?.is_weekly_champion} />
                    </p>
                    <p className="text-[11px] text-muted-foreground">{timeAgo(openPost.created_at)}</p>
                  </div>
                </div>
                {openPost.content && <p className="whitespace-pre-line text-sm text-foreground">{openPost.content}</p>}
                {openPost.location && (
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {openPost.location}
                  </p>
                )}
                <Link to="/home" className="mt-1 text-xs font-bold text-brand">
                  Ver no feed
                </Link>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explorar | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Busque atletas, descubra eventos em destaque e explore as fotos da comunidade Flow de Jiu-Jitsu.",
      },
      { property: "og:title", content: "Explorar | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Busque atletas, descubra eventos em destaque e explore as fotos da comunidade Flow de Jiu-Jitsu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  loader: ({ context }) => {
    context.queryClient.ensureQueryData(eventsQuery);
    context.queryClient.ensureQueryData(mediaQuery);
    context.queryClient.ensureQueryData(athletesQuery);
  },
  pendingComponent: () => (
    <div className="min-h-screen space-y-3 bg-background p-4">
      <Skeleton className="h-12 w-full rounded-full" />
      <Skeleton className="h-40 w-full rounded-2xl" />
      <Skeleton className="h-40 w-full rounded-2xl" />
    </div>
  ),
  errorComponent: ({ error }) => (
    <div role="alert" className="p-6 text-sm text-muted-foreground">
      Não foi possível carregar o Explorar: {error instanceof Error ? error.message : "erro desconhecido"}
    </div>
  ),
  notFoundComponent: () => <div className="p-6 text-sm text-muted-foreground">Nada por aqui.</div>,
  component: Explore,
});
