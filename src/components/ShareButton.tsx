import { useState } from "react";
import { Share2 } from "lucide-react";
import { ShareModal } from "@/components/ShareModal";
import type { SharePayload } from "@/lib/shareService";

/**
 * Botão de compartilhamento: abre o ShareModal com preview do card de Stories
 * e ações de postar no Story, no Feed, compartilhar ou baixar.
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
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          e.preventDefault();
          setOpen(true);
        }}
        aria-label={label}
        className={
          className ??
          "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold text-muted-foreground transition-colors hover:text-brand"
        }
      >
        <Share2 className="size-4" />
        {showLabel && <span>{label}</span>}
      </button>

      {open && <ShareModal payload={payload} onClose={() => setOpen(false)} />}
    </>
  );
}
