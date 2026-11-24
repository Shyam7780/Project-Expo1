import { useState } from "react";
import axios from "axios";
import PinMap from "../components/PinMap.jsx";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [desc, setDesc] = useState("");
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");

  const submit = async () => {
    if (!file || !pos) return setError("Photo aur map pin dono zaroori hain.");
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("description", desc);
      fd.append("lat", pos[0]);
      fd.append("lng", pos[1]);
      const { data } = await axios.post("/api/items", fd);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  return (
    <div className="card">
      <h2>Found an item?</h2>
      <label>Photo</label>
      <input type="file" accept="image/*" onChange={(e) => setFile(e.target.files[0])} />

      <label>Short description (optional)</label>
      <textarea rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />

      <label>Drop-off location (map par click karke pin lagao)</label>
      <PinMap onChange={setPos} />

      <button onClick={submit} disabled={loading}>
        {loading ? "Uploading..." : "Submit Found Item"}
      </button>
      {error && <div className="msg" style={{ color: "crimson" }}>{error}</div>}

      {result && (
        <div className="msg">
          Item saved! Auto tags:
          <div>{result.tags.map((t) => <span className="tag" key={t}>{t}</span>)}</div>
        </div>
      )}
    </div>
  );
}
