import { useEffect, useRef, useState } from "react";
import { getRoomStrokes, saveRoomStroke } from "@/api/rooms";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";
import { Wall, getCanvasPoint } from "@/canvas/wall";
import { DEFAULT_BRUSH, type WallPoint } from "@/canvas/stroke";
import {
  appendStrokeOnce,
  removeRemoteLiveStrokeByAuthorAndPoints,
  type RemoteLiveStroke,
  type RemoteStrokePointPayload,
  upsertRemoteLiveStroke,
} from "@/utils/draw";
import { useRoomCanvas } from "@/contexts/RoomCanvasContext";

const WALL_STROKE_COLOR = "#111827";

type DrawBoardProps = {
  roomId?: string;
  hasRoomAccess: boolean;
};

export function DrawBoard({ roomId, hasRoomAccess }: DrawBoardProps) {
  const { currentUser } = useAuth();
  const { activeTool, registerCanvasActions } = useRoomCanvas();
  const [strokes, setStrokes] = useState<WallPoint[][]>([]);
  const [loadingStrokes, setLoadingStrokes] = useState(true);
  const [currentStroke, setCurrentStroke] = useState<WallPoint[]>([]);
  const [remoteLiveStrokes, setRemoteLiveStrokes] = useState<
    RemoteLiveStroke[]
  >([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<WallPoint[]>([]);
  const activeStrokeIdRef = useRef<string | null>(null);
  const finishedStrokeIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!roomId || !hasRoomAccess || !currentUser) {
      setLoadingStrokes(false);
      setStrokes([]);
      setRemoteLiveStrokes([]);
      setCurrentStroke([]);
      finishedStrokeIdsRef.current.clear();
      return;
    }

    const socket = getSocket();
    const currentUserId = currentUser.id;

    function handleRoomJoined(payload: { roomId: string }) {
      console.log("socket joined room:", payload.roomId);
    }

    function handleRoomStrokePoint(payload: RemoteStrokePointPayload) {
      if (
        payload.authorId === currentUserId ||
        finishedStrokeIdsRef.current.has(payload.strokeId)
      ) {
        return;
      }

      setRemoteLiveStrokes((prev) => upsertRemoteLiveStroke(prev, payload));
    }

    function handleRoomStroke(stroke: {
      authorId: string;
      strokeId?: string | null;
      points: WallPoint[];
    }) {
      if (stroke.strokeId) {
        finishedStrokeIdsRef.current.add(stroke.strokeId);
        setRemoteLiveStrokes((prev) =>
          prev.filter((item) => item.strokeId !== stroke.strokeId),
        );
      } else {
        setRemoteLiveStrokes((prev) =>
          removeRemoteLiveStrokeByAuthorAndPoints(
            prev,
            stroke.authorId,
            stroke.points,
          ),
        );
      }

      setStrokes((prev) => appendStrokeOnce(prev, stroke.points));
    }

    socket.on("room-joined", handleRoomJoined);
    socket.on("room-stroke", handleRoomStroke);
    socket.on("room-stroke-point", handleRoomStrokePoint);

    return () => {
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-stroke", handleRoomStroke);
      socket.off("room-stroke-point", handleRoomStrokePoint);
    };
  }, [roomId, hasRoomAccess, currentUser]);

  useEffect(() => {
    if (!roomId || !hasRoomAccess || !currentUser) {
      return;
    }

    let ignore = false;
    const nextRoomId = roomId;

    setLoadingStrokes(true);
    setStrokes([]);
    setRemoteLiveStrokes([]);
    setCurrentStroke([]);
    finishedStrokeIdsRef.current.clear();

    async function loadStrokes() {
      try {
        const data = await getRoomStrokes(nextRoomId);

        if (!ignore) {
          setStrokes(data.map((stroke) => stroke.points));
        }
      } catch (error) {
        if (!ignore) {
          console.error(
            error instanceof Error ? error.message : "加载涂鸦失败",
          );
        }
      } finally {
        if (!ignore) {
          setLoadingStrokes(false);
        }
      }
    }

    void loadStrokes();

    return () => {
      ignore = true;
    };
  }, [roomId, hasRoomAccess, currentUser]);

  async function persistStroke(strokeId: string | null, points: WallPoint[]) {
    if (!roomId || points.length < 2) {
      return;
    }

    try {
      await saveRoomStroke(roomId, {
        strokeId: strokeId ?? undefined,
        color: WALL_STROKE_COLOR,
        size: Math.round(DEFAULT_BRUSH.size ?? 14),
        points,
      });
    } catch (error) {
      console.error(error instanceof Error ? error.message : "保存涂鸦失败");
    }
  }

  useEffect(() => {
    if (!roomId || !hasRoomAccess || !currentUser) {
      registerCanvasActions(null);
      return;
    }

    const clear = () => {
      setStrokes([]);
      setRemoteLiveStrokes([]);
      setCurrentStroke([]);
      currentStrokeRef.current = [];
      activeStrokeIdRef.current = null;
      isDrawingRef.current = false;
      finishedStrokeIdsRef.current.clear();
    };

    registerCanvasActions({
      undo: () => {},
      redo: () => {},
      clear,
    });

    return () => {
      registerCanvasActions(null);
    };
  }, [roomId, hasRoomAccess, currentUser, registerCanvasActions]);

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
    if (activeTool !== "pen") {
      return;
    }

    const point = getCanvasPoint(event.nativeEvent, event.currentTarget);
    const strokeId = crypto.randomUUID();
    activeStrokeIdRef.current = strokeId;

    if (roomId) {
      getSocket().emit("room-stroke-point", {
        roomId,
        strokeId,
        point,
      });
    }

    isDrawingRef.current = true;
    currentStrokeRef.current = [point];
    setCurrentStroke([point]);

    event.currentTarget.setPointerCapture(event.pointerId);
  }

  function handlePointerMove(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;

    const point = getCanvasPoint(event.nativeEvent, event.currentTarget);
    const nextStroke = [...currentStrokeRef.current, point];
    const strokeId = activeStrokeIdRef.current;

    if (roomId && strokeId) {
      getSocket().emit("room-stroke-point", {
        roomId,
        strokeId,
        point,
      });
    }

    currentStrokeRef.current = nextStroke;
    setCurrentStroke(nextStroke);
  }

  function finishStroke(event: React.PointerEvent<HTMLCanvasElement>) {
    if (!isDrawingRef.current) return;

    isDrawingRef.current = false;

    const completedStroke = currentStrokeRef.current;
    const completedStrokeId = activeStrokeIdRef.current;

    currentStrokeRef.current = [];
    activeStrokeIdRef.current = null;
    setCurrentStroke([]);

    if (completedStroke.length >= 2) {
      setStrokes((prev) => appendStrokeOnce(prev, completedStroke));
      void persistStroke(completedStrokeId, completedStroke);
    }

    if (event.currentTarget.hasPointerCapture(event.pointerId)) {
      event.currentTarget.releasePointerCapture(event.pointerId);
    }
  }

  if (!roomId || !hasRoomAccess || !currentUser) {
    return null;
  }

  return (
    <section className="relative flex-1 min-w-0 overflow-hidden bg-background">
      {loadingStrokes && (
        <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-background/35">
          <p className="text-sm text-muted-foreground">加载中...</p>
        </div>
      )}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative shrink-0">
          <Wall
            strokes={strokes}
            liveStrokes={remoteLiveStrokes.map((stroke) => stroke.points)}
            currentStroke={currentStroke}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={finishStroke}
            onPointerLeave={finishStroke}
            onPointerCancel={finishStroke}
          />
        </div>
      </div>
    </section>
  );
}
