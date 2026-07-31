/**
 * Codificação leve de posts de competição dentro do campo `content`.
 * Evita mudanças de schema: o marcador é lido pelo feed para renderizar o card especial.
 */

export type CompetitionPost = {
  event: string;
  placement: string;
  location: string;
  summary: string;
};

const MARKER = "[COMP]";

export const PLACEMENTS = [
  { value: "1º Lugar (Ouro)", short: "Ouro", tone: "gold" },
  { value: "2º Lugar (Prata)", short: "Prata", tone: "silver" },
  { value: "3º Lugar (Bronze)", short: "Bronze", tone: "bronze" },
  { value: "Participação", short: "Participação", tone: "default" },
] as const;

export function encodeCompetition(data: CompetitionPost): string {
  const head = [data.event, data.placement, data.location].map((v) => v.trim().replace(/\|/g, "/")).join(" | ");
  return `${MARKER} ${head}${data.summary.trim() ? `\n${data.summary.trim()}` : ""}`;
}

export function parseCompetition(content: string | null | undefined): CompetitionPost | null {
  if (!content || !content.startsWith(MARKER)) return null;
  const [head, ...rest] = content.slice(MARKER.length).trim().split("\n");
  const [event = "", placement = "", location = ""] = head.split("|").map((p) => p.trim());
  return { event, placement, location, summary: rest.join("\n").trim() };
}

export function placementTone(placement: string): string {
  if (placement.startsWith("1")) return "text-[oklch(0.85_0.16_92)] border-[oklch(0.85_0.16_92)]/40 bg-[oklch(0.85_0.16_92)]/10";
  if (placement.startsWith("2")) return "text-[oklch(0.85_0.01_260)] border-[oklch(0.85_0.01_260)]/40 bg-[oklch(0.85_0.01_260)]/10";
  if (placement.startsWith("3")) return "text-[oklch(0.72_0.12_60)] border-[oklch(0.72_0.12_60)]/40 bg-[oklch(0.72_0.12_60)]/10";
  return "text-brand border-brand/40 bg-brand/10";
}
