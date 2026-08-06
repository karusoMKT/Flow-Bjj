import { MapPin, Medal, Play, Trophy, Zap } from "lucide-react";
import { PostActions } from "@/components/PostActions";
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

  return (
    <li
      className={`overflow-hidden rounded-2xl border bg-surface ${
        comp ? "border-[oklch(0.85_0.16_92)]/35 shadow-[0_0_0_1px_oklch(0.85_0.16_92/0.08)]" : "border-white/5"
      }`}
    >
      <div className="flex items-start gap-3 p-3.5">
        <AvatarBubble src={author?.avatar_url} name={name} />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <p className="truncate text-sm font-semibold">{name}</p>
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
