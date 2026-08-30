import { PenLineIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverHeader,
  PopoverTitle,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useRoomCanvas } from "@/contexts/RoomCanvasContext";
import {
  BRUSH_COLORS,
  BRUSH_SIZE_MAX,
  BRUSH_SIZE_MIN,
  BRUSH_SIZE_STEP,
} from "@/utils/draw-tools";

export function BrushControls() {
  const { activeTool, setActiveTool, brushSettings, setBrushSettings } =
    useRoomCanvas();

  return (
    <Popover>
      <PopoverTrigger
        render={
          <Button
            type="button"
            variant={activeTool === "pen" ? "secondary" : "ghost"}
            size="icon-sm"
            aria-label="画笔设置"
            aria-pressed={activeTool === "pen"}
            onClick={() => setActiveTool("pen")}
          />
        }
      >
        <PenLineIcon />
      </PopoverTrigger>

      <PopoverContent align="start" className="w-80 space-y-4">
        <PopoverHeader>
          <PopoverTitle>画笔</PopoverTitle>
        </PopoverHeader>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">粗细</span>
            <span className="text-xs text-muted-foreground">
              {brushSettings.size}px
            </span>
          </div>

          <Slider
            min={BRUSH_SIZE_MIN}
            max={BRUSH_SIZE_MAX}
            step={BRUSH_SIZE_STEP}
            value={[brushSettings.size]}
            onValueChange={(nextValue) => {
              const nextSize = Array.isArray(nextValue)
                ? (nextValue[0] ?? brushSettings.size)
                : nextValue;
              setBrushSettings((prev) => ({ ...prev, size: nextSize }));
            }}
          />
        </div>

        <div className="space-y-2">
          <span className="text-sm font-medium">颜色</span>

          <ToggleGroup
            multiple={false}
            value={[brushSettings.color]}
            onValueChange={(nextValues) => {
              const nextColor = nextValues[0] ?? brushSettings.color;
              setBrushSettings((prev) => ({ ...prev, color: nextColor }));
            }}
            className="flex flex-wrap gap-2"
          >
            {BRUSH_COLORS.map((color) => (
              <ToggleGroupItem
                key={color}
                value={color}
                aria-label={color}
                className="h-8 w-8 min-w-8 rounded-full border border-input p-0 transition-shadow data-[state=on]:border-transparent"
                style={{
                  backgroundColor: color,
                  boxShadow:
                    brushSettings.color === color
                      ? "0 0 0 2px var(--background), 0 0 0 4px var(--ring)"
                      : undefined,
                }}
              />
            ))}
          </ToggleGroup>
        </div>
      </PopoverContent>
    </Popover>
  );
}
