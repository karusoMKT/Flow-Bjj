import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";

export const Route = createFileRoute("/_authenticated/checkin")({
  head: () => ({
    meta: [
      { title: "Check-in de treino | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Registre seu treino: academia, duração, tipo e intensidade em poucos toques.",
      },
      { property: "og:title", content: "Check-in de treino | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Registre seu treino: academia, duração, tipo e intensidade em poucos toques.",
      },
    ],
  }),
  component: Checkin,
});

const TYPES = ["Gi", "No-Gi", "Técnica", "Rolas", "Físico"];

function Checkin() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [gymId, setGymId] = useState("");
  const [duration, setDuration] = useState(60);
  const [type, setType] = useState("Gi");
  const [notes, setNotes] = useState("");
  const [saving, setSaving] = useState(false);

  const { data: gyms } = useQuery({
    queryKey: ["gyms"],
    queryFn: async () => {
      const { data, error } = await supabase.from("gyms").select("id, name, city").order("name").limit(100);
      if (error) throw error;
      return data ?? [];
    },
  });

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { data: auth } = await supabase.auth.getUser();
    const uid = auth.user?.id;
    if (!uid) {
      setSaving(false);
      return;
    }
    const { error } = await supabase.from("sessions").insert({
      user_id: uid,
      gym_id: gymId || null,
      session_date: new Date().toISOString().slice(0, 10),
      duration_minutes: duration,
      session_type: type,
      notes: notes || null,
    });
    setSaving(false);
    if (error) {
      toast.error("Não foi possível registrar o treino.");
      return;
    }
    toast.success("Treino registrado!");
    queryClient.invalidateQueries({ queryKey: ["feed"] });
    queryClient.invalidateQueries({ queryKey: ["profile"] });
    navigate({ to: "/home" });
  }

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-2xl font-bold">Check-in</h1>
        <p className="mt-1 text-sm text-muted-foreground">Registre o treino de hoje.</p>

        <form onSubmit={submit} className="mt-6 space-y-4">
          <div>
            <label htmlFor="gym" className="text-xs uppercase tracking-wide text-muted-foreground">
              Academia
            </label>
            <select
              id="gym"
              value={gymId}
              onChange={(e) => setGymId(e.target.value)}
              className="mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-3 text-sm outline-none focus:border-primary"
            >
              <option value="">Selecione</option>
              {gyms?.map((g) => (
                <option key={g.id} value={g.id}>
                  {g.name}
                  {g.city ? ` — ${g.city}` : ""}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="duration" className="text-xs uppercase tracking-wide text-muted-foreground">
              Duração: {duration} min
            </label>
            <input
              id="duration"
              type="range"
              min={15}
              max={180}
              step={15}
              value={duration}
              onChange={(e) => setDuration(Number(e.target.value))}
              className="mt-3 w-full accent-[var(--primary)]"
            />
          </div>

          <div>
            <span className="text-xs uppercase tracking-wide text-muted-foreground">Tipo</span>
            <div className="mt-2 flex flex-wrap gap-2">
              {TYPES.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => setType(t)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    type === t ? "bg-primary text-primary-foreground" : "bg-surface-2 text-muted-foreground"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label htmlFor="notes" className="text-xs uppercase tracking-wide text-muted-foreground">
              Notas
            </label>
            <textarea
              id="notes"
              rows={3}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              maxLength={500}
              placeholder="Como foi o treino?"
              className="mt-1.5 w-full rounded-xl border border-input bg-surface px-3 py-3 text-sm outline-none focus:border-primary"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-primary py-3.5 text-sm font-bold uppercase tracking-wide text-primary-foreground transition-opacity disabled:opacity-60"
          >
            {saving ? "Salvando..." : "Registrar treino"}
          </button>
        </form>
      </main>

      <BottomNav />
    </div>
  );
}
