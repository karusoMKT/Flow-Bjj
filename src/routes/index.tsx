import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { Logo } from "@/components/Logo";
import { BELTS } from "@/lib/feed";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Flow Jiu-Jitsu — Entre e registre seus treinos" },
      {
        name: "description",
        content:
          "Rede social do Jiu-Jitsu: faça check-in nos treinos, acompanhe sua evolução e conecte-se com atletas e academias.",
      },
      { property: "og:title", content: "Flow Jiu-Jitsu — Entre e registre seus treinos" },
      {
        property: "og:description",
        content:
          "Rede social do Jiu-Jitsu: faça check-in nos treinos, acompanhe sua evolução e conecte-se com atletas e academias.",
      },
    ],
  }),
  component: AuthPage,
});

const loginSchema = z.object({
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255),
  password: z.string().min(6, { message: "A senha precisa de ao menos 6 caracteres" }).max(72),
});

const signupSchema = loginSchema.extend({
  fullName: z.string().trim().min(2, { message: "Informe seu nome completo" }).max(100),
  team: z.string().trim().max(80).optional(),
  professor: z.string().trim().max(80).optional(),
  city: z.string().trim().max(80).optional(),
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    email: "",
    password: "",
    fullName: "",
    team: "",
    professor: "",
    city: "",
    belt: "Branca",
  });

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/home", replace: true });
    });
  }, [navigate]);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const parsed = loginSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: parsed.data.email,
          password: parsed.data.password,
        });
        if (error) {
          toast.error("E-mail ou senha incorretos.");
          return;
        }
        navigate({ to: "/home", replace: true });
      } else {
        const parsed = signupSchema.safeParse(form);
        if (!parsed.success) {
          toast.error(parsed.error.issues[0].message);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email: parsed.data.email,
          password: parsed.data.password,
          options: {
            emailRedirectTo: window.location.origin,
            data: {
              full_name: parsed.data.fullName,
              username: parsed.data.email.split("@")[0],
              team: form.team,
              professor: form.professor,
              city: form.city,
              belt: form.belt,
            },
          },
        });
        if (error) {
          toast.error(error.message.includes("registered") ? "E-mail já cadastrado." : "Não foi possível cadastrar.");
          return;
        }
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          navigate({ to: "/home", replace: true });
        } else {
          toast.success("Conta criada! Confirme seu e-mail para entrar.");
          setMode("login");
        }
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-primary";

  return (
    <div className="flex min-h-screen flex-col bg-background px-6 py-10">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <div className="flex flex-col items-center pt-6">
          <Logo />
          <h1 className="mt-8 text-2xl font-bold">
            {mode === "login" ? "Bem-vindo de volta!" : "Crie sua conta"}
          </h1>
          <p className="mt-1 text-center text-sm text-muted-foreground">
            {mode === "login"
              ? "Entre para ver os treinos da sua equipe."
              : "Every roll tells a story. Comece a sua."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-4">
          {mode === "signup" && (
            <>
              <div>
                <label htmlFor="fullName" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Nome completo
                </label>
                <input
                  id="fullName"
                  value={form.fullName}
                  onChange={(e) => set("fullName", e.target.value)}
                  className={inputClass}
                  placeholder="Carlos Santos"
                  autoComplete="name"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="city" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Cidade
                  </label>
                  <input
                    id="city"
                    value={form.city}
                    onChange={(e) => set("city", e.target.value)}
                    className={inputClass}
                    placeholder="Rio de Janeiro"
                  />
                </div>
                <div>
                  <label htmlFor="team" className="text-xs uppercase tracking-wide text-muted-foreground">
                    Equipe
                  </label>
                  <input
                    id="team"
                    value={form.team}
                    onChange={(e) => set("team", e.target.value)}
                    className={inputClass}
                    placeholder="Alliance"
                  />
                </div>
              </div>
              <div>
                <label htmlFor="professor" className="text-xs uppercase tracking-wide text-muted-foreground">
                  Professor
                </label>
                <input
                  id="professor"
                  value={form.professor}
                  onChange={(e) => set("professor", e.target.value)}
                  className={inputClass}
                  placeholder="João Miyao"
                />
              </div>
              <div>
                <span className="text-xs uppercase tracking-wide text-muted-foreground">Faixa</span>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BELTS.map((b) => (
                    <button
                      key={b}
                      type="button"
                      onClick={() => set("belt", b)}
                      className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                        form.belt === b ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
                      }`}
                    >
                      {b}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div>
            <label htmlFor="email" className="text-xs uppercase tracking-wide text-muted-foreground">
              E-mail
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
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
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {loading ? "Aguarde..." : mode === "login" ? "Entrar" : "Concluir cadastro"}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          {mode === "login" ? "Não tem uma conta? " : "Já tem conta? "}
          <button
            type="button"
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="font-semibold text-brand"
          >
            {mode === "login" ? "Criar conta" : "Entrar"}
          </button>
        </p>
      </div>
    </div>
  );
}
