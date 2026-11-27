import { useState, useEffect } from "react";
import api from "../api.js";
import PinMap from "../components/PinMap.jsx";
import ItemCard from "../components/ItemCard.jsx";
import Confetti from "../components/Confetti.jsx";

export default function UploadPage() {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [desc, setDesc] = useState("");
  const [pos, setPos] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [drag, setDrag] = useState(false);

  useEffect(() => {
    if (!file) return setPreview(null);
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  const onDrop = (e) => {
    e.preventDefault();
    setDrag(false);
    const f = e.dataTransfer.files?.[0];
    if (f && f.type.startsWith("image/")) setFile(f);
  };

  const submit = async () => {
    if (!file) return setError("Pehle item ki photo chuno.");
    if (!pos) return setError("Map par location pin lagao.");
    setError("");
    setLoading(true);
    try {
      const fd = new FormData();
      fd.append("image", file);
      fd.append("description", desc);
      fd.append("lat", pos[0]);
      fd.append("lng", pos[1]);
      const { data } = await api.post("/api/items", fd);
      setResult(data);
    } catch (e) {
      setError(e.response?.data?.error || e.message);
    }
    setLoading(false);
  };

  const reset = () => {
    setFile(null);
    setDesc("");
    setResult(null);
  };

  if (result) {
    return (
      <div className="page">
        <Confetti />
        <div className="success-card">
          <div className="success-emoji">🎉</div>
          <h2>Shukriya! Item save ho gaya</h2>
          <p>Aapne kisi ki badi madad ki hai. Owner search karke ise dhundh lega.</p>
        </div>
        <h3 className="section-title">🤖 AI ne ye tags banaye</h3>
        <ItemCard item={result} />
        <button className="btn btn-primary btn-lg btn-block" onClick={reset}>+ Ek aur item daalo</button>
      </div>
    );
  }

  const steps = [
    { label: "Photo", done: !!file },
    { label: "Location", done: !!pos },
    { label: "Submit", done: false },
  ];

  return (
    <div className="page">
      <h2 className="page-title">📦 Mujhe item mila</h2>
      <p className="page-sub">Photo daalo aur batao ki item kahan rakha hai.</p>

      <div className="progress">
        {steps.map((s, i) => (
          <div key={s.label} className={`prog-step ${s.done ? "done" : ""}`}>
            <span>{s.done ? "✓" : i + 1}</span>{s.label}
          </div>
        ))}
      </div>

      <div className="card">
        <div className="step-label"><span>1</span> Item ki photo</div>
        <label
          className={`dropzone ${preview ? "has-img" : ""} ${drag ? "drag" : ""}`}
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={onDrop}
        >
          {preview ? (
            <img src={preview} alt="preview" />
          ) : (
            <div>
              <div className="dz-icon">📷</div>
              <b>Photo yahan drop karo ya click karo</b>
              <div className="hint">JPG / PNG, 8MB tak</div>
            </div>
          )}
          <input type="file" accept="image/*" hidden onChange={(e) => setFile(e.target.files[0] || null)} />
        </label>
        {preview && (
          <button type="button" className="btn btn-soft btn-sm" onClick={() => setFile(null)}>
            🗑️ Photo hatao
          </button>
        )}

        <div className="step-label" style={{ marginTop: 20 }}><span>2</span> Chhota description (optional)</div>
        <textarea
          rows={2}
          placeholder="e.g. black iPhone, cracked back cover"
          value={desc}
          onChange={(e) => setDesc(e.target.value)}
        />
      </div>

      <div className="card">
        <div className="step-label"><span>3</span> Item kahan rakha hai?</div>
        <PinMap onChange={setPos} />
      </div>

      {error && <div className="alert alert-error">⚠️ {error}</div>}

      <button className="btn btn-primary btn-lg btn-block" onClick={submit} disabled={loading}>
        {loading ? <><span className="spinner" /> AI photo analyze kar raha hai...</> : "🚀 Submit Found Item"}
      </button>
    </div>
  );
}
