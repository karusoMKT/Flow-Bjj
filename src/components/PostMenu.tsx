import { useEffect, useRef, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, MoreHorizontal, Pencil, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

/** Menu de ações do post (apenas para o autor): editar legenda ou excluir. */
export function PostMenu({
  postId,
  authorId,
  currentUserId,
  content,
  className = "",
}: {
  postId: string;
  authorId?: string | null;
  currentUserId?: string | null;
  content?: string | null;
  className?: string;
}) {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<null | "edit" | "delete">(null);
  const [draft, setDraft] = useState(content ?? "");
  const [busy, setBusy] = useState(false);
  const wrapRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onDown(e: MouseEvent) {
      if (!wrapRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, [open]);

  if (!currentUserId || !authorId || currentUserId !== authorId) return null;

  async function refresh() {
    await Promise.all([
      qc.invalidateQueries({ queryKey: ["feed"] }),
      qc.invalidateQueries({ queryKey: ["profile-posts"] }),
    ]);
  }

  async function remove() {
    setBusy(true);
    try {
      const { error } = await supabase.from("posts").delete().eq("id", postId);
      if (error) throw error;
      setMode(null);
      await refresh();
      toast.success("Publicação excluída");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível excluir");
    } finally {
      setBusy(false);
    }
  }

  async function save() {
    setBusy(true);
    try {
      const { error } = await supabase
        .from("posts")
        .update({ content: draft.trim() || null })
        .eq("id", postId);
      if (error) throw error;
      setMode(null);
      await refresh();
      toast.success("Publicação atualizada");
    } catch (err) {
      toast.error((err as Error)?.message ?? "Não foi possível salvar");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div ref={wrapRef} className={`relative shrink-0 ${className}`}>
      <button
        type="button"
        aria-label="Ações da publicação"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="tap-target grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-white/5 hover:text-foreground"
      >
        <MoreHorizontal className="size-4.5" />
      </button>

      {open && (
        <div
          role="menu"
          className="absolute right-0 top-9 z-30 w-40 overflow-hidden rounded-xl border border-white/10 bg-surface-2 shadow-xl animate-in fade-in"
        >
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setDraft(content ?? "");
              setMode("edit");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 px-3 py-2.5 text-left text-sm text-foreground hover:bg-white/5"
          >
            <Pencil className="size-4 text-brand" /> Editar
          </button>
          <button
            type="button"
            role="menuitem"
            onClick={() => {
              setMode("delete");
              setOpen(false);
            }}
            className="flex w-full items-center gap-2 border-t border-white/5 px-3 py-2.5 text-left text-sm text-red-400 hover:bg-red-500/10"
          >
            <Trash2 className="size-4" /> Excluir
          </button>
        </div>
      )}

      {mode && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/70 p-4 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-surface p-4 text-left">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-black uppercase tracking-widest text-brand">
                {mode === "edit" ? "Editar publicação" : "Excluir publicação"}
              </h2>
              <button
                type="button"
                aria-label="Fechar"
                onClick={() => setMode(null)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="size-4" />
              </button>
            </div>

            {mode === "edit" ? (
              <>
                <textarea
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  rows={5}
                  aria-label="Texto da publicação"
                  className="mt-3 w-full resize-none rounded-xl border border-white/8 bg-surface-2 px-3 py-2.5 text-sm text-foreground outline-none focus:border-brand/60"
                />
                <div className="mt-3 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={save}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-xs font-black uppercase tracking-wider text-brand-foreground disabled:opacity-40"
                  >
                    {busy && <Loader2 className="size-3.5 animate-spin" />} Salvar
                  </button>
                </div>
              </>
            ) : (
              <>
                <p className="mt-3 text-sm text-muted-foreground">
                  Tem certeza que deseja excluir esta publicação? Essa ação não pode ser desfeita.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setMode(null)}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-muted-foreground hover:text-foreground"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={remove}
                    disabled={busy}
                    className="inline-flex items-center gap-2 rounded-full bg-red-500 px-4 py-2 text-xs font-black uppercase tracking-wider text-white disabled:opacity-40"
                  >
                    {busy && <Loader2 className="size-3.5 animate-spin" />} Excluir
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
