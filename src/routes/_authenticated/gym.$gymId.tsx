import { createFileRoute, Link, useParams } from "@tanstack/react-router";
import { ArrowLeft, CalendarDays, MapPin, QrCode, Star, Users } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

type Gym = {
  name: string;
  address: string;
  students: number;
  professors: number;
  rating: number;
  top: { name: string; xp: number }[];
};

const GYMS: Record<string, Gym> = {
  "alliance-barra": {
    name: "Alliance Barra da Tijuca",
    address: "Av. das Américas, 3500 — Barra da Tijuca, Rio de Janeiro, RJ",
    students: 248,
    professors: 6,
    rating: 4.9,
    top: [
      { name: "João Santos", xp: 2950 },
      { name: "Thiago Alves", xp: 2310 },
      { name: "Marina Souza", xp: 1980 },
    ],
  },
  "checkmat-ipanema": {
    name: "Checkmat Ipanema",
    address: "R. Visconde de Pirajá, 550 — Ipanema, Rio de Janeiro, RJ",
    students: 132,
    professors: 4,
    rating: 4.7,
    top: [
      { name: "Carlos Oliveira", xp: 1870 },
      { name: "Rafael Barbosa", xp: 1420 },
      { name: "Felipe Lima", xp: 1300 },
    ],
  },
};

const FALLBACK: Gym = {
  name: "Academia Flow",
  address: "Endereço não informado",
  students: 0,
  professors: 0,
  rating: 0,
  top: [],
};

const avatarUrl = (name: string) =>
  `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=1f1f22&color=d7ff3e&bold=true&size=160`;

const POSITION_STYLE = ["text-brand", "text-white/80", "text-amber-500"];

function GymPage() {
  const { gymId } = useParams({ from: "/_authenticated/gym/$gymId" });
  const gym = GYMS[gymId] ?? FALLBACK;

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="relative h-56 w-full overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(120%_100%_at_50%_0%,var(--color-surface-2),var(--color-background))]" />
        <div className="absolute inset-0 hero-fade" />
        <Link
          to="/search"
          aria-label="Voltar"
          className="absolute left-4 top-4 flex size-9 items-center justify-center rounded-full border border-border bg-black/40 text-foreground backdrop-blur"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <div className="absolute inset-x-0 bottom-6 flex flex-col items-center">
          <div className="flex size-24 items-center justify-center rounded-2xl border border-brand/40 bg-black/60 shadow-[0_10px_40px_-12px_var(--brand)]">
            <span className="text-2xl font-black italic tracking-tight">
              <span className="text-brand">{gym.name.charAt(0)}</span>
              <span className="text-foreground">{gym.name.split(" ")[0].slice(1, 4).toUpperCase()}</span>
            </span>
          </div>
        </div>
      </header>

      <main className="mx-auto -mt-2 max-w-md px-4">
        <h1 className="text-center font-sans text-xl font-semibold not-italic tracking-tight">{gym.name}</h1>
        <p className="mx-auto mt-2 flex max-w-xs items-start justify-center gap-1.5 text-center text-xs text-muted-foreground">
          <MapPin className="mt-0.5 size-3.5 shrink-0" />
          {gym.address}
        </p>

        <div className="mt-6 grid grid-cols-3 divide-x divide-white/5 rounded-2xl border border-border bg-surface py-4">
          {[
            { label: "Alunos", value: gym.students, icon: Users },
            { label: "Professores", value: gym.professors, icon: Users },
            { label: "Avaliação", value: gym.rating.toFixed(1), icon: Star },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <Icon className="size-4 text-brand" />
              <span className="text-lg font-bold">{value}</span>
              <span className="text-[11px] text-muted-foreground">{label}</span>
            </div>
          ))}
        </div>

        <div className="mt-5 space-y-3">
          <Link
            to="/checkin"
            className="flex w-full items-center justify-center gap-2 rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground shadow-[0_10px_30px_-12px_var(--brand)]"
          >
            <QrCode className="size-4" strokeWidth={2.5} />
            Fazer check-in
          </Link>
          <button
            type="button"
            className="flex w-full items-center justify-center gap-2 rounded-full border border-border bg-surface py-3.5 text-sm font-semibold text-foreground transition-colors hover:bg-surface-2"
          >
            <CalendarDays className="size-4" />
            Ver agenda
          </button>
        </div>

        <section className="mt-8">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">Ranking da academia</h2>
            <Link to="/ranking" className="text-xs font-semibold text-brand">
              Ver todos
            </Link>
          </div>

          <ul className="mt-2 divide-y divide-white/5">
            {gym.top.map((athlete, i) => (
              <li key={athlete.name} className="flex items-center gap-3 py-3">
                <span className={`w-5 text-sm font-bold ${POSITION_STYLE[i] ?? "text-muted-foreground"}`}>
                  {i + 1}
                </span>
                <img
                  src={avatarUrl(athlete.name)}
                  alt={athlete.name}
                  loading="lazy"
                  className="size-10 rounded-full object-cover ring-1 ring-white/10"
                />
                <span className="min-w-0 flex-1 truncate text-sm font-semibold">{athlete.name}</span>
                <span className="font-mono text-sm text-brand">{athlete.xp.toLocaleString("pt-BR")} XP</span>
              </li>
            ))}
            {gym.top.length === 0 && (
              <li className="py-4 text-sm text-muted-foreground">Ranking ainda não disponível.</li>
            )}
          </ul>
        </section>
      </main>
      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/gym/$gymId")({
  head: () => ({
    meta: [
      { title: "Academia | Flow Jiu-Jitsu" },
      { name: "description", content: "Veja informações, agenda e ranking da academia de Jiu-Jitsu." },
      { property: "og:title", content: "Academia | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Veja informações, agenda e ranking da academia de Jiu-Jitsu." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: GymPage,
});
