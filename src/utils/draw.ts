import type { WallPoint } from "@/canvas/stroke";

export type RemoteLiveStroke = {
  strokeId: string;
  authorId: string;
  points: WallPoint[];
};

export type RemoteStrokePointPayload = {
  authorId: string;
  strokeId: string;
  point: WallPoint;
};

type StrokeLike = WallPoint[] | { points: WallPoint[] };

function getStrokePoints(stroke: StrokeLike) {
  return Array.isArray(stroke) ? stroke : stroke.points;
}

export function samePoint(a: WallPoint, b: WallPoint) {
  return (
    a.x === b.x && a.y === b.y && (a.pressure ?? 0.5) === (b.pressure ?? 0.5)
  );
}

export function sameStroke(a: StrokeLike, b: StrokeLike) {
  const aPoints = getStrokePoints(a);
  const bPoints = getStrokePoints(b);

  if (aPoints.length !== bPoints.length) {
    return false;
  }

  return aPoints.every((point, index) => samePoint(point, bPoints[index]!));
}

export function appendStrokeOnce(strokes: StrokeLike[], stroke: StrokeLike) {
  const alreadyExists = strokes.some((item) => sameStroke(item, stroke));

  if (alreadyExists) {
    return strokes;
  }

  return [...strokes, stroke];
}

export function upsertRemoteLiveStroke(
  liveStrokes: RemoteLiveStroke[],
  payload: RemoteStrokePointPayload,
) {
  const index = liveStrokes.findIndex(
    (item) => item.strokeId === payload.strokeId,
  );

  if (index === -1) {
    return [
      ...liveStrokes,
      {
        strokeId: payload.strokeId,
        authorId: payload.authorId,
        points: [payload.point],
      },
    ];
  }

  const current = liveStrokes[index]!;
  const lastPoint = current.points[current.points.length - 1];

  if (lastPoint && samePoint(lastPoint, payload.point)) {
    return liveStrokes;
  }

  return [
    ...liveStrokes.slice(0, index),
    {
      ...current,
      points: [...current.points, payload.point],
    },
    ...liveStrokes.slice(index + 1),
  ];
}

export function removeRemoteLiveStrokeByAuthorAndPoints(
  liveStrokes: RemoteLiveStroke[],
  authorId: string,
  points: WallPoint[],
) {
  return liveStrokes.filter(
    (item) => !(item.authorId === authorId && sameStroke(item.points, points)),
  );
}
