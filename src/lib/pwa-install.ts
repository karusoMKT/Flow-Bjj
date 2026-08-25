export const PWA_PROMPT_DISMISSED = "flow_pwa_prompt_dismissed";
export const PWA_PROMPT_INSTALLED = "flow_pwa_installed";

export type BeforeInstallPromptEvent = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
};

let deferredPrompt: BeforeInstallPromptEvent | null = null;
const listeners = new Set<(e: BeforeInstallPromptEvent | null) => void>();

export function getDeferredPrompt() {
  return deferredPrompt;
}

export function onDeferredPromptChange(cb: (e: BeforeInstallPromptEvent | null) => void) {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

/** Captura global do evento — chamado uma vez no cliente. */
export function initPwaInstallCapture() {
  if (typeof window === "undefined") return;
  if ((window as any).__flowPwaCapture) return;
  (window as any).__flowPwaCapture = true;

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e as BeforeInstallPromptEvent;
    listeners.forEach((cb) => cb(deferredPrompt));
  });

  window.addEventListener("appinstalled", () => {
    deferredPrompt = null;
    try {
      localStorage.setItem(PWA_PROMPT_INSTALLED, "true");
    } catch {
      /* ignore */
    }
    listeners.forEach((cb) => cb(null));
  });
}

export function isIos() {
  if (typeof navigator === "undefined") return false;
  const ua = navigator.userAgent;
  const iOSDevice = /iPad|iPhone|iPod/.test(ua);
  const iPadOS = /Macintosh/.test(ua) && typeof document !== "undefined" && "ontouchend" in document;
  return iOSDevice || iPadOS;
}

export function isIosSafari() {
  if (!isIos()) return false;
  const ua = navigator.userAgent;
  // Chrome/Firefox/Edge no iOS não oferecem "Adicionar à Tela de Início"
  return !/CriOS|FxiOS|EdgiOS|OPiOS/.test(ua);
}

export function isStandalone() {
  if (typeof window === "undefined") return false;
  return (
    window.matchMedia?.("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true
  );
}

export function wasInstallPromptDismissed() {
  try {
    return localStorage.getItem(PWA_PROMPT_DISMISSED) === "true";
  } catch {
    return true;
  }
}

export function markInstallPromptDismissed() {
  try {
    localStorage.setItem(PWA_PROMPT_DISMISSED, "true");
  } catch {
    /* ignore */
  }
}
