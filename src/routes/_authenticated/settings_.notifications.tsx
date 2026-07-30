import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

type Pref = { id: string; label: string; description: string; defaultOn: boolean };

const GROUPS: { title: string; items: Pref[] }[] = [
  {
    title: "Atividade",
    items: [
      { id: "likes", label: "Curtidas", description: "Quando alguém curtir seu treino", defaultOn: true },
      { id: "comments", label: "Comentários", description: "Respostas e menções nos seus posts", defaultOn: true },
      { id: "follows", label: "Novos seguidores", description: "Quando alguém começar a te seguir", defaultOn: true },
    ],
  },
  {
    title: "Gamificação",
    items: [
      { id: "achievements", label: "Conquistas", description: "Novos emblemas desbloqueados", defaultOn: true },
      { id: "challenges", label: "Desafios", description: "Progresso e prazos dos desafios", defaultOn: false },
      { id: "ranking", label: "Ranking", description: "Mudanças na sua posição semanal", defaultOn: false },
    ],
  },
  {
    title: "Lembretes",
    items: [
      { id: "checkin", label: "Lembrete de check-in", description: "Aviso diário para registrar o treino", defaultOn: true },
      { id: "email", label: "Resumo por e-mail", description: "Resumo semanal da sua evolução", defaultOn: false },
    ],
  },
];

function Toggle({ on, onChange, label }: { on: boolean; onChange: () => void; label: string }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={onChange}
      className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${on ? "bg-brand" : "bg-surface-2"}`}
    >
      <span
        className={`absolute top-0.5 size-5 rounded-full bg-background transition-transform ${
          on ? "translate-x-[22px]" : "translate-x-0.5"
        }`}
      />
    </button>
  );
}

function NotificationSettingsPage() {
  const [state, setState] = useState<Record<string, boolean>>(() =>
    Object.fromEntries(GROUPS.flatMap((g) => g.items.map((i) => [i.id, i.defaultOn]))),
  );

  return (
    <div className="min-h-screen bg-background pb-28">
      <header className="mx-auto flex max-w-md items-center gap-3 px-4 pt-6">
        <Link
          to="/settings"
          className="rounded-xl bg-surface p-2.5 text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="size-5" />
        </Link>
        <h1 className="font-sans text-lg font-semibold tracking-tight">Notificações</h1>
      </header>

      <main className="mx-auto max-w-md px-4 pt-6">
        <p className="text-[13px] text-muted-foreground">
          Escolha o que você quer receber. Para ver as notificações recebidas, abra o{" "}
          <Link to="/notifications" className="font-semibold text-brand">
            feed de notificações
          </Link>
          .
        </p>

        {GROUPS.map((group) => (
          <section key={group.title} className="mt-6">
            <h2 className="mb-2 px-1 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
              {group.title}
            </h2>
            <div className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
              {group.items.map((item, index) => (
                <div
                  key={item.id}
                  className={`flex items-center gap-3 px-4 py-3.5 ${
                    index !== group.items.length - 1 ? "border-b border-white/5" : ""
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-[14px] font-medium text-foreground">{item.label}</p>
                    <p className="text-[12px] text-muted-foreground">{item.description}</p>
                  </div>
                  <Toggle
                    label={item.label}
                    on={state[item.id]}
                    onChange={() => setState((prev) => ({ ...prev, [item.id]: !prev[item.id] }))}
                  />
                </div>
              ))}
            </div>
          </section>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/settings_/notifications")({
  head: () => ({
    meta: [
      { title: "Preferências de notificação | Flow Jiu-Jitsu" },
      { name: "description", content: "Escolha quais notificações você quer receber no Flow Jiu-Jitsu." },
      { property: "og:title", content: "Preferências de notificação | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Escolha quais notificações você quer receber no Flow Jiu-Jitsu." },
    ],
  }),
  component: NotificationSettingsPage,
});
