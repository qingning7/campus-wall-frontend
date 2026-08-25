import { Link, useParams } from "react-router";
import { useEffect, useRef, useState } from "react";
import { PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  getMyRooms,
  getRoomMessages,
  getRoomStrokes,
  saveRoomStroke,
  sendRoomMessage,
  type ChatMessage,
} from "@/api/rooms";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoom } from "@/lib/room-access";
import { getSocket } from "@/lib/socket";
import { Wall, getCanvasPoint } from "@/canvas/wall";
import { DEFAULT_BRUSH, type WallPoint } from "@/canvas/stroke";

function appendMessageOnce(messages: ChatMessage[], message: ChatMessage) {
  const alreadyExists = messages.some((item) => item.id === message.id);

  if (alreadyExists) {
    return messages;
  }

  return [...messages, message];
}

function samePoint(a: WallPoint, b: WallPoint) {
  return (
    a.x === b.x && a.y === b.y && (a.pressure ?? 0.5) === (b.pressure ?? 0.5)
  );
}

function sameStroke(a: WallPoint[], b: WallPoint[]) {
  if (a.length !== b.length) {
    return false;
  }

  return a.every((point, index) => samePoint(point, b[index]!));
}

function appendStrokeOnce(strokes: WallPoint[][], stroke: WallPoint[]) {
  const alreadyExists = strokes.some((item) => sameStroke(item, stroke));

  if (alreadyExists) {
    return strokes;
  }

  return [...strokes, stroke];
}
// live stroke
type RemoteLiveStroke = {
  strokeId: string;
  authorId: string;
  points: WallPoint[];
};

function upsertRemoteLiveStroke(
  liveStrokes: RemoteLiveStroke[],
  payload: { strokeId: string; authorId: string; point: WallPoint },
) {
  const index = liveStrokes.findIndex(
    (item) => item.strokeId === payload.strokeId,
  );

  if (index === -1) {
    return [
      ...liveStrokes,
      {
        strokeId: payload.strokeId,
        authorId: payload.authorId,
        points: [payload.point],
      },
    ];
  }

  const current = liveStrokes[index]!;
  const lastPoint = current.points[current.points.length - 1];

  if (lastPoint && samePoint(lastPoint, payload.point)) {
    return liveStrokes;
  }

  return [
    ...liveStrokes.slice(0, index),
    {
      ...current,
      points: [...current.points, payload.point],
    },
    ...liveStrokes.slice(index + 1),
  ];
}

function removeRemoteLiveStrokeByAuthorAndPoints(
  liveStrokes: RemoteLiveStroke[],
  authorId: string,
  points: WallPoint[],
) {
  return liveStrokes.filter(
    (item) => !(item.authorId === authorId && sameStroke(item.points, points)),
  );
}

const WALL_STROKE_COLOR = "#111827";

export function RoomPage() {
  const { roomId } = useParams();
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [strokes, setStrokes] = useState<WallPoint[][]>([]);
  const [loadingStrokes, setLoadingStrokes] = useState(true);
  const [currentStroke, setCurrentStroke] = useState<WallPoint[]>([]);
  const isDrawingRef = useRef(false);
  const currentStrokeRef = useRef<WallPoint[]>([]);
  const { currentUser } = useAuth();
  const [checkingRoomAccess, setCheckingRoomAccess] = useState(true);
  const [hasRoomAccess, setHasRoomAccess] = useState(false);
  const [remoteLiveStrokes, setRemoteLiveStrokes] = useState<
    RemoteLiveStroke[]
  >([]);
  const activeStrokeIdRef = useRef<string | null>(null);
  const finishedStrokeIdsRef = useRef(new Set<string>());

  useEffect(() => {
    if (!roomId || !hasRoomAccess || !currentUser) {
      return;
    }

    const socket = getSocket();
    const currentUserId = currentUser.id;

    function joinCurrentRoom() {
      socket.emit("join-room", { roomId });
    }

    function handleRoomJoined(payload: { roomId: string }) {
      console.log("socket joined room:", payload.roomId);
    }

    function handleRoomError(payload: { message: string }) {
      setMessageError(payload.message);
    }

    function handleRoomMessage(message: ChatMessage) {
      setMessages((prev) => appendMessageOnce(prev, message));
    }

    function handleRoomStrokePoint(payload: {
      authorId: string;
      strokeId: string;
      point: WallPoint;
    }) {
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

    socket.on("connect", joinCurrentRoom);
    socket.on("room-joined", handleRoomJoined);
    socket.on("room-error", handleRoomError);
    socket.on("room-message", handleRoomMessage);
    socket.on("room-stroke", handleRoomStroke);
    socket.on("room-stroke-point", handleRoomStrokePoint);

    if (socket.connected) {
      joinCurrentRoom();
    } else {
      socket.connect();
    }

    return () => {
      socket.off("connect", joinCurrentRoom);
      socket.off("room-joined", handleRoomJoined);
      socket.off("room-error", handleRoomError);
      socket.off("room-message", handleRoomMessage);
      socket.off("room-stroke", handleRoomStroke);
      socket.off("room-stroke-point", handleRoomStrokePoint);
      socket.disconnect();
    };
  }, [roomId, hasRoomAccess, currentUser]);

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

  useEffect(() => {
    if (!roomId || !hasRoomAccess) {
      return;
    }

    let ignore = false; // ignore 表示过期信号

    async function loadMessages() {
      setLoadingMessages(true);

      try {
        const data = await getRoomMessages(roomId!);

        if (!ignore) {
          setMessages(data);
        } // 只有请求没过期才更新页面
      } catch (error) {
        if (!ignore) {
          setMessageError(
            error instanceof Error ? error.message : "加载消息失败",
          );
        }
      } finally {
        if (!ignore) {
          setLoadingMessages(false);
        }
      }
    }
    void loadMessages();

    return () => {
      ignore = true;
    };
  }, [roomId, hasRoomAccess]);

  useEffect(() => {
    if (!roomId || !hasRoomAccess) {
      setLoadingStrokes(false);
      setStrokes([]);
      setRemoteLiveStrokes([]);
      setCurrentStroke([]);
      finishedStrokeIdsRef.current.clear();
      return;
    }

    setLoadingStrokes(true);

    const nextRoomId = roomId;
    let ignore = false;

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
  }, [roomId, hasRoomAccess]);

  async function persistStroke(strokeId: string | null, points: WallPoint[]) {
    if (!roomId || points.length < 2) {
      return;
    }

    await saveRoomStroke(roomId, {
      strokeId: strokeId ?? undefined,
      color: WALL_STROKE_COLOR,
      size: Math.round(DEFAULT_BRUSH.size ?? 14),
      points,
    });
  }

  async function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!roomId || !currentUser) {
      return;
    }

    const content = messageText.trim();

    if (!content) {
      return;
    }

    const optimisticMessage: ChatMessage = {
      id: `optimistic-${Date.now()}`,
      content,
      createdAt: new Date().toISOString(),
      roomId,
      authorId: currentUser.id,
      author: {
        id: currentUser.id,
        name: currentUser.name,
      },
    };

    setMessageText("");
    setMessageError("");
    setMessages((prev) => appendMessageOnce(prev, optimisticMessage));

    try {
      const sentMessage = await sendRoomMessage(roomId, { content });

      setMessages((prev) => {
        const withoutOptimisticMessage = prev.filter(
          (message) => message.id !== optimisticMessage.id,
        );
        return appendMessageOnce(withoutOptimisticMessage, sentMessage);
      });
    } catch (error) {
      setMessages((prev) =>
        prev.filter((message) => message.id !== optimisticMessage.id),
      );
      setMessageText(content);
      setMessageError(error instanceof Error ? error.message : "发送消息失败");
    }
  }

  function handlePointerDown(event: React.PointerEvent<HTMLCanvasElement>) {
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
      {/*画布*/}
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

      <aside
        className={
          chatOpen
            ? "relative flex w-80 shrink-0 flex-col overflow-hidden border-l bg-card transition-[width] duration-200 ease-linear"
            : "relative flex w-12 shrink-0 flex-col overflow-hidden border-l bg-card transition-[width] duration-200 ease-linear"
        }
      >
        <Button
          type="button"
          variant="ghost"
          size="icon-sm"
          onClick={() => setChatOpen((open) => !open)}
          className="absolute left-2 top-3 z-10 transition-transform duration-200 ease-linear"
          aria-label={chatOpen ? "收起聊天区" : "展开聊天区"}
        >
          <PanelRightIcon />
        </Button>

        {chatOpen && (
          <div className="pointer-events-none absolute inset-x-0 top-0 z-[5] h-20 bg-gradient-to-b from-card via-card/95 to-transparent" />
        )}
        {chatOpen && (
          <>
            <div className="min-h-0 flex-1 overflow-y-auto px-4 py-12">
              {loadingMessages ? (
                <p className="text-sm text-muted-foreground">加载消息中...</p>
              ) : messageError ? (
                <p className="text-sm text-destructive">{messageError}</p>
              ) : messages.length ? (
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <p className="text-sm font-medium">
                        {message.author.name ?? "匿名用户"}
                      </p>
                      <p className="text-sm text-foreground">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">暂无消息</p>
              )}
            </div>

            <form className="border-t p-3" onSubmit={handleSendMessage}>
              <div className="flex gap-2">
                <input
                  value={messageText}
                  onChange={(event) => setMessageText(event.target.value)}
                  className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  placeholder="输入消息"
                />
                <Button type="submit" size="icon-sm">
                  发送
                </Button>
              </div>
            </form>
          </>
        )}
      </aside>
    </main>
  );
}
