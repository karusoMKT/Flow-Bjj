import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { BarChart3, Brain, Check, ChevronLeft, Crown, Loader2, Sparkles, Trophy, Users } from "lucide-react";
import { toast } from "sonner";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";

const BENEFITS = [
  {
    icon: Brain,
    title: "IA Coach Ilimitado",
    description: "Acesso 24h a um assistente inteligente para tirar dúvidas técnicas, criar cronogramas de drills e ajudar no seu jogo.",
  },
  { icon: Sparkles, title: "Selo exclusivo de Atleta PRO", description: "Seu nome com o raio neon em todo o app." },
  { icon: Trophy, title: "Tag de Competidor Oficial", description: "Chip dourado no feed e no seu perfil." },
  { icon: BarChart3, title: "Estatísticas avançadas", description: "Gráficos de longo prazo e histórico completo." },
  { icon: Users, title: "Maior visibilidade", description: "Destaque no ranking e na aba Explorar." },
];

const PLANS = [
  { id: "mensal", label: "Mensal", price: "R$ 14,90", note: "por mês", per: null, highlight: false },
  { id: "semestral", label: "Semestral", price: "R$ 74,90", note: "a cada 6 meses", per: "R$ 12,48/mês", highlight: false },
  { id: "anual", label: "Anual", price: "R$ 119,90", note: "por ano", per: "R$ 9,99/mês", highlight: true },
];

function fireConfetti() {
  void (async () => {
    try {
      const { default: confetti } = await import("canvas-confetti");
      const colors = ["#c6ff2e", "#ffd25e", "#ffffff"];
      confetti({ particleCount: 120, spread: 80, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
      window.setTimeout(
        () => confetti({ particleCount: 70, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true }),
        220,
      );
      window.setTimeout(
        () => confetti({ particleCount: 70, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true }),
        360,
      );
    } catch {
      /* confete é opcional */
    }
  })();
}

function ProPage() {
  const [selected, setSelected] = useState("anual");
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function subscribe() {
    if (loading) return;
    setLoading(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) throw new Error("Sem sessão");

      const { error } = await supabase.from("profiles").update({ is_pro: true }).eq("id", uid);
      if (error) throw error;

      fireConfetti();
      toast.success("Bem-vindo ao Flow PRO! 🥋");
      await queryClient.invalidateQueries();
      window.setTimeout(() => navigate({ to: "/perfil" }), 1600);
    } catch {
      toast.error("Não foi possível ativar o PRO. Tente novamente.");
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-44">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-96 bg-[radial-gradient(120%_70%_at_50%_0%,oklch(0.85_0.16_92/0.18),transparent_70%)]" />

      <main className="relative mx-auto max-w-md px-4 pt-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/perfil" })}
          aria-label="Voltar"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ChevronLeft className="size-5" />
        </button>

        <header className="mt-4 flex flex-col items-center text-center">
          <div className="grid size-16 place-items-center rounded-2xl border border-[oklch(0.85_0.16_92)]/40 bg-gradient-to-tr from-[oklch(0.85_0.16_92)]/20 to-brand/15 text-[oklch(0.9_0.14_95)] shadow-[0_0_40px_-10px_oklch(0.85_0.16_92/0.6)]">
            <Crown className="size-8" />
          </div>
          <p className="mt-4 text-[11px] font-black uppercase tracking-[0.3em] text-[oklch(0.9_0.14_95)]">Flow PRO</p>
          <h1 className="mt-2 text-3xl font-black italic leading-tight">
            Desbloqueie o <span className="text-brand">Flow PRO</span>
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Eleve seu nível no tatame com destaque, dados e reconhecimento na comunidade.
          </p>
        </header>

        <ul className="mt-7 space-y-3">
          {BENEFITS.map(({ icon: Icon, title, description }) => (
            <li
              key={title}
              className="flex gap-3 rounded-2xl border border-white/5 bg-surface p-4 transition-colors hover:border-brand/25"
            >
              <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand/10 text-brand">
                <Icon className="size-5" />
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold">{title}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{description}</p>
              </div>
            </li>
          ))}
        </ul>

        <section className="mt-8 space-y-3" role="radiogroup" aria-label="Planos Flow PRO">
          <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">Escolha seu plano</h2>
          {PLANS.map((plan) => {
            const active = selected === plan.id;
            return (
              <button
                key={plan.id}
                type="button"
                role="radio"
                aria-checked={active}
                onClick={() => setSelected(plan.id)}
                className={`relative flex w-full min-h-16 items-center gap-3 rounded-2xl border p-4 text-left transition-all ${
                  plan.highlight
                    ? active
                      ? "border-[oklch(0.85_0.16_92)] bg-[oklch(0.85_0.16_92)]/[0.07] shadow-[0_0_34px_-12px_oklch(0.85_0.16_92/0.9)]"
                      : "border-[oklch(0.85_0.16_92)]/50 bg-surface"
                    : active
                      ? "border-brand bg-brand/5"
                      : "border-white/10 bg-surface"
                }`}
              >
                {plan.highlight && (
                  <span className="absolute -top-2.5 left-4 rounded-full bg-[oklch(0.85_0.16_92)] px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-background">
                    Mais popular
                  </span>
                )}
                <span
                  className={`grid size-5 shrink-0 place-items-center rounded-full border ${
                    active
                      ? plan.highlight
                        ? "border-[oklch(0.85_0.16_92)] bg-[oklch(0.85_0.16_92)] text-background"
                        : "border-brand bg-brand text-brand-foreground"
                      : "border-white/25"
                  }`}
                >
                  {active && <Check className="size-3" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block text-sm font-semibold">{plan.label}</span>
                  <span className="block text-[11px] text-muted-foreground">{plan.note}</span>
                </span>
                <span className="shrink-0 text-right">
                  <span className="block text-base font-bold">{plan.price}</span>
                  {plan.per && (
                    <span
                      className={`block text-[11px] font-semibold ${plan.highlight ? "text-[oklch(0.9_0.14_95)]" : "text-brand"}`}
                    >
                      {plan.per}
                    </span>
                  )}
                </span>
              </button>
            );
          })}
        </section>

        <section className="mt-5">
          <label htmlFor="coupon" className="text-xs font-medium text-muted-foreground">
            Possui código de afiliado/desconto?
          </label>
          <input
            id="coupon"
            value={coupon}
            onChange={(e) => setCoupon(e.target.value.toUpperCase())}
            placeholder="EX: OSS10"
            className="mt-2 w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm uppercase tracking-wide text-foreground placeholder:text-muted-foreground/60 focus:border-brand/60 focus:outline-none"
          />
        </section>

        <p className="mt-4 text-center text-[11px] leading-relaxed text-muted-foreground">
          Cancele quando quiser. Renovação automática ao final do período.
        </p>
      </main>

      <div className="fixed inset-x-0 bottom-[72px] z-40 border-t border-border bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={subscribe}
          disabled={loading}
          className="mx-auto flex w-full max-w-md items-center justify-center gap-2 rounded-full bg-gradient-to-r from-brand to-[oklch(0.85_0.16_92)] py-3.5 text-sm font-black uppercase tracking-wide text-background shadow-[0_0_30px_-10px_var(--brand)] transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {loading ? <Loader2 className="size-4 animate-spin" /> : <Crown className="size-4" />}
          {loading ? "Ativando..." : "Assinar Flow PRO"}
        </button>
      </div>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/pro")({
  head: () => ({
    meta: [
      { title: "Flow PRO | Assine e destaque seu jiu-jitsu" },
      {
        name: "description",
        content: "IA Coach ilimitado, selo PRO, tag de competidor, estatísticas avançadas e mais visibilidade na comunidade Flow.",
      },
      { property: "og:title", content: "Flow PRO | Assine e destaque seu jiu-jitsu" },
      {
        property: "og:description",
        content: "IA Coach ilimitado, selo PRO, tag de competidor, estatísticas avançadas e mais visibilidade na comunidade Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ProPage,
});
