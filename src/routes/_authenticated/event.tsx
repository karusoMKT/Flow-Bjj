import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ArrowLeft, CalendarDays, Loader2, MapPin } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAccountType } from "@/hooks/useAccountType";
import { canPublishEvents } from "@/lib/account";

export const Route = createFileRoute("/_authenticated/event")({
  head: () => ({
    meta: [
      { title: "Criar evento ou aviso | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Professores e academias publicam seminários, aulas especiais e avisos para a equipe.",
      },
      { property: "og:title", content: "Criar evento ou aviso | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Professores e academias publicam seminários, aulas especiais e avisos para a equipe.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreateEventPage,
});

const inputClass =
  "w-full rounded-xl border border-white/10 bg-surface px-4 py-3 text-sm text-foreground outline-none transition-colors placeholder:text-muted-foreground focus:border-brand";

function CreateEventPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: accountType, isLoading } = useAccountType();
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [saving, setSaving] = useState(false);

  const allowed = canPublishEvents(accountType);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Dê um título ao evento ou aviso");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Faça login novamente");
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        content: content.trim() || null,
        post_type: "event",
        event_title: title.trim(),
        event_date: date ? new Date(date).toISOString() : null,
        event_location: location.trim() || null,
      } as never);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Publicado no feed! 🥋");
      navigate({ to: "/home", replace: true });
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível publicar");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto flex max-w-md items-center gap-3 px-4 pt-6">
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          aria-label="Voltar"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="font-sans text-lg font-semibold tracking-tight">Criar evento / aviso</h1>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6">
        {isLoading ? (
          <div className="h-40 animate-pulse rounded-2xl bg-white/5" />
        ) : !allowed ? (
          <div className="rounded-2xl border border-white/5 bg-surface p-6 text-center">
            <p className="text-sm text-muted-foreground">
              Apenas contas de Professor ou Academia podem publicar eventos e avisos.
            </p>
            <button
              type="button"
              onClick={() => navigate({ to: "/account-type", search: { onboarding: false } })}
              className="mt-4 rounded-xl bg-brand px-4 py-2 text-xs font-bold text-brand-foreground"
            >
              Alterar tipo de conta
            </button>
          </div>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-4">
            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Título</span>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Seminário com o professor..."
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <CalendarDays className="size-3.5" /> Data e hora
              </span>
              <input
                type="datetime-local"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                <MapPin className="size-3.5" /> Local
              </span>
              <input
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                placeholder="Academia, cidade..."
                className={inputClass}
              />
            </label>

            <label className="flex flex-col gap-2">
              <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detalhes</span>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={4}
                placeholder="Escreva o aviso para a equipe..."
                className={`${inputClass} resize-none`}
              />
            </label>

            <button
              type="submit"
              disabled={saving}
              className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground disabled:opacity-60"
            >
              {saving && <Loader2 className="size-4 animate-spin" />}
              Publicar
            </button>
          </form>
        )}
      </main>
    </div>
  );
}
