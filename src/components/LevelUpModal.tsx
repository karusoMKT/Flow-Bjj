import { useEffect } from "react";
import { Sparkles, X } from "lucide-react";
import { ShareButton } from "@/components/ShareButton";
import { levelProgress } from "@/lib/xp";

const MESSAGES = [
  "Você está imparável no tatame!",
  "A constância virou evolução. Oss!",
  "Mais um nível conquistado no suor.",
  "O tatame reconhece quem aparece.",
];

function fireConfetti() {
  void (async () => {
    try {
      const { default: confetti } = await import("canvas-confetti");
      const colors = ["#c6ff2e", "#ffffff", "#8ef26b"];
      confetti({ particleCount: 90, spread: 75, origin: { y: 0.6 }, colors, disableForReducedMotion: true });
      window.setTimeout(
        () => confetti({ particleCount: 60, angle: 60, spread: 60, origin: { x: 0, y: 0.7 }, colors, disableForReducedMotion: true }),
        220,
      );
      window.setTimeout(
        () => confetti({ particleCount: 60, angle: 120, spread: 60, origin: { x: 1, y: 0.7 }, colors, disableForReducedMotion: true }),
        360,
      );
    } catch {
      /* confete é opcional */
    }
  })();
}

/**
 * Celebração de subida de nível: overlay em tela cheia com confetes,
 * barra de progresso do novo nível e compartilhamento para Stories.
 */
export function LevelUpModal({
  level,
  xp,
  onClose,
  athlete,
  belt,
  avatarUrl,
}: {
  level: number | null;
  xp: number;
  onClose: () => void;
  athlete?: string | null;
  belt?: string | null;
  avatarUrl?: string | null;
}) {
  const open = level != null;

  useEffect(() => {
    if (open) fireConfetti();
  }, [open]);

  if (!open) return null;

  const progress = levelProgress(xp);
  const message = MESSAGES[level % MESSAGES.length];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Novo nível ${level}`}
      className="fixed inset-0 z-[70] flex flex-col items-center justify-center bg-black/90 px-6 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-brand/40 bg-surface p-8 text-center animate-pop-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <p className="flex items-center justify-center gap-2 text-xs font-black uppercase tracking-[0.3em] text-brand">
          <Sparkles className="size-3.5" /> Level up
        </p>

        <div className="relative mx-auto mt-5 grid size-40 place-items-center">
          <span className="absolute inset-0 rounded-full bg-brand/25 blur-3xl animate-pulse-glow" />
          <span className="absolute inset-0 rounded-full border-2 border-brand/40" />
          <span className="absolute inset-5 rounded-full border border-brand/20" />
          <div className="relative">
            <p className="text-[10px] font-bold uppercase tracking-[0.25em] text-muted-foreground">Nível</p>
            <p className="font-display text-6xl font-black leading-none text-brand">{level}</p>
          </div>
        </div>

        <h2 className="mt-6 text-lg font-bold text-foreground">{message}</h2>
        <p className="mt-1 text-sm text-muted-foreground">
          {progress.xpNeeded} XP para o Nível {progress.level + 1}
        </p>

        <div className="mt-4">
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand shadow-[0_0_14px_var(--brand)] transition-all duration-700"
              style={{ width: `${progress.percent}%` }}
            />
          </div>
          <div className="mt-1.5 flex justify-between text-[10px] text-muted-foreground">
            <span>{progress.xp} XP</span>
            <span>{progress.nextLevelXp} XP</span>
          </div>
        </div>

        <ShareButton
          payload={{
            kind: "level",
            level: progress.level,
            xp: progress.xp,
            percent: progress.percent,
            nextLevel: progress.level + 1,
            xpNeeded: progress.xpNeeded,
            athlete,
            belt,
            avatarUrl,
          }}
          label="Compartilhar vitória"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-black uppercase tracking-widest text-brand-foreground shadow-[0_0_28px_-6px_var(--brand)] transition-opacity hover:opacity-90 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl border border-white/10 py-3.5 text-sm font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
        >
          Continuar
        </button>
      </div>
    </div>
  );
}
