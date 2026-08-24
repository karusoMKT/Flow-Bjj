import { createFileRoute, useNavigate, useParams, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Flame, Lock, MapPin, MessageCircle, Trophy, Zap } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { ConnectionButton } from "@/components/ConnectionButton";
import { ChampionBadge } from "@/components/ChampionBadge";
import { ProBadge, CompetitorTag } from "@/components/ProBadge";
import { PostCard, PostCardSkeleton, AvatarBubble, type FeedPost } from "@/components/PostCard";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { FEED_SELECT } from "@/lib/social";
import { fetchMyConnections } from "@/lib/connections";
import { getOrCreateConversation } from "@/lib/inbox";

type PublicProfile = {
  id: string;
  username: string;
  full_name: string | null;
  avatar_url: string | null;
  belt: string | null;
  stripes: number | null;
  home_academy: string | null;
  team: string | null;
  city: string | null;
  xp: number | null;
  level: number | null;
  is_pro: boolean | null;
  is_competitor: boolean | null;
  is_weekly_champion: boolean | null;
};

async function fetchAthlete(userId: string) {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id ?? null;

  const { data: profile, error } = await supabase
    .from("profiles")
    .select(
      "id, username, full_name, avatar_url, belt, stripes, home_academy, team, city, xp, level, is_pro, is_competitor, is_weekly_champion",
    )
    .eq("id", userId)
    .maybeSingle();
  if (error) throw error;
  if (!profile) throw new Error("Atleta não encontrado");

  const [postsRes, workoutsRes, connectionsRes] = await Promise.all([
    supabase.from("posts").select(FEED_SELECT).eq("user_id", userId).order("created_at", { ascending: false }).limit(20),
    supabase.from("workouts").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase
      .from("connections")
      .select("id", { count: "exact", head: true })
      .eq("status", "accepted")
      .or(`requester_id.eq.${userId},receiver_id.eq.${userId}`),
  ]);

  return {
    uid,
    profile: profile as PublicProfile,
    posts: (postsRes.data ?? []) as unknown as FeedPost[],
    workouts: workoutsRes.count ?? 0,
    connections: connectionsRes.count ?? 0,
  };
}

function AthletePage() {
  const { userId } = useParams({ from: "/_authenticated/atleta/$userId" });
  const navigate = useNavigate();
  const [opening, setOpening] = useState(false);
  const { data, isLoading, error } = useQuery({ queryKey: ["athlete", userId], queryFn: () => fetchAthlete(userId) });
  const { data: connections = {} } = useQuery({ queryKey: ["connections"], queryFn: fetchMyConnections });

  const isMe = data?.uid === userId;
  const connected = connections[userId]?.state === "connected";
  const p = data?.profile;
  const name = p?.full_name || p?.username || "Atleta";

  async function openChat() {
    if (opening) return;
    setOpening(true);
    try {
      const conversationId = await getOrCreateConversation(userId);
      navigate({ to: "/chat/$chatId", params: { chatId: conversationId } });
    } catch (e) {
      toast.error((e as Error)?.message ?? "Não foi possível abrir o chat");
    } finally {
      setOpening(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative overflow-hidden border-b border-border">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-surface-2),var(--color-background))]" />
        <div className="relative mx-auto max-w-md px-4 pb-6 pt-5">
          <button
            type="button"
            aria-label="Voltar"
            onClick={() => window.history.back()}
            className="flex size-9 items-center justify-center rounded-full border border-border bg-black/40 text-foreground backdrop-blur"
          >
            <ArrowLeft className="size-5" />
          </button>

          {isLoading ? (
            <div className="mt-4 flex flex-col items-center gap-3">
              <Skeleton className="size-24 rounded-full" />
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-28" />
            </div>
          ) : error || !p ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">Atleta não encontrado.</p>
          ) : (
            <div className="mt-4 flex flex-col items-center text-center">
              <AvatarBubble
                src={p.avatar_url}
                name={name}
                className={`size-24 ${p.is_weekly_champion ? "ring-2 ring-amber-400" : ""}`}
              />
              <h1 className="mt-3 flex flex-wrap items-center justify-center gap-1.5 text-xl font-black italic tracking-tight">
                {name}
                {p.is_pro && <ProBadge className="size-4" />}
                <ChampionBadge active={p.is_weekly_champion} />
              </h1>
              <p className="text-xs text-muted-foreground">@{p.username}</p>
              <p className="mt-2 text-xs text-muted-foreground">
                {[p.belt && `Faixa ${p.belt}`, p.stripes ? `${p.stripes} graus` : null, p.home_academy || p.team]
                  .filter(Boolean)
                  .join(" • ")}
              </p>
              {p.city && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3" /> {p.city}
                </p>
              )}
              {p.is_competitor && p.is_pro && <CompetitorTag className="mt-2" />}

              {!isMe && (
                <div className="mt-4 flex items-center gap-2">
                  <ConnectionButton targetId={userId} size="lg" />
                  <button
                    type="button"
                    onClick={openChat}
                    disabled={!connected || opening}
                    title={connected ? "Enviar mensagem" : "Conecte-se para enviar mensagens"}
                    aria-label={connected ? "Enviar mensagem" : "Conecte-se para enviar mensagens"}
                    className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface px-5 py-2.5 text-xs font-bold text-foreground transition-colors enabled:hover:border-brand/60 enabled:hover:text-brand disabled:cursor-not-allowed disabled:opacity-50"
                  >
                    {connected ? <MessageCircle className="size-3.5" /> : <Lock className="size-3.5" />}
                    Mensagem
                  </button>
                </div>
              )}
              {!isMe && !connected && (
                <p className="mt-2 text-[11px] text-muted-foreground">Conecte-se para enviar mensagens.</p>
              )}

              <div className="mt-5 grid w-full grid-cols-3 gap-2">
                {[
                  { icon: Flame, label: "Treinos", value: data?.workouts ?? 0 },
                  { icon: Zap, label: "XP", value: p.xp ?? 0 },
                  { icon: Trophy, label: "Conexões", value: data?.connections ?? 0 },
                ].map((s) => (
                  <div key={s.label} className="rounded-2xl border border-border bg-surface px-2 py-3">
                    <s.icon className="mx-auto size-4 text-brand" />
                    <p className="mt-1 text-base font-black">{s.value}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 pt-5">
        <h2 className="mb-3 text-sm font-semibold text-muted-foreground">Publicações</h2>
        {isLoading ? (
          <div className="flex flex-col gap-4">
            <PostCardSkeleton />
            <PostCardSkeleton />
          </div>
        ) : data?.posts.length ? (
          <ul className="flex flex-col gap-4">
            {data.posts.map((post) => (
              <PostCard key={post.id} post={post} currentUserId={data.uid ?? undefined} />
            ))}
          </ul>
        ) : (
          <p className="rounded-2xl border border-white/5 bg-surface p-6 text-center text-sm text-muted-foreground">
            Este atleta ainda não publicou nada.{" "}
            <Link to="/home" className="font-semibold text-brand">
              Voltar ao feed
            </Link>
          </p>
        )}
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/atleta/$userId")({
  head: () => ({
    meta: [
      { title: "Perfil do atleta | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Veja treinos, competições e publicações do atleta e conecte-se com a comunidade Flow Jiu-Jitsu.",
      },
      { property: "og:title", content: "Perfil do atleta | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Veja treinos, competições e publicações do atleta e conecte-se com a comunidade Flow Jiu-Jitsu.",
      },
      { property: "og:type", content: "profile" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AthletePage,
});
