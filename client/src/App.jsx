import { useEffect, useState } from "react";
import { Routes, Route, NavLink, Link, useLocation, Navigate } from "react-router-dom";
import { useAuth } from "./AuthContext.jsx";
import Home from "./pages/Home.jsx";
import UploadPage from "./pages/UploadPage.jsx";
import SearchPage from "./pages/SearchPage.jsx";
import SupportPage from "./pages/SupportPage.jsx";
import AdminSupport from "./pages/AdminSupport.jsx";
import Login from "./pages/Login.jsx";
import PhoneVerify from "./pages/PhoneVerify.jsx";

function useTheme() {
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem("theme") || "light"; } catch { return "light"; }
  });
  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch {}
  }, [theme]);
  return [theme, () => setTheme((t) => (t === "light" ? "dark" : "light"))];
}

// Login ke bina koi page nahi khulega
function RequireAuth({ children }) {
  const { user, loading } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="center-load"><span className="spinner dark" /></div>;
  if (!user) return <Navigate to="/login" state={{ from: loc.pathname }} replace />;
  return children;
}

// Khoya hua item dhundhne ke liye phone verified hona chahiye
function RequirePhone({ children }) {
  const { user } = useAuth();
  const loc = useLocation();
  if (!user?.phoneVerified) return <Navigate to="/verify-phone" state={{ from: loc.pathname }} replace />;
  return children;
}

export default function App() {
  const [theme, toggle] = useTheme();
  const { user, logout } = useAuth();
  const { pathname } = useLocation();
  
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <>
      <header className="nav">
        <div className="nav-inner">
          <Link to="/" className="logo">
            <span className="logo-mark">🔎</span> Found<span>IT</span>
          </Link>
          <nav className="nav-links">
            {user && (
              <>
                <NavLink to="/found">📦 Mujhe mila</NavLink>
                <NavLink to="/search">🔍 Mera kho gaya</NavLink>
                <NavLink to="/support">💬 Support</NavLink>
              </>
            )}
            <button className="theme-btn" onClick={toggle} aria-label="Toggle theme">
              {theme === "light" ? "🌙" : "☀️"}
            </button>
            {user && (
              <div className="user-chip" title={user.email}>
                {user.picture ? <img src={user.picture} alt="" referrerPolicy="no-referrer" /> : <span>👤</span>}
                <b>{(user.name || "User").split(" ")[0]}</b>
                {user.phoneVerified && <i title="Phone verified">✓</i>}
                <button onClick={logout}>Logout</button>
              </div>
            )}
          </nav>
        </div>
      </header>

      <main className="container" key={pathname}>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={<RequireAuth><Home /></RequireAuth>} />
          <Route path="/found" element={<RequireAuth><UploadPage /></RequireAuth>} />
          <Route path="/verify-phone" element={<RequireAuth><PhoneVerify /></RequireAuth>} />
          <Route path="/search" element={<RequireAuth><RequirePhone><SearchPage /></RequirePhone></RequireAuth>} />
          <Route path="/support" element={<RequireAuth><SupportPage /></RequireAuth>} />
          <Route path="/admin" element={<RequireAuth><AdminSupport /></RequireAuth>} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>

      <footer className="footer">Made with 💜 · FoundIT — khoye hue ko apno se milao</footer>
    </>
  );
}