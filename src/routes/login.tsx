import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Mail } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { markOnboardingSeen } from "@/lib/onboarding";
import { markPushAskPending } from "@/lib/push";

export const Route = createFileRoute("/login")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Entrar — Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Acesse sua conta Flow para registrar treinos e acompanhar a evolução da sua equipe.",
      },
      { property: "og:title", content: "Entrar — Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Acesse sua conta Flow para registrar treinos e acompanhar a evolução da sua equipe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: LoginPage,
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255),
  password: z.string().min(6, { message: "A senha precisa de ao menos 6 caracteres" }).max(72),
});

function LoginPage() {
  const navigate = useNavigate();
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    markOnboardingSeen();
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = loginSchema.safeParse({ email, password });
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email: parsed.data.email,
        password: parsed.data.password,
      });
      if (error) {
        toast.error("E-mail ou senha incorretos.");
        return;
      }
      markPushAskPending();
      navigate({ to: "/home", replace: true });
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-brand";

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Link
          to="/onboarding"
          className="text-sm text-muted-foreground"
          aria-label="Voltar para o onboarding"
        >
          ←
        </Link>

        <div className="mt-12 flex flex-col items-center">
          <Logo className="h-44 w-auto sm:h-52" style={{ mixBlendMode: "lighten" }} />
          <h1 className="mt-8 text-lg font-semibold">Bem-vindo de volta!</h1>
        </div>


        {!showForm ? (
          <div className="mt-10 space-y-3">
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-white/15 bg-surface-2/60 py-3.5 text-sm font-semibold shadow-sm transition-colors hover:bg-surface-2"
            >
              <Mail className="h-4 w-4" />
              Entrar com e-mail
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
                E-mail
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClass}
                placeholder="voce@email.com"
                autoComplete="email"
              />
            </div>
            <div>
              <label htmlFor="password" className="text-xs uppercase tracking-wide text-muted-foreground">
                Senha
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClass}
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground disabled:opacity-60"
            >
              {loading ? "Entrando..." : "Entrar"}
            </button>
          </form>
        )}

        <p className="mt-auto pt-10 text-center text-sm text-muted-foreground">
          Não tem uma conta?{" "}
          <Link to="/cadastro" className="font-semibold text-brand">
            Criar conta
          </Link>
        </p>
      </div>
    </main>
  );
}
