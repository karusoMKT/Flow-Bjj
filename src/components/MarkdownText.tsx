/** Renderizador leve de markdown (negrito, itálico, listas, títulos) para as respostas do IA Coach. */

function renderInline(text: string) {
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*|`[^`]+`)/g).filter(Boolean);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-bold text-foreground">
          {part.slice(2, -2)}
        </strong>
      );
    }
    if (part.startsWith("*") && part.endsWith("*") && part.length > 2) {
      return (
        <em key={i} className="italic">
          {part.slice(1, -1)}
        </em>
      );
    }
    if (part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-white/10 px-1 py-0.5 text-[11px] text-brand">
          {part.slice(1, -1)}
        </code>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

export function MarkdownText({ content }: { content: string }) {
  const lines = content.split("\n");
  const blocks: React.ReactNode[] = [];
  let list: { ordered: boolean; items: string[] } | null = null;

  const flush = () => {
    if (!list) return;
    const items = list.items;
    blocks.push(
      list.ordered ? (
        <ol key={`l-${blocks.length}`} className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="grid size-5 shrink-0 place-items-center rounded-full bg-brand/15 text-[10px] font-bold text-brand">
                {i + 1}
              </span>
              <span className="min-w-0">{renderInline(item)}</span>
            </li>
          ))}
        </ol>
      ) : (
        <ul key={`l-${blocks.length}`} className="mt-2 space-y-1.5">
          {items.map((item, i) => (
            <li key={i} className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground">
              <span className="mt-2 size-1.5 shrink-0 rounded-full bg-brand" />
              <span className="min-w-0">{renderInline(item)}</span>
            </li>
          ))}
        </ul>
      ),
    );
    list = null;
  };

  for (const raw of lines) {
    const line = raw.trimEnd();
    const ordered = /^\s*\d+[.)]\s+/.exec(line);
    const bullet = /^\s*[-*+]\s+/.exec(line);
    const heading = /^(#{1,3})\s+(.*)$/.exec(line);

    if (ordered) {
      if (list && !list.ordered) flush();
      list = list ?? { ordered: true, items: [] };
      list.items.push(line.replace(/^\s*\d+[.)]\s+/, ""));
      continue;
    }
    if (bullet) {
      if (list && list.ordered) flush();
      list = list ?? { ordered: false, items: [] };
      list.items.push(line.replace(/^\s*[-*+]\s+/, ""));
      continue;
    }
    flush();
    if (!line.trim()) continue;
    if (heading) {
      blocks.push(
        <p key={`h-${blocks.length}`} className="mt-3 text-sm font-bold text-foreground first:mt-0">
          {renderInline(heading[2])}
        </p>,
      );
      continue;
    }
    blocks.push(
      <p key={`p-${blocks.length}`} className="mt-2 text-sm leading-relaxed text-foreground first:mt-0">
        {renderInline(line)}
      </p>,
    );
  }
  flush();

  return <div className="min-w-0">{blocks}</div>;
}
