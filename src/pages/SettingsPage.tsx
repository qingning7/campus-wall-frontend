import { ArrowLeftIcon } from "lucide-react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { SettingsSidebar } from "@/components/settings-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import { ChangePasswordForm } from "@/components/change-password-form";

export function SettingsPage() {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="flex shrink-0 flex-col bg-sidebar">
        <div className="border-r p-2">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            aria-label="返回"
            title="返回"
            onClick={() => navigate(-1)}
          >
            <ArrowLeftIcon />
          </Button>
        </div>

        <SettingsSidebar />
      </div>

      <main className="min-w-0 flex-1 bg-background p-6 text-foreground md:p-10">
        <ChangePasswordForm />
      </main>
    </SidebarProvider>
  );
}
