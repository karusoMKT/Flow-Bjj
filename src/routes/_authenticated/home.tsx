import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { Bell, Loader2, MessageSquare, Plus, Sparkles, X } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { FEED_SELECT } from "@/lib/social";
import { PostCard, PostCardSkeleton, type FeedPost } from "@/components/PostCard";
import { ChampionBadge } from "@/components/ChampionBadge";
import { FeedComposer } from "@/components/FeedComposer";
import { createStory, fetchActiveStories, groupStories, uploadShareImage, type StoryGroup } from "@/lib/stories";





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

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?background=1f1f1f&color=d9ff3f&bold=true&name=${encodeURIComponent(name)}`;

function StoryRing({ children, champion }: { children: React.ReactNode; champion?: boolean }) {
  return (
    <span
      className={`block rounded-full p-[2px] ${
        champion
          ? "bg-gradient-to-tr from-[oklch(0.85_0.16_92)] via-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.14_60)]"
          : "bg-gradient-to-tr from-brand via-brand/40 to-primary"
      }`}
    >
      <span className="block rounded-full border-2 border-background">{children}</span>
    </span>
  );
}


function HomeFeed() {
  
  const [viewing, setViewing] = useState<StoryGroup | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const queryClient = useQueryClient();

  async function onPickStory(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setUploading(true);
    try {
      const { data } = await supabase.auth.getUser();
      const userId = data.user?.id;
      if (!userId) throw new Error("Faça login para publicar");
      const imageUrl = await uploadShareImage(file, userId);
      await createStory(userId, imageUrl);
      await queryClient.invalidateQueries({ queryKey: ["stories"] });
      toast.success("Story publicado! Válido por 24h 🔥");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível publicar o story");
    } finally {
      setUploading(false);
    }
  }

  const { data: currentUserId } = useQuery({
    queryKey: ["current-user-id"],
    queryFn: async () => {
      const { data } = await supabase.auth.getUser();
      return data.user?.id ?? null;
    },
    staleTime: 5 * 60_000,
  });
  const { data: me } = useQuery({
    queryKey: ["my-profile-mini", currentUserId],
    enabled: !!currentUserId,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("full_name, username, avatar_url")
        .eq("id", currentUserId!)
        .maybeSingle();
      return data;
    },
    staleTime: 5 * 60_000,
  });
  const { data: storyRows } = useQuery({
    queryKey: ["stories"],
    queryFn: fetchActiveStories,
    staleTime: 60_000,
  });

  const groups = groupStories(storyRows ?? []);
  const mine = groups.find((g) => g.userId === currentUserId) ?? null;
  const others = groups.filter((g) => g.userId !== currentUserId);
  const myName = me?.full_name?.split(" ")[0] ?? me?.username ?? "Você";
  const myAvatar = mine?.avatarUrl ?? me?.avatar_url ?? avatar(myName);

  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("posts")
        .select(
          FEED_SELECT,
        )
        .order("created_at", { ascending: false })
        .limit(30);
      if (err) throw err;
      return data ?? [];
    },
  });


  return (
    <div className="min-h-screen bg-background pb-24">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-white/5 bg-background/95 px-4 py-3 backdrop-blur">
        <span className="select-none font-display text-2xl font-black italic tracking-tight text-brand">
          FLOW
        </span>
        <div className="flex items-center gap-1">
          <Link
            to="/coach"
            aria-label="IA Coach"
            className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-brand"
          >
            <Sparkles className="size-5" />
          </Link>
          <Link
            to="/notifications"
            aria-label="Notificações"
            className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <Bell className="size-5" />
            {unreadNotifications > 0 && (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </Link>
          <Link
            to="/messages"
            aria-label="Mensagens"
            className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageSquare className="size-5" />
            {unreadMessages > 0 && (
              <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
            )}
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md">
        <h1 className="sr-only">Feed</h1>

        {/* Stories */}
        <section aria-label="Stories" className="scrollbar-hide flex gap-4 overflow-x-auto px-4 py-4">
          {/* Seu story */}
          <div className="flex w-16 shrink-0 flex-col items-center gap-1.5">
            <div className="relative">
              {mine ? (
                <button type="button" onClick={() => setViewing(mine)} aria-label="Ver seu story">
                  <StoryRing>
                    <img src={myAvatar} alt="Seu story" className="size-14 rounded-full object-cover" />
                  </StoryRing>
                </button>
              ) : (
                <span className="block rounded-full border-2 border-white/10 p-[2px]">
                  <img src={myAvatar} alt="Seu story" className="size-14 rounded-full object-cover" />
                </span>
              )}
              {uploading && (
                <span className="absolute inset-0 grid place-items-center rounded-full bg-black/70">
                  <Loader2 className="size-5 animate-spin text-brand" />
                </span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={onPickStory}
              />
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                aria-label="Adicionar story"
                className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-brand text-brand-foreground disabled:opacity-60"
              >
                <Plus className="size-3" strokeWidth={3} />
              </button>
            </div>
            <span className="w-full truncate text-center text-[10px] text-muted-foreground">Seu story</span>
          </div>

          {others.map((g) => (
            <div key={g.userId} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <button type="button" onClick={() => setViewing(g)} aria-label={`Ver story de ${g.name}`}>
                <StoryRing champion={g.isChampion}>
                  <img
                    src={g.avatarUrl ?? avatar(g.name)}
                    alt={g.name}
                    className="size-14 rounded-full object-cover"
                    loading="lazy"
                  />
                </StoryRing>
              </button>
              <span className="flex w-full items-center justify-center gap-0.5 text-[10px] text-muted-foreground">
                <span className="truncate">{g.name}</span>
                <ChampionBadge active={g.isChampion} className="size-3" />
              </span>
            </div>
          ))}
        </section>

        <FeedComposer
          userId={currentUserId}
          name={me?.full_name ?? me?.username ?? "Você"}
          avatarUrl={me?.avatar_url}
        />

        {isLoading ? (
          <ul className="flex flex-col gap-4 px-4" aria-busy="true">
            <PostCardSkeleton />
            <PostCardSkeleton />
            <PostCardSkeleton />
          </ul>
        ) : error ? (
          <div className="mx-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-4 text-center">
            <p className="text-sm text-foreground">Não foi possível carregar o feed.</p>
            <button
              type="button"
              onClick={() => refetch()}
              className="mt-3 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
            >
              Tentar novamente
            </button>
          </div>
        ) : !posts?.length ? (
          <div className="mx-4 rounded-2xl border border-white/5 bg-surface p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Nenhum treino registrado ainda. Seja o primeiro a fazer o check-in!
            </p>
            <Link
              to="/create"
              className="mt-3 inline-block rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
            >
              Fazer check-in
            </Link>
          </div>
        ) : (
          <ul className="flex flex-col gap-4 px-4">
            {(posts as unknown as FeedPost[]).map((post) => (
              <PostCard key={post.id} post={post} currentUserId={currentUserId} />
            ))}
          </ul>
        )}


      </main>




      {viewing && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Story de ${viewing.name}`}
          onClick={() => setViewing(null)}
          className="fixed inset-0 z-[70] grid place-items-center bg-black/95 px-4 animate-fade-in"
        >
          <button
            type="button"
            onClick={() => setViewing(null)}
            aria-label="Fechar"
            className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <X className="size-5" />
          </button>
          <div className="absolute left-4 top-4 flex items-center gap-2">
            <img
              src={viewing.avatarUrl ?? avatar(viewing.name)}
              alt=""
              className="size-8 rounded-full object-cover"
            />
            <span className="flex items-center gap-1 text-sm font-semibold text-foreground">
              {viewing.name}
              <ChampionBadge active={viewing.isChampion} className="size-4" />
            </span>
          </div>
          <img
            src={viewing.cover}
            alt={`Story de ${viewing.name}`}
            className="max-h-[85vh] w-auto rounded-3xl border border-white/10 object-contain"
          />
        </div>
      )}


      <BottomNav />
    </div>
  );
}
