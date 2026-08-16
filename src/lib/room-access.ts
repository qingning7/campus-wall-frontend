import type { AuthUser } from "@/api/auth";
import type { Room } from "@/api/rooms";

export function canAccessRoom(
  roomId: string | undefined,
  currentUser: AuthUser | null,
  rooms: Room[],
) {
  if (!roomId || !currentUser) {
    return false;
  }

  if (currentUser.school?.room?.id === roomId) {
    return true;
  }

  return rooms.some((room) => room.id === roomId);
}
