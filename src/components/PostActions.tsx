import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Flame, Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { timeAgo } from "@/lib/feed";

type CommentRow = {
  id: string;
  content: string;
  created_at: string;
  profiles?: { full_name: string | null; username: string | null; avatar_url: string | null } | null;
};

export function PostActions({
  postId,
  userId,
  initialLiked,
  initialLikeCount,
  initialCommentCount,
  renderAvatar,
}: {
  postId: string;
  userId?: string | null;
  initialLiked: boolean;
  initialLikeCount: number;
  initialCommentCount: number;
  renderAvatar: (src: string | null | undefined, name: string) => React.ReactNode;
}) {
  const qc = useQueryClient();
  const [liked, setLiked] = useState(initialLiked);
  const [likeCount, setLikeCount] = useState(initialLikeCount);
  const [open, setOpen] = useState(false);
  const [draft, setDraft] = useState("");
  const [commentCount, setCommentCount] = useState(initialCommentCount);

  const toggleLike = useMutation({
    mutationFn: async (next: boolean) => {
      if (!userId) throw new Error("Sem sessão");
      if (next) {
        const { error } = await supabase.from("likes").insert({ post_id: postId, user_id: userId });
        if (error && error.code !== "23505") throw error;
      } else {
        const { error } = await supabase.from("likes").delete().eq("post_id", postId).eq("user_id", userId);
        if (error) throw error;
      }
    },
    onError: (_e, next) => {
      // rollback
      setLiked(!next);
      setLikeCount((c) => (next ? Math.max(c - 1, 0) : c + 1));
      toast.error("Não foi possível registrar seu Oss");
    },
    onSettled: () => {
      void qc.invalidateQueries({ queryKey: ["feed"] });
    },
  });

  const onLike = () => {
    const next = !liked;
    setLiked(next);
    setLikeCount((c) => (next ? c + 1 : Math.max(c - 1, 0)));
    toggleLike.mutate(next);
  };

  const comments = useQuery({
    queryKey: ["comments", postId],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select("id, content, created_at, profiles:user_id (full_name, username, avatar_url)")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return (data ?? []) as unknown as CommentRow[];
    },
  });

  const addComment = useMutation({
    mutationFn: async (content: string) => {
      if (!userId) throw new Error("Sem sessão");
      const { error } = await supabase.from("comments").insert({ post_id: postId, user_id: userId, content });
      if (error) throw error;
    },
    onSuccess: () => {
      setDraft("");
      setCommentCount((c) => c + 1);
      void comments.refetch();
    },
    onError: () => toast.error("Não foi possível comentar"),
  });

  return (
    <div className="border-t border-white/5">
      <div className="flex items-center gap-2 px-3.5 py-2.5">
        <button
          type="button"
          onClick={onLike}
          aria-pressed={liked}
          aria-label="Dar Oss"
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            liked ? "bg-brand/15 text-brand" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <Flame className={`size-4 ${liked ? "fill-brand/30" : ""}`} />
          Oss
          <span className="tabular-nums">{likeCount}</span>
        </button>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold transition-colors ${
            open ? "bg-white/5 text-foreground" : "text-muted-foreground hover:text-foreground"
          }`}
        >
          <MessageCircle className="size-4" />
          Comentar
          <span className="tabular-nums">{commentCount}</span>
        </button>
      </div>

      {open && (
        <div className="space-y-3 border-t border-white/5 bg-white/[0.02] px-3.5 py-3">
          {comments.isLoading ? (
            <p className="flex items-center gap-2 text-xs text-muted-foreground">
              <Loader2 className="size-3.5 animate-spin" /> Carregando comentários…
            </p>
          ) : (comments.data?.length ?? 0) === 0 ? (
            <p className="text-xs text-muted-foreground">Seja o primeiro a comentar.</p>
          ) : (
            <ul className="space-y-3">
              {comments.data!.map((c) => {
                const name = c.profiles?.full_name ?? c.profiles?.username ?? "Atleta";
                return (
                  <li key={c.id} className="flex items-start gap-2.5">
                    {renderAvatar(c.profiles?.avatar_url, name)}
                    <div className="min-w-0 flex-1">
                      <p className="flex items-baseline gap-2">
                        <span className="truncate text-xs font-semibold">{name}</span>
                        <span className="shrink-0 text-[10px] text-muted-foreground">{timeAgo(c.created_at)}</span>
                      </p>
                      <p className="text-sm leading-snug text-foreground/90">{c.content}</p>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}

          <form
            onSubmit={(e) => {
              e.preventDefault();
              const v = draft.trim();
              if (v) addComment.mutate(v);
            }}
            className="flex items-center gap-2"
          >
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Escreva um comentário…"
              className="h-10 flex-1 rounded-full border border-white/10 bg-surface px-4 text-sm outline-none placeholder:text-muted-foreground focus:border-brand/60"
            />
            <button
              type="submit"
              disabled={!draft.trim() || addComment.isPending}
              aria-label="Enviar comentário"
              className="grid size-10 shrink-0 place-items-center rounded-full bg-brand text-background disabled:opacity-40"
            >
              {addComment.isPending ? <Loader2 className="size-4 animate-spin" /> : <Send className="size-4" />}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
