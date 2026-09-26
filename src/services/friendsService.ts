/**
 * Friends client (Sprint 60).
 *
 * Replaces `mockFriends`, ten invented people with fabricated XP and
 * "mutualFriends" numbers that referenced no graph at all.
 */
import { apiFetchSafe } from "./api";

export interface Friend {
  id: string;
  name: string;
  avatar: string;
  level: number;
  xp: number;
  country: string;
  achievements: number;
  mutualFriends: number;
  online: boolean;
  lastActive: string | null;
}

export interface IncomingRequest {
  id: string;
  name: string;
  avatar: string;
  level: number;
  country: string;
  requestedAt: string;
}

export interface OutgoingRequest {
  id: string;
  requestedAt: string;
}

export interface FriendsData {
  friends: Friend[];
  incoming: IncomingRequest[];
  outgoing: OutgoingRequest[];
}

export async function fetchFriends(): Promise<{
  data: FriendsData | null;
  error: string | null;
  status: number;
}> {
  const result = await apiFetchSafe<FriendsData>("/api/friends");
  return { data: result.data, error: result.data ? null : result.error, status: result.status };
}

export function sendFriendRequest(userId: string) {
  return apiFetchSafe("/api/friends", { method: "POST", body: { userId } });
}

export function respondToFriendRequest(userId: string, action: "accept" | "decline") {
  return apiFetchSafe("/api/friends", { method: "PATCH", body: { userId, action } });
}

export function removeFriend(userId: string) {
  return apiFetchSafe(`/api/friends?userId=${encodeURIComponent(userId)}`, { method: "DELETE" });
}
