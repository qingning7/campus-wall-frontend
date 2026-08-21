import { Link, useParams } from "react-router";
import { useEffect, useState, useRef } from "react";
import { PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoomMessages, type ChatMessage } from "@/api/rooms";
import { sendRoomMessage } from "@/api/rooms";
import { useAuth } from "@/contexts/AuthContext";
import { canAccessRoom } from "@/lib/room-access";
import { getMyRooms } from "@/api/rooms";
import { getSocket } from "@/lib/socket";

function appendMessageOnce(messages: ChatMessage[], message: ChatMessage) {
  const alreadyExists = messages.some((item) => item.id === message.id);

  if (alreadyExists) {
    return messages;
  }

  return [...messages, message];
}

export function RoomPage() {
  const { roomId } = useParams();
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageText, setMessageText] = useState("");
  const { currentUser } = useAuth();
  const [checkingRoomAccess, setCheckingRoomAccess] = useState(true);
  const [hasRoomAccess, setHasRoomAccess] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const WALL_WIDTH = 2400;
  const WALL_HEIGHT = 1400;
  const GRID_SIZE = 100;

  function drawWallBackground(ctx: CanvasRenderingContext2D) {
    ctx.clearRect(0, 0, WALL_WIDTH, WALL_HEIGHT);

    ctx.fillStyle = "#f8fafc";
    ctx.fillRect(0, 0, WALL_WIDTH, WALL_HEIGHT);

    ctx.strokeStyle = "#e2e8f0";
    ctx.lineWidth = 1;
  }
  
  useEffect(() => {
    if (!roomId) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;

    canvas.width = WALL_WIDTH * dpr;
    canvas.height = WALL_HEIGHT * dpr;

    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    drawWallBackground(ctx);
  }, [roomId]);

  useEffect(() => {
    if (!roomId || !hasRoomAccess || !currentUser) {
      return;
    }

    const socket = getSocket();

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

    socket.on("connect", joinCurrentRoom);
    socket.on("room-joined", handleRoomJoined);
    socket.on("room-error", handleRoomError);
    socket.on("room-message", handleRoomMessage);

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
      socket.disconnect();
    };
  }, [roomId, hasRoomAccess, currentUser]);

  useEffect(() => {
    if (!roomId || !currentUser) {
      setCheckingRoomAccess(false);
      setHasRoomAccess(false);
      return;
    }

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

  if (!checkingRoomAccess && !hasRoomAccess) {
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
        <div className="absolute inset-0 flex items-center justify-center">
          <div
            className="relative shrink-0"
            style={{ width: WALL_WIDTH, height: WALL_HEIGHT }}
          >
            <canvas
              ref={canvasRef}
              className="absolute inset-0 h-full w-full"
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
