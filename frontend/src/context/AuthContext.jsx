import { createContext, useContext, useMemo, useState, useEffect } from "react";
import client from "../api/client";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [auth, setAuth] = useState({
    token: localStorage.getItem("token") || "",
    userId: localStorage.getItem("userId") || "",
    email: localStorage.getItem("email") || "",
    role: localStorage.getItem("role") || "",
    user: null,
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!auth.token) {
        if (active) setLoading(false);
        return;
      }

      try {
        const response = await client.get("/auth/me");
        if (!active) return;
        const user = response.data;
        localStorage.setItem("userId", String(user.id));
        localStorage.setItem("email", user.email);
        localStorage.setItem("role", user.role);
        setAuth((prev) => ({
          ...prev,
          userId: String(user.id),
          email: user.email,
          role: user.role,
          user,
        }));
      } catch {
        if (!active) return;
        ["token", "userId", "email", "role"].forEach((key) => localStorage.removeItem(key));
        setAuth({ token: "", userId: "", email: "", role: "", user: null });
      } finally {
        if (active) setLoading(false);
      }
    };

    restoreSession();
    return () => {
      active = false;
    };
    // Session restoration intentionally runs once when the provider mounts.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = (data) => {
    localStorage.setItem("token", data.token);
    localStorage.setItem("userId", data.userId);
    localStorage.setItem("email", data.email);
    localStorage.setItem("role", data.role);

    setAuth((prev) => ({
      ...prev,
      token: data.token,
      userId: String(data.userId),
      email: data.email,
      role: data.role,
    }));
  };

  const setUser = (userData) => {
    setAuth((prev) => ({
      ...prev,
      user: typeof userData === "function" ? userData(prev.user) : userData,
    }));
  };

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userId");
    localStorage.removeItem("email");
    localStorage.removeItem("role");

    setAuth({
      token: "",
      userId: "",
      email: "",
      role: "",
      user: null,
    });
  };

  const value = useMemo(() => ({
    auth,
    login,
    logout,
    setUser,
    loading,
    isAuthenticated: !!auth.token,
    user: auth.user,
  }), [auth, loading]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}

export default useAuth;

// import { createContext, useContext, useMemo, useState, useEffect } from 'react'

// const AuthContext = createContext(null)

// export function AuthProvider({ children }) {
//   const [auth, setAuth] = useState({
//     token: localStorage.getItem('token') || '',
//     userId: localStorage.getItem('userId') || '',
//     email: localStorage.getItem('email') || '',
//     role: localStorage.getItem('role') || '',
//     user: null,
//   })
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     setLoading(false)
//   }, [])

//   const login = (data) => {
//     localStorage.setItem('token', data.token)
//     localStorage.setItem('userId', data.userId)
//     localStorage.setItem('email', data.email)
//     localStorage.setItem('role', data.role)
//     setAuth(data)
//   }

//   const setUser = (userData) => {
//     setAuth(prev => ({ ...prev, user: userData }))
//   }

//   const logout = () => {
//     localStorage.removeItem('token')
//     localStorage.removeItem('userId')
//     localStorage.removeItem('email')
//     localStorage.removeItem('role')
//     setAuth({ token: '', userId: '', email: '', role: '', user: null })
//   }

//   const value = useMemo(() => ({
//     auth,
//     login,
//     logout,
//     setUser,
//     isAuthenticated: !!auth.token,
//     user: auth.user,   // ✅ FIX: expose top-level user for ProtectedAdminRoute
//     loading,
//   }), [auth, loading])

//   return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
// }

// export const useAuth = () => useContext(AuthContext)
