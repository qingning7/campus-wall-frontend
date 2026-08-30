import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import {
  DEFAULT_BRUSH_SETTINGS,
  type BrushSettings,
  type DrawTool,
} from "@/utils/draw-tools";

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
  brushSettings: BrushSettings;
  setBrushSettings: Dispatch<SetStateAction<BrushSettings>>;
};

const RoomCanvasContext = createContext<RoomCanvasContextValue | null>(null);

export function RoomCanvasProvider({ children }: { children: ReactNode }) {
  const [activeTool, setActiveTool] = useState<DrawTool>("pen");
  const [canvasActions, setCanvasActions] = useState<RoomCanvasActions | null>(
    null,
  );
  const [brushSettings, setBrushSettings] = useState<BrushSettings>(
    DEFAULT_BRUSH_SETTINGS,
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
      brushSettings,
      setBrushSettings,
      canvasActions,
      registerCanvasActions,
    }),
    [activeTool, brushSettings, canvasActions, registerCanvasActions],
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
