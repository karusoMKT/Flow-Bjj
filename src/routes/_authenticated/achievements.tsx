import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { icons, Lock, Trophy, X } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { supabase } from "@/integrations/supabase/client";
import { ACHIEVEMENTS, type AchievementDef } from "@/lib/achievements";

const TABS = ["Todas", "Desbloqueadas", "Bloqueadas"] as const;
type Tab = (typeof TABS)[number];

/** Como conquistar cada troféu (texto do bottom sheet). */
const HOW_TO: Record<string, string> = {
  first_training: "Registre o seu primeiro treino no Flow.",
  "10_trainings": "Registre 10 treinos.",
  "100_trainings": "Registre 100 treinos.",
  "7_days_streak": "Treine 7 dias seguidos, sem falhar nenhum.",
  first_competition: "Registre a sua primeira competição.",
  first_victory: "Suba ao pódio: ouro, prata ou bronze em um campeonato.",
  stripe_promotion: "Atualize o seu perfil ao receber um novo grau.",
  belt_promotion: "Atualize o seu perfil ao ser graduado em uma nova faixa.",
};

const CATALOG = Object.values(ACHIEVEMENTS) as AchievementDef[];

type GalleryItem = AchievementDef & { unlocked: boolean; unlockedAt: string | null };

function TrophyIcon({ name, className }: { name: string; className?: string }) {
  const Icon = (icons as Record<string, React.ElementType>)[name] ?? Trophy;
  return <Icon className={className} strokeWidth={1.7} />;
}

async function fetchGallery(): Promise<GalleryItem[]> {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");

  const { data, error } = await supabase
    .from("user_achievements")
    .select("title, unlocked_at")
    .eq("user_id", uid);
  if (error) throw error;

  const owned = new Map((data ?? []).map((r) => [r.title, r.unlocked_at as string]));

  return CATALOG.map((def) => ({
    ...def,
    unlocked: owned.has(def.title),
    unlockedAt: owned.get(def.title) ?? null,
  }));
}

function HexTrophy({ item, onClick }: { item: GalleryItem; onClick: () => void }) {
  const hex = "polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)";

  return (
    <button type="button" onClick={onClick} className="flex flex-col items-center gap-2 text-center">
      <div
        className={`relative grid size-[76px] place-items-center transition-transform active:scale-95 ${
          item.unlocked
            ? "bg-brand/12 shadow-[0_0_26px_-6px_var(--brand)]"
            : "bg-surface-2/60 opacity-50 grayscale"
        }`}
        style={{ clipPath: hex }}
      >
        <div
          className={`absolute inset-0 border-2 ${item.unlocked ? "border-brand" : "border-white/15"}`}
          style={{ clipPath: hex }}
        />
        <TrophyIcon
          name={item.icon_name}
          className={`size-8 ${item.unlocked ? "text-brand" : "text-muted-foreground"}`}
        />
        {!item.unlocked && (
          <span className="absolute bottom-3 right-3 grid size-4 place-items-center rounded-full bg-background/90">
            <Lock className="size-2.5 text-muted-foreground" />
          </span>
        )}
      </div>
      <p
        className={`text-[11px] font-medium leading-tight ${
          item.unlocked ? "text-foreground" : "text-muted-foreground"
        }`}
      >
        {item.title}
      </p>
    </button>
  );
}

function DetailSheet({ item, onClose }: { item: GalleryItem | null; onClose: () => void }) {
  if (!item) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={item.title}
      className="fixed inset-0 z-[60] flex items-end bg-black/70 animate-fade-in backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full rounded-t-3xl border-t border-white/10 bg-surface px-6 pb-10 pt-5 animate-slide-up"
      >
        <div className="mx-auto h-1 w-10 rounded-full bg-white/15" />
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar"
          className="absolute right-4 mt-1 rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-4" />
        </button>

        <div className="mt-5 flex items-start gap-4">
          <div
            className={`relative grid size-16 shrink-0 place-items-center rounded-2xl border ${
              item.unlocked ? "border-brand/50 bg-brand/10" : "border-white/10 bg-surface-2 opacity-60 grayscale"
            }`}
          >
            <TrophyIcon
              name={item.icon_name}
              className={`size-8 ${item.unlocked ? "text-brand" : "text-muted-foreground"}`}
            />
          </div>
          <div className="min-w-0">
            <h2 className="text-base font-bold text-foreground">{item.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
          </div>
        </div>

        <div className="mt-5 rounded-2xl border border-white/10 bg-surface-2/60 p-4">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Como conquistar</p>
          <p className="mt-1 text-sm text-foreground">{HOW_TO[item.key] ?? item.description}</p>
        </div>

        <p className={`mt-4 text-center text-xs ${item.unlocked ? "text-brand" : "text-muted-foreground"}`}>
          {item.unlocked && item.unlockedAt
            ? `Desbloqueada em ${new Date(item.unlockedAt).toLocaleDateString("pt-BR")}`
            : "Ainda bloqueada — continue treinando!"}
        </p>
      </div>
    </div>
  );
}

function AchievementsPage() {
  const [tab, setTab] = useState<Tab>("Todas");
  const [selected, setSelected] = useState<GalleryItem | null>(null);

  const { data, isLoading } = useQuery({ queryKey: ["achievements", "gallery"], queryFn: fetchGallery });
  const items = data ?? [];

  const filtered = useMemo(() => {
    if (tab === "Desbloqueadas") return items.filter((i) => i.unlocked);
    if (tab === "Bloqueadas") return items.filter((i) => !i.unlocked);
    return items;
  }, [items, tab]);

  const unlockedCount = items.filter((i) => i.unlocked).length;
  const percent = items.length ? Math.round((unlockedCount / items.length) * 100) : 0;

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center font-sans text-lg font-semibold tracking-tight">Galeria de Troféus</h1>

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
          <div className="mb-2 flex items-center justify-between text-xs">
            <span className="text-muted-foreground">
              {unlockedCount} / {items.length} desbloqueadas
            </span>
            <span className="font-semibold text-brand">{percent}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-surface-2">
            <div
              className="h-full rounded-full bg-brand shadow-[0_0_12px_var(--brand)] transition-all"
              style={{ width: `${percent}%` }}
            />
          </div>

          {isLoading ? (
            <div className="mt-6 grid grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="mx-auto size-[76px] animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <p className="mt-8 text-center text-sm text-muted-foreground">Nenhum troféu nesta aba ainda.</p>
          ) : (
            <div className="mt-6 grid grid-cols-3 gap-x-4 gap-y-6">
              {filtered.map((item) => (
                <HexTrophy key={item.key} item={item} onClick={() => setSelected(item)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <DetailSheet item={selected} onClose={() => setSelected(null)} />
      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/achievements")({
  head: () => ({
    meta: [
      { title: "Galeria de Troféus | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Todos os troféus do Flow: veja o que já desbloqueou e o que falta conquistar no tatame.",
      },
      { property: "og:title", content: "Galeria de Troféus | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Todos os troféus do Flow: veja o que já desbloqueou e o que falta conquistar no tatame.",
      },
    ],
  }),
  component: AchievementsPage,
});
