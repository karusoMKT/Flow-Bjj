import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Check, Loader2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { fetchMyConnections, toggleConnection } from "@/lib/connections";
import { supabase } from "@/integrations/supabase/client";

const meQuery = {
  queryKey: ["me", "id"],
  queryFn: async () => {
    const { data } = await supabase.auth.getUser();
    return data.user?.id ?? null;
  },
};

export function FollowButton({ targetId, className = "" }: { targetId: string; className?: string }) {
  const queryClient = useQueryClient();
  const [pending, setPending] = useState(false);
  const { data: myId } = useQuery(meQuery);
  const { data: connections = {} } = useQuery({ queryKey: ["connections"], queryFn: fetchMyConnections });

  if (myId === targetId) return null;

  const following = Boolean(connections[targetId]);

  async function onClick(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (pending) return;
    setPending(true);
    try {
      await toggleConnection(targetId, following);
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
    } catch {
      toast.error("Não foi possível atualizar a conexão.");
    } finally {
      setPending(false);
    }
  }

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={following}
      className={`inline-flex shrink-0 items-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-60 ${
        following
          ? "border border-brand/40 bg-brand/10 text-brand"
          : "bg-brand text-brand-foreground hover:opacity-90"
      } ${className}`}
    >
      {pending ? (
        <Loader2 className="size-3 animate-spin" />
      ) : following ? (
        <Check className="size-3" />
      ) : (
        <UserPlus className="size-3" />
      )}
      {following ? "Seguindo" : "Seguir"}
    </button>
  );
}
