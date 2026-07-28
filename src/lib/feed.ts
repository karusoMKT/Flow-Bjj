export function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const min = Math.floor(diff / 60000);
  if (min < 1) return "agora";
  if (min < 60) return `${min}min`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h}h`;
  const d = Math.floor(h / 24);
  if (d < 7) return `${d}d`;
  return `${Math.floor(d / 7)}sem`;
}

export function beltClass(belt?: string | null): string {
  const b = (belt ?? "").toLowerCase();
  if (b.includes("preta")) return "bg-surface-2 text-foreground";
  if (b.includes("marrom")) return "bg-surface-2 text-[oklch(0.65_0.09_50)]";
  if (b.includes("roxa")) return "bg-surface-2 text-[oklch(0.62_0.16_300)]";
  if (b.includes("azul")) return "bg-surface-2 text-primary";
  if (b.includes("branca")) return "bg-surface-2 text-muted-foreground";
  return "bg-surface-2 text-muted-foreground";
}

export const BELTS = ["Branca", "Azul", "Roxa", "Marrom", "Preta"] as const;
