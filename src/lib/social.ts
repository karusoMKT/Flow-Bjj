export const FEED_SELECT =
  "id, content, image_url, likes_count, created_at, post_type, event_title, event_date, event_location, profiles:user_id (full_name, username, avatar_url, belt, is_weekly_champion, account_type), workouts:workout_id (duration_minutes, training_type, intensity, location), likes (user_id), comments (id)";


export type SocialRow = {
  likes?: { user_id: string }[] | null;
  comments?: { id: string }[] | null;
};

export function socialCounts(row: SocialRow, userId?: string | null) {
  const likes = row.likes ?? [];
  return {
    likeCount: likes.length,
    liked: !!userId && likes.some((l) => l.user_id === userId),
    commentCount: (row.comments ?? []).length,
  };
}
