import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, MessageSquare, Plus, Sparkles, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { FEED_SELECT } from "@/lib/social";
import { PostCard, PostCardSkeleton, type FeedPost } from "@/components/PostCard";



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

function StoryRing({ children }: { children: React.ReactNode }) {
  return (
    <span className="block rounded-full bg-gradient-to-tr from-brand via-brand/40 to-primary p-[2px]">
      <span className="block rounded-full border-2 border-background">{children}</span>
    </span>
  );
}


function HomeFeed() {
  const [storySoon, setStorySoon] = useState(false);
  const [viewing, setViewing] = useState<StoryGroup | null>(null);
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
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
          </Link>
          <Link
            to="/messages"
            aria-label="Mensagens"
            className="relative rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
          >
            <MessageSquare className="size-5" />
            <span className="absolute right-1.5 top-1.5 size-2 rounded-full bg-destructive ring-2 ring-background" />
          </Link>
        </div>
      </header>

      <main className="mx-auto max-w-md">
        <h1 className="sr-only">Feed</h1>

        {/* Stories */}
        <section aria-label="Stories" className="scrollbar-hide flex gap-4 overflow-x-auto px-4 py-4">
          {STORIES.map((s) => (
            <div key={s.id} className="flex w-16 shrink-0 flex-col items-center gap-1.5">
              <div className="relative">
                {s.me ? (
                  <span className="block rounded-full border-2 border-white/10 p-[2px]">
                    <img
                      src={s.src}
                      alt={s.name}
                      className="size-14 rounded-full object-cover"
                      loading="lazy"
                    />
                  </span>
                ) : (
                  <StoryRing>
                    <img
                      src={s.src}
                      alt={s.name}
                      className="size-14 rounded-full object-cover"
                      loading="lazy"
                    />
                  </StoryRing>
                )}
                {s.me && (
                  <button
                    type="button"
                    onClick={() => setStorySoon(true)}
                    aria-label="Adicionar story"
                    className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-brand text-brand-foreground"
                  >
                    <Plus className="size-3" strokeWidth={3} />
                  </button>
                )}
              </div>
              <span className="w-full truncate text-center text-[10px] text-muted-foreground">
                {s.name}
              </span>
            </div>
          ))}
        </section>

        {/* Feed */}
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

      {storySoon && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Adicionar Story"
          onClick={() => setStorySoon(false)}
          className="fixed inset-0 z-[60] grid place-items-center bg-black/80 px-6 backdrop-blur-sm animate-fade-in"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-xs rounded-3xl border border-brand/25 bg-surface p-7 text-center animate-pop-in"
          >
            <button
              type="button"
              onClick={() => setStorySoon(false)}
              aria-label="Fechar"
              className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
            >
              <X className="size-4" />
            </button>
            <div className="mx-auto grid size-14 place-items-center rounded-full border border-brand/40 bg-brand/10 text-brand">
              <Plus className="size-6" strokeWidth={2.5} />
            </div>
            <p className="mt-4 text-base font-bold text-foreground">Adicionar Story (Em breve)</p>
            <button
              type="button"
              onClick={() => setStorySoon(false)}
              className="mt-6 w-full rounded-2xl bg-brand py-3 text-sm font-black uppercase tracking-widest text-brand-foreground transition-opacity hover:opacity-90"
            >
              Ok
            </button>
          </div>
        </div>
      )}

      <BottomNav />
    </div>
  );
}
