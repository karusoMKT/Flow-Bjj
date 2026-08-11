import { CalendarDays, Link2 as LinkIcon, MapPin, Medal, Play, Trophy, Zap } from "lucide-react";
import { PostActions } from "@/components/PostActions";
import { EventInterest } from "@/components/EventInterest";
import { ShareButton } from "@/components/ShareButton";
import { ChampionBadge } from "@/components/ChampionBadge";
import { socialCounts } from "@/lib/social";
import { timeAgo, beltClass } from "@/lib/feed";
import { parseCompetition, placementTone } from "@/lib/competition";

export type FeedPost = {
  id: string;
  content: string | null;
  image_url: string | null;
  likes_count: number | null;
  created_at: string;
  profiles?: {
    full_name: string | null;
    username: string | null;
    avatar_url: string | null;
    belt: string | null;
    is_weekly_champion?: boolean | null;
  } | null;
  workouts?: {
    duration_minutes: number | null;
    training_type: string | null;
    intensity: string | null;
    location?: string | null;
  } | null;
  likes?: { user_id: string }[] | null;
  comments?: { id: string }[] | null;
  post_type?: string | null;
  event_title?: string | null;
  event_date?: string | null;
  event_location?: string | null;
  location?: string | null;
  link?: string | null;
};


export function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? "")
    .join("");
}

export function AvatarBubble({
  src,
  name,
  className = "size-10",
}: {
  src?: string | null;
  name: string;
  className?: string;
}) {
  if (src) {
    return (
      <img
        src={src}
        alt={name}
        loading="lazy"
        className={`${className} shrink-0 rounded-full object-cover`}
      />
    );
  }
  return (
    <span
      aria-label={name}
      className={`${className} grid shrink-0 place-items-center rounded-full bg-surface-2 text-sm font-bold text-brand`}
    >
      {initialsOf(name) || "?"}
    </span>
  );
}

export function PostCardSkeleton() {
  return (
    <li className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
      <div className="flex items-start gap-3 p-3.5">
        <div className="size-10 shrink-0 animate-pulse rounded-full bg-white/10" />
        <div className="flex-1 space-y-2">
          <div className="h-3 w-1/3 animate-pulse rounded bg-white/10" />
          <div className="h-3 w-1/2 animate-pulse rounded bg-white/5" />
        </div>
      </div>
      <div className="h-40 w-full animate-pulse bg-white/[0.04]" />
    </li>
  );
}

export function PostCard({ post, currentUserId }: { post: FeedPost; currentUserId?: string | null }) {
  const author = post.profiles;
  const name = author?.full_name ?? author?.username ?? "Atleta";
  const workout = post.workouts;
  const comp = parseCompetition(post.content);
  const social = socialCounts(post, currentUserId);
  const champion = !!author?.is_weekly_champion;

  if (post.post_type === "event") {
    return (
      <EventCard post={post} currentUserId={currentUserId} name={name} social={social} />
    );
  }

  if (post.post_type === "social") {
    return <SocialCard post={post} currentUserId={currentUserId} name={name} social={social} />;
  }

  if (post.post_type === "promotion") {
    return <PromotionCard post={post} currentUserId={currentUserId} name={name} social={social} />;
  }



  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-surface ${
        champion
          ? "border-[oklch(0.85_0.16_92)]/50 shadow-[0_0_0_1px_oklch(0.85_0.16_92/0.12),0_0_24px_-8px_oklch(0.85_0.16_92/0.45)]"
          : comp
            ? "border-[oklch(0.85_0.16_92)]/35 shadow-[0_0_0_1px_oklch(0.85_0.16_92/0.08)]"
            : "border-white/5"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5">
        {champion ? (
          <span className="shrink-0 rounded-full bg-gradient-to-tr from-[oklch(0.85_0.16_92)] via-[oklch(0.92_0.12_95)] to-[oklch(0.7_0.14_60)] p-[2px]">
            <span className="block rounded-full border-2 border-surface">
              <AvatarBubble src={author?.avatar_url} name={name} />
            </span>
          </span>
        ) : (
          <AvatarBubble src={author?.avatar_url} name={name} />
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <ChampionBadge active={champion} />
            {comp && <Medal className="size-4 shrink-0 text-[oklch(0.85_0.16_92)]" />}
            {author?.belt && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${beltClass(author.belt)}`}>
                {author.belt}
              </span>
            )}
          </div>
          {comp ? (
            <div className="mt-1">
              <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
                <Trophy className="size-4 text-[oklch(0.85_0.16_92)]" />
                <span className="truncate">{comp.event}</span>
              </p>
              {comp.placement && (
                <span
                  className={`mt-1.5 inline-block rounded-full border px-2.5 py-1 text-[11px] font-black uppercase tracking-wide ${placementTone(
                    comp.placement,
                  )}`}
                >
                  {comp.placement}
                </span>
              )}
              {comp.summary && (
                <p className="mt-2 text-sm leading-snug text-foreground">{comp.summary}</p>
              )}
              {comp.location && (
                <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5" /> {comp.location}
                </p>
              )}
            </div>
          ) : (
            <>
              {workout ? (
                <p className="truncate text-xs text-muted-foreground">
                  Treinou {workout.duration_minutes} min
                  {workout.training_type ? ` · ${workout.training_type}` : ""}
                </p>
              ) : null}
              {workout?.location && (
                <p className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                  <MapPin className="size-3.5 shrink-0 text-brand" />
                  <span className="truncate">{workout.location}</span>
                </p>
              )}
              {post.content && <p className="mt-1 text-sm leading-snug text-foreground">{post.content}</p>}

            </>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
      </div>


      {post.image_url && (
        <img src={post.image_url} alt={`Treino de ${name}`} loading="lazy" className="h-60 w-full object-cover" />
      )}

      <div className="flex items-center gap-2 px-3.5 py-3">
        {workout && (
          <>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
              <Play className="size-3.5" /> {workout.duration_minutes} min
            </span>
            {workout.intensity && (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-brand/10 px-2.5 py-1 text-[11px] font-semibold text-brand">
                <Zap className="size-3.5" /> {workout.intensity}
              </span>
            )}
          </>
        )}
        {currentUserId && author && post.id ? (
          <div className="ml-auto">
            <ShareButton
              payload={{
                kind: "workout",
                title: comp ? comp.event : workout?.training_type ? `Treino de ${workout.training_type}` : "Treino registrado",
                description: comp ? (comp.placement ?? comp.summary ?? null) : (post.content ?? null),
                stats: [
                  ...(workout?.duration_minutes ? [{ label: "Minutos", value: String(workout.duration_minutes) }] : []),
                  ...(workout?.intensity ? [{ label: "Intensidade", value: workout.intensity }] : []),
                  ...(workout?.location || comp?.location
                    ? [{ label: "Local", value: (workout?.location ?? comp?.location) as string }]
                    : []),
                ],
                athlete: name,
                belt: author?.belt ?? null,
                avatarUrl: author?.avatar_url ?? null,
              }}
              showLabel={false}
            />
          </div>
        ) : null}
      </div>


      <PostActions
        postId={post.id}
        userId={currentUserId}
        initialLiked={social.liked}
        initialLikeCount={social.likeCount || post.likes_count || 0}
        initialCommentCount={social.commentCount}
        renderAvatar={(src, name) => <AvatarBubble src={src} name={name} className="size-7" />}
      />
    </li>
  );
}

function EventCard({
  post,
  currentUserId,
  name,
  social,
}: {
  post: FeedPost;
  currentUserId?: string | null;
  name: string;
  social: { liked: boolean; likeCount: number; commentCount: number };
}) {
  const author = post.profiles;
  const eventDate = post.event_date ? new Date(post.event_date) : null;
  const day = eventDate ? eventDate.toLocaleDateString("pt-BR", { day: "2-digit" }) : null;
  const month = eventDate
    ? eventDate.toLocaleDateString("pt-BR", { month: "short" }).replace(".", "").toUpperCase()
    : null;
  const hour = eventDate
    ? eventDate.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })
    : null;

  return (
    <li className="overflow-hidden rounded-2xl border border-brand/40 bg-surface shadow-[0_0_0_1px_var(--color-brand)/0.08,0_0_28px_-14px_var(--color-brand)]">
      <div className="flex items-center gap-2 border-b border-brand/20 bg-brand/[0.07] px-3.5 py-2">
        <CalendarDays className="size-4 text-brand" />
        <span className="text-[11px] font-black uppercase tracking-widest text-brand">Evento</span>
        <span className="ml-auto text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
      </div>

      {post.image_url && (
        <img
          src={post.image_url}
          alt={post.event_title ?? "Evento"}
          loading="lazy"
          className="h-52 w-full object-cover"
        />
      )}

      <div className="flex items-start gap-3 p-3.5">
        {eventDate && (
          <div className="relative shrink-0 overflow-hidden rounded-xl border border-brand/30 bg-brand/10 text-center">
            <span className="block bg-brand px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-brand-foreground">
              {month}
            </span>
            <span className="block px-3 py-1.5 text-2xl font-black leading-none text-foreground">{day}</span>
            {hour && <span className="block pb-1.5 text-[10px] font-semibold text-brand">{hour}</span>}
          </div>
        )}
        <div className="min-w-0 flex-1">
          <p className="text-base font-bold leading-snug text-foreground">{post.event_title ?? "Evento"}</p>
          {post.event_location && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-brand" />
              <span className="truncate">{post.event_location}</span>
            </p>
          )}
          {post.content && <p className="mt-2 text-sm leading-snug text-foreground">{post.content}</p>}
          <div className="mt-2.5 flex items-center gap-2">
            <AvatarBubble src={author?.avatar_url} name={name} className="size-6" />
            <span className="truncate text-xs text-muted-foreground">por {name}</span>
            <ChampionBadge active={!!author?.is_weekly_champion} className="size-3.5" />
          </div>
        </div>
      </div>

      <EventInterest postId={post.id} userId={currentUserId} />

      <PostActions
        postId={post.id}
        userId={currentUserId}
        initialLiked={social.liked}
        initialLikeCount={social.likeCount || post.likes_count || 0}
        initialCommentCount={social.commentCount}
        renderAvatar={(src, name) => <AvatarBubble src={src} name={name} className="size-7" />}
      />
    </li>
  );
}

function SocialCard({
  post,
  currentUserId,
  name,
  social,
}: {
  post: FeedPost;
  currentUserId?: string | null;
  name: string;
  social: { liked: boolean; likeCount: number; commentCount: number };
}) {
  const author = post.profiles;
  const champion = !!author?.is_weekly_champion;

  return (
    <li className="overflow-hidden rounded-2xl border border-white/5 bg-surface">
      <div className="flex items-start gap-3 p-3.5">
        <AvatarBubble src={author?.avatar_url} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{name}</p>
            <ChampionBadge active={champion} />
            {author?.belt && (
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-semibold ${beltClass(author.belt)}`}>
                {author.belt}
              </span>
            )}
          </div>
          {post.content && (
            <p className="mt-1.5 whitespace-pre-wrap text-sm leading-snug text-foreground">{post.content}</p>
          )}
          {post.location && (
            <p className="mt-1.5 flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="size-3.5 shrink-0 text-brand" />
              <span className="truncate">{post.location}</span>
            </p>
          )}
          {post.link && (
            <a
              href={post.link}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-2 flex items-center gap-2 rounded-xl border border-brand/30 bg-brand/[0.07] px-3 py-2 text-xs font-semibold text-brand transition-colors hover:bg-brand/15"
            >
              <LinkIcon className="size-3.5 shrink-0" />
              <span className="truncate">{post.link}</span>
            </a>
          )}
        </div>
        <span className="shrink-0 text-xs text-muted-foreground">{timeAgo(post.created_at)}</span>
      </div>

      {post.image_url && (
        <img src={post.image_url} alt={`Publicação de ${name}`} loading="lazy" className="w-full object-cover" />
      )}

      <PostActions
        postId={post.id}
        userId={currentUserId}
        initialLiked={social.liked}
        initialLikeCount={social.likeCount || post.likes_count || 0}
        initialCommentCount={social.commentCount}
        renderAvatar={(src, n) => <AvatarBubble src={src} name={n} className="size-7" />}
      />
    </li>
  );
}
