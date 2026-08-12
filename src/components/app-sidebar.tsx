"use client";

import * as React from "react";

import { NavMain } from "@/components/nav-main";
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
  schools: [
    {
      name: "选择学校",
      url: "/school",
      icon: <GraduationCapIcon />,
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

  if (!currentUser) return null;
  return (
    <Sidebar collapsible="icon" {...props}>
      <SidebarHeader>
        <TeamSwitcher teams={data.teams} />
      </SidebarHeader>
      <SidebarContent>
        <NavProjects title="我的学校" projects={data.schools} />
        <NavProjects title="我的房间" projects={data.rooms} />
        <NavProjects title="其它" projects={data.others} />
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
    </Sidebar>
  );
}
