import { Navigate, createBrowserRouter } from "react-router";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { SchoolPage } from "./pages/SchoolPage";
import { RoomPage } from "./pages/RoomPage";
import { ProtectedRoute, PublicOnlyRoute } from "./routes/Auth";
import { Workspace } from "./routes/Workspace";
import { SettingsPage } from "./pages/SettingsPage";

export const router = createBrowserRouter([
  {
    element: <PublicOnlyRoute />,
    children: [
      {
        path: "/auth",
        element: <AuthPage />,
      },
    ],
  },
  {
    element: <ProtectedRoute />,
    children: [
      {
        element: <Workspace />,
        children: [
          {
            path: "/",
            element: <HomePage />,
          },
          {
            path: "/rooms/:roomId",
            element: <RoomPage />,
          },
        ],
      },
      {
        path: "/school",
        element: <SchoolPage />,
      },
      {
        path: "/settings",
        element: <SettingsPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
