import { createFileRoute } from "@tanstack/react-router";
import { Activity, Dumbbell, Moon, Repeat, Shirt, Swords, Timer } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

type Day = {
  day: string;
  type: "Técnica" | "Rolas" | "Drilling" | "Físico" | "Descanso";
  duration: string;
  focus: string;
  icon: React.ElementType;
  rest?: boolean;
};

const WEEK: Day[] = [
  { day: "Segunda", type: "Técnica", duration: "90 min", focus: "Passagens de guarda", icon: Shirt },
  { day: "Terça", type: "Físico", duration: "45 min", focus: "Condicionamento e core", icon: Dumbbell },
  { day: "Quarta", type: "Rolas", duration: "60 min", focus: "6 rounds de sparring", icon: Swords },
  { day: "Quinta", type: "Drilling", duration: "50 min", focus: "Raspagens de guarda fechada", icon: Repeat },
  { day: "Sexta", type: "Técnica", duration: "90 min", focus: "Quedas e clinch", icon: Shirt },
  { day: "Sábado", type: "Rolas", duration: "75 min", focus: "Open mat", icon: Activity },
  { day: "Domingo", type: "Descanso", duration: "Recuperação", focus: "Mobilidade e sono", icon: Moon, rest: true },
];

function DayRow({ item }: { item: Day }) {
  const Icon = item.icon;
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border p-3.5 ${
        item.rest ? "border-destructive/30 bg-destructive/5" : "border-white/5 bg-surface"
      }`}
    >
      <div
        className={`grid size-11 shrink-0 place-items-center rounded-xl ${
          item.rest ? "bg-destructive/15 text-destructive" : "bg-brand/10 text-brand"
        }`}
      >
        <Icon className="size-5" />
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{item.day}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
              item.rest ? "bg-destructive/15 text-destructive" : "bg-brand/15 text-brand"
            }`}
          >
            {item.type}
          </span>
        </div>
        <p className="mt-1 truncate text-sm font-medium">{item.focus}</p>
      </div>

      <div className="flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
        <Timer className="size-3.5" />
        {item.duration}
      </div>
    </li>
  );
}

function TrainingPlanPage() {
  return (
    <div className="min-h-screen bg-background pb-40">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center font-sans text-lg font-semibold tracking-tight">Plano de Treino</h1>

        <section className="mt-5 overflow-hidden rounded-2xl border border-brand/25 bg-surface p-5">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Semana atual</p>
          <h2 className="mt-1 font-sans text-xl font-bold text-brand">Operação Faixa Azul</h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Plano semanal sugerido para você. Foco: Evolução completa.
          </p>
          <div className="mt-4 flex items-center gap-4 text-xs text-muted-foreground">
            <span>
              <strong className="text-foreground">6</strong> sessões
            </span>
            <span>
              <strong className="text-foreground">6h30</strong> no tatame
            </span>
            <span>
              <strong className="text-foreground">1</strong> descanso
            </span>
          </div>
        </section>

        <ul className="mt-6 space-y-2.5">
          {WEEK.map((item) => (
            <DayRow key={item.day} item={item} />
          ))}
        </ul>
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          className="mx-auto block w-full max-w-md rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90"
        >
          Iniciar Plano
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/training-plan")({
  head: () => ({
    meta: [
      { title: "Plano de Treino | Flow Jiu-Jitsu" },
      { name: "description", content: "Plano semanal Operação Faixa Azul: técnica, rolas, drilling, físico e descanso." },
      { property: "og:title", content: "Plano de Treino | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Plano semanal Operação Faixa Azul: técnica, rolas, drilling, físico e descanso." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: TrainingPlanPage,
});
