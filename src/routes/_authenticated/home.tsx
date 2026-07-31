import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, MessageSquare, Plus, Sparkles } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
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

const STORIES = [
  { id: "me", name: "Seu story", src: avatar("Você"), me: true },
  { id: "joao", name: "João", src: avatar("João Santos") },
  { id: "maria", name: "Maria", src: avatar("Maria Almeida") },
  { id: "alliance", name: "Alliance", src: avatar("Alliance") },
  { id: "lucas", name: "Lucas", src: avatar("Lucas") },
];

function StoryRing({ children }: { children: React.ReactNode }) {
  return (
    <span className="block rounded-full bg-gradient-to-tr from-brand via-brand/40 to-primary p-[2px]">
      <span className="block rounded-full border-2 border-background">{children}</span>
    </span>
  );
}

function HomeFeed() {
  const { data: posts, isLoading, error, refetch } = useQuery({
    queryKey: ["feed"],
    queryFn: async () => {
      const { data, error: err } = await supabase
        .from("posts")
        .select(
          "id, content, image_url, likes_count, created_at, profiles:user_id (full_name, username, avatar_url, belt), workouts:workout_id (duration_minutes, training_type, intensity)",
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
                  <Link
                    to="/checkin"
                    aria-label="Adicionar story"
                    className="absolute -bottom-0.5 -right-0.5 grid size-5 place-items-center rounded-full border-2 border-background bg-brand text-brand-foreground"
                  >
                    <Plus className="size-3" strokeWidth={3} />
                  </Link>
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
            {[0, 1, 2].map((i) => (
              <li key={i} className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
                <div className="flex items-start gap-3 p-3.5">
                  <div className="size-10 shrink-0 animate-pulse rounded-full bg-white/10" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
                <div className="h-40 w-full animate-pulse bg-white/[0.04]" />
              </li>
            ))}
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
            {posts.map((post) => {
              const author = post.profiles;
              const name = author?.full_name ?? author?.username ?? "Atleta";
              const workout = post.workouts;
              return (
                <li key={post.id} className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
                  <div className="flex items-start gap-3 p-3.5">
                    <img
                      src={author?.avatar_url ?? avatar(name)}
                      alt={name}
                      className="size-10 shrink-0 rounded-full object-cover"
                      loading="lazy"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-semibold">{name}</p>
                        {author?.belt && (
                          <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${beltClass(author.belt)}`}>
                            {author.belt}
                          </span>
                        )}
                      </div>
                      {workout ? (
                        <p className="truncate text-xs text-muted-foreground">
                          Treinou {workout.duration_minutes} min
                          {workout.training_type ? ` · ${workout.training_type}` : ""}
                        </p>
                      ) : null}
                      {post.content && (
                        <p className="mt-1 text-sm leading-snug text-foreground">{post.content}</p>
                      )}
                    </div>
                    <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
                  </div>

                  {post.image_url && (
                    <img
                      src={post.image_url}
                      alt={`Treino de ${name}`}
                      loading="lazy"
                      className="h-60 w-full object-cover"
                    />
                  )}

                  <div className="flex items-center gap-2 px-3.5 py-3">
                    {workout && (
                      <>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                          <Play className="size-3.5" /> {workout.duration_minutes} min
                        </span>
                        {workout.intensity && (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                            <Zap className="size-3.5" /> {workout.intensity}
                          </span>
                        )}
                      </>
                    )}
                    <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1.5">
                        <Heart className="size-4 text-destructive" /> {post.likes_count ?? 0}
                      </span>
                      <span className="flex items-center gap-1.5">
                        <MessageCircle className="size-4" /> 0
                      </span>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

      </main>

      <BottomNav />
    </div>
  );
}
