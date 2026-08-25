import { useState } from "react";
import logoAsset from "@/assets/flow-logo.png.asset.json";

/** Marca tipográfica usada quando nenhuma imagem consegue carregar. */
function WordmarkFallback({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <span
      className={`flex select-none flex-col items-center justify-center leading-none ${className ?? ""}`}
      style={style}
      aria-label="Flow Jiu-Jitsu"
    >
      <span className="text-[2.5em] font-black italic tracking-tight text-white">
        <span className="text-brand drop-shadow-[0_0_12px_var(--color-brand)]">F</span>LOW
      </span>
      <span className="mt-1 text-[0.55em] font-bold uppercase tracking-[0.35em] text-brand">
        Jiu-Jitsu
      </span>
    </span>
  );
}

export function Logo({
  className = "h-10 w-auto",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  // 1º: asset no CDN. 2º: /logo.png em /public. 3º: marca tipográfica.
  const [stage, setStage] = useState<0 | 1 | 2>(0);

  if (stage === 2) return <WordmarkFallback className={className} style={style} />;

  return (
    <img
      src={stage === 0 ? logoAsset.url : "/logo.png"}
      alt="Flow Jiu-Jitsu"
      className={`select-none object-contain ${className}`}
      draggable={false}
      style={style}
      onError={() => setStage((s) => (s === 0 ? 1 : 2))}
    />
  );
}
