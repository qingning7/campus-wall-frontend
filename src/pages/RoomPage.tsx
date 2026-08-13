import { useParams } from "react-router";
import { useEffect, useState } from "react";
import { PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { getRoomMessages, type ChatMessage } from "@/api/rooms";
import { sendRoomMessage } from "@/api/rooms";

export function RoomPage() {
  const { roomId } = useParams();
  const [chatOpen, setChatOpen] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageError, setMessageError] = useState("");
  const [messageText, setMessageText] = useState("");
  const [sendingMessage, setSendingMessage] = useState(false);

  useEffect(() => {
    if (!roomId) {
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
  }, [roomId]);

  async function handleSendMessage(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    if (!roomId || sendingMessage) {
      return;
    }

    const content = messageText.trim();

    if (!content) {
      return;
    }

    setMessageText("");
    setSendingMessage(true);
    setMessageError("");

    try {
      const sentMessage = await sendRoomMessage(roomId, { content });

      setMessages((prev) => [...prev, sentMessage]);
      setMessageText("");
    } catch (error) {
      setMessageText(content);
      setMessageError(error instanceof Error ? error.message : "发送消息失败");
    } finally {
      setSendingMessage(false);
    }
  }

  return (
    <main className="flex h-[calc(100svh-3.5rem)] min-h-0 bg-background text-foreground">
      <section className="relative min-w-0 flex-1 overflow-hidden bg-white">
        <div className="absolute inset-0 flex items-center justify-center text-sm text-muted-foreground">
          画画区
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
                <Button type="submit" size="icon-sm" disabled={sendingMessage}>
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
