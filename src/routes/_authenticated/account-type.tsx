import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { ACCOUNT_TYPES, type AccountType } from "@/lib/account";
import { useAccountType } from "@/hooks/useAccountType";

export const Route = createFileRoute("/_authenticated/account-type")({
  validateSearch: (search: Record<string, unknown>) => ({
    onboarding: search.onboarding === true || search.onboarding === "true",
  }),
  head: () => ({
    meta: [
      { title: "Tipo de conta | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Escolha se você é aluno, professor ou academia e personalize sua experiência no Flow.",
      },
      { property: "og:title", content: "Tipo de conta | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Escolha se você é aluno, professor ou academia e personalize sua experiência no Flow.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AccountTypePage,
});

function AccountTypePage() {
  const navigate = useNavigate();
  const { onboarding } = useSearch({ from: "/_authenticated/account-type" });
  const queryClient = useQueryClient();
  const { data: current } = useAccountType();
  const [selected, setSelected] = useState<AccountType | null>(null);
  const [saving, setSaving] = useState(false);

  const active = selected ?? current ?? "student";

  async function save() {
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const id = auth.user?.id;
      if (!id) throw new Error("Faça login novamente");
      const { error } = await supabase
        .from("profiles")
        .update({ account_type: active } as never)
        .eq("id", id);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["account-type"] });
      toast.success("Tipo de conta atualizado!");
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível salvar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto flex max-w-md items-center gap-3 px-4 pt-6">
        {!onboarding && (
          <button
            type="button"
            onClick={() => navigate({ to: "/settings" })}
            aria-label="Voltar"
            className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-5" />
          </button>
        )}
        <h1 className="font-sans text-lg font-semibold tracking-tight">Tipo de conta</h1>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Como você vive o Jiu-Jitsu? Isso define as ferramentas que você verá no Flow.
        </p>

        <ul className="mt-6 flex flex-col gap-3">
          {ACCOUNT_TYPES.map((type) => {
            const isActive = active === type.key;
            return (
              <li key={type.key}>
                <button
                  type="button"
                  onClick={() => setSelected(type.key)}
                  aria-pressed={isActive}
                  className={`flex w-full items-start gap-4 rounded-2xl border p-4 text-left transition-all ${
                    isActive
                      ? "border-brand bg-brand/[0.07] shadow-[0_0_0_1px_var(--color-brand),0_0_28px_-12px_var(--color-brand)]"
                      : "border-white/5 bg-surface hover:border-white/15"
                  }`}
                >
                  <span
                    className={`grid size-12 shrink-0 place-items-center rounded-xl ${
                      isActive ? "bg-brand text-brand-foreground" : "bg-surface-2 text-brand"
                    }`}
                  >
                    <type.icon className="size-6" strokeWidth={1.8} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="flex items-center gap-2">
                      <span className="text-[15px] font-bold text-foreground">{type.title}</span>
                      {isActive && <Check className="size-4 text-brand" strokeWidth={3} />}
                    </span>
                    <span className="mt-1 block text-[13px] leading-snug text-muted-foreground">
                      {type.description}
                    </span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>

        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="mt-8 flex w-full items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground disabled:opacity-60"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          {onboarding ? "Continuar" : "Salvar"}
        </button>
      </main>
    </div>
  );
}
