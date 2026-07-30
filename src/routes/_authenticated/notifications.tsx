import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Bell, Medal, MessageCircle, UserPlus, Heart, Trophy, Check } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";

const TABS = ["Todas", "Menções"] as const;
type Tab = (typeof TABS)[number];

type NotificationType = "like" | "comment" | "follow" | "achievement" | "challenge";

type Notification = {
  id: string;
  type: NotificationType;
  actor: string;
  text: string;
  time: string;
  read: boolean;
  avatarUrl?: string;
};

const NOTIFICATIONS: Notification[] = [
  {
    id: "1",
    type: "like",
    actor: "João Santos",
    text: "curtiu seu treino",
    time: "agora",
    read: false,
    avatarUrl: "https://ui-avatars.com/api/?name=João+Santos&background=random&color=fff",
  },
  {
    id: "2",
    type: "comment",
    actor: "Maria Almeida",
    text: "comentou: \"Treino pesado! \"",
    time: "5m",
    read: false,
    avatarUrl: "https://ui-avatars.com/api/?name=Maria+Almeida&background=random&color=fff",
  },
  {
    id: "3",
    type: "achievement",
    actor: "Sistema",
    text: "Você conquistou a medalha \"30 dias seguidos\"",
    time: "10m",
    read: false,
  },
  {
    id: "4",
    type: "follow",
    actor: "Novo seguidor",
    text: "Lucas Lima começou a seguir você",
    time: "15m",
    read: true,
    avatarUrl: "https://ui-avatars.com/api/?name=Lucas+Lima&background=random&color=fff",
  },
  {
    id: "5",
    type: "challenge",
    actor: "Desafio",
    text: "Desafio concluído: Semana Sem Faltar",
    time: "20m",
    read: true,
  },
  {
    id: "6",
    type: "like",
    actor: "Carlos Mendes",
    text: "curtiu sua foto",
    time: "1h",
    read: true,
    avatarUrl: "https://ui-avatars.com/api/?name=Carlos+Mendes&background=random&color=fff",
  },
  {
    id: "7",
    type: "comment",
    actor: "Ana Paula",
    text: "comentou: \"Vamos treinar juntos! \"",
    time: "2h",
    read: true,
    avatarUrl: "https://ui-avatars.com/api/?name=Ana+Paula&background=random&color=fff",
  },
];

const TYPE_ICON: Record<NotificationType, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  achievement: Medal,
  challenge: Trophy,
};

function NotificationItem({ notification }: { notification: Notification }) {
  const Icon = TYPE_ICON[notification.type];
  const isSystem = notification.type === "achievement" || notification.type === "challenge";

  return (
    <div className="flex items-start gap-3 py-3.5">
      <div className="relative shrink-0">
        {notification.avatarUrl && !isSystem ? (
          <img
            src={notification.avatarUrl}
            alt={notification.actor}
            className="size-11 rounded-full object-cover ring-1 ring-white/10"
          />
        ) : (
          <div className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand ring-1 ring-white/10">
            <Icon className="size-5" strokeWidth={1.8} />
          </div>
        )}
        {!notification.read && (
          <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-background" />
        )}
      </div>

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground">
          <span className="font-semibold">{notification.actor}</span>{" "}
          <span className="text-muted-foreground">{notification.text}</span>
        </p>
        <span className="mt-0.5 text-[11px] text-muted-foreground">{notification.time}</span>
      </div>
    </div>
  );
}

function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("Todas");
  const [items, setItems] = useState(NOTIFICATIONS);

  const filtered = items.filter((n) => (tab === "Menções" ? n.type === "comment" || n.type === "like" : true));

  function markAllAsRead() {
    setItems((prev) => prev.map((n) => ({ ...n, read: true })));
  }

  return (
    <div className="min-h-screen bg-background pb-28">
      <main className="mx-auto max-w-md px-4 pt-6">
        <h1 className="text-center font-sans text-lg font-semibold tracking-tight">Notificações</h1>

        <div className="mt-4 flex gap-2">
          {TABS.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setTab(t)}
              className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                tab === t
                  ? "bg-brand text-brand-foreground"
                  : "border border-white/10 bg-surface text-muted-foreground hover:text-foreground"
              }`}
            >
              {t}
            </button>
          ))}
        </div>

        <section className="mt-4">
          {filtered.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </section>

        <div className="mt-6 flex justify-center">
          <button
            type="button"
            onClick={markAllAsRead}
            className="flex items-center gap-1.5 text-xs font-semibold text-brand transition-colors hover:text-brand/80"
          >
            <Check className="size-3.5" strokeWidth={2.5} />
            Marcar todas como lidas
          </button>
        </div>
      </main>

      <BottomNav />
    </div>
  );
}

export const Route = createFileRoute("/_authenticated/notifications")({
  head: () => ({
    meta: [
      { title: "Notificações | Flow Jiu-Jitsu" },
      { name: "description", content: "Acompanhe suas notificações e menções no Flow Jiu-Jitsu." },
      { property: "og:title", content: "Notificações | Flow Jiu-Jitsu" },
      { property: "og:description", content: "Acompanhe suas notificações e menções no Flow Jiu-Jitsu." },
    ],
  }),
  component: NotificationsPage,
});
