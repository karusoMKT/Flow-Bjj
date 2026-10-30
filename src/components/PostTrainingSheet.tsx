import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Brain, Loader2, Sparkles } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { analyzeTraining } from "@/lib/study.functions";

type Result = { summary: string; nextFocus: string[]; newActivity: string | null };

const POSITIONS = ["Guarda", "Passagem", "Montada", "Costas", "Raspagem", "Quedas", "Meia-guarda", "Finalizações"];

export function PostTrainingSheet({ workoutId, open, onDone }: { workoutId: string | null; open: boolean; onDone: () => void }) {
  const analyze = useServerFn(analyzeTraining);
  const [position, setPosition] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [highlight, setHighlight] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<Result | null>(null);

  async function submit() {
    setLoading(true);
    setError(null);
    try {
      const r = await analyze({ data: { workoutId, position, difficulty, highlight } });
      if (!r.ok) setError(r.error ?? "Não foi possível analisar agora.");
      else setResult({ summary: r.summary ?? "", nextFocus: r.nextFocus ?? [], newActivity: r.newActivity ?? null });
    } catch {
      setError("Não foi possível analisar agora. Tente novamente.");
    } finally {
      setLoading(false);
    }
  }

  const input = "min-h-11 w-full rounded-lg border border-white/10 bg-background px-3 text-sm outline-none focus:border-brand";

  return (
    <Sheet open={open} onOpenChange={(o) => !o && !loading && onDone()}>
      <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-3xl border-brand/20 bg-background pb-10">
        <SheetHeader className="text-left">
          <SheetTitle className="flex items-center gap-2">
            <Brain className="size-5 text-brand" /> Análise Pós-Treino
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Opcional · 30 segundos. O Flow AI ajusta seu plano e sua memória esportiva.</p>
        </SheetHeader>

        {!result ? (
          <div className="space-y-4 px-4">
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Qual posição mais trabalhou?</label>
              <div className="mb-2 flex flex-wrap gap-1.5">
                {POSITIONS.map((p) => (
                  <button
                    key={p}
                    type="button"
                    onClick={() => setPosition(p)}
                    className={`min-h-9 rounded-full px-3 text-xs font-medium transition ${position === p ? "bg-brand text-brand-foreground" : "bg-surface text-muted-foreground"}`}
                  >
                    {p}
                  </button>
                ))}
              </div>
              <input value={position} onChange={(e) => setPosition(e.target.value)} maxLength={120} placeholder="Ou escreva: guarda De La Riva" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Qual foi a principal dificuldade?</label>
              <input value={difficulty} onChange={(e) => setDifficulty(e.target.value)} maxLength={160} placeholder="Ex: Sair da cem quilos" className={input} />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-semibold">Algo que funcionou bem? (opcional)</label>
              <input value={highlight} onChange={(e) => setHighlight(e.target.value)} maxLength={200} placeholder="Ex: Consegui 2 raspagens de tesoura" className={input} />
            </div>
            {error && <p className="rounded-lg bg-destructive/10 px-3 py-2 text-xs text-destructive">{error}</p>}
            <div className="flex gap-2">
              <button type="button" onClick={onDone} disabled={loading} className="min-h-11 flex-1 rounded-xl border border-white/10 text-sm text-muted-foreground">
                Pular
              </button>
              <button
                type="button"
                onClick={submit}
                disabled={loading || (!position.trim() && !difficulty.trim() && !highlight.trim())}
                className="flex min-h-11 flex-[2] items-center justify-center gap-2 rounded-xl bg-brand text-sm font-bold text-brand-foreground disabled:opacity-50"
              >
                {loading ? <Loader2 className="size-4 animate-spin" /> : <Sparkles className="size-4" />}
                {loading ? "Analisando..." : "Analisar treino"}
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 px-4">
            <div className="rounded-2xl border border-brand/30 bg-brand/5 p-3">
              <p className="mb-1 text-[10px] font-bold uppercase tracking-wider text-brand">Resumo do Coach</p>
              <p className="text-sm">{result.summary}</p>
            </div>
            {result.nextFocus.length > 0 && (
              <div>
                <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">⚡ Próxima sessão</p>
                <ul className="space-y-1.5">
                  {result.nextFocus.map((f) => (
                    <li key={f} className="rounded-lg bg-surface px-3 py-2 text-sm">{f}</li>
                  ))}
                </ul>
              </div>
            )}
            {result.newActivity && (
              <p className="rounded-lg border border-gold/30 bg-gold/5 px-3 py-2 text-xs">
                📅 Adicionado ao seu plano: <strong>{result.newActivity}</strong>
              </p>
            )}
            <button type="button" onClick={onDone} className="min-h-11 w-full rounded-xl bg-brand text-sm font-bold text-brand-foreground">
              Continuar
            </button>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
