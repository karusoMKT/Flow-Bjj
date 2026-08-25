const BELT_PROGRESSION = ["Branca", "Azul", "Roxa", "Marrom", "Preta"];

export function getNextBeltObjective(belt: string | null, stripes: number): string {
  const normalizedBelt = belt?.trim() || "Branca";

  if (normalizedBelt.toLowerCase() === "preta") {
    return "Operação Mestre ou Evolução Contínua";
  }

  if (stripes < 4) {
    return `Operação ${stripes + 1}º Grau`;
  }

  const currentIndex = BELT_PROGRESSION.findIndex(
    (b) => b.toLowerCase() === normalizedBelt.toLowerCase()
  );

  const nextIndex = currentIndex >= 0 ? currentIndex + 1 : 1;
  const nextBelt = BELT_PROGRESSION[nextIndex];

  if (!nextBelt || nextBelt.toLowerCase() === "preta") {
    return "Operação Mestre ou Evolução Contínua";
  }

  return `Operação Faixa ${nextBelt}`;
}
