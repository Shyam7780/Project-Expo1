import { useEffect, useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import axios from "axios";

function ClickHandler({ onPick }) {
  useMapEvents({ click: (e) => onPick([e.latlng.lat, e.latlng.lng], false) });
  return null;
}

function FlyTo({ target }) {
  const map = useMap();
  useEffect(() => {
    if (target) map.setView(target, 15);
  }, [target, map]);
  return null;
}

export default function PinMap({ onChange }) {
  const [pos, setPos] = useState(null);
  const [flyTarget, setFlyTarget] = useState(null);
  const [text, setText] = useState("");
  const [options, setOptions] = useState([]);
  const [searching, setSearching] = useState(false);
  const [msg, setMsg] = useState("");

  const pick = (ll, fly = true) => {
    setPos(ll);
    onChange(ll);
    if (fly) setFlyTarget([...ll]);
  };

  const useMyLocation = () => {
    navigator.geolocation?.getCurrentPosition(
      (p) => pick([p.coords.latitude, p.coords.longitude]),
      () => setMsg("Location permission nahi mili.")
    );
  };

  useEffect(() => {
    useMyLocation();
  }, []);

  const searchPlace = async () => {
    if (!text.trim()) return;
    setSearching(true);
    setMsg("");
    setOptions([]);
    try {
      const { data } = await axios.get("https://nominatim.openstreetmap.org/search", {
        params: { q: text, format: "json", limit: 5, countrycodes: "in" },
      });
      if (data.length === 0) setMsg("Ye jagah nahi mili, naam thoda alag likh ke dekho.");
      else if (data.length === 1) choose(data[0]);
      else setOptions(data);
    } catch {
      setMsg("Search nahi ho paya, internet check karo.");
    }
    setSearching(false);
  };

  const choose = (place) => {
    pick([parseFloat(place.lat), parseFloat(place.lon)]);
    setText(place.display_name.split(",").slice(0, 2).join(","));
    setOptions([]);
  };

  return (
    <div>
      <div className="place-search">
        <input
          type="text"
          placeholder="Area ya landmark likho (e.g. Katra bus stand)"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), searchPlace())}
        />
        <button type="button" className="btn btn-primary btn-sm" onClick={searchPlace} disabled={searching}>
          {searching ? "..." : "Find"}
        </button>
        <button type="button" className="btn btn-soft btn-sm" onClick={useMyLocation}>
          📍 Meri location
        </button>
      </div>

      {msg && <div className="alert alert-error">{msg}</div>}

      {options.length > 0 && (
        <ul className="place-options">
          {options.map((o) => (
            <li key={o.place_id} onClick={() => choose(o)}>{o.display_name}</li>
          ))}
        </ul>
      )}

      <div className="map-wrap">
        <MapContainer center={[32.7266, 74.857]} zoom={13} style={{ height: 320 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution="&copy; OpenStreetMap contributors"
          />
          <ClickHandler onPick={pick} />
          <FlyTo target={flyTarget} />
          {pos && <Marker position={pos} />}
        </MapContainer>
      </div>
      <p className="hint">Map par click karke pin ko sahi jagah par laga sakte ho.</p>
    </div>
  );
}
