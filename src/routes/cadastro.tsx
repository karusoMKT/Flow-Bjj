import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { City, Country, State } from "country-state-city";
import { supabase } from "@/integrations/supabase/client";
import { BELTS } from "@/lib/feed";

export const Route = createFileRoute("/cadastro")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Criar conta — Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Crie sua conta Flow, registre seus treinos e comece a ganhar XP no tatame.",
      },
      { property: "og:title", content: "Criar conta — Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Crie sua conta Flow, registre seus treinos e comece a ganhar XP no tatame.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: SignupPage,
});

const signupSchema = z.object({
  fullName: z.string().trim().min(2, { message: "Informe seu nome completo" }).max(100),
  email: z.string().trim().email({ message: "E-mail inválido" }).max(255),
  password: z.string().min(6, { message: "A senha precisa de ao menos 6 caracteres" }).max(72),
  team: z.string().trim().max(80).optional(),
  professor: z.string().trim().max(80).optional(),
});

function SignupPage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    password: "",
    countryCode: "BR",
    stateCode: "",
    cityName: "",
    team: "",
    professor: "",
    belt: "Branca",
    degrees: 0,
    competitor: true,
  });

  const countries = useMemo(() => Country.getAllCountries(), []);
  const states = useMemo(
    () => (form.countryCode ? State.getStatesOfCountry(form.countryCode) : []),
    [form.countryCode],
  );
  const cities = useMemo(
    () =>
      form.countryCode && form.stateCode
        ? City.getCitiesOfState(form.countryCode, form.stateCode)
        : [],
    [form.countryCode, form.stateCode],
  );

  const locationLabel = [
    form.cityName,
    form.stateCode,
    countries.find((c) => c.isoCode === form.countryCode)?.name,
  ]
    .filter(Boolean)
    .join(", ");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = signupSchema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signUp({
        email: parsed.data.email,
        password: parsed.data.password,
        options: {
          emailRedirectTo: window.location.origin,
          data: {
            full_name: parsed.data.fullName,
            username: parsed.data.email.split("@")[0],
            city: locationLabel,
            team: form.team,
            professor: form.professor,
            belt: form.belt,
            degrees: form.degrees,
            competitor: form.competitor,
          },
        },
      });
      if (error) {
        toast.error(
          error.message.includes("registered") ? "E-mail já cadastrado." : "Não foi possível cadastrar.",
        );
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        navigate({ to: "/home", replace: true });
      } else {
        toast.success("Conta criada! Confirme seu e-mail para entrar.");
        navigate({ to: "/login", replace: true });
      }
    } finally {
      setLoading(false);
    }
  }

  const inputClass =
    "mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-3 text-sm outline-none placeholder:text-muted-foreground focus:border-brand";
  const labelClass = "text-[11px] uppercase tracking-wide text-muted-foreground";
  const selectClass =
    "w-full appearance-none rounded-xl border border-white/10 bg-surface-2 px-3 py-3 text-sm text-foreground outline-none transition-colors focus:border-brand";

  return (
    <main className="flex min-h-screen flex-col bg-background px-6 py-8">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col">
        <Link to="/login" className="text-sm text-muted-foreground" aria-label="Voltar para o login">
          ←
        </Link>
        <h1 className="mt-4 font-display text-2xl font-extrabold">Crie sua conta</h1>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="fullName" className={labelClass}>
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
          <div className="space-y-3 rounded-xl border border-white/10 bg-surface/60 p-3">
            <span className={labelClass}>Localização</span>
            <div>
              <label htmlFor="country" className="sr-only">
                País
              </label>
              <select
                id="country"
                value={form.countryCode}
                onChange={(e) =>
                  setForm((f) => ({ ...f, countryCode: e.target.value, stateCode: "", cityName: "" }))
                }
                className={selectClass}
              >
                <option value="">Selecione o país</option>
                {countries.map((c) => (
                  <option key={c.isoCode} value={c.isoCode} className="bg-surface">
                    {c.flag} {c.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="state" className="sr-only">
                Estado
              </label>
              <select
                id="state"
                value={form.stateCode}
                disabled={!states.length}
                onChange={(e) => setForm((f) => ({ ...f, stateCode: e.target.value, cityName: "" }))}
                className={`${selectClass} disabled:opacity-50`}
              >
                <option value="">Selecione o estado</option>
                {states.map((s) => (
                  <option key={s.isoCode} value={s.isoCode} className="bg-surface">
                    {s.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label htmlFor="cityName" className="sr-only">
                Cidade
              </label>
              <select
                id="cityName"
                value={form.cityName}
                disabled={!cities.length}
                onChange={(e) => set("cityName", e.target.value)}
                className={`${selectClass} disabled:opacity-50`}
              >
                <option value="">Selecione a cidade</option>
                {cities.map((c) => (
                  <option key={`${c.name}-${c.latitude}-${c.longitude}`} value={c.name} className="bg-surface">
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
            {locationLabel && (
              <p className="text-xs font-semibold text-brand">{locationLabel}</p>
            )}
          </div>
          <div>
            <label htmlFor="team" className={labelClass}>
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
          <div>
            <label htmlFor="professor" className={labelClass}>
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
            <span className={labelClass}>Faixa</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {BELTS.map((b) => (
                <button
                  key={b}
                  type="button"
                  onClick={() => set("belt", b)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    form.belt === b ? "bg-brand text-brand-foreground" : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  {b}
                </button>
              ))}
            </div>
          </div>

          <div>
            <span className={labelClass}>Graus</span>
            <div className="mt-2 flex gap-2">
              {[0, 1, 2, 3, 4].map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => set("degrees", d)}
                  className={`h-9 w-9 rounded-full text-xs font-bold transition-colors ${
                    form.degrees === d ? "bg-brand text-brand-foreground" : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          <div className="flex items-center justify-between rounded-xl bg-surface px-4 py-3">
            <span className="text-sm text-muted-foreground">Evoluir no Jiu-Jitsu · Competidor?</span>
            <button
              type="button"
              role="switch"
              aria-checked={form.competitor}
              aria-label="Sou competidor"
              onClick={() => set("competitor", !form.competitor)}
              className={`relative h-6 w-11 rounded-full transition-colors ${
                form.competitor ? "bg-brand" : "bg-surface-2"
              }`}
            >
              <span
                className={`absolute top-0.5 h-5 w-5 rounded-full bg-background transition-all ${
                  form.competitor ? "left-[22px]" : "left-0.5"
                }`}
              />
            </button>
          </div>

          <div>
            <label htmlFor="email" className={labelClass}>
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
            <label htmlFor="password" className={labelClass}>
              Senha
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={(e) => set("password", e.target.value)}
              className={inputClass}
              placeholder="••••••••"
              autoComplete="new-password"
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground disabled:opacity-60"
          >
            {loading ? "Aguarde..." : "Concluir cadastro"}
          </button>
        </form>

        <p className="mt-6 pb-4 text-center text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link to="/login" className="font-semibold text-brand">
            Entrar
          </Link>
        </p>
      </div>
    </main>
  );
}
