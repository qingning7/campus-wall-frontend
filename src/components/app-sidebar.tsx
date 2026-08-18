"use client";

import * as React from "react";

import { NavProjects } from "@/components/nav-projects";
import { NavUser } from "@/components/nav-user";
import { TeamSwitcher } from "@/components/team-switcher";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarRail,
} from "@/components/ui/sidebar";
import {
  DoorOpenIcon,
  GalleryVerticalEndIcon,
  GraduationCapIcon,
  HashIcon,
  PlusIcon,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import {
  getMyRooms,
  createPrivateRoom,
  joinRoom,
  leaveRoom,
  deleteRoom,
  type Room,
} from "@/api/rooms";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
// This is sample data.
const data = {
  user: {
    name: "测试用户",
    email: "test@example.com",
    avatar: "",
  },
  teams: [
    {
      name: "Campus Wall",
      logo: <GalleryVerticalEndIcon />,
      plan: "校园墙",
    },
  ],
  rooms: [
    {
      name: "示例私人房间",
      url: "#",
      icon: <HashIcon />,
    },
  ],
  others: [
    {
      name: "创建房间",
      url: "#",
      icon: <PlusIcon />,
    },
    {
      name: "加入房间",
      url: "#",
      icon: <DoorOpenIcon />,
    },
  ],
};

export function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [createOpen, setCreateOpen] = React.useState(false);
  const [roomName, setRoomName] = React.useState("");
  const [roomPassword, setRoomPassword] = React.useState("");
  const [creatingRoom, setCreatingRoom] = React.useState(false);
  const [privateRooms, setPrivateRooms] = React.useState<Room[]>([]);
  const [loadingRooms, setLoadingRooms] = React.useState(false); // 创建房间
  const [joinOpen, setJoinOpen] = React.useState(false);
  const [joinCode, setJoinCode] = React.useState("");
  const [joinPassword, setJoinPassword] = React.useState("");
  const [joiningRoom, setJoiningRoom] = React.useState(false);
  const [joinError, setJoinError] = React.useState(""); // 加入房间
  const [shareRoomCode, setShareRoomCode] = React.useState("");
  const [copiedRoomCode, setCopiedRoomCode] = React.useState(false); // 分享房间
  const [leavingRoomId, setLeavingRoomId] = React.useState("");
  const [deletingRoomId, setDeletingRoomId] = React.useState("");

  async function handleCreateRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const name = roomName.trim();
    const password = roomPassword.trim();

    setCreatingRoom(true);

    try {
      const room = await createPrivateRoom({
        name: name || undefined,
        password: password || undefined,
      });

      setPrivateRooms((prev) => {
        const alreadyExists = prev.some((item) => item.id === room.id);

        if (alreadyExists) {
          return prev;
        }

        return [room, ...prev];
      });

      setCreateOpen(false);
      setRoomName("");
      setRoomPassword("");
      navigate(`/rooms/${room.id}`);
    } finally {
      setCreatingRoom(false);
    }
  }

  async function handleJoinRoom(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();

    const code = joinCode.trim();
    const password = joinPassword.trim();

    if (!code) {
      setJoinError("请输入房间号");
      return;
    }

    setJoinError("");
    setJoiningRoom(true);

    try {
      const result = await joinRoom({
        code,
        password: password || undefined,
      });

      setPrivateRooms((prev) => {
        const alreadyExists = prev.some((room) => room.id === result.room.id);

        if (alreadyExists) {
          return prev;
        }

        return [result.room, ...prev];
      });

      setJoinOpen(false);
      setJoinCode("");
      setJoinPassword("");
      navigate(`/rooms/${result.room.id}`);
    } catch (error) {
      setJoinError(error instanceof Error ? error.message : "加入房间失败");
    } finally {
      setJoiningRoom(false);
    }
  }

  async function handleLeaveRoom(room: Room) {
    const confirmed = window.confirm(
      `确定要退出“${room.name || `房间 ${room.code}`}”吗？`,
    );

    if (!confirmed) {
      return;
    }

    setLeavingRoomId(room.id);

    try {
      await leaveRoom(room.id);

      setPrivateRooms((prev) => prev.filter((item) => item.id !== room.id));

      if (window.location.pathname === `/rooms/${room.id}`) {
        navigate("/");
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "退出房间失败");
    } finally {
      setLeavingRoomId("");
    }
  }

  async function handleDeleteRoom(room: Room) {
    const confirmed = window.confirm(
      `确定要删除“${room.name || `房间 ${room.code}`}”吗？`,
    );

    if (!confirmed) {
      return;
    }

    setDeletingRoomId(room.id);

    try {
      await deleteRoom(room.id);

      setPrivateRooms((prev) => prev.filter((item) => item.id !== room.id));

      if (window.location.pathname === `/rooms/${room.id}`) {
        navigate("/");
      }
    } catch (error) {
      window.alert(error instanceof Error ? error.message : "删除房间失败");
    } finally {
      setDeletingRoomId("");
    }
  }

  async function handleCopyRoomCode() {
    if (!shareRoomCode) {
      return;
    }

    await navigator.clipboard.writeText(shareRoomCode);
    setCopiedRoomCode(true);

    window.setTimeout(() => {
      setCopiedRoomCode(false);
    }, 1500);
  }

  React.useEffect(() => {
    if (!currentUser) {
      return;
    }

    let ignore = false;

    async function loadRooms() {
      setLoadingRooms(true);

      try {
        const rooms = await getMyRooms();

        if (!ignore) {
          setPrivateRooms(rooms.filter((room) => room.type === "PRIVATE"));
        }
      } catch {
        if (!ignore) {
          setPrivateRooms([]);
        }
      } finally {
        if (!ignore) {
          setLoadingRooms(false);
        }
      }
    }

    void loadRooms();

    return () => {
      ignore = true;
    };
  }, [currentUser?.id]);

  if (!currentUser) return null;

  const schoolRoomId = currentUser.school?.room?.id;

  const schoolItems = [
    {
      name: currentUser.school?.name ?? "选择学校",
      url: currentUser.school ? `/rooms/${schoolRoomId}` : "/school",
      icon: <GraduationCapIcon />,
    },
  ];

  const privateRoomItems = loadingRooms
    ? [
        {
          name: "加载中...",
          url: "#",
          icon: <HashIcon />,
        },
      ]
    : privateRooms.length
      ? privateRooms.map((room) => {
          const isOwner = room.ownerId === currentUser.id;

          return {
            name: room.name || `房间 ${room.code}`,
            url: `/rooms/${room.id}`,
            icon: <HashIcon />,
            onShare: () => setShareRoomCode(room.code ?? ""),
            dangerLabel: isOwner
              ? deletingRoomId === room.id
                ? "删除中..."
                : "删除房间"
              : leavingRoomId === room.id
                ? "退出中..."
                : "退出房间",
            onDanger: () =>
              void (isOwner ? handleDeleteRoom(room) : handleLeaveRoom(room)),
          };
        })
      : [
          {
            name: "暂无房间",
            url: "#",
            icon: <HashIcon />,
          },
        ];

  const otherItems = [
    {
      name: "创建房间",
      url: "#",
      icon: <PlusIcon />,
      onClick: () => setCreateOpen(true),
    },
    {
      name: "加入房间",
      url: "#",
      icon: <DoorOpenIcon />,
      onClick: () => setJoinOpen(true),
    },
  ];
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects title="我的学校" projects={schoolItems} />
        <NavProjects title="我的房间" projects={privateRoomItems} />
        <NavProjects title="其它" projects={otherItems} />
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          user={{
            name: currentUser.name || "",
            email: currentUser.email,
            avatar: "",
          }}
        />
      </SidebarFooter>
      <SidebarRail />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>创建房间</DialogTitle>
            <DialogDescription>输入房间名，密码可选。</DialogDescription>
          </DialogHeader>

          <form onSubmit={handleCreateRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="room-name">房间名</Label>
              <Input
                id="room-name"
                value={roomName}
                onChange={(e) => setRoomName(e.target.value)}
                placeholder=""
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="room-password">密码（可选）</Label>
              <Input
                id="room-password"
                type="password"
                value={roomPassword}
                onChange={(e) => setRoomPassword(e.target.value)}
                placeholder=""
              />
            </div>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setCreateOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={creatingRoom}>
                {creatingRoom ? "创建中..." : "创建"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog open={joinOpen} onOpenChange={setJoinOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>加入房间</DialogTitle>
          </DialogHeader>

          <form onSubmit={handleJoinRoom} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="join-room-code">房间号</Label>
              <Input
                id="join-room-code"
                value={joinCode}
                onChange={(event) => setJoinCode(event.target.value)}
                placeholder="输入 6 位房间号"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="join-room-password">密码（如果有）</Label>
              <Input
                id="join-room-password"
                type="password"
                value={joinPassword}
                onChange={(event) => setJoinPassword(event.target.value)}
                minLength={4}
                placeholder="无密码可留空"
              />
            </div>

            {joinError && (
              <p className="text-sm text-destructive">{joinError}</p>
            )}

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setJoinOpen(false)}
              >
                取消
              </Button>
              <Button type="submit" disabled={joiningRoom}>
                {joiningRoom ? "加入中..." : "加入"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <Dialog
        open={!!shareRoomCode}
        onOpenChange={(open) => {
          if (!open) {
            setShareRoomCode("");
          }
        }}
      >
        <DialogContent className="relative">
          <DialogHeader>
            <DialogTitle>分享房间</DialogTitle>
          </DialogHeader>

          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">点击复制房间号</p>
            <button
              type="button"
              onClick={handleCopyRoomCode}
              className="w-full rounded-md border bg-muted px-3 py-2 text-left text-lg font-semibold tracking-wider transition hover:bg-muted/80"
            >
              {shareRoomCode}
            </button>
          </div>
          {copiedRoomCode && (
            <div className="pointer-events-none absolute left-1/2 top-4 -translate-x-1/2 rounded-md border bg-popover px-3 py-1.5 text-sm shadow-md">
              已复制
            </div>
          )}
        </DialogContent>
      </Dialog>
    </Sidebar>
  );
}
