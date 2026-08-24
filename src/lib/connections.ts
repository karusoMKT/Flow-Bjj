import { supabase } from "@/integrations/supabase/client";

export type ConnectionState = "none" | "outgoing" | "incoming" | "connected";

export type ConnectionEntry = {
  id: string;
  state: ConnectionState;
};

export type ConnectionMap = Record<string, ConnectionEntry>;

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/** Mapa targetUserId -> estado da conexão com o usuário logado. */
export async function fetchMyConnections(): Promise<ConnectionMap> {
  const uid = await getCurrentUserId();
  if (!uid) return {};

  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);
  if (error) throw error;

  const map: ConnectionMap = {};
  for (const row of data ?? []) {
    const other = row.requester_id === uid ? row.receiver_id : row.requester_id;
    const state: ConnectionState =
      row.status === "accepted" ? "connected" : row.requester_id === uid ? "outgoing" : "incoming";
    map[other] = { id: row.id, state };
  }
  return map;
}

export function connectionStateOf(map: ConnectionMap, targetId: string): ConnectionState {
  return map[targetId]?.state ?? "none";
}

/** Envia um convite de conexão e notifica o recebedor. */
export async function sendConnectionRequest(targetId: string) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Sessão expirada");
  if (uid === targetId) throw new Error("Não é possível conectar consigo mesmo");

  const { error } = await supabase
    .from("connections")
    .insert({ requester_id: uid, receiver_id: targetId, status: "pending" });
  if (error && error.code !== "23505") throw error;

  await supabase.from("notifications").insert({
    user_id: targetId,
    actor_id: uid,
    type: "connection_request",
    content: "quer se conectar com você no tatame.",
  });
}

/** Aceita um convite recebido. */
export async function acceptConnectionRequest(connectionId: string, requesterId?: string) {
  const uid = await getCurrentUserId();
  if (!uid) throw new Error("Sessão expirada");

  const { error } = await supabase
    .from("connections")
    .update({ status: "accepted" })
    .eq("id", connectionId)
    .eq("receiver_id", uid);
  if (error) throw error;

  if (requesterId) {
    await supabase.from("notifications").insert({
      user_id: requesterId,
      actor_id: uid,
      type: "connection_accepted",
      content: "aceitou seu pedido de conexão.",
    });
  }
}

/** Recusa, cancela ou desfaz uma conexão. */
export async function removeConnection(connectionId: string) {
  const { error } = await supabase.from("connections").delete().eq("id", connectionId);
  if (error) throw error;
}

/** Encontra a conexão entre o usuário logado e outro atleta (pendente ou aceita). */
export async function fetchConnectionWith(targetId: string): Promise<ConnectionEntry & { requesterId: string } | null> {
  const uid = await getCurrentUserId();
  if (!uid) return null;

  const { data, error } = await supabase
    .from("connections")
    .select("id, requester_id, receiver_id, status")
    .or(
      `and(requester_id.eq.${uid},receiver_id.eq.${targetId}),and(requester_id.eq.${targetId},receiver_id.eq.${uid})`,
    )
    .maybeSingle();
  if (error) throw error;
  if (!data) return null;

  return {
    id: data.id,
    requesterId: data.requester_id,
    state: data.status === "accepted" ? "connected" : data.requester_id === uid ? "outgoing" : "incoming",
  };
}

/** IDs dos atletas com conexão aceita com o usuário logado. */
export async function fetchConnectedUserIds(): Promise<string[]> {
  const uid = await getCurrentUserId();
  if (!uid) return [];
  const { data, error } = await supabase
    .from("connections")
    .select("requester_id, receiver_id")
    .eq("status", "accepted")
    .or(`requester_id.eq.${uid},receiver_id.eq.${uid}`);
  if (error) throw error;
  return (data ?? []).map((r) => (r.requester_id === uid ? r.receiver_id : r.requester_id));
}
