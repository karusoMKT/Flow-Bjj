import { useEffect, useState } from "react";
import { Bell, X } from "lucide-react";
import { toast } from "sonner";
import { markPushPromptSeen, requestPushPermission, shouldAskForPush } from "@/lib/push";

/**
 * Alerta amigável (não nativo) pedindo permissão de notificações.
 * Só aparece uma vez por dispositivo e apenas se a permissão ainda estiver pendente.
 */
export function PushPermissionPrompt({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(() => setOpen(shouldAskForPush()), 900);
    return () => clearTimeout(t);
  }, [enabled]);

  if (!open) return null;

  function dismiss() {
    markPushPromptSeen();
    setOpen(false);
  }

  async function accept() {
    setLoading(true);
    try {
      const result = await requestPushPermission();
      if (result === "granted") toast.success("Pronto! Você será avisado das novidades 🔔");
      else if (result === "denied") toast.info("Sem problemas — você pode ativar depois nas configurações.");
    } finally {
      setLoading(false);
      setOpen(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Ativar notificações"
      className="fixed inset-0 z-[80] grid place-items-end bg-black/70 px-4 pb-24 animate-fade-in sm:place-items-center sm:pb-0"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-6 text-center shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Agora não"
          className="float-right -mr-2 -mt-2 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>
        <span className="mx-auto grid size-14 place-items-center rounded-2xl bg-brand/15 text-brand shadow-[0_0_28px_-8px_var(--brand)]">
          <Bell className="size-7" />
        </span>
        <h2 className="mt-4 text-base font-bold text-foreground">
          Quer ser avisado quando seus parceiros de treino interagirem com você?
        </h2>
        <p className="mt-2 text-xs text-muted-foreground">
          Curtidas, comentários, pedidos de conexão e mensagens direto no seu celular.
        </p>
        <div className="mt-5 flex flex-col gap-2">
          <button
            type="button"
            onClick={accept}
            disabled={loading}
            className="rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground shadow-[0_0_24px_-6px_var(--brand)] disabled:opacity-60"
          >
            {loading ? "Ativando..." : "Ativar notificações"}
          </button>
          <button
            type="button"
            onClick={dismiss}
            className="rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            Agora não
          </button>
        </div>
      </div>
    </div>
  );
}
