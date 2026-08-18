"use client";

import { Link } from "react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import {
  MoreHorizontalIcon,
  FolderIcon,
  ArrowRightIcon,
  Trash2Icon,
} from "lucide-react";

export function NavProjects({
  title,
  projects,
}: {
  title: string;
  projects: {
    name: string;
    url: string;
    icon: React.ReactNode;
    onClick?: () => void;
    onShare?: () => void;
    dangerLabel?: string;
    onDanger?: () => void;
  }[];
}) {
  const { isMobile } = useSidebar();
  return (
    <SidebarGroup className="group-data-[collapsible=icon]:hidden">
      <SidebarGroupLabel>{title}</SidebarGroupLabel>
      <SidebarMenu>
        {projects.map((item) => (
          <SidebarMenuItem key={item.name}>
            {item.onClick ? (
              <SidebarMenuButton type="button" onClick={item.onClick}>
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            ) : (
              <SidebarMenuButton render={<Link to={item.url ?? "#"} />}>
                {item.icon}
                <span>{item.name}</span>
              </SidebarMenuButton>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <SidebarMenuAction
                    showOnHover
                    className="aria-expanded:bg-muted"
                  />
                }
              >
                <MoreHorizontalIcon />
                <span className="sr-only">More</span>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                className="w-fit"
                side={isMobile ? "bottom" : "right"}
                align={isMobile ? "end" : "start"}
              >
                <DropdownMenuItem onClick={item.onShare}>
                  <ArrowRightIcon />
                  <span>分享房间</span>
                </DropdownMenuItem>
                <DropdownMenuItem
                  variant="destructive"
                  onClick={() => item.onDanger?.()}
                >
                  <Trash2Icon />
                  <span>{item.dangerLabel ?? "退出房间"}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        ))}
      </SidebarMenu>
    </SidebarGroup>
  );
}
