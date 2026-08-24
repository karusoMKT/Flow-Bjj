import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Clock, Loader2, UserCheck, UserPlus, X } from "lucide-react";
import { toast } from "sonner";
import {
  acceptConnectionRequest,
  connectionStateOf,
  fetchMyConnections,
  getCurrentUserId,
  removeConnection,
  sendConnectionRequest,
  type ConnectionState,
} from "@/lib/connections";

export const connectionsQuery = {
  queryKey: ["connections"] as const,
  queryFn: fetchMyConnections,
};

export const meQuery = {
  queryKey: ["current-user-id"] as const,
  queryFn: getCurrentUserId,
  staleTime: 5 * 60_000,
};

const base =
  "inline-flex shrink-0 items-center justify-center gap-1 rounded-full px-3 py-1.5 text-[11px] font-bold transition-colors disabled:opacity-60";

export function ConnectionButton({
  targetId,
  className = "",
  size = "sm",
}: {
  targetId: string;
  className?: string;
  size?: "sm" | "lg";
}) {
  const queryClient = useQueryClient();
  const [busy, setBusy] = useState(false);
  const { data: myId } = useQuery(meQuery);
  const { data: connections = {} } = useQuery(connectionsQuery);

  if (!myId || myId === targetId) return null;

  const entry = connections[targetId];
  const state: ConnectionState = connectionStateOf(connections, targetId);
  const sizing = size === "lg" ? "px-5 py-2.5 text-xs" : "";

  async function run(fn: () => Promise<void>, errorMsg: string) {
    if (busy) return;
    setBusy(true);
    try {
      await fn();
      await queryClient.invalidateQueries({ queryKey: ["connections"] });
    } catch {
      toast.error(errorMsg);
    } finally {
      setBusy(false);
    }
  }

  function stop(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
  }

  if (state === "incoming" && entry) {
    return (
      <div className={`flex shrink-0 items-center gap-1.5 ${className}`}>
        <button
          type="button"
          disabled={busy}
          onClick={(e) => {
            stop(e);
            void run(
              () => acceptConnectionRequest(entry.id, targetId).then(() => undefined),
              "Não foi possível aceitar o convite.",
            );
          }}
          className={`${base} ${sizing} bg-brand text-brand-foreground hover:opacity-90`}
        >
          {busy ? <Loader2 className="size-3 animate-spin" /> : <Check className="size-3" />}
          Aceitar
        </button>
        <button
          type="button"
          disabled={busy}
          aria-label="Recusar convite"
          onClick={(e) => {
            stop(e);
            void run(() => removeConnection(entry.id), "Não foi possível recusar o convite.");
          }}
          className={`${base} ${sizing} border border-border text-muted-foreground hover:text-foreground`}
        >
          <X className="size-3" />
        </button>
      </div>
    );
  }

  const config: Record<
    Exclude<ConnectionState, "incoming">,
    { label: string; icon: React.ElementType; classes: string; action: () => Promise<void>; error: string }
  > = {
    none: {
      label: "Conectar",
      icon: UserPlus,
      classes: "bg-brand text-brand-foreground hover:opacity-90",
      action: () => sendConnectionRequest(targetId),
      error: "Não foi possível enviar o convite.",
    },
    outgoing: {
      label: "Solicitado",
      icon: Clock,
      classes: "border border-white/10 bg-white/5 text-muted-foreground hover:text-foreground",
      action: async () => {
        if (entry) await removeConnection(entry.id);
      },
      error: "Não foi possível cancelar o convite.",
    },
    connected: {
      label: "Conectados",
      icon: UserCheck,
      classes: "border border-brand/40 bg-brand/10 text-brand hover:bg-brand/20",
      action: async () => {
        if (entry) await removeConnection(entry.id);
        toast.success("Conexão desfeita.");
      },
      error: "Não foi possível desfazer a conexão.",
    },
  };

  const { label, icon: Icon, classes, action, error } = config[state as Exclude<ConnectionState, "incoming">];

  return (
    <button
      type="button"
      disabled={busy}
      onClick={(e) => {
        stop(e);
        void run(action, error);
      }}
      className={`${base} ${sizing} ${classes} ${className}`}
    >
      {busy ? <Loader2 className="size-3 animate-spin" /> : <Icon className="size-3" />}
      {label}
    </button>
  );
}
