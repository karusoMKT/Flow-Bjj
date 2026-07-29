import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { HAS_SEEN_ONBOARDING } from "@/lib/onboarding";

export const Route = createFileRoute("/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Flow Jiu-Jitsu — Every roll tells a story" },
      {
        name: "description",
        content:
          "Flow é a rede social do Jiu-Jitsu: registre treinos, acompanhe sua evolução no tatame e conecte-se com atletas e academias.",
      },
      { property: "og:title", content: "Flow Jiu-Jitsu — Every roll tells a story" },
      {
        property: "og:description",
        content:
          "Flow é a rede social do Jiu-Jitsu: registre treinos, acompanhe sua evolução no tatame e conecte-se com atletas e academias.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SplashPage,
});

function SplashPage() {
  const navigate = useNavigate();

  useEffect(() => {
    let cancelled = false;
    const start = Date.now();

    async function decide() {
      const { data } = await supabase.auth.getSession();
      const seen = localStorage.getItem(HAS_SEEN_ONBOARDING) === "true";
      const to = data.session ? "/home" : seen ? "/login" : "/onboarding";
      const wait = Math.max(0, 3000 - (Date.now() - start));
      setTimeout(() => {
        if (!cancelled) navigate({ to, replace: true });
      }, wait);
    }

    decide();
    return () => {
      cancelled = true;
    };
  }, [navigate]);

  return (
    <main
      className="relative flex min-h-screen flex-col items-center justify-center bg-black px-8"
      style={{ backgroundColor: "#000000" }}
    >
      <h1 className="sr-only">Flow Jiu-Jitsu</h1>
      <div className="flex flex-col items-center gap-8">
        <div className="animate-in fade-in zoom-in-95 duration-700">
          <Logo
            className="h-52 w-auto sm:h-60"
            style={{ mixBlendMode: "lighten" }}
          />
        </div>
        <p className="text-center text-[11px] font-semibold uppercase tracking-[0.4em] text-white sm:text-xs">
          Every roll tells a{" "}
          <span className="text-brand">Story</span>
        </p>
      </div>
      <div className="absolute bottom-16 left-1/2 h-1 w-28 -translate-x-1/2 overflow-hidden rounded-full bg-white/10">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand shadow-[0_0_12px_var(--color-brand)]" />
      </div>
    </main>
  );
}
