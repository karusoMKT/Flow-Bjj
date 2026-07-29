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
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-8">
      <h1 className="sr-only">Flow Jiu-Jitsu</h1>
      <div className="animate-in fade-in zoom-in-95 duration-700">
        <Logo className="h-40 w-auto" />
      </div>
      <div className="absolute bottom-12 h-1 w-24 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full w-1/2 animate-pulse rounded-full bg-brand" />
      </div>
    </main>
  );
}
