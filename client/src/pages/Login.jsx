import { useEffect, useRef, useState } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../AuthContext.jsx";

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;

export default function Login() {
  const { user, loginWithGoogle } = useAuth();
  const btn = useRef(null);
  const loc = useLocation();
  const from = loc.state?.from || "/";
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!CLIENT_ID) return;
    let tries = 0;
    const t = setInterval(() => {
      if (window.google?.accounts?.id) {
        clearInterval(t);
        window.google.accounts.id.initialize({
          client_id: CLIENT_ID,
          callback: async (resp) => {
            setBusy(true);
            setError("");
            try {
              await loginWithGoogle(resp.credential);
              window.location.replace(from); // <-- यही बदलाव किया है
            } catch (e) {
              setError(e.response?.data?.error || e.message);
              setBusy(false);
            }
          },
        });
        window.google.accounts.id.renderButton(btn.current, {
          theme: "outline", size: "large", shape: "pill", text: "continue_with", width: 300,
        });
      } else if (++tries > 50) {
        clearInterval(t);
        setError("Google script load nahi hui. Internet check karke page refresh karo.");
      }
    }, 100);
    return () => clearInterval(t);
  }, []);

  if (user) return <Navigate to={from} replace />;

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div className="login-emoji">🔎</div>
        <h2>FoundIT me aapka swagat hai</h2>
        <p>Khoya hua samaan dhundhne ya kisi ki madad karne ke liye Google se login karo. Bas ek click.</p>

        {CLIENT_ID ? (
          <div className="google-btn" ref={btn} />
        ) : (
          <div className="alert alert-error">
            ⚠️ <code>VITE_GOOGLE_CLIENT_ID</code> client/.env me set nahi hai.
          </div>
        )}

        {busy && <div className="hint">Login ho raha hai...</div>}
        {error && <div className="alert alert-error">⚠️ {error}</div>}

        <ul className="login-points">
          <li>🔒 Aapka password hum kabhi nahi dekhte</li>
          <li>📱 Item dhundhne ke liye phone verify karna hoga</li>
          <li>🗓️ Items 20 din baad apne aap hat jaate hain</li>
        </ul>
      </div>
    </div>
  );
}