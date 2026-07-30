import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, Search, Star } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_authenticated/explore")({
  head: () => ({
    meta: [
      { title: "Explorar | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Descubra lutadores, academias em destaque e tags em alta na comunidade Flow de Jiu-Jitsu.",
      },
      { property: "og:title", content: "Explorar | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Descubra lutadores, academias em destaque e tags em alta na comunidade Flow de Jiu-Jitsu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Explore,
});

const SUGGESTIONS = [
  { name: "João Santos", belt: "Faixa Preta" },
  { name: "Maria Almeida", belt: "Faixa Azul" },
  { name: "Lucas Mendes", belt: "Faixa Roxa" },
  { name: "Carla Dias", belt: "Faixa Marrom" },
  { name: "Pedro Henrique", belt: "Faixa Azul" },
];

const GYMS = [
  { name: "Alliance Barra", distance: "2.5 km", rating: 4.9 },
  { name: "Gracie Barra Tijuca", distance: "4.1 km", rating: 4.8 },
  { name: "GFTeam Méier", distance: "6.3 km", rating: 4.7 },
  { name: "Checkmat Botafogo", distance: "8.0 km", rating: 4.6 },
];

const TAGS = ["#GuardaAranha", "#NoGi", "#Competição", "#Berimbolo", "#Drilling", "#FaixaAzul", "#Leglock", "#OpenMat"];

const avatar = (name: string, bg = "1A1A1A") =>
  `https://ui-avatars.com/api/?background=${bg}&color=D7FF3E&bold=true&name=${encodeURIComponent(name)}`;

function Explore() {
  const [query, setQuery] = useState("");
  const [following, setFollowing] = useState<string[]>([]);
  const [activeTag, setActiveTag] = useState<string | null>(null);

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="sticky top-0 z-20 bg-background/95 px-4 py-4 backdrop-blur">
        <h1 className="sr-only">Explorar</h1>
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            aria-label="Buscar"
            placeholder="Buscar lutadores, academias ou treinos..."
            className="w-full rounded-full border border-white/5 bg-white/[0.05] py-4 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
          />
        </div>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-8 pb-6">
        {/* Sugestões */}
        <section className="flex flex-col gap-3">
          <h2 className="px-4 text-sm font-semibold text-foreground">Sugestões para você</h2>
          <div className="scrollbar-hide flex gap-3 overflow-x-auto px-4">
            {SUGGESTIONS.map((s) => {
              const isFollowing = following.includes(s.name);
              return (
                <article
                  key={s.name}
                  className="flex w-32 shrink-0 flex-col items-center gap-2 rounded-2xl border border-white/5 bg-white/[0.03] p-3 text-center"
                >
                  <img src={avatar(s.name)} alt={`Avatar de ${s.name}`} loading="lazy" className="size-14 rounded-full" />
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold text-foreground">{s.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{s.belt}</p>
                  </div>
                  <button
                    type="button"
                    onClick={() =>
                      setFollowing((f) => (isFollowing ? f.filter((n) => n !== s.name) : [...f, s.name]))
                    }
                    className={`w-full rounded-full py-1.5 text-[11px] font-bold transition-colors ${
                      isFollowing
                        ? "border border-white/10 text-muted-foreground"
                        : "bg-brand text-brand-foreground"
                    }`}
                  >
                    {isFollowing ? "Seguindo" : "Seguir"}
                  </button>
                </article>
              );
            })}
          </div>
        </section>

        {/* Academias */}
        <section className="flex flex-col gap-3">
          <h2 className="px-4 text-sm font-semibold text-foreground">Academias em destaque</h2>
          <ul className="flex flex-col gap-2 px-4">
            {GYMS.map((g) => (
              <li
                key={g.name}
                className="flex items-center gap-3 rounded-2xl border border-white/5 px-3 py-3"
              >
                <img
                  src={avatar(g.name, "101010")}
                  alt={`Logo ${g.name}`}
                  loading="lazy"
                  className="size-11 rounded-xl"
                />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-foreground">{g.name}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    <MapPin className="size-3" /> {g.distance}
                  </p>
                </div>
                <span className="flex items-center gap-1 text-xs font-semibold text-foreground">
                  <Star className="size-4 fill-brand text-brand" />
                  {g.rating.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </section>

        {/* Tags */}
        <section className="flex flex-col gap-3">
          <h2 className="px-4 text-sm font-semibold text-foreground">Tags em alta</h2>
          <div className="flex flex-wrap gap-2 px-4">
            {TAGS.map((t) => {
              const active = activeTag === t;
              return (
                <button
                  key={t}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setActiveTag(active ? null : t)}
                  className={`rounded-full px-4 py-2 text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand text-brand-foreground"
                      : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}
