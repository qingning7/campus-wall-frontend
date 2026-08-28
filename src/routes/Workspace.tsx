import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import { Button } from "@/components/ui/button";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  EraserIcon,
  PenLineIcon,
  Redo2Icon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";
import {
  RoomCanvasProvider,
  useRoomCanvas,
} from "@/contexts/RoomCanvasContext";

export function Workspace() {
  return (
    <RoomCanvasProvider>
      <WorkspaceShell />
    </RoomCanvasProvider>
  );
}

function WorkspaceShell() {
  const { activeTool, setActiveTool, canvasActions } = useRoomCanvas();

  return (
    <SidebarProvider defaultOpen>
        <AppSidebar />

        <SidebarInset>
          <header className="flex h-14 shrink-0 items-center border-b px-4">
            <SidebarTrigger />
            <div className="ml-4 flex items-center gap-1">
              <Button
                type="button"
                variant={activeTool === "pen" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="画笔"
                aria-pressed={activeTool === "pen"}
                onClick={() => setActiveTool("pen")}
              >
                <PenLineIcon />
              </Button>
              <Button
                type="button"
                variant={activeTool === "eraser" ? "secondary" : "ghost"}
                size="icon-sm"
                aria-label="橡皮"
                aria-pressed={activeTool === "eraser"}
                onClick={() => setActiveTool("eraser")}
              >
                <EraserIcon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="撤销"
                onClick={() => canvasActions?.undo()}
                disabled={!canvasActions}
              >
                <Undo2Icon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="重做"
                onClick={() => canvasActions?.redo()}
                disabled={!canvasActions}
              >
                <Redo2Icon />
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                aria-label="清空"
                onClick={() => canvasActions?.clear()}
                disabled={!canvasActions}
              >
                <Trash2Icon />
              </Button>
            </div>
          </header>

          <Outlet />
        </SidebarInset>
      </SidebarProvider>
  );
}