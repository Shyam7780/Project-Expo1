import { useState } from "react";
import api from "../api.js";

export default function AdminSupport() {
  const [key, setKey] = useState("");
  const [tickets, setTickets] = useState(null);
  const [error, setError] = useState("");
  const [drafts, setDrafts] = useState({});

  const headers = { "x-admin-key": key };

  const load = async () => {
    setError("");
    try {
      const { data } = await api.get("/api/support/admin/all", { headers });
      setTickets(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const save = async (t) => {
    const d = drafts[t._id] || {};
    try {
      const { data } = await api.patch(
        `/api/support/admin/${t._id}`,
        { status: d.status ?? t.status, reply: d.reply ?? t.reply },
        { headers }
      );
      setTickets(tickets.map((x) => (x._id === t._id ? data : x)));
      setDrafts({ ...drafts, [t._id]: undefined });
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
  };

  const edit = (id, k, v) => setDrafts({ ...drafts, [id]: { ...(drafts[id] || {}), [k]: v } });

  if (!tickets) {
    return (
      <div className="page">
        <h2 className="page-title">🛠️ Admin: Support Tickets</h2>
        <div className="card">
          <label className="field">Admin key
            <input type="text" value={key} onChange={(e) => setKey(e.target.value)} placeholder="server .env wali ADMIN_KEY" />
          </label>
          {error && <div className="alert alert-error">⚠️ {error}</div>}
          <button className="btn btn-primary btn-block" onClick={load}>Tickets dikhao</button>
        </div>
      </div>
    );
  }

  return (
    <div className="page" style={{ maxWidth: 820 }}>
      <h2 className="page-title">🛠️ Support Tickets ({tickets.length})</h2>
      {error && <div className="alert alert-error">⚠️ {error}</div>}
      {tickets.length === 0 && <div className="empty">Abhi koi ticket nahi hai.</div>}
      {tickets.map((t) => (
        <div className="card" key={t._id}>
          <div className="ticket-head">
            <b>{t.ticketId} · {t.category}</b>
            <span className="hint">{new Date(t.createdAt).toLocaleString()}</span>
          </div>
          <h4 style={{ margin: "8px 0 4px" }}>{t.subject}</h4>
          <div className="hint">{t.name} · {t.email}</div>
          <p className="ticket-msg">{t.message}</p>
          <select value={drafts[t._id]?.status ?? t.status} onChange={(e) => edit(t._id, "status", e.target.value)}>
            <option value="open">Open</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
          <textarea rows={2} style={{ marginTop: 10 }} placeholder="User ko jawab likho..."
            value={drafts[t._id]?.reply ?? t.reply} onChange={(e) => edit(t._id, "reply", e.target.value)} />
          <button className="btn btn-primary btn-sm" style={{ marginTop: 10 }} onClick={() => save(t)}>Save</button>
        </div>
      ))}
    </div>
  );
}
