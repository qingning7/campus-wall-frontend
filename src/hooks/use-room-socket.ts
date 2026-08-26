import { useEffect, useRef, useState } from "react";
import { getSocket } from "@/lib/socket";

type UseRoomSocketOptions = {
  roomId?: string;
  enabled: boolean;
}

export function useRoomSocket({ roomId, enabled }: UseRoomSocketOptions) {
  useEffect(() => {
    if (!roomId || !enabled) {
      return;
    }

    const socket = getSocket();

    function joinRoom() {
      socket.emit("join-room", { roomId });
    }

    socket.on("connect", joinRoom);

    if (socket.connected) {
      joinRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", joinRoom);
      socket.disconnect();
    };
  }, [roomId, enabled]);

  return getSocket();
}