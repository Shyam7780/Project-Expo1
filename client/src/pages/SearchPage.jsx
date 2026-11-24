import { useState } from "react";
import axios from "axios";
import PinMap from "../components/PinMap.jsx";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const [pos, setPos] = useState(null);
  const [radius, setRadius] = useState(5);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const search = async () => {
    if (!query || !pos) return setError("Query likho aur map par landmark chuno.");
    setError("");
    setLoading(true);
    try {
      const { data } = await axios.post("/api/items/search", {
        query,
        lat: pos[0],
        lng: pos[1],
        radiusKm: Number(radius),
      });
      setResults(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <>
      <div className="card">
        <h2>Lost something?</h2>
        <label>Kya kho gaya? (e.g. black backpack with laptop)</label>
        <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} />

        <label>Landmark / search area (map par click karo)</label>
        <PinMap onChange={setPos} />

        <label>Radius (km)</label>
        <input type="number" min="1" value={radius} onChange={(e) => setRadius(e.target.value)} />

        <button onClick={search} disabled={loading}>{loading ? "Searching..." : "Search"}</button>
        {error && <div className="msg" style={{ color: "crimson" }}>{error}</div>}
      </div>

      {results && results.length === 0 && <div className="card">Koi match nahi mila.</div>}
      {results && results.map((r) => (
        <div className="card result" key={r._id}>
          <img src={r.imageUrl} alt="found item" />
          <div>
            <b>Match: {(r.score * 100).toFixed(0)}%</b>
            <div>{r.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
            {r.description && <p>{r.description}</p>}
          </div>
        </div>
      ))}
    </>
  );
}
