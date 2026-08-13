import { Outlet } from "react-router";
import { AppSidebar } from "@/components/app-sidebar";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

export function Workspace() {
  return (
    <SidebarProvider defaultOpen>
      <AppSidebar />

      <SidebarInset>
        <header className="flex h-14 shrink-0 items-center border-b px-4">
          <SidebarTrigger />
        </header>

        <Outlet />
      </SidebarInset>
    </SidebarProvider>
  );
}
