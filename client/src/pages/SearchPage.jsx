import { useState } from "react";
import api from "../api.js";
import PinMap from "../components/PinMap.jsx";
import ItemCard from "../components/ItemCard.jsx";

const CATEGORIES = [
  { e: "📱", l: "phone", c: "c1" },
  { e: "👛", l: "wallet", c: "c2" },
  { e: "🎒", l: "bag", c: "c3" },
  { e: "🔑", l: "keys", c: "c4" },
  { e: "⌚", l: "watch", c: "c5" },
  { e: "💻", l: "laptop", c: "c6" },
  { e: "🎧", l: "earphones", c: "c7" },
  { e: "👓", l: "glasses", c: "c8" },
];

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState(null);
  const [radius, setRadius] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query.trim()) return setError("Pehle likho ki kya kho gaya hai.");
    if (!pos) return setError("Map par apna area ya landmark chuno.");
    setError("");
    setLoading(true);
    setResults(null);
    try {
      const { data } = await api.post("/api/items/search", {
        query,
        lat: pos[0],
        lng: pos[1],
        radiusKm: Number(radius),
      });
      setResults(data);
      setTimeout(() => document.getElementById("results")?.scrollIntoView({ behavior: "smooth" }), 100);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="page">
      <h2 className="page-title">🔍 Mera item kho gaya</h2>
      <p className="page-sub">Batao kya khoya aur kahan, hum aas-paas mile items me dhundhenge.</p>

      <div className="card">
        <div className="step-label"><span>1</span> Kya kho gaya?</div>
        <div className="cat-grid">
          {CATEGORIES.map((c) => (
            <button
              key={c.l}
              type="button"
              className={`cat ${c.c} ${query.toLowerCase() === c.l ? "active" : ""}`}
              onClick={() => setQuery(c.l)}
            >
              <span>{c.e}</span>{c.l}
            </button>
          ))}
        </div>
        <input
          type="text"
          style={{ marginTop: 14 }}
          placeholder="ya khud likho: black iPhone with cracked cover"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && search()}
        />
      </div>

      <div className="card">
        <div className="step-label"><span>2</span> Kahan khoya? (area / landmark)</div>
        <PinMap onChange={setPos} />

        <div className="step-label" style={{ marginTop: 20 }}>
          <span>3</span> Search radius: <b className="radius-val">{radius} km</b>
        </div>
        <input
          className="range"
          type="range"
          min="1"
          max="50"
          value={radius}
          style={{ "--v": `${((radius - 1) / 49) * 100}%` }}
          onChange={(e) => setRadius(e.target.value)}
        />
        <div className="range-labels"><span>1 km</span><span>50 km</span></div>
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <button className="btn btn-primary btn-lg btn-block" onClick={search} disabled={loading}>
        {loading ? <><span className="spinner" /> Dhundh rahe hain...</> : "🔎 Search Karo"}
      </button>

      <div id="results" style={{ marginTop: 30 }}>
        {loading && (
          <div className="grid">
            {[0, 1, 2].map((i) => (
              <div className="item-card skeleton" key={i}>
                <div className="sk-img" />
                <div className="sk-line" /><div className="sk-line short" />
              </div>
            ))}
          </div>
        )}

        {results && (
          <>
            <h3 className="section-title">
              {results.length > 0 ? `🎯 ${results.length} match mile` : "Koi match nahi mila"}
            </h3>
            {results.length === 0 && (
              <div className="empty">
                <div className="empty-emoji">🫥</div>
                <b>Is area me abhi koi matching item nahi hai</b>
                <p>Radius badha ke ya dusre shabd likh ke try karo. Baad me phir check karna, koi item upload ho sakta hai.</p>
              </div>
            )}
            <div className="grid">
              {results.map((r, i) => <ItemCard key={r._id} item={r} index={i} />)}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
