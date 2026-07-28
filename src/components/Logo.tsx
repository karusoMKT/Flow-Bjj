export function Logo({ className = "" }: { className?: string }) {
  return (
    <div className={`select-none leading-none ${className}`}>
      <span className="font-display text-3xl font-extrabold uppercase tracking-tight text-brand">
        Flow
      </span>
      <span className="ml-2 align-middle text-[10px] font-semibold uppercase tracking-[0.4em] text-muted-foreground">
        Jiu-Jitsu
      </span>
    </div>
  );
}
