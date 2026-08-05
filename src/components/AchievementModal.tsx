import { icons, Trophy, X } from "lucide-react";
import type { Achievement } from "@/lib/achievements";
import { ShareButton } from "@/components/ShareButton";

function AchievementIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (icons as Record<string, React.ElementType>)[name] ?? Trophy;
  return <Icon className={className} strokeWidth={1.6} />;
}

export function AchievementModal({
  achievement,
  onClose,
  athlete,
  belt,
  avatarUrl,
}: {
  achievement: Achievement | null;
  onClose: () => void;
  athlete?: string | null;
  belt?: string | null;
  avatarUrl?: string | null;
}) {
  if (!achievement) return null;


  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={`Conquista desbloqueada: ${achievement.title}`}
      className="fixed inset-0 z-[60] grid place-items-center bg-black/80 px-6 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-sm overflow-hidden rounded-3xl border border-brand/30 bg-surface p-8 text-center animate-pop-in"
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-3 top-3 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="relative mx-auto grid size-32 place-items-center">
          <span className="absolute inset-0 rounded-full bg-brand/25 blur-2xl animate-pulse-glow" />
          <span className="absolute inset-4 rounded-full bg-brand/15 blur-xl" />
          <span className="absolute inset-0 rounded-full border border-brand/40" />
          <AchievementIcon name={achievement.icon_name} className="relative size-16 text-brand" />
        </div>

        <p className="mt-6 font-display text-3xl font-black italic tracking-tight text-brand">PARABÉNS!</p>
        <h2 className="mt-2 text-lg font-bold text-foreground">{achievement.title}</h2>
        {achievement.description && (
          <p className="mt-1.5 text-sm text-muted-foreground">{achievement.description}</p>
        )}

        <ShareButton
          payload={{
            kind: "achievement",
            title: achievement.title,
            description: achievement.description,
            iconName: achievement.icon_name,
            athlete,
            belt,
            avatarUrl,
          }}
          label="Compartilhar no Story"
          className="mt-7 flex w-full items-center justify-center gap-2 rounded-2xl border border-brand/40 bg-brand/10 py-3.5 text-sm font-black uppercase tracking-widest text-brand transition-opacity hover:opacity-90 disabled:opacity-60"
        />

        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-2xl bg-brand py-3.5 text-sm font-black uppercase tracking-widest text-brand-foreground transition-opacity hover:opacity-90"
        >
          Oss!
        </button>
      </div>
    </div>
  );
}

export { AchievementIcon };
