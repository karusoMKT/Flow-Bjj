import { Zap } from "lucide-react";

export function ProBadge({ className = "size-3.5" }: { className?: string }) {
  return (
    <span
      aria-label="Flow PRO"
      className={`inline-grid shrink-0 place-items-center rounded-full bg-gradient-to-tr from-[oklch(0.85_0.2_140)] to-[oklch(0.75_0.18_130)] text-background shadow-[0_0_8px_oklch(0.85_0.2_140/0.55)] ${className}`}
    >
      <Zap className="size-[65%] fill-current" />
    </span>
  );
}

export function CompetitorTag({ className = "" }: { className?: string }) {
  return (
    <span
      className={`inline-flex shrink-0 items-center gap-1 rounded-full border border-[oklch(0.85_0.16_92)]/50 bg-[oklch(0.85_0.16_92)]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-wide text-[oklch(0.9_0.14_95)] shadow-[0_0_10px_-2px_oklch(0.85_0.16_92/0.35)] ${className}`}
    >
      <span aria-hidden>🏆</span> Competidor
    </span>
  );
}
