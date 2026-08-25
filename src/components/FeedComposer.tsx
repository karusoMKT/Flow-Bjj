import { useMemo, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Image as ImageIcon, Link2, Loader2, MapPin, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { uploadShareImage } from "@/lib/stories";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { AvatarBubble } from "@/components/PostCard";

const PLACEHOLDERS = [
  "O que rolou no tatame hoje?",
  "Compartilhe uma posição ou novidade...",
  "Qual a boa do treino?",
  "Alguma finalização nova pra contar?",
];

/** Caixa de postagem livre no topo do feed (posts sociais, sem XP). */
export function FeedComposer({
  userId,
  name,
  avatarUrl,
}: {
  userId?: string | null;
  name: string;
  avatarUrl?: string | null;
}) {
  const qc = useQueryClient();
  const [focused, setFocused] = useState(false);
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [showLocation, setShowLocation] = useState(false);
  const [location, setLocation] = useState("");
  const [showLink, setShowLink] = useState(false);
  const [link, setLink] = useState("");
  const [saving, setSaving] = useState(false);
  const [eventMode, setEventMode] = useState(false);
  const [eventTitle, setEventTitle] = useState("");
  const [eventDate, setEventDate] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const placeholder = useMemo(
    () => PLACEHOLDERS[Math.floor(Math.random() * PLACEHOLDERS.length)]!,
    [],
  );

  const expanded = focused || !!text || !!imagePreview || showLocation || showLink || eventMode;
  const canPost = eventMode ? !!eventTitle.trim() : !!text.trim() || !!imageFile;


  function pickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  function reset() {
    setText("");
    setImageFile(null);
    setImagePreview(null);
    setLocation("");
    setShowLocation(false);
    setLink("");
    setShowLink(false);
    setFocused(false);
    setEventMode(false);
    setEventTitle("");
    setEventDate("");
  }

  async function publish() {
    if (!userId) {
      toast.error("Faça login para publicar");
      return;
    }
    if (!canPost) return;
    setSaving(true);
    try {
      let imageUrl: string | null = null;
      if (imageFile) imageUrl = await uploadShareImage(imageFile, userId);
      const payload = eventMode
        ? {
            user_id: userId,
            post_type: "event",
            content: text.trim() || null,
            image_url: imageUrl,
            event_title: eventTitle.trim(),
            event_date: eventDate ? new Date(eventDate).toISOString() : null,
            event_location: location.trim() || null,
          }
        : {
            user_id: userId,
            post_type: "social",
            content: text.trim() || null,
            image_url: imageUrl,
            location: location.trim() || null,
            link: link.trim() || null,
          };
      const { error } = await supabase.from("posts").insert(payload as never);
      if (error) throw error;
      reset();
      await qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success(eventMode ? "Evento publicado! 🥋" : "Publicado no feed! 🔥");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível publicar");
    } finally {
      setSaving(false);
    }
  }


  return (
    <section
      aria-label="Criar publicação"
      className={`mx-4 mb-3 overflow-hidden rounded-2xl border bg-surface transition-colors ${
        expanded ? "border-brand/50 shadow-[0_0_0_3px_color-mix(in_oklab,var(--color-brand)_10%,transparent)]" : "border-white/8"
      }`}
    >
      {eventMode && (
        <div className="flex flex-col gap-2 border-b border-white/5 px-3 pt-3 pb-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-black uppercase tracking-widest text-brand">Novo evento</span>
            <button
              type="button"
              onClick={() => setEventMode(false)}
              aria-label="Cancelar evento"
              className="text-muted-foreground hover:text-foreground"
            >
              <X className="size-4" />
            </button>
          </div>
          <input
            value={eventTitle}
            onChange={(e) => setEventTitle(e.target.value)}
            placeholder="Título do evento (obrigatório)"
            aria-label="Título do evento"
            className="h-11 w-full rounded-xl border border-white/8 bg-surface-2 px-4 text-sm font-semibold text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
          />
          <input
            type="datetime-local"
            value={eventDate}
            onChange={(e) => setEventDate(e.target.value)}
            aria-label="Data e hora do evento"
            className="h-11 w-full rounded-xl border border-white/8 bg-surface-2 px-4 text-sm text-foreground outline-none focus:border-brand/60"
          />
        </div>
      )}

      <div className="grid grid-cols-[auto_1fr] gap-3 p-3">
        <AvatarBubble src={avatarUrl} name={name} className="size-9 shrink-0" />
        <div className="flex min-w-0 flex-col gap-3">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            rows={expanded ? 3 : 1}
            placeholder={eventMode ? "Conte como vai ser o evento..." : placeholder}
            aria-label="Escreva uma publicação"
            className="w-full resize-none rounded-2xl border border-white/8 bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand/60"
          />

          {imagePreview && (
            <div className="relative overflow-hidden rounded-xl border border-white/8">
              <img src={imagePreview} alt="Prévia da imagem" className="max-h-64 w-full object-cover" />
              <button
                type="button"
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(null);
                }}
                aria-label="Remover imagem"
                className="absolute right-2 top-2 grid size-7 place-items-center rounded-full bg-black/70 text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>
          )}

          {showLocation && (
            <LocationAutocomplete
              value={location}
              onChange={setLocation}
              placeholder={eventMode ? "Ginásio, academia, cidade..." : "Onde foi isso?"}
              ariaLabel={eventMode ? "Local do evento" : "Localização da publicação"}
            />
          )}

          {showLink && !eventMode && (
            <input
              value={link}
              onChange={(e) => setLink(e.target.value)}
              inputMode="url"
              placeholder="https://link-do-convite.com"
              aria-label="Link ou convite"
              className="h-11 w-full rounded-xl border border-white/8 bg-surface-2 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
            />
          )}
        </div>
      </div>

      <div className="grid grid-cols-[auto_1fr] gap-3 border-t border-white/5 px-3 pb-3">
        <div className="size-9 shrink-0" aria-hidden="true" />
        <div className="flex min-w-0 flex-wrap items-center gap-2">
          <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pickImage} />
          <ComposerAction
            icon={ImageIcon}
            label={eventMode ? "Capa" : "Imagem/Vídeo"}
            onClick={() => fileRef.current?.click()}
            active={!!imagePreview}
          />
          <ComposerAction icon={MapPin} label="Local" onClick={() => setShowLocation((v) => !v)} active={showLocation} />
          {!eventMode && (
            <ComposerAction icon={Link2} label="Link" onClick={() => setShowLink((v) => !v)} active={showLink} />
          )}
          <ComposerAction
            icon={CalendarDays}
            label="Evento"
            onClick={() => {
              setEventMode((v) => !v);
              if (!eventMode) {
                setShowLocation(true);
                setShowLink(false);
              }
            }}
            active={eventMode}
          />
          <button
            type="button"
            onClick={publish}
            disabled={!canPost || saving}
            className="ml-auto inline-flex shrink-0 items-center gap-2 rounded-full bg-brand px-3 py-2 text-[11px] font-black uppercase tracking-wider text-brand-foreground transition-transform active:scale-95 disabled:opacity-40 sm:px-4 sm:text-xs"
          >
            {saving && <Loader2 className="size-3.5 animate-spin" />}
            {eventMode ? "Criar evento" : "Publicar"}
          </button>
        </div>
      </div>
    </section>
  );
}

function ComposerAction({
  icon: Icon,
  label,
  onClick,
  active,
}: {
  icon: typeof MapPin;
  label: string;
  onClick: () => void;
  active?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      aria-pressed={active}
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-[11px] font-semibold transition-colors ${
        active ? "bg-brand/15 text-brand" : "text-muted-foreground hover:bg-white/5 hover:text-foreground"
      }`}
    >
      <Icon className="size-4" />
      <span>{label}</span>
    </button>
  );
}
