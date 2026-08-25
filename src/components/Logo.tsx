import { useState } from "react";

/** Marca tipográfica usada quando a imagem oficial não consegue carregar. */
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
  variant = "full",
}: {
  className?: string;
  style?: React.CSSProperties;
  /** "full" = lockup completo (splash/login). "mark" = apenas o ícone "F" (header). */
  variant?: "full" | "mark";
}) {
  const [failed, setFailed] = useState(false);

  if (failed) return <WordmarkFallback className={className} style={style} />;

  return (
    <img
      src={variant === "mark" ? "/logo-mark.png" : "/logo.png"}
      alt="Flow Jiu-Jitsu"
      className={`select-none object-contain ${className}`}
      draggable={false}
      style={style}
      onError={() => setFailed(true)}
    />
  );
}
