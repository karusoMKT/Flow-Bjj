import logoAsset from "@/assets/flow-logo.png.asset.json";

export function Logo({
  className = "h-10 w-auto",
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <img
      src={logoAsset.url}
      alt="Flow Jiu-Jitsu"
      className={`select-none object-contain ${className}`}
      draggable={false}
      style={style}
    />
  );
}
