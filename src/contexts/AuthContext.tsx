import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { getMe, logout, type AuthUser } from "../api/auth";
import { getAuthToken } from "../lib/api";
import { resetSocket } from "../lib/socket";

type AuthContextValue = {
  currentUser: AuthUser | null;
  checkingSession: boolean;
  refreshUser: () => Promise<AuthUser | null>;
  setCurrentUser: (user: AuthUser | null) => void;
  logoutAndClear: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const [checkingSession, setCheckingSession] = useState(true);

  async function refreshUser() {
    setCheckingSession(true);

    try {
      const user = await getMe();
      setCurrentUser(user);
      return user;
    } catch {
      resetSocket();
      logout();
      setCurrentUser(null);
      return null;
    } finally {
      setCheckingSession(false);
    }
  }

  useEffect(() => {
    if (!getAuthToken()) {
      setCheckingSession(false);
      return;
    }

    void refreshUser();
  }, []);

  function logoutAndClear() {
    resetSocket();
    logout();
    setCurrentUser(null);
  }

  const value = useMemo(
    () => ({
      currentUser,
      checkingSession,
      refreshUser,
      setCurrentUser,
      logoutAndClear,
    }),
    [currentUser, checkingSession],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider");
  }

  return context;
}
