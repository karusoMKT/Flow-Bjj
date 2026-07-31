import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { Battery, Camera, ChevronRight, Clock, Flame, MapPin, X, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { AchievementModal } from "@/components/AchievementModal";
import type { Achievement } from "@/lib/achievements";

/** Conquista simulada (apenas UI, sem banco de dados por enquanto). */
const DEMO_ACHIEVEMENT: Achievement = {
  id: "demo-first-workout",
  title: "Primeiro Treino",
  description: "Você deu o primeiro passo na sua jornada!",
  icon_name: "Trophy",
  unlocked_at: new Date().toISOString(),
};

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
  const [text, setText] = useState("");
  const [gymId, setGymId] = useState("");
  const [type, setType] = useState("Kimono");
  const [duration, setDuration] = useState("90");
  const [intensity, setIntensity] = useState("Moderado");
  const [saving, setSaving] = useState(false);
  const [unlocked, setUnlocked] = useState<Achievement | null>(null);

  const { data: gyms } = useQuery({
    queryKey: ["gyms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("id, name, city").order("name").limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  const selectedGym = gyms?.find((g) => g.id === gymId);

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
    const minutes = Number(duration) || 60;
    const notes = [text.trim(), `Intensidade: ${intensity}`].filter(Boolean).join(" · ") || null;

    const { data: workout, error: workoutError } = await supabase
      .from("workouts")
      .insert({
        user_id: uid,
        gym_id: gymId || null,
        duration_minutes: minutes,
        training_type: type,
        intensity,
        notes,
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
      gym_id: gymId || null,
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
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });

    // Simulação de conquista (apenas UI): mostra o troféu e depois redireciona.
    setUnlocked(DEMO_ACHIEVEMENT);
    window.setTimeout(() => {
      setUnlocked(null);
      navigate({ to: "/home" });
    }, 3500);
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
        <h1 className="text-base font-semibold text-foreground">Registrar Treino</h1>
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

        {/* Localização */}
        <section className="flex flex-col gap-3">
          <h2 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Localização</h2>
          <div className="relative">
            <MapPin className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-brand" />
            <ChevronRight className="pointer-events-none absolute right-4 top-1/2 size-5 -translate-y-1/2 text-muted-foreground" />
            <select
              value={gymId}
              onChange={(e) => setGymId(e.target.value)}
              aria-label="Academia"
              className="w-full appearance-none rounded-2xl border border-white/5 bg-white/[0.04] py-4 pl-12 pr-12 text-sm text-foreground focus:border-brand/40 focus:outline-none"
            >
              <option value="">Adicionar Academia (Check-in)</option>
              {gyms?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {g.city ? ` — ${g.city}` : ""}
                </option>
              ))}
            </select>
          </div>
          {selectedGym && (
            <p className="text-xs text-muted-foreground">Check-in em {selectedGym.name}</p>
          )}
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

        <button
          type="button"
          onClick={publish}
          disabled={saving}
          className="mt-2 w-full rounded-2xl bg-brand py-4 text-sm font-bold text-brand-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {saving ? "Publicando..." : "Publicar treino"}
        </button>
      </main>

      <AchievementModal
        achievement={unlocked}
        onClose={() => {
          setUnlocked(null);
          navigate({ to: "/home" });
        }}
      />
    </div>
  );
}
