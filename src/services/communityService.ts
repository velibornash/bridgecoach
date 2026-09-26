/**
 * Community client (Sprint 60).
 *
 * Replaces `mockCommunityPosts`, a fixture whose `userId` values pointed at
 * fictional accounts and whose like counts were literal numbers in a file.
 */
import { apiFetchSafe } from "./api";

export interface CommunityAuthor {
  id: string;
  name: string;
  avatar: string;
  level: number;
}

/** The four kinds of post the feed filter understands. */
export type PostType = "achievement" | "lesson_completed" | "milestone" | "streak";

const POST_TYPES: readonly PostType[] = [
  "achievement",
  "lesson_completed",
  "milestone",
  "streak",
];

export function isPostType(value: unknown): value is PostType {
  return typeof value === "string" && POST_TYPES.includes(value as PostType);
}

export interface CommunityPost {
  id: string;
  body: string;
  /** Normalised to the filter's vocabulary; an untagged post is a milestone. */
  type: PostType;
  relatedType: string | null;
  relatedId: string | null;
  createdAt: string;
  author: CommunityAuthor;
  likes: number;
  likedByMe: boolean;
  comments: number;
}

export interface CommunityComment {
  id: string;
  body: string;
  createdAt: string;
  author: CommunityAuthor;
}

export async function fetchFeed(before?: string): Promise<{
  data: { posts: CommunityPost[]; nextCursor: string | null } | null;
  error: string | null;
  status: number;
}> {
  const query = before ? `?before=${encodeURIComponent(before)}` : "";
  const result = await apiFetchSafe<{ posts: CommunityPost[]; nextCursor: string | null }>(
    `/api/community${query}`,
  );
  if (!result.data) return { data: null, error: result.error, status: result.status };
  return {
    data: {
      posts: result.data.posts.map((p) => ({
        ...p,
        type: isPostType(p.type) ? p.type : "milestone",
      })),
      nextCursor: result.data.nextCursor,
    },
    error: null,
    status: result.status,
  };
}

export function createPost(body: string, type: PostType) {
  return apiFetchSafe<{ id: string }>("/api/community", {
    method: "POST",
    body: { body, type },
  });
}

export function toggleLike(postId: string) {
  return apiFetchSafe<{ liked: boolean; likes: number }>("/api/community/likes", {
    method: "POST",
    body: { postId },
  });
}

export function fetchComments(postId: string) {
  return apiFetchSafe<{ comments: CommunityComment[] }>(
    `/api/community/comments?postId=${encodeURIComponent(postId)}`,
  );
}

export function addComment(postId: string, body: string) {
  return apiFetchSafe<{ id: string }>("/api/community/comments", {
    method: "POST",
    body: { postId, body },
  });
}

export function deletePost(postId: string) {
  return apiFetchSafe(`/api/community?postId=${encodeURIComponent(postId)}`, { method: "DELETE" });
}
