import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, Bot, Check, Crown, Infinity as InfinityIcon, ShieldCheck } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const BENEFITS = [
  { icon: Bot, title: "IA Coach ilimitado", description: "Perguntas e planos personalizados sem limite diário." },
  { icon: BarChart3, title: "Análise avançada", description: "Relatórios completos da sua evolução no tatame." },
  { icon: InfinityIcon, title: "Histórico completo", description: "Todos os seus treinos, sem corte de 30 dias." },
  { icon: ShieldCheck, title: "Emblemas exclusivos", description: "Conquistas e molduras só para membros Premium." },
];

const PLANS = [
  { id: "mensal", label: "Mensal", price: "R$ 24,90", note: "por mês", highlight: false },
  { id: "anual", label: "Anual", price: "R$ 199,90", note: "economize 33%", highlight: true },
];

function PremiumPage() {
  return (
    <div className="min-h-screen bg-background pb-40">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="flex flex-col items-center text-center">
          <div className="grid size-14 place-items-center rounded-2xl bg-brand/15 text-brand">
            <Crown className="size-7" />
          </div>
          <h1 className="mt-4 font-sans text-2xl font-bold tracking-tight">
            Flow <span className="text-brand">Premium</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Destrave o Flow completo e acelere sua jornada rumo à faixa azul.
          </p>
        </header>

        <ul className="mt-7 space-y-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <li key={title} className="flex gap-3 rounded-2xl border border-white/5 bg-surface p-4">
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-7 grid grid-cols-2 gap-3">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`rounded-2xl border p-4 text-center ${
                plan.highlight ? "border-brand bg-brand/5" : "border-white/10 bg-surface"
              }`}
            >
              <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">{plan.label}</p>
              <p className="mt-1.5 text-lg font-bold">{plan.price}</p>
              <p className={`mt-0.5 text-[11px] ${plan.highlight ? "text-brand" : "text-muted-foreground"}`}>
                {plan.note}
              </p>
              {plan.highlight && (
                <span className="mt-2 inline-flex items-center gap-1 text-[10px] font-bold text-brand">
                  <Check className="size-3" /> Melhor valor
                </span>
              )}
            </div>
          ))}
        </section>

        <Link to="/coach" className="mt-6 block text-center text-xs font-semibold text-brand">
          Experimentar o IA Coach primeiro
        </Link>
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          className="mx-auto block w-full max-w-md rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90"
        >
          Assinar Premium
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/premium")({
  head: () => ({
    meta: [
      { title: "Flow Premium | Flow Jiu-Jitsu" },
      { name: "description", content: "Assine o Flow Premium e tenha IA Coach ilimitado, análise avançada e histórico completo." },
      { property: "og:title", content: "Flow Premium | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Assine o Flow Premium e tenha IA Coach ilimitado, análise avançada e histórico completo." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: PremiumPage,
});
