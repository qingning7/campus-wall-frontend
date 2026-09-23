import { useEffect } from "react";
import { getSocket } from "@/lib/socket";

type UseRoomSocketOptions = {
  roomId?: string;
  enabled: boolean;
};

export function useRoomSocket({ roomId, enabled }: UseRoomSocketOptions) {
  useEffect(() => {
    if (!roomId || !enabled) {
      return;
    }

    const socket = getSocket();

    function joinRoom() {
      socket.emit("join-room", { roomId });
    }

    function contentChanged(payload: { roomId: string }) {
      // Reload history after administrative changes, including room deletion.
      if (payload.roomId === roomId) window.location.reload();
    }
    function disconnected(reason: string) {
      if (reason === "io server disconnect") window.location.reload();
    }
    socket.on("room-content-changed", contentChanged);
    socket.on("disconnect", disconnected);
    socket.on("connect", joinRoom);

    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("room-content-changed", contentChanged);
      socket.off("disconnect", disconnected);
      socket.off("connect", joinRoom);
      socket.disconnect();
    };
  }, [roomId, enabled]);

  return getSocket();
}
