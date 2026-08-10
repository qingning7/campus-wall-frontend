import { Navigate, Outlet } from "react-router";
import { useAuth } from "../contexts/AuthContext.tsx";

function LoadingScreen() {
  return (
    <main className="min-h-screen bg-background px-6 py-10 text-foreground">
      <section className="mx-auto flex min-h-[calc(100vh-5rem)] max-w-xl items-center justify-center">
        <p className="text-sm text-muted-foreground">加载中...</p>
      </section>
    </main>
  );
}

export function ProtectedRoute() {
  const { currentUser, checkingSession } = useAuth();

  if (checkingSession) {
    return <LoadingScreen />;
  }

  if (!currentUser) {
    return <Navigate to="/auth" replace />;
  }

  return <Outlet />;
}

export function PublicOnlyRoute() {
  const { currentUser, checkingSession } = useAuth();

  if (checkingSession) {
    return <LoadingScreen />;
  }

  if (currentUser) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}