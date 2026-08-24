import { supabase } from "@/integrations/supabase/client";

export const PUSH_PROMPT_KEY = "flow:pushPromptSeen";

export type PushPermission = "unsupported" | "default" | "granted" | "denied";

/** Estado atual da permissão de notificações neste dispositivo. */
export function getPushPermission(): PushPermission {
  if (typeof window === "undefined" || !("Notification" in window)) return "unsupported";
  return Notification.permission as PushPermission;
}

/** Já perguntamos para este usuário neste dispositivo? */
export function hasSeenPushPrompt(): boolean {
  if (typeof window === "undefined") return true;
  return localStorage.getItem(PUSH_PROMPT_KEY) === "1";
}

export function markPushPromptSeen() {
  if (typeof window !== "undefined") localStorage.setItem(PUSH_PROMPT_KEY, "1");
}

/** Devemos exibir o alerta amigável? */
export function shouldAskForPush(): boolean {
  return getPushPermission() === "default" && !hasSeenPushPrompt();
}

function urlBase64ToUint8Array(base64: string) {
  const padding = "=".repeat((4 - (base64.length % 4)) % 4);
  const raw = atob((base64 + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((c) => c.charCodeAt(0)));
}

/**
 * Tenta obter um token de push do ambiente (Web Push / FCM).
 * Retorna null quando o navegador não expõe um token — a permissão continua válida
 * para notificações locais.
 */
async function getPushToken(): Promise<string | null> {
  try {
    if (typeof navigator === "undefined" || !("serviceWorker" in navigator) || !("PushManager" in window)) {
      return null;
    }
    const registration = await navigator.serviceWorker.getRegistration();
    if (!registration) return null;

    const vapidKey = import.meta.env['VITE_VAPID_PUBLIC_KEY'] as string | undefined;
    const existing = await registration.pushManager.getSubscription();
    const subscription =
      existing ??
      (vapidKey
        ? await registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: urlBase64ToUint8Array(vapidKey),
          })
        : null);

    return subscription ? JSON.stringify(subscription.toJSON()) : null;
  } catch {
    return null;
  }
}

async function savePushToken(token: string) {
  const { data } = await supabase.auth.getUser();
  const userId = data.user?.id;
  if (!userId) return;
  await supabase.from("profiles").update({ push_token: token }).eq("id", userId);
}

/**
 * Pede a permissão nativa e, se possível, salva o token no perfil.
 * Retorna o estado final da permissão.
 */
export async function requestPushPermission(): Promise<PushPermission> {
  markPushPromptSeen();
  if (getPushPermission() === "unsupported") return "unsupported";

  const result = (await Notification.requestPermission()) as PushPermission;
  if (result !== "granted") return result;

  const token = await getPushToken();
  if (token) {
    try {
      await savePushToken(token);
    } catch {
      /* token opcional: não bloqueia a experiência */
    }
  }
  return "granted";
}
