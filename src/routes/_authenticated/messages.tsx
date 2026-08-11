import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { ChevronLeft, Search, SquarePen } from "lucide-react";
import { useMemo, useState } from "react";
import {
  avatarFor,
  displayName,
  fetchConversations,
  timeAgo,
  useCurrentUserId,
  useInboxRealtime,
} from "@/lib/inbox";

export const Route = createFileRoute("/_authenticated/messages")({
  head: () => ({
    meta: [
      { title: "Mensagens — Flow Jiu-Jitsu" },
      { name: "description", content: "Suas conversas com parceiros de treino e academias no Flow." },
      { property: "og:title", content: "Mensagens — Flow Jiu-Jitsu" },
      { property: "og:description", content: "Suas conversas com parceiros de treino e academias no Flow." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: MessagesPage,
});

function MessagesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const { data: userId } = useCurrentUserId();
  useInboxRealtime(userId);

  const { data: conversations = [], isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: fetchConversations,
  });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return conversations;
    return conversations.filter(
      (c) =>
        displayName(c.other).toLowerCase().includes(q) ||
        (c.lastMessage?.content ?? "").toLowerCase().includes(q),
    );
  }, [query, conversations]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => router.history.back()}
          aria-label="Voltar"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">Mensagens</h1>
        <Link
          to="/search"
          aria-label="Nova conversa"
          className="rounded-xl p-2 text-brand transition-colors hover:text-foreground"
        >
          <SquarePen className="size-5" />
        </Link>
      </header>

      <main className="mx-auto max-w-md px-4">
        <div className="relative py-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar conversas..."
            aria-label="Buscar conversas"
            className="w-full rounded-xl border border-white/5 bg-white/[0.04] py-3 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
          />
        </div>

        {isLoading ? (
          <ul className="flex flex-col gap-4">
            {[0, 1, 2].map((i) => (
              <li key={i} className="flex items-center gap-3 px-3 py-3">
                <div className="size-12 animate-pulse rounded-full bg-white/5" />
                <div className="flex-1 space-y-2">
                  <div className="h-3 w-1/3 animate-pulse rounded bg-white/5" />
                  <div className="h-2 w-2/3 animate-pulse rounded bg-white/5" />
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <ul className="flex flex-col gap-4">
            {filtered.map((c) => {
              const name = displayName(c.other);
              return (
                <li key={c.id}>
                  <Link
                    to="/chat/$chatId"
                    params={{ chatId: c.id }}
                    className="flex items-center gap-3 rounded-2xl border border-white/5 px-3 py-3 transition-colors hover:bg-white/[0.03]"
                  >
                    <span className="relative shrink-0">
                      <img
                        src={c.other?.avatar_url || avatarFor(name)}
                        alt={`Avatar de ${name}`}
                        loading="lazy"
                        className="size-12 rounded-full object-cover"
                      />
                    </span>

                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-foreground">{name}</span>
                      <span className="block truncate text-xs text-muted-foreground">
                        {c.lastMessage?.content ?? "Diga oss e comece a conversa"}
                      </span>
                    </span>

                    <span className="flex shrink-0 flex-col items-end gap-1.5">
                      <span className="text-[11px] text-muted-foreground">
                        {c.lastMessage ? timeAgo(c.lastMessage.created_at) : ""}
                      </span>
                      {c.unread > 0 && (
                        <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
                          {c.unread}
                        </span>
                      )}
                    </span>
                  </Link>
                </li>
              );
            })}
            {filtered.length === 0 && (
              <li className="py-10 text-center text-sm text-muted-foreground">
                {query ? "Nenhuma conversa encontrada." : "Você ainda não tem conversas."}
              </li>
            )}
          </ul>
        )}
      </main>
    </div>
  );
}
