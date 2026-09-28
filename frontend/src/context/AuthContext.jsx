import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import * as authApi from "../api/auth.js";
import {
  clearStoredAuth,
  readStoredAuth,
  setUnauthorizedHandler,
  storeAuth,
} from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const navigate = useNavigate();
  const [storedAuth] = useState(readStoredAuth);
  const [token, setToken] = useState(storedAuth.accessToken);
  const [user, setUser] = useState(storedAuth.user);

  const logout = useCallback(() => {
    clearStoredAuth();
    setToken(null);
    setUser(null);
  }, []);

  useEffect(() => {
    setUnauthorizedHandler(() => {
      logout();
      navigate("/login", { replace: true });
    });
    return () => setUnauthorizedHandler(() => {});
  }, [logout, navigate]);

  const authenticate = useCallback(async (request) => {
    const result = await request();
    storeAuth(result);
    setToken(result.access_token);
    setUser(result.user);
    navigate("/", { replace: true });
  }, [navigate]);

  const login = useCallback(
    (credentials) => authenticate(() => authApi.login(credentials)),
    [authenticate],
  );

  const register = useCallback(
    (details) => authenticate(() => authApi.register(details)),
    [authenticate],
  );

  const value = useMemo(
    () => ({ isAuthenticated: Boolean(token), user, login, register, logout }),
    [token, user, login, register, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider.");
  return context;
}
