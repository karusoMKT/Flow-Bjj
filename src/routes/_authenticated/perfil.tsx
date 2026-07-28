import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { BottomNav } from "@/components/BottomNav";
import { beltClass, timeAgo } from "@/lib/feed";

export const Route = createFileRoute("/_authenticated/perfil")({
  head: () => ({
    meta: [
      { title: "Meu perfil | Flow Jiu-Jitsu" },
      {
        name: "description",
        content: "Sua faixa, equipe, professor e o histórico completo dos seus treinos.",
      },
      { property: "og:title", content: "Meu perfil | Flow Jiu-Jitsu" },
      {
        property: "og:description",
        content: "Sua faixa, equipe, professor e o histórico completo dos seus treinos.",
      },
    ],
  }),
  component: Perfil,
});

async function fetchProfile() {
  const { data: auth } = await supabase.auth.getUser();
  const uid = auth.user?.id;
  if (!uid) throw new Error("Sem sessão");

  const [profileRes, sessionsRes] = await Promise.all([
    supabase.from("profiles").select("*").eq("id", uid).maybeSingle(),
    supabase
      .from("sessions")
      .select("*")
      .eq("user_id", uid)
      .order("session_date", { ascending: false })
      .limit(20),
  ]);

  const gymIds = [...new Set((sessionsRes.data ?? []).map((s) => s.gym_id).filter(Boolean) as string[])];
  const gymsRes = gymIds.length
    ? await supabase.from("gyms").select("id, name").in("id", gymIds)
    : { data: [] as { id: string; name: string }[] };
  const gyms = new Map((gymsRes.data ?? []).map((g) => [g.id, g.name]));

  return {
    profile: profileRes.data,
    sessions: (sessionsRes.data ?? []).map((s) => ({ ...s, gymName: s.gym_id ? gyms.get(s.gym_id) : undefined })),
  };
}

function Perfil() {
  const { data, isLoading } = useQuery({ queryKey: ["profile"], queryFn: fetchProfile });
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  async function signOut() {
    await queryClient.cancelQueries();
    queryClient.clear();
    await supabase.auth.signOut();
    navigate({ to: "/login", replace: true });
  }

  const profile = data?.profile;
  const sessions = data?.sessions ?? [];
  const totalMin = sessions.reduce((acc, s) => acc + (s.duration_minutes ?? 0), 0);

  return (
    <div className="min-h-screen bg-background pb-24">
      <main className="mx-auto max-w-md px-4 pt-6">
        <div className="flex items-center gap-4">
          <div className="size-20 overflow-hidden rounded-full bg-surface-2">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={profile.full_name ?? "Perfil"} className="size-full object-cover" />
            ) : null}
          </div>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-bold">
              {isLoading ? "Carregando..." : (profile?.full_name ?? profile?.username ?? "Atleta")}
            </h1>
            <p className="truncate text-sm text-muted-foreground">@{profile?.username ?? "—"}</p>
            <span
              className={`mt-2 inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold ${beltClass(profile?.belt)}`}
            >
              Faixa {profile?.belt ?? "—"}
            </span>
          </div>
          <button
            onClick={signOut}
            aria-label="Sair"
            className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
          >
            <LogOut className="size-5" />
          </button>
        </div>

        <dl className="mt-6 grid grid-cols-2 gap-3">
          {[
            ["Equipe", profile?.team],
            ["Professor", profile?.professor],
            ["Cidade", profile?.city],
            ["Peso", profile?.weight],
          ].map(([label, value]) => (
            <div key={label as string} className="card-elevated rounded-2xl p-3">
              <dt className="text-[11px] uppercase tracking-wide text-muted-foreground">{label}</dt>
              <dd className="mt-1 truncate text-sm font-medium">{(value as string) || "—"}</dd>
            </div>
          ))}
        </dl>

        <div className="mt-3 grid grid-cols-2 gap-3">
          <div className="card-elevated rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Treinos</p>
            <p className="mt-1 text-2xl font-bold text-brand">{sessions.length}</p>
          </div>
          <div className="card-elevated rounded-2xl p-3">
            <p className="text-[11px] uppercase tracking-wide text-muted-foreground">Horas no tatame</p>
            <p className="mt-1 text-2xl font-bold text-brand">{Math.round(totalMin / 60)}h</p>
          </div>
        </div>

        <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
          Histórico de treinos
        </h2>
        <ul className="mt-3 space-y-2">
          {sessions.length === 0 && !isLoading && (
            <li className="rounded-2xl bg-surface p-4 text-sm text-muted-foreground">
              Nenhum treino registrado ainda.
            </li>
          )}
          {sessions.map((s) => (
            <li key={s.id} className="card-elevated flex items-center justify-between rounded-2xl p-4">
              <div className="min-w-0">
                <p className="truncate text-sm font-medium">{s.gymName ?? "Academia"}</p>
                <p className="text-xs text-muted-foreground">
                  {new Date(s.session_date).toLocaleDateString("pt-BR")} · {s.session_type ?? "Treino"}
                </p>
              </div>
              <span className="text-xs text-muted-foreground">
                {s.duration_minutes}min · {timeAgo(s.created_at)}
              </span>
            </li>
          ))}
        </ul>
      </main>

      <BottomNav />
    </div>
  );
}
