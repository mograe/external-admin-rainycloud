import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { loginRequest, logoutRequest, meRequest } from "../lib/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isBootstrapping, setIsBootstrapping] = useState(true);

  async function refreshMe() {
    try {
      const data = await meRequest();
      setUser(data.user);
      return data.user;
    } catch (error) {
      if (error.status === 401) {
        setUser(null);
        return null;
      }
      throw error;
    }
  }

  async function login(username, password) {
    const data = await loginRequest({ username, password });
    setUser(data.user);
    return data.user;
  }

  async function logout() {
    try {
      await logoutRequest();
    } finally {
      setUser(null);
    }
  }

  useEffect(() => {
    (async () => {
      try {
        await refreshMe();
      } finally {
        setIsBootstrapping(false);
      }
    })();
  }, []);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isBootstrapping,
      login,
      logout,
      refreshMe,
    }),
    [user, isBootstrapping]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used inside AuthProvider");
  }
  return ctx;
}