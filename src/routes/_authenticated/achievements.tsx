import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import {
  Award,
  Clock,
  Dumbbell,
  Flame,
  Footprints,
  Globe,
  Medal,
  Shield,
  Star,
  Swords,
  Target,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const TABS = ["Todas", "Desbloqueadas", "Raras"] as const;
type Tab = (typeof TABS)[number];

type Rarity = "common" | "rare" | "epic" | "legendary" | "mythic";

type Badge = {
  id: string;
  name: string;
  icon: React.ElementType;
  rarity: Rarity;
  unlocked: boolean;
};

const RARITY_CONFIG: Record<
  Rarity,
  { label: string; border: string; icon: string; glow: string; bg: string }
> = {
  common: {
    label: "Comum",
    border: "border-white/15",
    icon: "text-white/80",
    glow: "shadow-[0_0_20px_-8px_rgba(255,255,255,0.15)]",
    bg: "bg-surface-2/60",
  },
  rare: {
    label: "Raro",
    border: "border-brand",
    icon: "text-brand",
    glow: "shadow-[0_0_24px_-8px_var(--brand)]",
    bg: "bg-brand/10",
  },
  epic: {
    label: "Épico",
    border: "border-purple-500",
    icon: "text-purple-400",
    glow: "shadow-[0_0_24px_-8px_rgba(168,85,247,0.45)]",
    bg: "bg-purple-500/10",
  },
  legendary: {
    label: "Lendário",
    border: "border-amber-400",
    icon: "text-amber-400",
    glow: "shadow-[0_0_24px_-8px_rgba(251,191,36,0.45)]",
    bg: "bg-amber-400/10",
  },
  mythic: {
    label: "Mítico",
    border: "border-sky-400",
    icon: "text-sky-400",
    glow: "shadow-[0_0_24px_-8px_rgba(56,189,248,0.45)]",
    bg: "bg-sky-400/10",
  },
};

const BADGES: Badge[] = [
  { id: "1", name: "Primeiro treino", icon: Dumbbell, rarity: "common", unlocked: true },
  { id: "2", name: "10 treinos", icon: Target, rarity: "common", unlocked: true },
  { id: "3", name: "100 horas", icon: Clock, rarity: "rare", unlocked: true },
  { id: "4", name: "30 dias seguidos", icon: Flame, rarity: "rare", unlocked: true },
  { id: "5", name: "Primeira competição", icon: Trophy, rarity: "epic", unlocked: true },
  { id: "6", name: "Faixa Azul", icon: Award, rarity: "epic", unlocked: true },
  { id: "7", name: "Treinou em outro estado", icon: Globe, rarity: "rare", unlocked: true },
  { id: "8", name: "Treinou em outro país", icon: Shield, rarity: "epic", unlocked: false },
  { id: "9", name: "Faixa Roxa", icon: Medal, rarity: "legendary", unlocked: false },
  { id: "10", name: "Faixa Marrom", icon: Star, rarity: "legendary", unlocked: false },
  { id: "11", name: "Semana Sem Faltar", icon: Zap, rarity: "rare", unlocked: true },
  { id: "12", name: "Open Mat", icon: Footprints, rarity: "common", unlocked: true },
  { id: "13", name: "Rolou com 10 parceiros", icon: Users, rarity: "rare", unlocked: true },
  { id: "14", name: "50 Quadas", icon: Swords, rarity: "mythic", unlocked: false },
  { id: "15", name: "Mestre do tatame", icon: CrownIcon, rarity: "mythic", unlocked: false },
];

function CrownIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M2 4l3 12h14l3-12-6 7-4-7-4 7-6-7zm3 16h14" />
    </svg>
  );
}

function HexBadge({ badge }: { badge: Badge }) {
  const style = RARITY_CONFIG[badge.rarity];
  const Icon = badge.icon;

  return (
    <div className="flex flex-col items-center gap-2">
      <div
        className={`relative grid size-[72px] place-items-center ${style.bg} ${style.glow} transition-opacity`}
        style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
      >
        <div
          className={`absolute inset-0 border-2 ${style.border}`}
          style={{ clipPath: "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)" }}
        />
        <Icon className={`size-7 ${style.icon} ${badge.unlocked ? "" : "opacity-40 grayscale"}`} strokeWidth={1.8} />
        {!badge.unlocked && (
          <div className="absolute inset-0 grid place-items-center bg-background/50">
            <span className="text-[10px] font-bold text-muted-foreground">BLOQ.</span>
          </div>
        )}
      </div>
      <div className="text-center">
        <p className={`text-[11px] font-medium leading-tight ${badge.unlocked ? "text-foreground" : "text-muted-foreground"}`}>
          {badge.name}
        </p>
        <p className={`text-[9px] ${style.icon}`}>{style.label}</p>
      </div>
    </div>
  );
}

function AchievementsPage() {
  const [tab, setTab] = useState<Tab>("Todas");

  const filtered = useMemo(() => {
    if (tab === "Todas") return BADGES;
    if (tab === "Desbloqueadas") return BADGES.filter((b) => b.unlocked);
    return BADGES.filter((b) => b.rarity === "epic" || b.rarity === "legendary" || b.rarity === "mythic");
  }, [tab]);

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center font-sans text-lg font-semibold tracking-tight">Conquistas</h1>

        <div className="mt-4 flex rounded-full bg-surface p-1">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`flex-1 rounded-full py-2 text-xs font-semibold transition-colors ${
                tab === t ? "bg-brand text-brand-foreground" : "text-muted-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="mt-6">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs text-muted-foreground">
              {BADGES.filter((b) => b.unlocked).length} / {BADGES.length} desbloqueadas
            </span>
            <span className="text-xs font-semibold text-brand">
              {Math.round((BADGES.filter((b) => b.unlocked).length / BADGES.length) * 100)}%
            </span>
          </div>

          <div className="grid grid-cols-3 gap-4">
            {filtered.map((badge) => (
              <HexBadge key={badge.id} badge={badge} />
            ))}
          </div>
        </section>
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Conquistas | Flow Jiu-Jitsu" },
      { name: "description", content: "Veja todas as conquistas, emblemas e marcos da sua jornada no Jiu-Jitsu." },
      { property: "og:title", content: "Conquistas | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Veja todas as conquistas, emblemas e marcos da sua jornada no Jiu-Jitsu." },
    ],
  }),
  component: AchievementsPage,
});
