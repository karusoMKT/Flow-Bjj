import { supabase } from "@/integrations/supabase/client";

export type ConnectionStatus = "pending" | "accepted";

/** IDs que o usuário logado já segue (ou solicitou seguir). */
export async function fetchMyConnections(): Promise<Record<string, ConnectionStatus>> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) return {};

  const { data, error } = await supabase
    .from("follows")
    .select("following_id, status")
    .eq("follower_id", uid);
  if (error) throw error;

  const map: Record<string, ConnectionStatus> = {};
  for (const row of data ?? []) {
    map[row.following_id] = (row.status as ConnectionStatus) ?? "accepted";
  }
  return map;
}

/** Segue ou deixa de seguir um atleta. Retorna o novo estado. */
export async function toggleConnection(targetId: string, isFollowing: boolean): Promise<boolean> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");
  if (uid === targetId) throw new Error("Não é possível seguir a si mesmo");

  if (isFollowing) {
    const { error } = await supabase
      .from("follows")
      .delete()
      .eq("follower_id", uid)
      .eq("following_id", targetId);
    if (error) throw error;
    return false;
  }

  const { error } = await supabase
    .from("follows")
    .insert({ follower_id: uid, following_id: targetId, status: "accepted" });
  if (error && error.code !== "23505") throw error;
  return true;
}
