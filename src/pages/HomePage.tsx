import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { useAuth } from "../contexts/AuthContext.tsx";

export function HomePage() {
  const navigate = useNavigate();
  const { currentUser, logoutAndClear } = useAuth();

  if (!currentUser) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl flex-col justify-start pt-20">
        <div className="space-y-6">
          <h1 className="text-3xl font-semibold tracking-normal">
            欢迎，{currentUser.name || currentUser.email}
          </h1>

          {!currentUser.schoolId && (
            <Button type="button" onClick={() => navigate("/school")}>
              去绑定学校
            </Button>
          )}

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              logoutAndClear();
              navigate("/auth", { replace: true });
            }}
          >
            退出登录
          </Button>
        </div>
      </section>
    </main>
  );
}
