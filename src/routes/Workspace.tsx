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
  MoonIcon,
  SunIcon,
  Trash2Icon,
  Undo2Icon,
} from "lucide-react";
import {
  RoomCanvasProvider,
  useRoomCanvas,
} from "@/contexts/RoomCanvasContext";
import { BrushControls } from "@/components/brush-controls";
import { useTheme } from "@/contexts/ThemeContext";

export function Workspace() {
  return (
    <RoomCanvasProvider>
      <WorkspaceShell />
    </RoomCanvasProvider>
  );
}

function WorkspaceShell() {
  const { activeTool, setActiveTool, canvasActions } = useRoomCanvas();
  const { theme, toggleTheme } = useTheme();

  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center border-b px-4">
          <SidebarTrigger />
          <div className="ml-4 flex items-center gap-1">
            <BrushControls />
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
              aria-label="清空"
              onClick={() => canvasActions?.clear()}
              disabled={!canvasActions}
            >
              <Trash2Icon />
            </Button>
          </div>

          <div className="ml-auto flex items-center gap-1">
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              aria-label="切换显示模式"
              aria-pressed={theme === "dark"}
              onClick={toggleTheme}
            >
              {theme === "light" ? <MoonIcon /> : <SunIcon />}
            </Button>
            <Button
              render={
                <a
                  href="https://github.com/qingning7/campus-wall-frontend"
                  target="_blank"
                  rel="noreferrer"
                />
              }
              variant="ghost"
              size="icon-sm"
              aria-label="前往 GitHub"
            >
              <svg
                viewBox="0 0 24 24"
                fill="currentColor"
                aria-hidden="true"
              >
                <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.08 3.29 9.39 7.86 10.91.58.11.79-.25.79-.56 0-.27-.01-1.02-.02-2-3.2.7-3.88-1.54-3.88-1.54-.53-1.34-1.29-1.7-1.29-1.7-1.05-.72.08-.71.08-.71 1.16.08 1.77 1.19 1.77 1.19 1.03 1.77 2.7 1.26 3.36.96.1-.75.4-1.26.73-1.55-2.55-.29-5.23-1.28-5.23-5.68 0-1.25.45-2.28 1.18-3.08-.12-.29-.51-1.46.11-3.05 0 0 .97-.31 3.17 1.18.92-.26 1.9-.39 2.88-.39.98 0 1.96.13 2.88.39 2.2-1.49 3.17-1.18 3.17-1.18.62 1.59.23 2.76.11 3.05.73.8 1.18 1.83 1.18 3.08 0 4.41-2.68 5.39-5.24 5.67.41.35.78 1.05.78 2.12 0 1.53-.01 2.76-.01 3.14 0 .31.21.68.8.56C20.71 21.39 24 17.08 24 12 24 5.65 18.85.5 12 .5z" />
              </svg>
            </Button>
          </div>
        </header>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
