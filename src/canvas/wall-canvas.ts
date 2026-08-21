export const WALL_WIDTH = 2400;
export const WALL_HEIGHT = 1400;
export const GRID_SIZE = 100;

export function drawWallBackground(ctx: CanvasRenderingContext2D) {
  ctx.clearRect(0, 0, WALL_WIDTH, WALL_HEIGHT);

  ctx.fillStyle = "#f8fafc";
  ctx.fillRect(0, 0, WALL_WIDTH, WALL_HEIGHT);

  ctx.strokeStyle = "#e2e8f0";
  ctx.lineWidth = 1;
}

export function getCanvasPoint(
  event: Pick<PointerEvent, "clientX" | "clientY">,
  canvas: HTMLCanvasElement,
) {
  const rect = canvas.getBoundingClientRect();

  return {
    x: event.clientX - rect.left,
    y: event.clientY - rect.top,
  };
}

export function drawSegment(
  ctx: CanvasRenderingContext2D,
  from: { x: number; y: number },
  to: { x: number; y: number },
) {
  ctx.strokeStyle = "#111827";
  ctx.lineWidth = 4;
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  ctx.beginPath();
  ctx.moveTo(from.x, from.y);
  ctx.lineTo(to.x, to.y);
  ctx.stroke();
}
