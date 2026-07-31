import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Bell, Heart, MessageCircle, MessageSquare, Play, Plus, Sparkles, Zap } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo, beltClass } from "@/lib/feed";


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
        <ul className="flex flex-col gap-4 px-4">
          {/* Card tipo 1 — treino com imagem */}
          <li className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
            <div className="flex items-start gap-3 p-3.5">
              <img
                src={avatar("João Santos")}
                alt="João Santos"
                className="size-10 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">João Santos</p>
                <p className="truncate text-xs text-muted-foreground">Treinou 2h · Alliance Barra</p>
                <p className="truncate text-xs text-muted-foreground">Técnica · Rolas</p>
              </div>
              <span className="shrink-0 text-xs text-muted-foreground">2h</span>
            </div>

            <img
              src={feedRoll}
              alt="Atletas treinando jiu-jitsu"
              width={1024}
              height={768}
              loading="lazy"
              className="h-60 w-full object-cover"
            />

            <div className="flex items-center gap-2 px-3.5 py-3">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                <Play className="size-3.5" /> 2h 12m
              </span>
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                <Zap className="size-3.5" /> +80 XP
              </span>
              <div className="ml-auto flex items-center gap-3 text-xs text-muted-foreground">
                <button type="button" className="flex items-center gap-1.5 transition-colors hover:text-destructive">
                  <Heart className="size-4 text-destructive" /> 128
                </button>
                <button type="button" className="flex items-center gap-1.5 transition-colors hover:text-foreground">
                  <MessageCircle className="size-4" /> 23
                </button>
              </div>
            </div>
          </li>

          {/* Card tipo 2 — conquista */}
          <li className="rounded-2xl border border-white/5 bg-surface p-3.5">
            <div className="flex items-start gap-3">
              <img
                src={avatar("Maria Almeida")}
                alt="Maria Almeida"
                className="size-10 shrink-0 rounded-full object-cover"
                loading="lazy"
              />
              <p className="min-w-0 flex-1 text-sm font-semibold leading-snug text-foreground">
                Maria Almeida conquistou sua faixa Azul!
              </p>
              <span className="shrink-0 text-xs text-muted-foreground">4h</span>
            </div>
          </li>
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}
