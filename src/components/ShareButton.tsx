import { useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { ShareStoryCard } from "@/components/ShareStoryCard";
import { shareNode, type SharePayload } from "@/lib/shareService";

/**
 * Botão de compartilhamento: renderiza um card de Stories fora da tela,
 * converte em PNG e abre a gaveta nativa (ou baixa a imagem).
 */
export function ShareButton({
  payload,
  label = "Compartilhar",
  showLabel = true,
  className,
}: {
  payload: SharePayload;
  label?: string;
  showLabel?: boolean;
  className?: string;
}) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [rendering, setRendering] = useState(false);
  const [busy, setBusy] = useState(false);

  async function onShare(e: React.MouseEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    setRendering(true);
    // aguarda o card ser montado e as fontes carregarem
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    try {
      await document.fonts?.ready;
    } catch {
      /* opcional */
    }

    const result = await shareNode(cardRef.current, payload);
    if (result === "downloaded") toast.success("Imagem salva! Poste no seu Story 🔥");
    else if (result === "failed") toast.error("Não foi possível gerar a imagem");

    setRendering(false);
    setBusy(false);
  }

  return (
    <>
      <button
        type="button"
        onClick={onShare}
        disabled={busy}
        aria-label={label}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-brand disabled:opacity-60"
        }
      >
        {busy ? <Loader2 className="size-4 animate-spin" /> : <Share2 className="size-4" />}
        {showLabel && <span>{label}</span>}
      </button>

      {rendering &&
        typeof document !== "undefined" &&
        createPortal(
          <div style={{ position: "fixed", top: 0, left: -20000, zIndex: -1, pointerEvents: "none" }}>
            <ShareStoryCard ref={cardRef} payload={payload} />
          </div>,
          document.body,
        )}
    </>
  );
}
