import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { markOnboardingSeen } from "@/lib/onboarding";
import step1 from "@/assets/onboarding-1.jpg";
import step2 from "@/assets/onboarding-2.jpg";
import step3 from "@/assets/onboarding-3.jpg";

export const Route = createFileRoute("/onboarding")({
  head: () => ({
    meta: [
      { title: "Comece sua jornada — Flow Jiu-Jitsu" },
      {
        name: "description",
        content:
          "Conheça o Flow: registre treinos, conecte-se com atletas e academias e suba no ranking do Jiu-Jitsu.",
      },
      { property: "og:title", content: "Comece sua jornada — Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content:
          "Conheça o Flow: registre treinos, conecte-se com atletas e academias e suba no ranking do Jiu-Jitsu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: OnboardingPage,
});

const STEPS = [
  {
    title: "Sua jornada\ncomeça aqui",
    text: "Registre seus treinos e acompanhe sua evolução cada dia no tatame.",
    image: step1,
    alt: "Atletas de Jiu-Jitsu treinando no tatame",
  },
  {
    title: "Conecte-se com\natletas e academias",
    text: "Encontre parceiros, participe de desafios e compartilhe sua paixão pelo Jiu-Jitsu.",
    image: step2,
    alt: "Equipe de Jiu-Jitsu reunida na academia",
  },
  {
    title: "Conquiste medalhas\ne suba no ranking",
    text: "Ganhe XP, complete desafios e mostre que você vive o Jiu-Jitsu todos os dias.",
    image: step3,
    alt: "Faixa preta de Jiu-Jitsu enrolada",
  },
];

function OnboardingPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const step = STEPS[index];
  const isLast = index === STEPS.length - 1;

  function finish() {
    markOnboardingSeen();
    navigate({ to: "/login", replace: true });
  }

  return (
    <main className="relative flex min-h-screen flex-col bg-background">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-10 pt-6">
        <button
          type="button"
          onClick={finish}
          className="self-end text-xs font-semibold uppercase tracking-widest text-muted-foreground"
        >
          Pular
        </button>

        <h1 className="mt-8 whitespace-pre-line font-display text-3xl font-extrabold leading-tight">
          {step.title}
        </h1>
        <p className="mt-4 max-w-xs text-sm leading-relaxed text-muted-foreground">{step.text}</p>

        <div className="relative mt-8 flex-1 overflow-hidden rounded-2xl">
          <img
            src={step.image}
            alt={step.alt}
            width={768}
            height={1024}
            loading={index === 0 ? "eager" : "lazy"}
            className="h-full min-h-[280px] w-full object-cover"
          />
          <div
            className="pointer-events-none absolute inset-0"
            style={{ background: "var(--gradient-hero)" }}
          />
        </div>

        <div className="mt-8 flex justify-center gap-2">
          {STEPS.map((s, i) => (
            <button
              key={s.title}
              type="button"
              aria-label={`Ir para o passo ${i + 1}`}
              onClick={() => setIndex(i)}
              className={`h-1.5 rounded-full transition-all ${
                i === index ? "w-6 bg-brand" : "w-1.5 bg-surface-2"
              }`}
            />
          ))}
        </div>

        <button
          type="button"
          onClick={() => (isLast ? finish() : setIndex(index + 1))}
          className="mt-6 w-full rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground"
        >
          {isLast ? "Começar" : "Próximo"}
        </button>
      </div>
    </main>
  );
}
