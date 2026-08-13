import { useParams } from "react-router";
import { useState } from "react";
import { PanelRightIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export function RoomPage() {
  const { roomId } = useParams();
  const [chatOpen, setChatOpen] = useState(true);

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
              <p className="text-sm text-muted-foreground">暂无消息</p>
            </div>

            <form className="border-t p-3">
              <input
                className="h-9 w-full rounded-md border bg-background px-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring"
                placeholder="输入消息"
              />
            </form>
          </>
        )}
      </aside>
    </main>
  );
}
