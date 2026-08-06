import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Loader2, Star } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Botão "Tenho interesse" para posts de evento, com contagem de participantes. */
export function EventInterest({ postId, userId }: { postId: string; userId?: string | null }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);

  const { data } = useQuery({
    queryKey: ["event-interest", postId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("event_interests")
        .select("user_id")
        .eq("post_id", postId);
      if (error) throw error;
      return (data ?? []) as { user_id: string }[];
    },
    staleTime: 30_000,
  });

  const rows = data ?? [];
  const going = !!userId && rows.some((r) => r.user_id === userId);
  const count = rows.length;

  async function toggle() {
    if (!userId) {
      toast.error("Entre na sua conta para confirmar interesse");
      return;
    }
    setPending(true);
    try {
      if (going) {
        const { error } = await supabase
          .from("event_interests")
          .delete()
          .eq("post_id", postId)
          .eq("user_id", userId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("event_interests")
          .insert({ post_id: postId, user_id: userId });
        if (error) throw error;
      }
      await queryClient.invalidateQueries({ queryKey: ["event-interest", postId] });
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível atualizar");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="flex items-center gap-3 px-3.5 pb-3">
      <button
        type="button"
        onClick={toggle}
        disabled={pending}
        aria-pressed={going}
        className={`flex flex-1 items-center justify-center gap-2 rounded-full border px-4 py-2.5 text-[12px] font-extrabold uppercase tracking-widest transition-colors disabled:opacity-60 ${
          going
            ? "border-brand bg-brand text-brand-foreground"
            : "border-brand/40 bg-brand/10 text-brand hover:bg-brand/15"
        }`}
      >
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : going ? (
          <Check className="size-4" strokeWidth={3} />
        ) : (
          <Star className="size-4" />
        )}
        {going ? "Vou participar" : "Tenho interesse"}
      </button>
      {count > 0 && (
        <span className="shrink-0 text-[11px] font-semibold text-muted-foreground">
          {count} {count === 1 ? "interessado" : "interessados"}
        </span>
      )}
    </div>
  );
}
