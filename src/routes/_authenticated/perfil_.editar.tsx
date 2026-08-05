import { useEffect, useState } from "react";
import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { AchievementModal } from "@/components/AchievementModal";
import {
  runBeltPromotionAchievement,
  runStripePromotionAchievement,
  type Achievement,
} from "@/lib/achievements";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export const Route = createFileRoute("/_authenticated/perfil_/editar")({
  head: () => ({
    meta: [
      { title: "Editar perfil | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Atualize sua academia principal, faixa, graus, peso e status de competidor no Flow.",
      },
      { property: "og:title", content: "Editar perfil | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Atualize sua academia principal, faixa, graus, peso e status de competidor no Flow.",
      },
    ],
  }),
  component: EditarPerfil,
});

const BELT_OPTIONS = ["Branca", "Azul", "Roxa", "Marrom", "Preta", "Coral", "Vermelha"] as const;
const BELT_ORDER: Record<string, number> = Object.fromEntries(
  BELT_OPTIONS.map((b, i) => [b, i]),
);

async function fetchMyProfile() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");
  const { data, error } = await supabase
    .from("profiles")
    .select("id, home_academy, belt, stripes, weight, is_competitor")
    .eq("id", uid)
    .maybeSingle();
  if (error) throw error;
  return data;
}

function EditarPerfil() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { data: profile, isLoading } = useQuery({
    queryKey: ["profile-edit"],
    queryFn: fetchMyProfile,
  });

  const [academy, setAcademy] = useState("");
  const [belt, setBelt] = useState<string>("Branca");
  const [stripes, setStripes] = useState(0);
  const [weight, setWeight] = useState("");
  const [isCompetitor, setIsCompetitor] = useState(false);
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState<Achievement[]>([]);

  useEffect(() => {
    if (!profile) return;
    setAcademy(profile.home_academy ?? "");
    setBelt(profile.belt ?? "Branca");
    setStripes(profile.stripes ?? 0);
    setWeight(profile.weight ?? "");
    setIsCompetitor(Boolean(profile.is_competitor));
  }, [profile]);

  async function handleSave() {
    if (!profile?.id || saving) return;
    setSaving(true);

    const prevBelt = profile.belt ?? "Branca";
    const prevStripes = profile.stripes ?? 0;

    const { error } = await supabase
      .from("profiles")
      .update({
        home_academy: academy.trim() || null,
        belt,
        stripes,
        weight: weight.trim() || null,
        is_competitor: isCompetitor,
      })
      .eq("id", profile.id);

    if (error) {
      setSaving(false);
      toast.error("Não foi possível salvar seu perfil.");
      return;
    }

    const unlocked: Achievement[] = [];
    const beltUp = belt !== prevBelt && (BELT_ORDER[belt] ?? 0) > (BELT_ORDER[prevBelt] ?? 0);
    if (beltUp) unlocked.push(...(await runBeltPromotionAchievement(profile.id)));
    if (stripes > prevStripes) unlocked.push(...(await runStripePromotionAchievement(profile.id)));

    await queryClient.invalidateQueries({ queryKey: ["profile"] });
    await queryClient.invalidateQueries({ queryKey: ["profile-edit"] });
    toast.success("Perfil atualizado!");
    setSaving(false);

    if (unlocked.length) {
      setQueue(unlocked);
      return;
    }
    navigate({ to: "/perfil" });
  }

  function closeAchievement() {
    setQueue((q) => {
      const rest = q.slice(1);
      if (!rest.length) navigate({ to: "/perfil" });
      return rest;
    });
  }

  return (
    <div className="min-h-dvh bg-background pb-28 text-foreground">
      <header className="sticky top-0 z-20 flex items-center gap-3 border-b border-white/5 bg-background/90 px-5 py-4 backdrop-blur">
        <Link
          to="/perfil"
          aria-label="Voltar"
          className="rounded-full p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="text-lg font-black italic tracking-tight">EDITAR PERFIL</h1>
      </header>

      <main className="mx-auto w-full max-w-md space-y-7 px-5 py-6">
        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Academia principal
          </label>
          <LocationAutocomplete
            value={academy}
            onChange={setAcademy}
            placeholder="Buscar sua academia..."
            ariaLabel="Academia principal"
          />
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Faixa
          </label>
          <Select value={belt} onValueChange={setBelt}>
            <SelectTrigger className="h-12 rounded-2xl border-white/10 bg-surface text-sm focus:ring-brand/40">
              <SelectValue placeholder="Selecione a faixa" />
            </SelectTrigger>
            <SelectContent className="rounded-2xl border-white/10 bg-[#121212]">
              {BELT_OPTIONS.map((b) => (
                <SelectItem
                  key={b}
                  value={b}
                  className="rounded-xl focus:bg-brand/15 focus:text-brand"
                >
                  {b}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <label className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Graus
          </label>
          <div className="grid grid-cols-5 gap-2">
            {[0, 1, 2, 3, 4].map((n) => (
              <button
                key={n}
                type="button"
                aria-pressed={stripes === n}
                onClick={() => setStripes(n)}
                className={`h-12 rounded-2xl border text-sm font-bold transition-colors ${
                  stripes === n
                    ? "border-brand bg-brand/15 text-brand"
                    : "border-white/10 bg-surface text-muted-foreground hover:text-foreground"
                }`}
              >
                {n}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label
            htmlFor="weight"
            className="mb-2 block text-xs font-bold uppercase tracking-widest text-muted-foreground"
          >
            Peso (kg)
          </label>
          <input
            id="weight"
            type="number"
            inputMode="decimal"
            min={30}
            max={250}
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="Ex.: 78"
            className="h-12 w-full rounded-2xl border border-white/10 bg-surface px-4 text-sm outline-none transition-colors placeholder:text-muted-foreground focus:border-brand/60"
          />
        </div>

        <button
          type="button"
          role="switch"
          aria-checked={isCompetitor}
          onClick={() => setIsCompetitor((v) => !v)}
          className="flex w-full items-center justify-between rounded-2xl border border-white/10 bg-surface px-4 py-4 text-left"
        >
          <span>
            <span className="block text-sm font-semibold">Sou atleta competidor</span>
            <span className="mt-0.5 block text-xs text-muted-foreground">
              Ative se você participa de campeonatos
            </span>
          </span>
          <span
            className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
              isCompetitor ? "bg-brand" : "bg-white/15"
            }`}
          >
            <span
              className={`absolute top-0.5 size-5 rounded-full bg-white transition-all ${
                isCompetitor ? "left-[22px]" : "left-0.5"
              }`}
            />
          </span>
        </button>

        <button
          type="button"
          onClick={handleSave}
          disabled={saving || isLoading}
          className="flex w-full items-center justify-center gap-2 rounded-2xl bg-brand py-4 text-sm font-black uppercase tracking-widest text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving && <Loader2 className="size-4 animate-spin" />}
          Salvar alterações
        </button>
      </main>

      <AchievementModal achievement={queue[0] ?? null} onClose={closeAchievement} />
    </div>
  );
}
