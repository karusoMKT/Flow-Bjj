import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Brain, Check, Plus, RotateCcw, Target, Trash2, Trophy, Heart, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import confetti from "canvas-confetti";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { supabase } from "@/integrations/supabase/client";

type Kind = "goal" | "favorite_position" | "difficulty";
type Memory = { id: string; kind: Kind; content: string; is_active: boolean; updated_at: string };

const SECTIONS: { kind: Kind; title: string; icon: typeof Target; empty: string }[] = [
  { kind: "goal", title: "Objetivos Técnicos", icon: Target, empty: "Nenhum objetivo ativo." },
  { kind: "difficulty", title: "Dificuldades", icon: AlertTriangle, empty: "Nenhuma dificuldade registrada." },
  { kind: "favorite_position", title: "Posições Favoritas", icon: Heart, empty: "Nenhuma posição favorita." },
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const db = supabase as any;

export function MemoryPanel() {
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);
  const [kind, setKind] = useState<Kind>("goal");
  const [text, setText] = useState("");
  const [celebrate, setCelebrate] = useState<string | null>(null);

  const { data: memories = [], isLoading } = useQuery<Memory[]>({
    queryKey: ["ai-memories"],
    enabled: open,
    queryFn: async () => {
      const { data, error } = await db
        .from("ai_memories")
        .select("id, kind, content, is_active, updated_at")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data ?? [];
    },
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["ai-memories"] });

  const add = useMutation({
    mutationFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      if (!auth.user) throw new Error();
      const { error } = await db.from("ai_memories").insert({ user_id: auth.user.id, kind, content: text.trim() });
      if (error) throw error;
    },
    onSuccess: () => {
      setText("");
      refresh();
      toast.success("Memória adicionada");
    },
    onError: () => toast.error("Não foi possível salvar."),
  });

  const toggle = useMutation({
    mutationFn: async (m: Memory) => {
      const { error } = await db.from("ai_memories").update({ is_active: !m.is_active }).eq("id", m.id);
      if (error) throw error;
      return m;
    },
    onSuccess: (m) => {
      refresh();
      if (m.is_active) {
        setCelebrate(m.content);
        confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 }, colors: ["#d4ff3a", "#facc15", "#ffffff"] });
        setTimeout(() => setCelebrate(null), 2600);
      }
    },
    onError: () => toast.error("Não foi possível atualizar."),
  });

  const remove = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from("ai_memories").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: refresh,
    onError: () => toast.error("Não foi possível excluir."),
  });

  const active = memories.filter((m) => m.is_active);
  const done = memories.filter((m) => !m.is_active);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Perfil Técnico e Memórias"
          className="ml-1 grid size-11 place-items-center rounded-full border border-brand/30 text-brand transition hover:bg-brand/10"
        >
          <Brain className="size-5" />
        </button>
      </SheetTrigger>
      <SheetContent side="bottom" className="max-h-[88vh] overflow-y-auto rounded-t-3xl border-brand/20 bg-background pb-10">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="size-5 text-brand" /> Perfil Técnico & Memórias
          </SheetTitle>
          <p className="text-xs text-muted-foreground">O Flow AI usa estas informações para personalizar suas respostas.</p>
        </SheetHeader>

        {celebrate && (
          <div className="mx-4 mb-3 animate-in fade-in zoom-in-95 rounded-2xl border border-brand/50 bg-brand/10 p-4 text-center shadow-[0_0_30px_-8px_var(--color-brand)]">
            <Trophy className="mx-auto size-8 text-brand" />
            <p className="mt-1 text-sm font-bold text-brand">Objetivo conquistado!</p>
            <p className="truncate text-xs text-muted-foreground">{celebrate}</p>
          </div>
        )}

        <form
          className="mx-4 space-y-2 rounded-2xl border border-white/5 bg-surface p-3"
          onSubmit={(e) => {
            e.preventDefault();
            if (text.trim()) add.mutate();
          }}
        >
          <div className="flex gap-1.5">
            {SECTIONS.map((s) => (
              <button
                key={s.kind}
                type="button"
                onClick={() => setKind(s.kind)}
                className={`min-h-9 flex-1 rounded-lg px-2 text-[11px] font-semibold transition ${
                  kind === s.kind ? "bg-brand text-brand-foreground" : "bg-background text-muted-foreground"
                }`}
              >
                {s.kind === "goal" ? "Objetivo" : s.kind === "difficulty" ? "Dificuldade" : "Favorita"}
              </button>
            ))}
          </div>
          <div className="flex gap-2">
            <input
              value={text}
              onChange={(e) => setText(e.target.value)}
              maxLength={120}
              placeholder="Ex: Melhorar passagem de guarda"
              className="min-h-11 min-w-0 flex-1 rounded-lg border border-white/10 bg-background px-3 text-sm outline-none focus:border-brand"
            />
            <button
              type="submit"
              disabled={!text.trim() || add.isPending}
              aria-label="Adicionar"
              className="grid size-11 shrink-0 place-items-center rounded-lg bg-brand text-brand-foreground disabled:opacity-50"
            >
              <Plus className="size-5" />
            </button>
          </div>
        </form>

        <div className="mt-4 space-y-5 px-4">
          {isLoading && <p className="text-sm text-muted-foreground">Carregando...</p>}
          {!isLoading &&
            SECTIONS.map((s) => {
              const items = active.filter((m) => m.kind === s.kind);
              return (
                <section key={s.kind}>
                  <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    <s.icon className="size-3.5 text-brand" /> {s.title}
                  </h3>
                  {items.length === 0 ? (
                    <p className="text-xs text-muted-foreground/70">{s.empty}</p>
                  ) : (
                    <ul className="space-y-2">
                      {items.map((m) => (
                        <li key={m.id} className="flex items-center gap-2 rounded-xl border border-white/5 bg-surface p-2 pl-3">
                          <span className="min-w-0 flex-1 truncate text-sm">{m.content}</span>
                          {m.kind === "goal" && (
                            <button
                              type="button"
                              aria-label="Marcar como concluído"
                              onClick={() => toggle.mutate(m)}
                              className="grid size-11 place-items-center rounded-lg text-brand hover:bg-brand/10"
                            >
                              <Check className="size-5" />
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label="Excluir"
                            onClick={() => remove.mutate(m.id)}
                            className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                          >
                            <Trash2 className="size-4" />
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}
                </section>
              );
            })}

          {done.length > 0 && (
            <section>
              <h3 className="mb-2 flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-gold">
                <Trophy className="size-3.5" /> Concluídos
              </h3>
              <ul className="space-y-2">
                {done.map((m) => (
                  <li
                    key={m.id}
                    className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold/5 p-2 pl-3"
                  >
                    <Trophy className="size-4 shrink-0 text-gold" />
                    <span className="min-w-0 flex-1 truncate text-sm line-through decoration-gold/60">{m.content}</span>
                    <button
                      type="button"
                      aria-label="Reabrir"
                      onClick={() => toggle.mutate(m)}
                      className="grid size-11 place-items-center rounded-lg text-muted-foreground"
                    >
                      <RotateCcw className="size-4" />
                    </button>
                    <button
                      type="button"
                      aria-label="Excluir"
                      onClick={() => remove.mutate(m.id)}
                      className="grid size-11 place-items-center rounded-lg text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="size-4" />
                    </button>
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
