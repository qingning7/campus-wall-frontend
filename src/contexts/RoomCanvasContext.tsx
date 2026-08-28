import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { DrawTool } from "@/utils/draw-tools";

export type RoomCanvasActions = {
  undo: () => void;
  redo: () => void;
  clear: () => void;
};

type RoomCanvasContextValue = {
  activeTool: DrawTool;
  setActiveTool: (tool: DrawTool) => void;
  canvasActions: RoomCanvasActions | null;
  registerCanvasActions: (actions: RoomCanvasActions | null) => void;
};

const RoomCanvasContext = createContext<RoomCanvasContextValue | null>(null);

export function RoomCanvasProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<DrawTool>("pen");
  const [canvasActions, setCanvasActions] = useState<RoomCanvasActions | null>(
    null,
  );

  const registerCanvasActions = useCallback(
    (actions: RoomCanvasActions | null) => {
      setCanvasActions(actions);
    },
    [],
  );

  const value = useMemo(
    () => ({
      activeTool,
      setActiveTool,
      canvasActions,
      registerCanvasActions,
    }),
    [activeTool, canvasActions, registerCanvasActions],
  );

  return (
    <RoomCanvasContext.Provider value={value}>
      {children}
    </RoomCanvasContext.Provider>
  );
}

export function useRoomCanvas() {
  const context = useContext(RoomCanvasContext);

  if (!context) {
    throw new Error("useRoomCanvas must be used inside RoomCanvasProvider");
  }

  return context;
}
