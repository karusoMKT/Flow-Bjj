import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { Battery, Camera, ChevronRight, Clock, Flame, ImagePlus, MapPin, Trophy, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AchievementModal } from "@/components/AchievementModal";
import { LevelUpModal } from "@/components/LevelUpModal";

import type { Achievement } from "@/lib/achievements";
import { runCompetitionAchievements, runWorkoutAchievements } from "@/lib/achievements";
import { awardXp, XP_REWARDS } from "@/lib/xp";
import { PLACEMENTS, encodeCompetition } from "@/lib/competition";
import { LocationAutocomplete } from "@/components/LocationAutocomplete";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { uploadShareImage } from "@/lib/stories";



export const Route = createFileRoute("/_authenticated/create")({
  head: () => ({
    meta: [
      { title: "Registrar treino | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Publique seu treino de Jiu-Jitsu: academia, tipo, duração e intensidade em poucos toques.",
      },
      { property: "og:title", content: "Registrar treino | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Publique seu treino de Jiu-Jitsu: academia, tipo, duração e intensidade em poucos toques.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CreatePost,
});

const TYPES = ["Kimono", "No-Gi", "Drilling", "Competição", "Físico"];

const INTENSITIES = [
  { key: "Leve", icon: Battery },
  { key: "Moderado", icon: Zap },
  { key: "Guerra", icon: Flame },
];

function CreatePost() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [mode, setMode] = useState<"treino" | "competicao">("treino");
  const [text, setText] = useState("");
  const [type, setType] = useState("Kimono");
  const [duration, setDuration] = useState("90");
  const [intensity, setIntensity] = useState("Moderado");
  const [saving, setSaving] = useState(false);
  const [queue, setQueue] = useState<Achievement[]>([]);
  const [levelUp, setLevelUp] = useState<{ level: number; xp: number } | null>(null);
  const unlocked = queue[0] ?? null;

  const [trainLocation, setTrainLocation] = useState("");
  const [locationTouched, setLocationTouched] = useState(false);
  // Competição
  const [event, setEvent] = useState("");
  const [placement, setPlacement] = useState<string>(PLACEMENTS[0].value);
  const [compLocation, setCompLocation] = useState("");
  const [compSummary, setCompSummary] = useState("");

  // Mídia do post (foto do treino ou da competição)
  const fileRef = useRef<HTMLInputElement>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  // Academia principal do perfil (preenche o local automaticamente)
  const { data: me } = useQuery({
    queryKey: ["home-academy"],
    queryFn: async () => {
      const { data: auth } = await supabase.auth.getUser();
      const uid = auth.user?.id;
      if (!uid) return null;
      const { data, error } = await supabase
        .from("profiles")
        .select("home_academy, full_name, username, belt, avatar_url")
        .eq("id", uid)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });
  const homeAcademy = me?.home_academy ?? null;


  useEffect(() => {
    if (homeAcademy && !locationTouched && !trainLocation) {
      setTrainLocation(homeAcademy);
    }
  }, [homeAcademy, locationTouched, trainLocation]);

  /** Concede XP do check-in e devolve o nível quando o atleta sobe. */
  async function grantXp(uid: string, kind: "treino" | "competicao") {
    const result = await awardXp(uid, kind);
    if (!result) return null;
    toast.success(`+${XP_REWARDS[kind]} XP`);
    return result.leveledUp ? { level: result.level, xp: result.xp } : null;
  }



  async function publish() {
    if (saving) return;
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setSaving(false);
      toast.error("Sessão expirada. Faça login novamente.");
      return;
    }
    if (mode === "competicao") {
      if (!event.trim()) {
        setSaving(false);
        toast.error("Informe o nome do campeonato.");
        return;
      }
      const { error: compError } = await supabase.from("posts").insert({
        user_id: uid,
        content: encodeCompetition({
          event,
          placement,
          location: compLocation,
          summary: compSummary,
        }),
      });
      setSaving(false);
      if (compError) {
        toast.error("Não foi possível publicar a competição.");
        return;
      }
      toast.success("Competição publicada!");
      const leveledComp = await grantXp(uid, "competicao");
      queryClient.invalidateQueries({ queryKey: ["feed"] });
      queryClient.invalidateQueries({ queryKey: ["profile"] });
      const unlockedList = await runCompetitionAchievements(uid, placement);
      queryClient.invalidateQueries({ queryKey: ["achievements"] });
      showUnlocked(unlockedList, leveledComp);

      return;
    }


    const minutes = Number(duration) || 60;
    const notes = [text.trim(), `Intensidade: ${intensity}`].filter(Boolean).join(" · ") || null;

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: uid,
        gym_id: null,
        duration_minutes: minutes,
        training_type: type,
        intensity,
        notes,
        location: trainLocation.trim() || null,
      })
      .select("id")
      .single();

    if (workoutError) {
      setSaving(false);
      toast.error("Não foi possível publicar o treino.");
      return;
    }

    const { error: postError } = await supabase.from("posts").insert({
      user_id: uid,
      workout_id: workout.id,
      content: text.trim() || `Treino de ${type} · ${minutes} min · ${intensity}`,
    });

    // Mantém compatibilidade com o feed atual baseado em sessions
    await supabase.from("sessions").insert({
      user_id: uid,
      gym_id: null,
      session_date: new Date().toISOString().slice(0, 10),
      duration_minutes: minutes,
      session_type: type,
      notes,
    });

    setSaving(false);
    if (postError) {
      toast.error("Treino salvo, mas não foi possível publicar no feed.");
      return;
    }
    toast.success("Treino publicado!");
    const leveled = await grantXp(uid, "treino");
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });

    // Motor de conquistas (volume, ofensiva) — sem duplicar troféus.
    const unlockedList = await runWorkoutAchievements(uid);
    queryClient.invalidateQueries({ queryKey: ["achievements"] });
    showUnlocked(unlockedList, leveled);

  }

  /**
   * Mostra as conquistas em sequência e, ao final, celebra o level up.
   * Sem nada a comemorar, volta direto para a Home.
   */
  function showUnlocked(list: Achievement[], leveled: { level: number; xp: number } | null) {
    const finish = () => {
      if (leveled) setLevelUp(leveled);
      else navigate({ to: "/home" });
    };

    if (!list.length) {
      finish();
      return;
    }
    setQueue(list);
    list.forEach((_, i) => {
      window.setTimeout(() => {
        setQueue((q) => q.slice(1));
        if (i === list.length - 1) finish();
      }, 3500 * (i + 1));
    });
  }


  return (
    <div className="min-h-screen bg-background pb-16">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-white/5 bg-background/95 px-4 py-3 backdrop-blur">
        <button
          type="button"
          onClick={() => navigate({ to: "/home" })}
          aria-label="Cancelar"
          className="rounded-xl p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="size-5" />
        </button>
        <h1 className="text-base font-semibold text-foreground">
          {mode === "treino" ? "Registrar Treino" : "Registrar Competição"}
        </h1>
        <button
          type="button"
          onClick={publish}
          disabled={saving}
          className="rounded-xl px-2 py-2 text-sm font-bold text-brand transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {saving ? "..." : "Publicar"}
        </button>
      </header>

      <main className="mx-auto flex max-w-md flex-col gap-6 px-4 py-6">
        {/* Tabs Treino / Competição */}
        <div
          role="tablist"
          aria-label="Tipo de registro"
          className="grid grid-cols-2 gap-1 rounded-2xl border border-white/5 bg-white/[0.04] p-1"
        >
          {(["treino", "competicao"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`rounded-xl py-2.5 text-sm font-semibold transition-all duration-300 ${
                mode === m
                  ? "bg-brand text-brand-foreground shadow-[0_6px_20px_-10px_var(--brand)]"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {m === "treino" ? "Treino" : "Competição"}
            </button>
          ))}
        </div>

        {mode === "treino" ? (
          <div key="treino" className="flex flex-col gap-6 animate-fade-in">
        {/* Texto + mídia */}

        <section className="flex gap-3">
          <img
            src="https://ui-avatars.com/api/?background=1A1A1A&color=D7FF3E&bold=true&name=Voce"
            alt="Seu avatar"
            className="size-10 shrink-0 rounded-full"
          />
          <div className="flex-1">
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={4}
              aria-label="Descrição do treino"
              placeholder="Como foi o treino hoje? Compartilhe os detalhes..."
              className="w-full resize-none border-0 bg-transparent p-0 text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-0"
            />
          </div>
        </section>

        <button
          type="button"
          className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-8 text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
        >
          <Camera className="size-6" />
          <span className="text-sm">Adicionar foto ou vídeo</span>
        </button>

        {/* Academia / Local do treino (unificado) */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Academia / Local do Treino
          </h2>
          <LocationAutocomplete
            value={trainLocation}
            onChange={(v) => {
              setLocationTouched(true);
              setTrainLocation(v);
            }}
            ariaLabel="Academia ou local do treino"
            placeholder="Ex: Gracie Barra, Copacabana..."
          />
        </section>



        {/* Tipo de treino */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Tipo de treino</h2>
          <div className="scrollbar-hide -mx-4 flex gap-2 overflow-x-auto px-4">
            {TYPES.map((t) => {
              const active = t === type;
              return (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  aria-pressed={active}
                  className={`shrink-0 rounded-full px-4 py-2.5 text-sm font-medium transition-colors ${
                    active
                      ? "bg-brand text-brand-foreground"
                      : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {t}
                </button>
              );
            })}
          </div>
        </section>

        {/* Duração */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Duração</h2>
          <div className="relative">
            <Clock className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand" />
            <input
              value={duration}
              onChange={(e) => setDuration(e.target.value.replace(/\D/g, ""))}
              inputMode="numeric"
              aria-label="Duração em minutos"
              placeholder="90"
              className="w-full rounded-2xl border border-white/5 bg-white/[0.04] py-4 pl-12 pr-16 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
            />
            <span className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
              min
            </span>
          </div>
        </section>

        {/* Intensidade */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
            Intensidade do rola
          </h2>
          <div className="grid grid-cols-3 gap-2">
            {INTENSITIES.map(({ key, icon: Icon }) => {
              const active = key === intensity;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => setIntensity(key)}
                  aria-pressed={active}
                  className={`flex flex-col items-center gap-2 rounded-2xl py-4 text-xs font-medium transition-colors ${
                    active
                      ? "bg-brand text-brand-foreground"
                      : "border border-white/10 bg-white/[0.03] text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {key === "Guerra" ? "Guerra/Pesado" : key}
                </button>
              );
            })}
          </div>
        </section>
          </div>
        ) : (
          <div key="competicao" className="flex flex-col gap-6 animate-fade-in">
            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Nome do campeonato
              </h2>
              <div className="relative">
                <Trophy className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand" />
                <input
                  value={event}
                  onChange={(e) => setEvent(e.target.value)}
                  aria-label="Nome do campeonato"
                  placeholder="Ex: Copa Sul Brasileiro de Jiu-Jitsu"
                  className="w-full rounded-2xl border border-white/5 bg-white/[0.04] py-4 pl-12 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
                />
              </div>
            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Colocação
              </h2>
              <Select value={placement} onValueChange={setPlacement}>
                <SelectTrigger
                  aria-label="Colocação"
                  className="h-auto w-full rounded-2xl border border-white/5 bg-white/[0.04] px-4 py-4 text-sm text-foreground focus:border-brand/40 focus:ring-0"
                >
                  <SelectValue placeholder="Selecione a colocação" />
                </SelectTrigger>
                <SelectContent className="rounded-2xl border-white/10 bg-[#121212] text-foreground">
                  {PLACEMENTS.map((p) => (
                    <SelectItem
                      key={p.value}
                      value={p.value}
                      className="rounded-xl text-sm text-foreground focus:bg-brand/15 focus:text-brand data-[state=checked]:text-brand"
                    >
                      {p.value}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Localização
              </h2>
              <LocationAutocomplete
                value={compLocation}
                onChange={setCompLocation}
                ariaLabel="Localização do campeonato"
                placeholder="Ex: Ginásio do Ibirapuera, São Paulo"
              />

            </section>

            <section className="flex flex-col gap-3">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">
                Resumo das lutas
              </h2>
              <textarea
                value={compSummary}
                onChange={(e) => setCompSummary(e.target.value)}
                rows={5}
                aria-label="Resumo das lutas"
                placeholder="Conte como foram as lutas, finalizações, aprendizados..."
                className="w-full resize-none rounded-2xl border border-white/5 bg-white/[0.04] p-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-brand/40 focus:outline-none"
              />
            </section>

            <button
              type="button"
              className="flex w-full flex-col items-center justify-center gap-2 rounded-2xl border border-dashed border-white/15 py-8 text-muted-foreground transition-colors hover:border-brand/40 hover:text-foreground"
            >
              <ImagePlus className="size-6" />
              <span className="text-sm">Adicionar foto do evento</span>
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={publish}
          disabled={saving}
          className="mt-2 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Publicando..." : mode === "treino" ? "Publicar treino" : "Publicar competição"}
        </button>

      </main>

      <AchievementModal
        achievement={unlocked}
        athlete={me?.full_name ?? me?.username ?? null}
        belt={me?.belt ?? null}
        avatarUrl={me?.avatar_url ?? null}
        onClose={() => {
          setQueue((q) => q.slice(1));
          if (levelUp) setLevelUp(levelUp);
          else navigate({ to: "/home" });
        }}
      />

      <LevelUpModal
        level={levelUp?.level ?? null}
        xp={levelUp?.xp ?? 0}
        athlete={me?.full_name ?? me?.username ?? null}
        belt={me?.belt ?? null}
        avatarUrl={me?.avatar_url ?? null}
        onClose={() => {
          setLevelUp(null);
          navigate({ to: "/home" });
        }}

      />
    </div>
  );
}
