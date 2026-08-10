import { Navigate, createBrowserRouter } from "react-router";
import { AuthPage } from "./pages/AuthPage";
import { HomePage } from "./pages/HomePage";
import { SchoolPage } from "./pages/SchoolPage";
import { ProtectedRoute, PublicOnlyRoute } from "./routes/Auth";

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
        path: "/",
        element: <HomePage />,
      },
      {
        path: "/school",
        element: <SchoolPage />,
      },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);
