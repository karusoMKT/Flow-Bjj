import { Medal } from "lucide-react";

/** Medalha de ouro do Campeão da Semana, exibida ao lado do nome do atleta. */
export function ChampionBadge({
  active,
  className = "size-4",
}: {
  active?: boolean | null;
  className?: string;
}) {
  if (!active) return null;
  return (
    <Medal
      aria-label="Campeão da Semana"
      role="img"
      className={`${className} shrink-0 fill-[oklch(0.85_0.16_92)]/25 text-[oklch(0.85_0.16_92)] drop-shadow-[0_0_6px_oklch(0.85_0.16_92/0.6)]`}
    />
  );
}
