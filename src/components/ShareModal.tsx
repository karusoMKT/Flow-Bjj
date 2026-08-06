import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Download, Image as ImageIcon, Loader2, Rss, Share2, X } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";
import { ShareStoryCard } from "@/components/ShareStoryCard";
import { downloadBlob, nodeToPngBlob, shareNode, type SharePayload } from "@/lib/shareService";
import { supabase } from "@/integrations/supabase/client";
import { createImagePost, createStory, uploadShareImage } from "@/lib/stories";

const PREVIEW_SCALE = 0.24; // 1080x1920 -> 259x461

function defaultCaption(payload: SharePayload) {
  if (payload.kind === "achievement") return `Mais um marco alcançado no tatame: ${payload.title}! 🥋`;
  if (payload.kind === "level") return `Cheguei ao Nível ${payload.level} no tatame! 🔥`;
  return "Mais um marco alcançado no tatame! 🥋";
}

type Action = "story" | "feed" | "share" | "download" | null;

export function ShareModal({ payload, onClose }: { payload: SharePayload; onClose: () => void }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState<Action>(null);
  const [ready, setReady] = useState(false);
  const [step, setStep] = useState<"actions" | "caption">("actions");
  const [caption, setCaption] = useState(() => defaultCaption(payload));
  const queryClient = useQueryClient();

  useEffect(() => {
    let alive = true;
    (async () => {
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
      try {
        await document.fonts?.ready;
      } catch {
        /* opcional */
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, []);

  async function capture(): Promise<Blob> {
    const blob = cardRef.current ? await nodeToPngBlob(cardRef.current) : null;
    if (!blob) throw new Error("Não foi possível gerar a imagem");
    return blob;
  }

  async function currentUserId(): Promise<string> {
    const { data } = await supabase.auth.getUser();
    if (!data.user) throw new Error("Faça login para publicar");
    return data.user.id;
  }

  async function run(action: Exclude<Action, null>) {
    if (busy) return;
    setBusy(action);
    try {
      if (action === "share") {
        const result = await shareNode(cardRef.current, payload);
        if (result === "downloaded") toast.success("Imagem salva! Poste no seu Story 🔥");
        else if (result === "failed") toast.error("Não foi possível gerar a imagem");
        if (result !== "cancelled" && result !== "failed") onClose();
        return;
      }

      const blob = await capture();

      if (action === "download") {
        downloadBlob(blob, "flow-story.png");
        toast.success("Imagem salva no seu dispositivo");
        onClose();
        return;
      }

      const userId = await currentUserId();
      const imageUrl = await uploadShareImage(blob, userId);

      if (action === "story") {
        await createStory(userId, imageUrl, defaultCaption(payload));
        await queryClient.invalidateQueries({ queryKey: ["stories"] });
        toast.success("Story publicado! Válido por 24h 🔥");
      } else {
        await createImagePost(userId, imageUrl, caption.trim() || defaultCaption(payload));
        await queryClient.invalidateQueries({ queryKey: ["feed"] });
        toast.success("Post publicado no feed! 🥋");
      }
      onClose();
    } catch (e) {
      toast.error((e as Error)?.message ?? "Algo deu errado");
    } finally {
      setBusy(null);
    }
  }

  if (typeof document === "undefined") return null;

  return createPortal(
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Compartilhar"
      onClick={onClose}
      className="fixed inset-0 z-[80] grid place-items-center bg-black/85 px-5 py-8 backdrop-blur-sm animate-fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-brand/25 bg-surface p-5 animate-pop-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 z-10 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <p className="text-center text-xs font-black uppercase tracking-[0.25em] text-brand">Compartilhar</p>

        {/* Preview do card */}
        <div className="mt-4 grid place-items-center">
          <div
            className="relative overflow-hidden rounded-2xl border border-white/10 shadow-[0_0_40px_-12px] shadow-brand/40"
            style={{ width: 1080 * PREVIEW_SCALE, height: 1920 * PREVIEW_SCALE }}
          >
            <div
              style={{
                transform: `scale(${PREVIEW_SCALE})`,
                transformOrigin: "top left",
                width: 1080,
                height: 1920,
              }}
            >
              <ShareStoryCard payload={payload} />
            </div>
            {!ready && (
              <div className="absolute inset-0 grid place-items-center bg-black/60">
                <Loader2 className="size-6 animate-spin text-brand" />
              </div>
            )}
          </div>
        </div>

        {step === "caption" ? (
          <div className="mt-5 flex flex-col gap-3">
            <label htmlFor="share-caption" className="text-[11px] font-bold uppercase tracking-widest text-muted-foreground">
              Legenda
            </label>
            <textarea
              id="share-caption"
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              maxLength={280}
              placeholder="Escreva algo sobre esse marco..."
              className="w-full resize-none rounded-2xl border border-white/10 bg-background px-4 py-3 text-sm text-foreground placeholder:text-muted-foreground/70 outline-none transition-colors focus:border-brand focus:ring-2 focus:ring-brand/40"
            />
            <span className="-mt-1 text-right text-[10px] text-muted-foreground">{caption.length}/280</span>

            <button
              type="button"
              onClick={() => run("feed")}
              disabled={!!busy || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-black uppercase tracking-widest text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy === "feed" ? <Loader2 className="size-4 animate-spin" /> : <Rss className="size-4" />}
              Publicar
            </button>
            <button
              type="button"
              onClick={() => setStep("actions")}
              disabled={!!busy}
              className="w-full rounded-2xl border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
            >
              Voltar
            </button>
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-2.5">
            <button
              type="button"
              onClick={() => run("story")}
              disabled={!!busy || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-3.5 text-sm font-black uppercase tracking-widest text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {busy === "story" ? <Loader2 className="size-4 animate-spin" /> : <ImageIcon className="size-4" />}
              Postar no Story
            </button>

            <button
              type="button"
              onClick={() => setStep("caption")}
              disabled={!!busy || !ready}
              className="flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 py-3.5 text-sm font-black uppercase tracking-widest text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              <Rss className="size-4" />
              Postar no Feed
            </button>

            <div className="flex gap-2.5">
              <button
                type="button"
                onClick={() => run("share")}
                disabled={!!busy || !ready}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              >
                {busy === "share" ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
                Outros apps
              </button>
              <button
                type="button"
                onClick={() => run("download")}
                disabled={!!busy || !ready}
                className="flex flex-1 items-center justify-center gap-2 rounded-2xl border border-white/10 py-3 text-xs font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground disabled:opacity-60"
              >
                {busy === "download" ? <Loader2 className="size-4 animate-spin" /> : <Download className="size-4" />}
                Baixar
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Card em tamanho real, fora da tela, usado na captura */}
      <div style={{ position: "fixed", top: 0, left: -20000, zIndex: -1, pointerEvents: "none" }}>
        <ShareStoryCard ref={cardRef} payload={payload} />
      </div>
    </div>,
    document.body,
  );
}
