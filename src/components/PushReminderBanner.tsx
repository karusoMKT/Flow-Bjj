import { useEffect, useState } from "react";
import { BellOff, X } from "lucide-react";
import { toast } from "sonner";
import { dismissPushBanner, getPushPermission, requestPushPermission, shouldShowPushBanner } from "@/lib/push";

/**
 * Lembrete in-app exibido no topo da Central de Notificações quando o usuário
 * recebeu interações mas as notificações do celular estão desativadas.
 */
export function PushReminderBanner({ hasInteractions }: { hasInteractions: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setOpen(hasInteractions && shouldShowPushBanner());
  }, [hasInteractions]);

  if (!open) return null;

  function close() {
    dismissPushBanner();
    setOpen(false);
  }

  async function enable() {
    if (getPushPermission() === "denied") {
      toast.info("Ative as notificações do Flow nas configurações do seu navegador.");
      return;
    }
    setLoading(true);
    try {
      const result = await requestPushPermission();
      if (result === "granted") {
        toast.success("Pronto! Você será avisado das novidades 🔔");
        setOpen(false);
      } else {
        toast.info("Sem problemas — você pode ativar depois nas configurações.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-4 flex items-start gap-3 rounded-2xl border border-brand/30 bg-brand/10 p-3.5 shadow-[0_0_28px_-14px_var(--brand)]">
      <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
        <BellOff className="size-4.5" strokeWidth={2} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="text-[12.5px] leading-snug text-foreground">
          As notificações do seu celular estão desativadas. Ative para não perder nenhum Oss ou convite para treinar!
        </p>
        <div className="mt-2.5 flex items-center gap-2">
          <button
            type="button"
            onClick={enable}
            disabled={loading}
            className="rounded-lg bg-brand px-3 py-1.5 text-[11px] font-bold text-brand-foreground disabled:opacity-60"
          >
            {loading ? "Ativando..." : "Ativar notificações"}
          </button>
          <button
            type="button"
            onClick={close}
            className="rounded-lg px-3 py-1.5 text-[11px] font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Entendi
          </button>
        </div>
      </div>
      <button
        type="button"
        onClick={close}
        aria-label="Fechar aviso"
        className="-mr-1 -mt-1 rounded-full p-1.5 text-muted-foreground transition-colors hover:text-foreground"
      >
        <X className="size-3.5" />
      </button>
    </div>
  );
}
