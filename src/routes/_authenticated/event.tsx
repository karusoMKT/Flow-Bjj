import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { useRef, useState } from "react";
import { ArrowLeft, CalendarDays, ImagePlus, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadShareImage } from "@/lib/stories";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";

export const Route = createFileRoute("/_authenticated/event")({
  head: () => ({
    meta: [
      { title: "Criar evento | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Crie um evento de Jiu-Jitsu: campeonatos, seminários e treinos abertos para a comunidade.",
      },
      { property: "og:title", content: "Criar evento | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Crie um evento de Jiu-Jitsu: campeonatos, seminários e treinos abertos para a comunidade.",
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
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [location, setLocation] = useState("");
  const [content, setContent] = useState("");
  const [cover, setCover] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function pickCover(file?: File | null) {
    if (!file) return;
    setCover(file);
    setCoverPreview(URL.createObjectURL(file));
  }

  function clearCover() {
    setCover(null);
    if (coverPreview) URL.revokeObjectURL(coverPreview);
    setCoverPreview(null);
    if (fileRef.current) fileRef.current.value = "";
  }

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) {
      toast.error("Dê um título ao evento");
      return;
    }
    setSaving(true);
    try {
      const { data: auth } = await supabase.auth.getUser();
      const userId = auth.user?.id;
      if (!userId) throw new Error("Faça login novamente");

      const imageUrl = cover ? await uploadShareImage(cover, userId) : null;

      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        content: content.trim() || null,
        image_url: imageUrl,
        post_type: "event",
        event_title: title.trim(),
        event_date: date ? new Date(date).toISOString() : null,
        event_location: location.trim() || null,
      } as never);
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Evento publicado no feed! 🥋");
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
        <h1 className="font-sans text-lg font-semibold tracking-tight">Criar evento</h1>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6">
        <form onSubmit={submit} className="flex flex-col gap-4">
          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Título</span>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Open de Jiu-Jitsu, Seminário..."
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

          <div className="flex flex-col gap-2">
            <span className="flex items-center gap-1.5 text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              <MapPin className="size-3.5" /> Local
            </span>
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              placeholder="Ginásio, academia, cidade..."
              ariaLabel="Local do evento"
            />
          </div>

          <div className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
              Imagem de capa
            </span>
            <input
              ref={fileRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => pickCover(e.target.files?.[0])}
            />
            {coverPreview ? (
              <div className="relative overflow-hidden rounded-xl border border-white/10">
                <img src={coverPreview} alt="Capa do evento" className="h-44 w-full object-cover" />
                <button
                  type="button"
                  onClick={clearCover}
                  aria-label="Remover capa"
                  className="absolute right-2 top-2 rounded-full bg-black/70 p-1.5 text-foreground"
                >
                  <X className="size-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                className="flex h-32 flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-white/15 bg-surface text-muted-foreground transition-colors hover:border-brand/50 hover:text-brand"
              >
                <ImagePlus className="size-6" />
                <span className="text-xs font-semibold">Adicionar imagem de capa</span>
              </button>
            )}
          </div>

          <label className="flex flex-col gap-2">
            <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Detalhes</span>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={4}
              placeholder="Conte como vai ser o evento..."
              className={`${inputClass} resize-none`}
            />
          </label>

          <button
            type="submit"
            disabled={saving}
            className="mt-2 flex items-center justify-center gap-2 rounded-full bg-brand py-4 text-sm font-extrabold uppercase tracking-widest text-brand-foreground disabled:opacity-60"
          >
            {saving && <Loader2 className="size-4 animate-spin" />}
            Publicar evento
          </button>
        </form>
      </main>
    </div>
  );
}
