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
