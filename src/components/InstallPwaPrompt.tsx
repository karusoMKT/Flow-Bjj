import { useEffect, useState } from "react";
import { Download, Share, SquarePlus, Smartphone, X } from "lucide-react";
import {
  getDeferredPrompt,
  initPwaInstallCapture,
  isIosSafari,
  isStandalone,
  markInstallPromptDismissed,
  onDeferredPromptChange,
  wasInstallPromptDismissed,
  type BeforeInstallPromptEvent,
} from "@/lib/pwa-install";

/**
 * Modal de instalação do PWA focado em conversão.
 * Android/Desktop: usa o evento beforeinstallprompt.
 * iOS/Safari: tutorial visual de "Adicionar à Tela de Início".
 */
export function InstallPwaPrompt({ enabled = true }: { enabled?: boolean }) {
  const [open, setOpen] = useState(false);
  const [prompt, setPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    initPwaInstallCapture();
    setPrompt(getDeferredPrompt());
    return onDeferredPromptChange(setPrompt);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    if (isStandalone() || wasInstallPromptDismissed()) return;
    const iosSafari = isIosSafari();
    setIos(iosSafari);
    const t = setTimeout(() => {
      if (iosSafari || getDeferredPrompt()) setOpen(true);
    }, 2200);
    return () => clearTimeout(t);
  }, [enabled, prompt]);

  if (!open) return null;

  function dismiss() {
    markInstallPromptDismissed();
    setOpen(false);
  }

  async function install() {
    const evt = getDeferredPrompt();
    if (!evt) return dismiss();
    try {
      await evt.prompt();
      await evt.userChoice;
    } finally {
      markInstallPromptDismissed();
      setOpen(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Instalar o Flow"
      className="fixed inset-0 z-[85] grid place-items-end bg-black/80 px-4 pb-6 backdrop-blur-sm animate-fade-in sm:place-items-center sm:pb-0"
    >
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-surface p-6 shadow-2xl">
        <button
          type="button"
          onClick={dismiss}
          aria-label="Fechar"
          className="float-right -mr-2 -mt-2 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <span className="grid size-14 place-items-center rounded-2xl bg-brand/15 text-brand shadow-[0_0_28px_-8px_var(--brand)]">
          <Smartphone className="size-7" />
        </span>

        <h2 className="mt-4 font-display text-lg font-black italic tracking-tight text-foreground">
          {ios ? "Adicione o Flow à sua Tela de Início" : "Instale o Flow no seu celular"}
        </h2>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
          Instale o Flow no seu celular para treinar sem distrações — abertura instantânea, tela cheia
          e notificações dos seus parceiros de tatame.
        </p>

        {ios ? (
          <ol className="mt-5 flex flex-col gap-3">
            <li className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/60 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                <Share className="size-4" />
              </span>
              <p className="text-xs text-foreground">
                Toque em <span className="font-bold">Compartilhar</span> na barra do Safari.
              </p>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/60 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand">
                <SquarePlus className="size-4" />
              </span>
              <p className="text-xs text-foreground">
                Escolha <span className="font-bold">Adicionar à Tela de Início</span>.
              </p>
            </li>
            <li className="flex items-center gap-3 rounded-2xl border border-white/5 bg-background/60 p-3">
              <span className="grid size-9 shrink-0 place-items-center rounded-xl bg-brand/15 text-brand text-xs font-black">
                3
              </span>
              <p className="text-xs text-foreground">
                Confirme em <span className="font-bold">Adicionar</span> e treine pelo ícone do Flow.
              </p>
            </li>
          </ol>
        ) : (
          <button
            type="button"
            onClick={install}
            className="press tap-target mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-brand px-4 py-3 text-sm font-bold text-brand-foreground shadow-[0_0_24px_-6px_var(--brand)]"
          >
            <Download className="size-4" strokeWidth={2.5} />
            Instalar App
          </button>
        )}

        <button
          type="button"
          onClick={dismiss}
          className="mt-2 w-full rounded-xl px-4 py-2.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
        >
          Agora não
        </button>
      </div>
    </div>
  );
}
