import { supabase } from "@/integrations/supabase/client";

/**
 * Garante uma sessão Supabase válida antes de chamadas autenticadas.
 * Renova o token se estiver expirado/perto de expirar. Retorna false se não houver como recuperar.
 */
export async function ensureFreshSession(force = false): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  const session = data.session;
  const expiresSoon = !session?.expires_at || session.expires_at * 1000 - Date.now() < 60_000;
  if (!error && session && !expiresSoon && !force) return true;
  const { data: refreshed, error: refreshError } = await supabase.auth.refreshSession();
  if (refreshError || !refreshed.session) {
    console.error("Supabase session refresh failed:", refreshError);
    return false;
  }
  return true;
}

export const SESSION_EXPIRED_MSG = "Sua sessão expirou. Por favor, faça login novamente";

/** Limpa a sessão local e envia para o login com aviso. */
export async function expireSessionAndRedirect() {
  await supabase.auth.signOut({ scope: "local" }).catch(() => {});
  sessionStorage.setItem("flow:authNotice", SESSION_EXPIRED_MSG);
  window.location.assign("/login");
}
