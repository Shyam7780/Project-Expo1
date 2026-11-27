function timeAgo(date) {
  const s = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (s < 60) return "abhi abhi";
  if (s < 3600) return `${Math.floor(s / 60)} min pehle`;
  if (s < 86400) return `${Math.floor(s / 3600)} ghante pehle`;
  return `${Math.floor(s / 86400)} din pehle`;
}

const EXPIRY_DAYS = 20;

export default function ItemCard({ item, index = 0 }) {
  const hasScore = item.score !== undefined;
  const pct = Math.round((item.score || 0) * 100);
  const color = pct >= 60 ? "#22c55e" : pct >= 30 ? "#f59e0b" : "#94a3b8";
  const label = pct >= 60 ? "Best match" : pct >= 30 ? "Ho sakta hai" : "Kam match";
  const [lng, lat] = item.location.coordinates;
  const ageDays = Math.floor((Date.now() - new Date(item.createdAt).getTime()) / 86400000);
  const daysLeft = Math.max(EXPIRY_DAYS - ageDays, 0);

  return (
    <div className="item-card" style={{ animationDelay: `${index * 90}ms` }}>
      <div className="item-img">
        <img src={item.imageUrl} alt="found item" loading="lazy" />
        {hasScore && (
          <div className="ring" style={{ "--p": pct, "--c": color }} title={label}>
            <span>{pct}%</span>
          </div>
        )}
        {hasScore && <span className="match-label" style={{ background: color }}>{label}</span>}
      </div>
      <div className="item-body">
        <div className="tags">
          {item.tags.slice(0, 6).map((t, i) => (
            <span className={`tag tag-${i % 5}`} key={t}>{t}</span>
          ))}
        </div>
        {item.description && <p className="item-desc">“{item.description}”</p>}
        <div className="item-meta">
          <span>🕒 {timeAgo(item.createdAt)} · ⏳ {daysLeft} din baaki</span>
          <a href={`https://www.google.com/maps?q=${lat},${lng}`} target="_blank" rel="noreferrer">
            📍 Map par dekho →
          </a>
        </div>
      </div>
    </div>
  );
}
