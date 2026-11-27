import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api from "./api.js";

const AuthCtx = createContext(null);
export const useAuth = () => useContext(AuthCtx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const refreshUser = useCallback(async () => {
    const { data } = await api.get("/api/auth/me");
    setUser(data);
    return data;
  }, []);

  useEffect(() => {
    let token = null;
    try { token = localStorage.getItem("foundit_token"); } catch {}
    if (!token) return setLoading(false);
    refreshUser().catch(() => {}).finally(() => setLoading(false));
  }, [refreshUser]);

  const loginWithGoogle = async (credential) => {
    const { data } = await api.post("/api/auth/google", { credential });
    try { localStorage.setItem("foundit_token", data.token); } catch {}
    setUser(data.user);
  };

  const logout = () => {
    try { localStorage.removeItem("foundit_token"); } catch {}
    setUser(null);
    window.google?.accounts?.id?.disableAutoSelect();
  };

  return (
    <AuthCtx.Provider value={{ user, loading, loginWithGoogle, logout, refreshUser, setUser }}>
      {children}
    </AuthCtx.Provider>
  );
}
