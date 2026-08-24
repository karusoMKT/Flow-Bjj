import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Bell, Check, Heart, Medal, MessageCircle, Trophy, UserCheck, UserPlus } from "lucide-react";
import { BottomNav } from "@/components/BottomNav";
import { PushPermissionPrompt } from "@/components/PushPermissionPrompt";
import { ConnectionButton } from "@/components/ConnectionButton";
import {
  avatarFor,
  displayName,
  fetchNotifications,
  markAllNotificationsRead,
  timeAgo,
  useCurrentUserId,
  useInboxRealtime,
  type NotificationRow,
} from "@/lib/inbox";

const TABS = ["Todas", "Menções"] as const;
type Tab = (typeof TABS)[number];

const TYPE_ICON: Record<string, React.ElementType> = {
  like: Heart,
  comment: MessageCircle,
  follow: UserPlus,
  connection_request: UserPlus,
  connection_accepted: UserCheck,
  achievement: Medal,
  challenge: Trophy,
  system: Bell,
};


function NotificationItem({ notification }: { notification: NotificationRow }) {
  const Icon = TYPE_ICON[notification.type] ?? Bell;
  const actorName = notification.actor ? displayName(notification.actor) : "Flow";
  const hasActor = Boolean(notification.actor);

  const avatar = (
    <div className="relative shrink-0">
      {hasActor ? (
        <img
          src={notification.actor?.avatar_url || avatarFor(actorName)}
          alt={actorName}
          loading="lazy"
          className="size-11 rounded-full object-cover ring-1 ring-white/10"
        />
      ) : (
        <div className="grid size-11 place-items-center rounded-full bg-brand/10 text-brand ring-1 ring-white/10">
          <Icon className="size-5" strokeWidth={1.8} />
        </div>
      )}
      {!notification.is_read && (
        <span className="absolute -right-0.5 -top-0.5 size-2.5 rounded-full bg-brand ring-2 ring-background" />
      )}
    </div>
  );

  return (
    <div className="flex items-start gap-3 py-3.5">
      {notification.actor_id ? (
        <Link to="/atleta/$userId" params={{ userId: notification.actor_id }}>
          {avatar}
        </Link>
      ) : (
        avatar
      )}

      <div className="min-w-0 flex-1">
        <p className="text-[13px] leading-snug text-foreground">
          {hasActor && <span className="font-semibold">{actorName} </span>}
          <span className="text-muted-foreground">{notification.content}</span>
        </p>
        <span className="mt-0.5 text-[11px] text-muted-foreground">{timeAgo(notification.created_at)}</span>
        {notification.type === "connection_request" && notification.actor_id && (
          <div className="mt-2">
            <ConnectionButton targetId={notification.actor_id} />
          </div>
        )}
      </div>
    </div>
  );

}

function NotificationsPage() {
  const [tab, setTab] = useState<Tab>("Todas");
  const queryClient = useQueryClient();
  const { data: userId } = useCurrentUserId();
  useInboxRealtime(userId);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["notifications"],
    queryFn: fetchNotifications,
  });

  const filtered = items.filter((n) => (tab === "Menções" ? n.type === "comment" || n.type === "like" : true));

  async function markAllAsRead() {
    await markAllNotificationsRead();
    queryClient.invalidateQueries({ queryKey: ["notifications"] });
    queryClient.invalidateQueries({ queryKey: ["notifications-unread"] });
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
          {isLoading ? (
            <div className="divide-y divide-white/5">
              {[0, 1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3.5">
                  <div className="size-11 animate-pulse rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 w-2/3 animate-pulse rounded bg-white/5" />
                    <div className="h-2 w-16 animate-pulse rounded bg-white/5" />
                  </div>
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-12 text-center">
              <p className="text-sm text-muted-foreground">Nenhuma notificação por aqui.</p>
              <Link to="/home" className="mt-2 inline-block text-xs font-semibold text-brand">
                Voltar ao feed
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-white/5">
              {filtered.map((n) => (
                <NotificationItem key={n.id} notification={n} />
              ))}
            </div>
          )}
        </section>

        {items.some((n) => !n.is_read) && (
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
        )}
      </main>

      <PushPermissionPrompt />

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
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NotificationsPage,
});
