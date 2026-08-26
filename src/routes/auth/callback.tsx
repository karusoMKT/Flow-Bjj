import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { markPushAskPending } from "@/lib/push";

export const Route = createFileRoute("/auth/callback")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Confirmação de e-mail — Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Confirmação de e-mail da sua conta Flow Jiu-Jitsu.",
      },
      { property: "og:title", content: "Confirmação de e-mail — Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Confirmação de e-mail da sua conta Flow Jiu-Jitsu.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AuthCallbackPage,
});

type Status = "processing" | "success" | "error";

function AuthCallbackPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<Status>("processing");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function handleCallback() {
      try {
        const url = new URL(window.location.href);
        const code = url.searchParams.get("code");
        const errorDescription =
          url.searchParams.get("error_description") ?? url.searchParams.get("error");

        if (errorDescription) {
          throw new Error(errorDescription.replace(/\+/g, " "));
        }

        // Fluxo PKCE: o e-mail retorna com ?code=... e precisamos trocar por sessão.
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
        }

        // Fluxo implícito (hash #access_token=...) é detectado automaticamente
        // pelo cliente do Supabase; aqui só confirmamos que a sessão existe.
        // Aguarda algumas tentativas para o processamento do hash concluir.
        let session = null;
        for (let attempt = 0; attempt < 10; attempt++) {
          const { data } = await supabase.auth.getSession();
          if (data.session) {
            session = data.session;
            break;
          }
          await new Promise((resolve) => setTimeout(resolve, 300));
        }

        if (cancelled) return;
        if (session) {
          markPushAskPending();
          setStatus("success");
        } else {
          setStatus("error");
          setErrorMessage(
            "Não foi possível validar o link. Ele pode ter expirado — solicite um novo cadastro ou faça login.",
          );
        }
      } catch (error) {
        if (cancelled) return;
        console.error("[AuthCallback]", error);
        setStatus("error");
        setErrorMessage(
          error instanceof Error && error.message
            ? error.message
            : "Link de confirmação inválido ou expirado.",
        );
      }
    }

    void handleCallback();
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-6 py-10 text-center">
      <Logo className="h-32 w-auto sm:h-40" style={{ mixBlendMode: "lighten" }} />

      {status === "processing" && (
        <div className="mt-10 flex flex-col items-center gap-4">
          <Loader2 className="h-10 w-10 animate-spin text-brand" />
          <p className="text-sm text-muted-foreground">Confirmando seu e-mail...</p>
        </div>
      )}

      {status === "success" && (
        <div className="mt-10 flex w-full max-w-sm flex-col items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-brand/40 bg-brand/10 shadow-[0_0_30px_var(--color-brand)]">
            <CheckCircle2 className="h-10 w-10 text-brand" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-extrabold">
            E-mail confirmado com sucesso!
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Bem-vindo ao Flow. Sua jornada no tatame começa agora.
          </p>
          <button
            type="button"
            onClick={() => navigate({ to: "/home", replace: true })}
            className="mt-8 w-full rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground transition-transform active:scale-95"
          >
            Acessar o Aplicativo
          </button>
        </div>
      )}

      {status === "error" && (
        <div className="mt-10 flex w-full max-w-sm flex-col items-center">
          <span className="flex h-20 w-20 items-center justify-center rounded-full border border-destructive/40 bg-destructive/10">
            <TriangleAlert className="h-10 w-10 text-destructive" />
          </span>
          <h1 className="mt-6 font-display text-2xl font-extrabold">Ops, algo deu errado</h1>
          <p className="mt-2 text-sm text-muted-foreground">{errorMessage}</p>
          <button
            type="button"
            onClick={() => navigate({ to: "/login", replace: true })}
            className="mt-8 w-full rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground transition-transform active:scale-95"
          >
            Ir para o Login
          </button>
        </div>
      )}
    </main>
  );
}
