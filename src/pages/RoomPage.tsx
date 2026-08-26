import { Link, useParams } from "react-router";
import { useEffect, useState } from "react";
import { getMyRooms } from "@/api/rooms";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoom } from "@/lib/room-access";
import { useRoomSocket } from "@/hooks/use-room-socket";
import { RoomChat } from "./room/chat";
import { DrawBoard } from "./room/draw-board";

export function RoomPage() {
  const { roomId } = useParams();
  const { currentUser } = useAuth();
  const [checkingRoomAccess, setCheckingRoomAccess] = useState(true);
  const [hasRoomAccess, setHasRoomAccess] = useState(false);

  useRoomSocket({
    roomId,
    enabled: Boolean(roomId && hasRoomAccess && currentUser),
  });
  
  useEffect(() => {
    if (!roomId || !currentUser) {
      setCheckingRoomAccess(false);
      setHasRoomAccess(false);
      return;
    }

    if (currentUser.school?.room?.id === roomId) {
      setHasRoomAccess(true);
      setCheckingRoomAccess(false);
      return;
    } // 优化进入学校公共房间的加载时间。私人房间需要请求 /api/rooms/mine 来确认权限，学校房间跳过 getMyRooms() 请求

    let ignore = false;

    async function checkRoomAccess() {
      setCheckingRoomAccess(true);

      try {
        const rooms = await getMyRooms();
        const allowed = canAccessRoom(roomId, currentUser, rooms);

        if (!ignore) {
          setHasRoomAccess(allowed);
        }
      } catch {
        if (!ignore) {
          setHasRoomAccess(false);
        }
      } finally {
        if (!ignore) {
          setCheckingRoomAccess(false);
        }
      }
    }

    void checkRoomAccess();

    return () => {
      ignore = true;
    };
  }, [roomId, currentUser]);
  // 房间权限检查时不渲染房间页面
  if (checkingRoomAccess) {
    return (
      <main className="flex h-[calc(100svh-3.5rem)] items-center justify-center bg-background text-foreground">
        <p className="text-sm text-muted-foreground">加载房间中...</p>
      </main>
    );
  }

  if (!hasRoomAccess) {
    return (
      <main className="flex h-[calc(100svh-3.5rem)] items-center justify-center bg-background text-foreground">
        <Link
          to="/"
          replace
          className="text-sm text-muted-foreground underline-offset-4 transition hover:text-foreground hover:underline"
        >
          似乎来到了错误页面，点击回到首页
        </Link>
      </main>
    );
  }

  return (
    <main className="flex h-[calc(100svh-3.5rem)] min-h-0 bg-background text-foreground">
      <DrawBoard roomId={roomId} hasRoomAccess={hasRoomAccess} />
      <RoomChat roomId={roomId} hasRoomAccess={hasRoomAccess} />
    </main>
  );
}
