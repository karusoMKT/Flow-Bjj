import logoAsset from "@/assets/flow-logo.png.asset.json";

export function Logo({ className = "" }: { className?: string }) {
  return (
    <img
      src={logoAsset.url}
      alt="Flow Jiu-Jitsu"
      className={`select-none object-contain ${className}`}
      draggable={false}
    />
  );
}
