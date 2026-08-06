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
      const { error } = await supabase.from("posts").insert({
        user_id: userId,
        post_type: "social",
        content: text.trim() || null,
        image_url: imageUrl,
        location: location.trim() || null,
        link: link.trim() || null,
      });
      if (error) throw error;
      reset();
      await qc.invalidateQueries({ queryKey: ["feed"] });
      toast.success("Publicado no feed! 🔥");
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
      <div className="flex items-start gap-3 p-3">
        <AvatarBubble src={avatarUrl} name={name} className="size-9" />
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          onFocus={() => setFocused(true)}
          rows={expanded ? 3 : 1}
          placeholder={placeholder}
          aria-label="Escreva uma publicação"
          className="mt-0.5 w-full flex-1 resize-none rounded-2xl border border-white/8 bg-surface-2 px-4 py-2.5 text-sm text-foreground outline-none transition-all placeholder:text-muted-foreground focus:border-brand/60"
        />
      </div>

      {imagePreview && (
        <div className="relative mx-3 mb-3 overflow-hidden rounded-xl border border-white/8">
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
        <div className="px-3 pb-3">
          <LocationAutocomplete
            value={location}
            onChange={setLocation}
            placeholder="Onde foi isso?"
            ariaLabel="Localização da publicação"
          />
        </div>
      )}

      {showLink && (
        <div className="px-3 pb-3">
          <input
            value={link}
            onChange={(e) => setLink(e.target.value)}
            inputMode="url"
            placeholder="https://link-do-convite.com"
            aria-label="Link ou convite"
            className="h-11 w-full rounded-xl border border-white/8 bg-surface-2 px-4 text-sm text-foreground outline-none placeholder:text-muted-foreground focus:border-brand/60"
          />
        </div>
      )}

      <div className="flex items-center gap-1 border-t border-white/5 px-2 py-2">
        <input ref={fileRef} type="file" accept="image/*,video/*" className="hidden" onChange={pickImage} />
        <ComposerAction icon={ImageIcon} label="Imagem/Vídeo" onClick={() => fileRef.current?.click()} active={!!imagePreview} />
        <ComposerAction icon={MapPin} label="Localização" onClick={() => setShowLocation((v) => !v)} active={showLocation} />
        <ComposerAction icon={Link2} label="Link" onClick={() => setShowLink((v) => !v)} active={showLink} />
        <button
          type="button"
          onClick={publish}
          disabled={!canPost || saving}
          className="ml-auto inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-black uppercase tracking-wider text-brand-foreground transition-transform active:scale-95 disabled:opacity-40"
        >
          {saving && <Loader2 className="size-3.5 animate-spin" />}
          Publicar
        </button>
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
