import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import api from "../api.js";
import { useAuth } from "../AuthContext.jsx";

export default function PhoneVerify() {
  const { user, setUser } = useAuth();
  const nav = useNavigate();
  const loc = useLocation();
  const from = loc.state?.from || "/search";

  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [sent, setSent] = useState(false);
  const [devOtp, setDevOtp] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [wait, setWait] = useState(0);

  useEffect(() => {
    if (user?.phoneVerified) nav(from, { replace: true });
  }, [user]);

  useEffect(() => {
    if (wait <= 0) return;
    const t = setTimeout(() => setWait(wait - 1), 1000);
    return () => clearTimeout(t);
  }, [wait]);

  const sendOtp = async () => {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/phone/send-otp", { phone });
      setSent(true);
      setDevOtp(data.devOtp || "");
      setWait(30);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  const verify = async () => {
    setError("");
    setBusy(true);
    try {
      const { data } = await api.post("/api/auth/phone/verify", { phone, otp });
      setUser(data.user);
      nav(from, { replace: true });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setBusy(false);
  };

  return (
    <div className="page" style={{ maxWidth: 480 }}>
      <h2 className="page-title">📱 Phone verify karo</h2>
      <p className="page-sub">
        Khoya hua item dhundhne se pehle phone number verify karna zaruri hai, taaki finder aur owner ke beech bharosa bana rahe.
      </p>

      <div className="card">
        <label className="field">Mobile number
          <div className="phone-row">
            <span className="phone-prefix">🇮🇳 +91</span>
            <input type="text" inputMode="numeric" maxLength={10} placeholder="10 digit number"
              value={phone} disabled={sent}
              onChange={(e) => setPhone(e.target.value.replace(/\D/g, ""))} />
          </div>
        </label>

        {!sent && (
          <button className="btn btn-primary btn-block" onClick={sendOtp} disabled={busy || phone.length !== 10}>
            {busy ? "Bhej rahe hain..." : "OTP bhejo"}
          </button>
        )}

        {sent && (
          <>
            {devOtp && (
              <div className="demo-box">
                🧪 <b>Demo mode:</b> SMS nahi jata. Aapka OTP: <b className="demo-otp">{devOtp}</b>
              </div>
            )}
            <label className="field">6 digit OTP
              <input type="text" inputMode="numeric" maxLength={6} className="otp-input" placeholder="••••••"
                value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))} />
            </label>
            <button className="btn btn-primary btn-block" onClick={verify} disabled={busy || otp.length < 4}>
              {busy ? "Check ho raha hai..." : "Verify karo ✓"}
            </button>
            <div className="resend">
              {wait > 0 ? `Dobara OTP ${wait}s baad` : (
                <button type="button" className="link-btn" onClick={() => { setSent(false); setOtp(""); setDevOtp(""); }}>
                  Number badlo / OTP dobara bhejo
                </button>
              )}
            </div>
          </>
        )}

        {error && <div className="alert alert-error">⚠️ {error}</div>}
      </div>
    </div>
  );
}
