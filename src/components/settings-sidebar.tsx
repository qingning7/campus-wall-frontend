import { KeyRoundIcon } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from "@/components/ui/sidebar";

export function SettingsSidebar() {
  return (
    <Sidebar collapsible="none" className="flex-1 shrink-0 border-r">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>设置</SidebarGroupLabel>

          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  isActive
                  tooltip="更改密码"
                  aria-current="page"
                >
                  <KeyRoundIcon />
                  <span>更改密码</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
