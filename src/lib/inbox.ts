import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ProfileLite = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  is_weekly_champion?: boolean | null;
};

export type NotificationRow = {
  id: string;
  user_id: string;
  actor_id: string | null;
  type: string;
  content: string;
  post_id: string | null;
  is_read: boolean;
  created_at: string;
  actor: ProfileLite | null;
};

export type MessageRow = {
  id: string;
  conversation_id: string;
  sender_id: string;
  content: string;
  created_at: string;
};

export type ConversationSummary = {
  id: string;
  last_message_at: string;
  other: ProfileLite | null;
  lastMessage: MessageRow | null;
  unread: number;
};

export const avatarFor = (name: string) =>
  `https://ui-avatars.com/api/?background=1A1A1A&color=D7FF3E&bold=true&name=${encodeURIComponent(name || "Flow")}`;

export function displayName(p: ProfileLite | null | undefined) {
  return p?.full_name || p?.username || "Atleta";
}

export function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}m`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
}

export function clockTime(iso: string) {
  return new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

export async function getCurrentUserId() {
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

/* ---------------- Notifications ---------------- */

export async function fetchNotifications(): Promise<NotificationRow[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];
  const { data, error } = await supabase
    .from("notifications")
    .select(
      "id, user_id, actor_id, type, content, post_id, is_read, created_at, actor:profiles!notifications_actor_id_fkey(id, username, full_name, avatar_url, is_weekly_champion)",
    )
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as NotificationRow[];
}

export async function markAllNotificationsRead() {
  const userId = await getCurrentUserId();
  if (!userId) return;
  await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
}

/* ---------------- Conversations ---------------- */

export async function fetchConversations(): Promise<ConversationSummary[]> {
  const userId = await getCurrentUserId();
  if (!userId) return [];

  const { data: mine, error } = await supabase
    .from("conversation_participants")
    .select("conversation_id, conversations!inner(id, last_message_at)")
    .eq("user_id", userId);
  if (error) throw error;

  const ids = (mine ?? []).map((r) => r.conversation_id);
  if (ids.length === 0) return [];

  const [{ data: participants }, { data: messages }] = await Promise.all([
    supabase
      .from("conversation_participants")
      .select("conversation_id, user_id, profiles!inner(id, username, full_name, avatar_url, is_weekly_champion)")
      .in("conversation_id", ids),
    supabase
      .from("messages")
      .select("id, conversation_id, sender_id, content, created_at, read_at")
      .in("conversation_id", ids)
      .order("created_at", { ascending: false }),
  ]);

  return ids
    .map((id) => {
      const other =
        ((participants ?? []).find((p) => p.conversation_id === id && p.user_id !== userId) as
          | { profiles: ProfileLite }
          | undefined)?.profiles ?? null;
      const convMessages = (messages ?? []).filter((m) => m.conversation_id === id);
      const lastMessage = (convMessages[0] as MessageRow | undefined) ?? null;
      const unread = convMessages.filter((m) => m.sender_id !== userId && !m.read_at).length;
      const conv = (mine ?? []).find((r) => r.conversation_id === id) as
        | { conversations: { last_message_at: string } }
        | undefined;
      return {
        id,
        last_message_at: lastMessage?.created_at ?? conv?.conversations.last_message_at ?? new Date(0).toISOString(),
        other,
        lastMessage,
        unread,
      } satisfies ConversationSummary;
    })
    .sort((a, b) => b.last_message_at.localeCompare(a.last_message_at));
}

export async function fetchMessages(conversationId: string): Promise<MessageRow[]> {
  const { data, error } = await supabase
    .from("messages")
    .select("id, conversation_id, sender_id, content, created_at")
    .eq("conversation_id", conversationId)
    .order("created_at", { ascending: true });
  if (error) throw error;
  return (data ?? []) as MessageRow[];
}

export async function fetchConversationPeer(conversationId: string, userId: string): Promise<ProfileLite | null> {
  const { data } = await supabase
    .from("conversation_participants")
    .select("user_id, profiles!inner(id, username, full_name, avatar_url, is_weekly_champion)")
    .eq("conversation_id", conversationId)
    .neq("user_id", userId)
    .maybeSingle();
  return ((data as { profiles: ProfileLite } | null)?.profiles) ?? null;
}

export async function sendMessage(conversationId: string, content: string) {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sessão expirada");
  const { error } = await supabase
    .from("messages")
    .insert({ conversation_id: conversationId, sender_id: userId, content });
  if (error) throw error;
}

export async function markConversationRead(conversationId: string) {
  const userId = await getCurrentUserId();
  if (!userId) return;
  await supabase
    .from("messages")
    .update({ read_at: new Date().toISOString() })
    .eq("conversation_id", conversationId)
    .neq("sender_id", userId)
    .is("read_at", null);
}

/* ---------------- Realtime hooks ---------------- */

export function useCurrentUserId() {
  return useQuery({ queryKey: ["current-user-id"], queryFn: getCurrentUserId, staleTime: 5 * 60_000 });
}

/** Subscribes to notifications + messages targeted at the current user and invalidates queries. */
export function useInboxRealtime(userId: string | null | undefined) {
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!userId) return;
    const channel = supabase
      .channel(`inbox-${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "notifications", filter: `user_id=eq.${userId}` },
        () => {
          queryClient.invalidateQueries({ queryKey: ["notifications"] });
          queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
        },
      )
      .on("postgres_changes", { event: "*", schema: "public", table: "messages" }, () => {
        queryClient.invalidateQueries({ queryKey: ["conversations"] });
        queryClient.invalidateQueries({ queryKey: ["messages"] });
        queryClient.invalidateQueries({ queryKey: ["messages-unread"] });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient]);
}

export async function fetchUnreadNotificationsCount() {
  const userId = await getCurrentUserId();
  if (!userId) return 0;
  const { count } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("is_read", false);
  return count ?? 0;
}

export async function fetchUnreadMessagesCount() {
  const conversations = await fetchConversations();
  return conversations.reduce((sum, c) => sum + c.unread, 0);
}

/* ---------------- Conexões e chat ---------------- */

/** Abre (ou cria) a conversa 1:1 com outro atleta. Exige conexão aceita. */
export async function getOrCreateConversation(otherUserId: string): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new Error("Sessão expirada");

  const { data: connected, error: connError } = await supabase.rpc("are_connected", {
    _a: userId,
    _b: otherUserId,
  });
  if (connError) throw connError;
  if (!connected) throw new Error("Conecte-se para enviar mensagens");

  const { data: mine } = await supabase
    .from("conversation_participants")
    .select("conversation_id")
    .eq("user_id", userId);
  const ids = (mine ?? []).map((r) => r.conversation_id);

  if (ids.length) {
    const { data: shared } = await supabase
      .from("conversation_participants")
      .select("conversation_id")
      .eq("user_id", otherUserId)
      .in("conversation_id", ids)
      .limit(1);
    if (shared?.[0]) return shared[0].conversation_id;
  }

  const { data: conversation, error } = await supabase
    .from("conversations")
    .insert({ created_by: userId })
    .select("id")
    .single();
  if (error) throw error;

  const { error: partError } = await supabase.from("conversation_participants").insert([
    { conversation_id: conversation.id, user_id: userId },
    { conversation_id: conversation.id, user_id: otherUserId },
  ]);
  if (partError) throw partError;

  return conversation.id;
}
