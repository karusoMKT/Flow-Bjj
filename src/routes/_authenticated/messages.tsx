import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { ChevronLeft, Search, SquarePen } from "lucide-react";
import { useMemo, useState } from "react";

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

const CONVERSATIONS = [
  { id: "1", name: "João Santos", preview: "Bora! Confirmado 🤙", time: "10:30", unread: 2, online: true },
  { id: "2", name: "Maria Almeida", preview: "Aquele detalhe da raspagem salvou meu treino", time: "09:12", unread: 1, online: true },
  { id: "3", name: "Alliance Barra", preview: "Aula extra de no-gi sábado às 10h", time: "Ontem", unread: 0, online: false },
  { id: "4", name: "Lucas Ferreira", preview: "Treino amanhã cedo? Quero drillar guarda", time: "Seg", unread: 0, online: false },
];

const avatar = (name: string) =>
  `https://ui-avatars.com/api/?background=1A1A1A&color=D7FF3E&bold=true&name=${encodeURIComponent(name)}`;

function MessagesPage() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return CONVERSATIONS;
    return CONVERSATIONS.filter(
      (c) => c.name.toLowerCase().includes(q) || c.preview.toLowerCase().includes(q),
    );
  }, [query]);

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
        <button
          type="button"
          aria-label="Nova conversa"
          className="rounded-xl p-2 text-brand transition-colors hover:text-foreground"
        >
          <SquarePen className="size-5" />
        </button>
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

        <ul className="flex flex-col gap-4">
          {filtered.map((c) => (
            <li key={c.id}>
              <Link
                to="/chat/$chatId"
                params={{ chatId: c.id }}
                className="flex items-center gap-3 rounded-2xl border border-white/5 px-3 py-3 transition-colors hover:bg-white/[0.03]"
              >
                <span className="relative shrink-0">
                  <img
                    src={avatar(c.name)}
                    alt={`Avatar de ${c.name}`}
                    loading="lazy"
                    className="size-12 rounded-full object-cover"
                  />
                  {c.online && (
                    <span className="absolute bottom-0 right-0 size-3 rounded-full bg-emerald-400 ring-2 ring-background" />
                  )}
                </span>

                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium text-foreground">{c.name}</span>
                  <span className="block truncate text-xs text-muted-foreground">{c.preview}</span>
                </span>

                <span className="flex shrink-0 flex-col items-end gap-1.5">
                  <span className="text-[11px] text-muted-foreground">{c.time}</span>
                  {c.unread > 0 && (
                    <span className="flex size-5 items-center justify-center rounded-full bg-brand text-[11px] font-bold text-brand-foreground">
                      {c.unread}
                    </span>
                  )}
                </span>
              </Link>
            </li>
          ))}
          {filtered.length === 0 && (
            <li className="py-10 text-center text-sm text-muted-foreground">Nenhuma conversa encontrada.</li>
          )}
        </ul>
      </main>
    </div>
  );
}
