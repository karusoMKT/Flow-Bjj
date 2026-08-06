import { supabase } from "@/integrations/supabase/client";

export const STORIES_BUCKET = "stories";
const YEAR_SECONDS = 60 * 60 * 24 * 365;

export type StoryRow = {
  id: string;
  user_id: string;
  image_url: string;
  created_at: string;
  expires_at: string;
  profiles?: { username: string | null; full_name: string | null; avatar_url: string | null } | null;
};

/** Envia a imagem para o bucket privado e devolve uma URL assinada de longa duração. */
export async function uploadShareImage(blob: Blob, userId: string): Promise<string> {
  const type = blob.type || "image/png";
  const ext = type.split("/")[1]?.split("+")[0] || "png";
  const path = `${userId}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage
    .from(STORIES_BUCKET)
    .upload(path, blob, { contentType: type, upsert: false });
  if (error) throw error;

  const { data, error: signError } = await supabase.storage
    .from(STORIES_BUCKET)
    .createSignedUrl(path, YEAR_SECONDS);
  if (signError || !data?.signedUrl) throw signError ?? new Error("Não foi possível assinar a imagem");
  return data.signedUrl;
}

/** Cria um story válido por 24h. */
export async function createStory(userId: string, imageUrl: string, caption?: string | null) {
  const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
  const { error } = await supabase
    .from("stories")
    .insert({ user_id: userId, image_url: imageUrl, caption: caption ?? null, expires_at: expiresAt });
  if (error) throw error;
}

/** Cria um post no feed com a imagem compartilhada. */
export async function createImagePost(userId: string, imageUrl: string, content: string) {
  const { error } = await supabase.from("posts").insert({ user_id: userId, image_url: imageUrl, content });
  if (error) throw error;
}

/** Busca stories ativos (não expirados) com o perfil do autor. */
export async function fetchActiveStories(): Promise<StoryRow[]> {
  const { data, error } = await supabase
    .from("stories")
    .select("id, user_id, image_url, created_at, expires_at, profiles:user_id (username, full_name, avatar_url)")
    .gt("expires_at", new Date().toISOString())
    .order("created_at", { ascending: false })
    .limit(100);
  if (error) throw error;
  return (data ?? []) as unknown as StoryRow[];
}

export type StoryGroup = {
  userId: string;
  name: string;
  avatarUrl: string | null;
  cover: string;
  count: number;
};

/** Agrupa stories por usuário, mantendo o mais recente como capa. */
export function groupStories(rows: StoryRow[]): StoryGroup[] {
  const map = new Map<string, StoryGroup>();
  for (const row of rows) {
    const existing = map.get(row.user_id);
    if (existing) {
      existing.count += 1;
      continue;
    }
    map.set(row.user_id, {
      userId: row.user_id,
      name: row.profiles?.full_name?.split(" ")[0] ?? row.profiles?.username ?? "Atleta",
      avatarUrl: row.profiles?.avatar_url ?? null,
      cover: row.image_url,
      count: 1,
    });
  }
  return [...map.values()];
}
