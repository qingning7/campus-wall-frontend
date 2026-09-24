import { useEffect, useState } from "react";
import { PanelRightIcon, SendIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  getRoomMessages,
  sendRoomMessage,
  type ChatMessage,
} from "@/api/rooms";
import { useAuth } from "@/contexts/AuthContext";
import { getSocket } from "@/lib/socket";

const messageTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});
const fullMessageTimeFormatter = new Intl.DateTimeFormat("zh-CN", {
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
  hourCycle: "h23",
  timeZoneName: "short",
});

function MessageTime({ createdAt }: { createdAt: string }) {
  const timestamp = new Date(createdAt);
  if (Number.isNaN(timestamp.getTime())) return null;

  const fullTime = fullMessageTimeFormatter.format(timestamp);
  return (
    <Tooltip>
      <TooltipTrigger
        render={<time dateTime={createdAt} />}
        tabIndex={0}
        aria-label={`发送时间：${fullTime}`}
        className="shrink-0 rounded-sm text-xs whitespace-nowrap tabular-nums text-muted-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {messageTimeFormatter.format(timestamp)}
      </TooltipTrigger>
      <TooltipContent>{fullTime}</TooltipContent>
    </Tooltip>
  );
}

function appendMessageOnce(messages: ChatMessage[], message: ChatMessage) {
  if (messages.some((item) => item.id === message.id)) {
    return messages;
  }

  return [...messages, message];
}

type RoomChatProps = {
  roomId?: string;
  hasRoomAccess: boolean;
};

export function RoomChat({ roomId, hasRoomAccess }: RoomChatProps) {
  const { currentUser } = useAuth();
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageText, setMessageText] = useState("");

  useEffect(() => {
    if (!roomId || !hasRoomAccess || !currentUser) {
      setMessages([]);
      setMessageText("");
      setMessageError("");
      setLoadingMessages(false);
      return;
    }

    const socket = getSocket();

    function handleRoomError(payload: { message: string }) {
      setMessageError(payload.message);
    }

    function handleRoomMessage(message: ChatMessage) {
      setMessages((prev) => appendMessageOnce(prev, message));
    }

    socket.on("room-error", handleRoomError);
    socket.on("room-message", handleRoomMessage);

    return () => {
      socket.off("room-error", handleRoomError);
      socket.off("room-message", handleRoomMessage);
    };
  }, [roomId, hasRoomAccess, currentUser]);

  useEffect(() => {
    if (!roomId || !hasRoomAccess) {
      return;
    }

    const nextRoomId = roomId;
    let ignore = false;

    async function loadMessages() {
      setLoadingMessages(true);

      try {
        const data = await getRoomMessages(nextRoomId);

        if (!ignore) {
          setMessages(data);
        }
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

  if (!roomId || !hasRoomAccess || !currentUser) {
    return null;
  }

  return (
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
              <TooltipProvider delay={300}>
                <div className="space-y-3">
                  {messages.map((message) => (
                    <div key={message.id} className="space-y-1">
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                        <p className="min-w-0 break-all text-sm font-medium">
                          {message.author.name ?? "匿名用户"}
                        </p>
                        <MessageTime createdAt={message.createdAt} />
                      </div>
                      <p className="text-sm text-foreground">
                        {message.content}
                      </p>
                    </div>
                  ))}
                </div>
              </TooltipProvider>
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
              <Button
                type="submit"
                size="icon-sm"
                className="rounded-lg"
                aria-label="发送消息"
              >
                <SendIcon className="size-4" />
              </Button>
            </div>
          </form>
        </>
      )}
    </aside>
  );
}
