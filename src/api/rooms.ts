import { apiRequest } from "../lib/api";

export type RoomType = "SCHOOL" | "PRIVATE";

export type RoomSchool = {
  id: string;
  name: string;
};

export type Room = {
  id: string;
  type: RoomType;
  name: string | null;
  code: string | null;
  createdAt: string;
  ownerId: string | null;
  school: RoomSchool | null;
};

export type CreatPrivateRoomInput = {
  name?: string;
  password?: string;
};

export type JoinRoomInput = {
  code: string;
  password?: string;
};

export type JoinRoonResult = {
  room: Room;
  member: {
    id: string;
    joinedAt: string;
    userId: string;
    roomId: string;
  };
};

export type LeaveRoomResult = {
  roomId: string;
};

export type DeleteRoomResult = {
  roomId: string;
};

export type ChatMessageAuthor = {
  id: string;
  name: string | null;
};

export type ChatMessage = {
  id: string;
  content: string;
  createdAt: string;
  roomId: string;
  authorId: string;
  author: ChatMessageAuthor;
};

export type SendRoomMessageInput = {
  content: string;
};

export type WallPoint = {
  x: number;
  y: number;
};

export type WallStroke = {
  id: string;
  createdAt: string;
  roomId: string;
  authorId: string;
  color: string;
  size: number;
  points: WallPoint[];
};

export type SaveRoomStrokrIput = {
  color: string;
  size: number;
  points: WallPoint[]
};

export async function getMyRooms() {
  return apiRequest<Room[]>("/api/rooms/mine", {
    auth: true,
  });
}

export async function createPrivateRoom(input: CreatPrivateRoomInput) {
  return apiRequest<Room>("/api/rooms", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function joinRoom(input: JoinRoomInput) {
  return apiRequest<JoinRoonResult>("/api/rooms/join", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function leaveRoom(roomId: string) {
  return apiRequest<LeaveRoomResult>(`/api/rooms/${roomId}/leave`, {
    method: "POST",
    auth: true,
  });
}

export async function deleteRoom(roomId: string) {
  return apiRequest<DeleteRoomResult>(`/api/rooms/${roomId}`, {
    method: "DELETE",
    auth: true,
  });
}

export async function getRoomMessages(roomId: string) {
  return apiRequest<ChatMessage[]>(`/api/rooms/${roomId}/messages`, {
    auth: true,
  });
}

export async function sendRoomMessage(
  roomId: string,
  input: SendRoomMessageInput,
) {
  return apiRequest<ChatMessage>(`/api/rooms/${roomId}/messages`, {
    method: "POST",
    auth: true,
    body: input,
  });
}

export async function getRoomStrokes(roomId: string) {
  return apiRequest<WallStroke[]>(`/api/rooms/${roomId}/strokes`, {
    auth: true,
  });
}

export async function saveRoomStroke(
  roomId: string,
  input: SaveRoomStrokrIput,
) {
  return apiRequest<WallStroke>(`/api/rooms/${roomId}/strokes`, {
    method: "post",
    auth: true,
    body: input,
  });
}