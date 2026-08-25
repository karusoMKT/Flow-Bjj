import { useEffect, useMemo, useState } from "react";
import { AtSign, Check, Loader2, Search, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AvatarBubble } from "@/components/PostCard";

export type MentionProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  belt: string | null;
};

/** Modal para marcar amigos (@username) em uma publicação. */
export function MentionPicker({
  open,
  onClose,
  currentUserId,
  selected,
  onToggle,
}: {
  open: boolean;
  onClose: () => void;
  currentUserId?: string | null;
  selected: string[];
  onToggle: (username: string) => void;
}) {
  const [term, setTerm] = useState("");
  const [rows, setRows] = useState<MentionProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!open) return;
    let active = true;
    setLoading(true);
    const t = setTimeout(async () => {
      let q = supabase
        .from("profiles")
        .select("id, username, full_name, avatar_url, belt")
        .order("username")
        .limit(30);
      if (term.trim()) q = q.or(`username.ilike.%${term.trim()}%,full_name.ilike.%${term.trim()}%`);
      const { data } = await q;
      if (!active) return;
      setRows((data ?? []).filter((p) => p.id !== currentUserId) as MentionProfile[]);
      setLoading(false);
    }, 250);
    return () => {
      active = false;
      clearTimeout(t);
    };
  }, [open, term, currentUserId]);

  const selectedSet = useMemo(() => new Set(selected), [selected]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 backdrop-blur-sm animate-in fade-in sm:items-center sm:p-4">
      <div className="flex max-h-[75vh] w-full max-w-md flex-col rounded-t-3xl border border-white/10 bg-surface sm:rounded-3xl">
        <div className="flex items-center gap-2 border-b border-white/5 px-4 py-3">
          <AtSign className="size-4 text-brand" />
          <h2 className="text-sm font-black uppercase tracking-widest text-brand">Marcar amigos</h2>
          <button
            type="button"
            aria-label="Fechar"
            onClick={onClose}
            className="ml-auto text-muted-foreground hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        <div className="px-4 pt-3">
          <div className="flex h-11 items-center gap-2 rounded-xl border border-white/8 bg-surface-2 px-3">
            <Search className="size-4 shrink-0 text-muted-foreground" />
            <input
              value={term}
              onChange={(e) => setTerm(e.target.value)}
              placeholder="Buscar atleta..."
              aria-label="Buscar atleta"
              className="w-full bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
            />
          </div>
        </div>

        <ul className="flex-1 overflow-y-auto p-2">
          {loading && (
            <li className="flex items-center justify-center gap-2 py-6 text-xs text-muted-foreground">
              <Loader2 className="size-4 animate-spin" /> Carregando...
            </li>
          )}
          {!loading && rows.length === 0 && (
            <li className="py-6 text-center text-xs text-muted-foreground">Nenhum atleta encontrado.</li>
          )}
          {rows.map((p) => {
            const username = p.username ?? "";
            const active = selectedSet.has(username);
            return (
              <li key={p.id}>
                <button
                  type="button"
                  onClick={() => username && onToggle(username)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors ${
                    active ? "bg-brand/10" : "hover:bg-white/5"
                  }`}
                >
                  <AvatarBubble src={p.avatar_url} name={p.full_name ?? username} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-semibold text-foreground">
                      {p.full_name ?? username}
                    </span>
                    <span className="block truncate text-xs text-muted-foreground">@{username}</span>
                  </span>
                  {active && <Check className="size-4 shrink-0 text-brand" />}
                </button>
              </li>
            );
          })}
        </ul>

        <div className="border-t border-white/5 p-3">
          <button
            type="button"
            onClick={onClose}
            className="w-full rounded-full bg-brand py-2.5 text-xs font-black uppercase tracking-wider text-brand-foreground"
          >
            Concluir{selected.length ? ` (${selected.length})` : ""}
          </button>
        </div>
      </div>
    </div>
  );
}
