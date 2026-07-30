import { useState } from "react";
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
  { id: "trimestral", label: "Trimestral", price: "R$ 64,90", note: "economize 13%", highlight: false },
  { id: "semestral", label: "Semestral", price: "R$ 119,90", note: "economize 20%", highlight: false },
  { id: "anual", label: "Anual", price: "R$ 199,90", note: "economize 33%", highlight: true },
];

function PremiumPage() {
  const [selected, setSelected] = useState("anual");
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

        <section className="mt-7 space-y-3" role="radiogroup" aria-label="Planos Flow Premium">
          {PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(plan.id)}
                className={`relative flex w-full min-h-14 items-center gap-3 rounded-2xl border p-4 text-left transition-colors ${
                  plan.highlight
                    ? "border-brand bg-brand/5 shadow-[0_0_28px_-14px_var(--brand)]"
                    : active
                      ? "border-brand/60 bg-surface"
                      : "border-white/10 bg-surface"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-brand px-2 py-0.5 text-[10px] font-bold text-brand-foreground">
                    Melhor Custo-Benefício
                  </span>
                )}
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                    active ? "border-brand bg-brand text-brand-foreground" : "border-white/25"
                  }`}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{plan.label}</span>
                  <span className={`block text-[11px] ${plan.highlight ? "text-brand" : "text-muted-foreground"}`}>
                    {plan.note}
                  </span>
                </span>
                <span className="shrink-0 text-base font-bold">{plan.price}</span>
              </button>
            );
          })}
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
