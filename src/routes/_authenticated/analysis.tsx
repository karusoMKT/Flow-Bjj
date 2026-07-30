import { createFileRoute } from "@tanstack/react-router";
import { AlertTriangle, CheckCircle2, Lightbulb, TrendingUp } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const STRENGTHS = [
  { title: "Consistência", description: "18 treinos em 30 dias, acima da sua média." },
  { title: "Variedade de treinos", description: "Técnica, rolas e físico bem distribuídos." },
  { title: "Participação em desafios", description: "4 desafios ativos com bom progresso." },
];

const ATTENTION = [
  { title: "Treinar mais quedas", description: "Apenas 8% das suas sessões incluíram jogo em pé." },
  { title: "Aumentar treinos de drilling", description: "Repetição é o que fixa o movimento para a faixa azul." },
];

function AnalysisPage() {
  return (
    <div className="min-h-screen bg-background pb-40">
      <main className="mx-auto max-w-md px-4 pt-6">
        <header className="flex items-center justify-center gap-2">
          <h1 className="font-sans text-lg font-semibold tracking-tight">Análise</h1>
          <span className="rounded-full bg-brand/15 px-2 py-0.5 text-[10px] font-bold tracking-wider text-brand">
            BETA
          </span>
        </header>

        <section className="mt-5 flex gap-3 rounded-2xl border border-white/5 bg-surface p-4">
          <div className="grid size-11 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
            <TrendingUp className="size-5" />
          </div>
          <p className="text-sm leading-relaxed text-foreground">
            Você treinou <strong className="text-brand">18 vezes</strong> nos últimos 30 dias. Sua consistência está
            incrível! 🔥
          </p>
        </section>

        <section className="mt-7">
          <h2 className="font-sans text-sm font-semibold text-brand">Pontos Fortes</h2>
          <ul className="mt-3 space-y-3">
            {STRENGTHS.map((item) => (
              <li key={item.title} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-brand" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7">
          <h2 className="font-sans text-sm font-semibold text-destructive">Pontos de Atenção</h2>
          <ul className="mt-3 space-y-3">
            {ATTENTION.map((item) => (
              <li key={item.title} className="flex gap-3">
                <AlertTriangle className="mt-0.5 size-5 shrink-0 text-destructive" />
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs leading-relaxed text-muted-foreground">{item.description}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>

        <section className="mt-7 flex gap-3 rounded-2xl border border-brand/40 bg-brand/5 p-4">
          <Lightbulb className="mt-0.5 size-5 shrink-0 text-brand" />
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-wider text-brand">Sugestão</p>
            <p className="mt-1 text-sm leading-relaxed text-foreground">
              Tente treinar mais quedas para evoluir seu jogo em pé.
            </p>
          </div>
        </section>
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          className="mx-auto block w-full max-w-md rounded-full bg-brand py-3.5 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90"
        >
          Ver análise completa
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/analysis")({
  head: () => ({
    meta: [
      { title: "Análise | Flow Jiu-Jitsu" },
      { name: "description", content: "Análise inteligente do seu treino: pontos fortes, pontos de atenção e sugestões." },
      { property: "og:title", content: "Análise | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Análise inteligente do seu treino: pontos fortes, pontos de atenção e sugestões." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AnalysisPage,
});
