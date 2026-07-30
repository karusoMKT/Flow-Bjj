import { createFileRoute, Link } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { Plus, Search } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const FILTERS = ["Todos", "Atletas", "Academias", "Eventos", "Professores"] as const;
type Filter = (typeof FILTERS)[number];

type Suggestion = {
  id: string;
  name: string;
  subtitle: string;
  kind: Exclude<Filter, "Todos">;
  gymId?: string;
};

const SUGGESTIONS: Suggestion[] = [
  { id: "1", name: "João Santos", subtitle: "Alliance • Faixa Preta", kind: "Atletas" },
  { id: "2", name: "Marina Souza", subtitle: "Fight Sports • Faixa Roxa", kind: "Atletas" },
  { id: "3", name: "Lucas Mendes", subtitle: "Gracie Barra • Faixa Marrom", kind: "Atletas" },
  { id: "4", name: "Pedro Henrique", subtitle: "GFTeam • Faixa Azul", kind: "Atletas" },
  { id: "5", name: "Alliance Barra da Tijuca", subtitle: "Rio de Janeiro, RJ", kind: "Academias", gymId: "alliance-barra" },
  { id: "6", name: "Checkmat Ipanema", subtitle: "Rio de Janeiro, RJ", kind: "Academias", gymId: "checkmat-ipanema" },
  { id: "7", name: "Open Mat Beira-Mar", subtitle: "Sábado, 09:00 • Recreio", kind: "Eventos" },
  { id: "8", name: "Copa Flow de Jiu-Jitsu", subtitle: "12 de Setembro • São Paulo", kind: "Eventos" },
  { id: "9", name: "Prof. Fabio Gurgel", subtitle: "Alliance • Coral", kind: "Professores" },
  { id: "10", name: "Prof. Leticia Ribeiro", subtitle: "GFTeam • Faixa Preta", kind: "Professores" },
];

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f1f22&color=d7ff3e&bold=true&size=160`;

function SearchPage() {
  const [filter, setFilter] = useState<Filter>("Todos");
  const [query, setQuery] = useState("");
  const [following, setFollowing] = useState<string[]>([]);

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    return SUGGESTIONS.filter(
      (s) =>
        (filter === "Todos" || s.kind === filter) &&
        (q === "" || s.name.toLowerCase().includes(q) || s.subtitle.toLowerCase().includes(q)),
    );
  }, [filter, query]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="font-sans text-lg font-semibold not-italic tracking-tight">Busca</h1>

        <div className="relative mt-4">
          <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Buscar atletas, academias..."
            aria-label="Buscar atletas, academias"
            className="w-full rounded-full border border-border bg-surface py-3 pl-10 pr-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
          />
        </div>

        <div className="scrollbar-hide -mx-4 mt-4 flex gap-2 overflow-x-auto px-4">
          {FILTERS.map((f) => (
            <button
              key={f}
              type="button"
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                filter === f
                  ? "bg-brand text-brand-foreground"
                  : "border border-border bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {f}
            </button>
          ))}
        </div>

        <section className="mt-7">
          <h2 className="text-sm font-semibold text-muted-foreground">
            {filter === "Todos" ? "Sugestões para você" : `Sugestões de ${filter.toLowerCase()}`}
          </h2>

          <ul className="mt-2 divide-y divide-white/5">
            {results.map((item) => {
              const isFollowing = following.includes(item.id);
              const row = (
                <div className="flex items-center gap-3 py-3">
                  <img
                    src={avatarUrl(item.name)}
                    alt={item.name}
                    loading="lazy"
                    className="size-11 shrink-0 rounded-full object-cover ring-1 ring-white/10"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold">{item.name}</p>
                    <p className="truncate text-xs text-muted-foreground">{item.subtitle}</p>
                  </div>
                  <button
                    type="button"
                    aria-label={`Seguir ${item.name}`}
                    onClick={(e) => {
                      e.preventDefault();
                      setFollowing((prev) =>
                        prev.includes(item.id) ? prev.filter((id) => id !== item.id) : [...prev, item.id],
                      );
                    }}
                    className={`flex size-9 shrink-0 items-center justify-center rounded-full transition-colors ${
                      isFollowing
                        ? "border border-brand/60 text-brand"
                        : "bg-brand text-brand-foreground"
                    }`}
                  >
                    <Plus className={`size-5 transition-transform ${isFollowing ? "rotate-45" : ""}`} strokeWidth={2.5} />
                  </button>
                </div>
              );

              return (
                <li key={item.id}>
                  {item.gymId ? (
                    <Link to="/gym/$gymId" params={{ gymId: item.gymId }} className="block">
                      {row}
                    </Link>
                  ) : (
                    row
                  )}
                </li>
              );
            })}
          </ul>

          {results.length === 0 && (
            <p className="mt-6 text-center text-sm text-muted-foreground">Nenhum resultado encontrado.</p>
          )}
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/search")({
  head: () => ({
    meta: [
      { title: "Busca | Flow Jiu-Jitsu" },
      { name: "description", content: "Encontre atletas, academias, professores e eventos de Jiu-Jitsu." },
      { property: "og:title", content: "Busca | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Encontre atletas, academias, professores e eventos de Jiu-Jitsu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SearchPage,
});
