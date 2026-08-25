import type { ReactNode } from "react";

/** Renderiza o texto do post destacando menções (@usuario) com o neon da marca. */
export function renderWithMentions(text: string): ReactNode[] {
  const parts = text.split(/(@[a-zA-Z0-9_.]+)/g);
  return parts.map((part, i) =>
    part.startsWith("@") && part.length > 1 ? (
      <span key={i} className="font-semibold text-brand">
        {part}
      </span>
    ) : (
      <span key={i}>{part}</span>
    ),
  );
}
