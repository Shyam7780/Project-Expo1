import { useState } from "react";
import api from "../api.js";

const CATEGORIES = [
  { v: "claim", l: "🙋 Item claim ki problem" },
  { v: "upload", l: "📦 Upload ki problem" },
  { v: "search", l: "🔍 Search ki problem" },
  { v: "report", l: "🚩 Fake / spam report" },
  { v: "other", l: "💬 Kuch aur" },
];

const STATUS = {
  open: { t: "Open", c: "st-open" },
  in_progress: { t: "In Progress", c: "st-prog" },
  resolved: { t: "Resolved ✓", c: "st-done" },
};

export default function SupportPage() {
  const [tab, setTab] = useState("new");

  // new query
  const [form, setForm] = useState({ name: "", email: "", category: "other", subject: "", message: "" });
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [ticketId, setTicketId] = useState("");
  const [copied, setCopied] = useState(false);

  // track
  const [track, setTrack] = useState({ ticketId: "", email: "" });
  const [tracking, setTracking] = useState(false);
  const [trackErr, setTrackErr] = useState("");
  const [ticket, setTicket] = useState(null);

  const set = (k) => (e) => setForm({ ...form, [k]: e.target.value });

  const submit = async () => {
    setError("");
    setSending(true);
    try {
      const { data } = await api.post("/api/support", form);
      setTicketId(data.ticketId);
      setTrack({ ticketId: data.ticketId, email: form.email });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setSending(false);
  };

  const checkStatus = async () => {
    setTrackErr("");
    setTicket(null);
    setTracking(true);
    try {
      const { data } = await api.post("/api/support/track", track);
      setTicket(data);
    } catch (e) {
      setTrackErr(e.response?.data?.error || e.message);
    }
    setTracking(false);
  };

  const copy = () => {
    navigator.clipboard?.writeText(ticketId);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  const resetForm = () => {
    setTicketId("");
    setForm({ name: "", email: "", category: "other", subject: "", message: "" });
  };

  return (
    <div className="page">
      <h2 className="page-title">💬 Support</h2>
      <p className="page-sub">Koi problem ya sawal hai? Apni query bhejo, hum jald jawab denge.</p>

      <div className="tabs">
        <button className={tab === "new" ? "on" : ""} onClick={() => setTab("new")}>✉️ Nayi query</button>
        <button className={tab === "track" ? "on" : ""} onClick={() => setTab("track")}>🔎 Ticket status</button>
      </div>

      {tab === "new" && !ticketId && (
        <div className="card">
          <label className="field">Aapka naam
            <input type="text" value={form.name} onChange={set("name")} placeholder="Rohit" />
          </label>
          <label className="field">Email (jawab yahin se track hoga)
            <input type="text" value={form.email} onChange={set("email")} placeholder="you@example.com" />
          </label>
          <label className="field">Query ka type
            <select value={form.category} onChange={set("category")}>
              {CATEGORIES.map((c) => <option key={c.v} value={c.v}>{c.l}</option>)}
            </select>
          </label>
          <label className="field">Subject
            <input type="text" value={form.subject} onChange={set("subject")} placeholder="Chhota title likho" maxLength={120} />
          </label>
          <label className="field">Apni problem likho
            <textarea rows={5} value={form.message} onChange={set("message")} maxLength={1500}
              placeholder="Kya hua, kab hua, kaunsa item ya page tha..." />
            <span className="hint">{form.message.length}/1500</span>
          </label>

          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={sending}>
            {sending ? <><span className="spinner" /> Bhej rahe hain...</> : "📨 Query Bhejo"}
          </button>
        </div>
      )}

      {tab === "new" && ticketId && (
        <div className="success-card">
          <div className="success-emoji">✅</div>
          <h2>Query mil gayi!</h2>
          <p>Ye Ticket ID sambhal ke rakho, isse status dekh sakte ho:</p>
          <div className="ticket-id">{ticketId}</div>
          <div style={{ display: "flex", gap: 10, justifyContent: "center", flexWrap: "wrap" }}>
            <button className="btn btn-white btn-sm" onClick={copy}>{copied ? "Copied ✓" : "📋 Copy ID"}</button>
            <button className="btn btn-white btn-sm" onClick={() => { setTab("track"); checkStatus(); }}>🔎 Status dekho</button>
            <button className="btn btn-outline btn-sm" onClick={resetForm}>+ Nayi query</button>
          </div>
        </div>
      )}

      {tab === "track" && (
        <div className="card">
          <label className="field">Ticket ID
            <input type="text" value={track.ticketId} onChange={(e) => setTrack({ ...track, ticketId: e.target.value })} placeholder="FI-AB12CD" />
          </label>
          <label className="field">Email (jisse query bheji thi)
            <input type="text" value={track.email} onChange={(e) => setTrack({ ...track, email: e.target.value })} placeholder="you@example.com" />
          </label>
          {trackErr && <div className="alert alert-error">⚠️ {trackErr}</div>}
          <button className="btn btn-primary btn-block" onClick={checkStatus} disabled={tracking}>
            {tracking ? "Dhundh rahe hain..." : "Status dekho"}
          </button>

          {ticket && (
            <div className="ticket-view">
              <div className="ticket-head">
                <b>{ticket.ticketId}</b>
                <span className={`status ${STATUS[ticket.status].c}`}>{STATUS[ticket.status].t}</span>
              </div>
              <h4>{ticket.subject}</h4>
              <p className="ticket-msg">{ticket.message}</p>
              <div className="hint">Bheji gayi: {new Date(ticket.createdAt).toLocaleString()}</div>
              <div className={`reply-box ${ticket.reply ? "" : "empty-reply"}`}>
                {ticket.reply ? <><b>💬 Support ka jawab:</b><p>{ticket.reply}</p></> : "Abhi jawab nahi aaya. Hum jald dekhenge."}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
