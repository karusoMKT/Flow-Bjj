import { useState } from "react";
import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Building2, CalendarDays, MapPin, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { ConnectionButton } from "@/components/ConnectionButton";
import { ChampionBadge } from "@/components/ChampionBadge";
import { ProBadge, CompetitorTag } from "@/components/ProBadge";
import { PostCard, PostCardSkeleton, AvatarBubble, type FeedPost } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { FEED_SELECT } from "@/lib/social";

type Member = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  belt: string | null;
  xp: number | null;
  is_pro: boolean | null;
  is_competitor: boolean | null;
  is_weekly_champion: boolean | null;
};

type GymData = {
  name: string;
  address: string | null;
  members: Member[];
  events: FeedPost[];
  feed: FeedPost[];
  uid: string | null;
};

async function fetchGym(gymId: string): Promise<GymData> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const [customRes, gymRes] = await Promise.all([
    supabase.from("custom_locations").select("name, address").eq("id", gymId).maybeSingle(),
    supabase.from("gyms").select("name, address, city, state").eq("id", gymId).maybeSingle(),
  ]);

  const name = customRes.data?.name ?? gymRes.data?.name ?? null;
  if (!name) throw new Error("Academia não encontrada");
  const address =
    customRes.data?.address ??
    gymRes.data?.address ??
    ([gymRes.data?.city, gymRes.data?.state].filter(Boolean).join(", ") || null);

  const like = `%${name}%`;
  const { data: members, error: membersError } = await supabase
    .from("profiles")
    .select("id, username, full_name, avatar_url, belt, xp, is_pro, is_competitor, is_weekly_champion")
    .or(`home_academy.ilike.${like},team.ilike.${like}`)
    .order("xp", { ascending: false })
    .limit(100);
  if (membersError) throw membersError;

  const memberIds = (members ?? []).map((m) => m.id);

  const [eventsRes, feedRes] = await Promise.all([
    supabase
      .from("posts")
      .select(FEED_SELECT)
      .eq("post_type", "event")
      .ilike("event_location", like)
      .order("event_date", { ascending: true })
      .limit(20),
    memberIds.length
      ? supabase
          .from("posts")
          .select(FEED_SELECT)
          .in("user_id", memberIds)
          .neq("post_type", "event")
          .order("created_at", { ascending: false })
          .limit(30)
      : Promise.resolve({ data: [], error: null }),
  ]);

  return {
    name,
    address,
    members: (members ?? []) as Member[],
    events: (eventsRes.data ?? []) as unknown as FeedPost[],
    feed: (feedRes.data ?? []) as unknown as FeedPost[],

    uid,
  };
}

const TABS = [
  { id: "members", label: "Alunos" },
  { id: "events", label: "Eventos" },
  { id: "mat", label: "Tatame" },
] as const;

function GymPage() {
  const { gymId } = useParams({ from: "/_authenticated/gym/$gymId" });
  const [tab, setTab] = useState<(typeof TABS)[number]["id"]>("members");
  const { data, isLoading, error } = useQuery({ queryKey: ["gym", gymId], queryFn: () => fetchGym(gymId) });

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-surface-2),var(--color-background))]" />
        <div className="relative mx-auto max-w-md px-4 pb-6 pt-5">
          <Link
            to="/explore"
            aria-label="Voltar"
            className="flex size-11 items-center justify-center rounded-full border border-border bg-black/40 text-foreground backdrop-blur transition-all duration-200 ease-in-out active:scale-95"
          >
            <ArrowLeft className="size-5" />
          </Link>

          <div className="mt-4 flex flex-col items-center text-center">
            <span className="grid size-20 place-items-center rounded-2xl border border-brand/40 bg-black/60 text-brand shadow-[0_10px_40px_-14px_var(--brand)]">
              <Building2 className="size-9" />
            </span>
            {isLoading ? (
              <Skeleton className="mt-4 h-6 w-48" />
            ) : (
              <h1 className="mt-4 text-xl font-black italic tracking-tight">{data?.name ?? "Academia"}</h1>
            )}
            <p className="mt-2 flex max-w-xs items-start justify-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="mt-0.5 size-3.5 shrink-0" />
              {error ? "Academia não encontrada" : (data?.address ?? "Endereço não informado")}
            </p>
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full border border-brand/30 bg-brand/10 px-3 py-1 text-[11px] font-bold text-brand">
              <Users className="size-3.5" />
              {data?.members.length ?? 0} alunos registrados
            </p>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-4">
        <div className="grid grid-cols-3 gap-1 rounded-full border border-border bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-full py-2 text-xs font-bold transition-colors ${
                tab === t.id ? "bg-brand text-brand-foreground" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="mt-4 space-y-2">
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
            <Skeleton className="h-16 w-full rounded-2xl" />
          </div>
        ) : tab === "members" ? (
          data?.members.length ? (
            <ul className="mt-4 flex flex-col gap-2">
              {data.members.map((m) => (
                <li key={m.id} className="flex items-center gap-3 rounded-2xl border border-border bg-surface px-3 py-2.5">
                  <Link
                    to="/atleta/$userId"
                    params={{ userId: m.id }}
                    className="flex min-w-0 flex-1 items-center gap-3"
                  >
                    <AvatarBubble src={m.avatar_url} name={m.full_name ?? m.username} className="size-11" />
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-1 truncate text-sm font-semibold">
                        {m.full_name || m.username}
                        {m.is_pro && <ProBadge className="size-3" />}
                        <ChampionBadge active={m.is_weekly_champion} />
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {[m.belt, `${m.xp ?? 0} XP`].filter(Boolean).join(" • ")}
                      </p>
                      {m.is_competitor && m.is_pro && <CompetitorTag className="mt-1" />}
                    </div>
                  </Link>
                  <ConnectionButton targetId={m.id} />

                </li>
              ))}
            </ul>
          ) : (
            <p className="mt-6 rounded-2xl border border-white/5 bg-surface p-6 text-center text-sm text-muted-foreground">
              Nenhum aluno vinculou o perfil a esta academia ainda.
            </p>
          )
        ) : tab === "events" ? (
          data?.events.length ? (
            <ul className="mt-4 flex flex-col gap-4">
              {data.events.map((p) => (
                <PostCard key={p.id} post={p} currentUserId={data.uid ?? undefined} />
              ))}
            </ul>
          ) : (
            <p className="mt-6 flex flex-col items-center gap-2 rounded-2xl border border-white/5 bg-surface p-6 text-center text-sm text-muted-foreground">
              <CalendarDays className="size-6 text-brand" />
              Nenhum evento nesta academia por enquanto.
            </p>
          )
        ) : data?.feed.length ? (
          <ul className="mt-4 flex flex-col gap-4">
            {data.feed.map((p) => (
              <PostCard key={p.id} post={p} currentUserId={data.uid ?? undefined} />
            ))}
          </ul>
        ) : (
          <ul className="mt-4 flex flex-col gap-4">
            <PostCardSkeleton />
            <p className="text-center text-sm text-muted-foreground">
              O tatame ainda está vazio. Faça o primeiro check-in por aqui!
            </p>
          </ul>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/gym/$gymId")({
  head: () => ({
    meta: [
      { title: "Comunidade da academia | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Veja alunos, eventos e o tatame (feed) da academia de Jiu-Jitsu na comunidade Flow.",
      },
      { property: "og:title", content: "Comunidade da academia | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Veja alunos, eventos e o tatame (feed) da academia de Jiu-Jitsu na comunidade Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: GymPage,
});
