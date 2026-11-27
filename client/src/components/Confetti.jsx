const COLORS = ["#6366f1", "#ec4899", "#f59e0b", "#10b981", "#3b82f6", "#ef4444"];

export default function Confetti() {
  const pieces = Array.from({ length: 60 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 0.8,
    dur: 2 + Math.random() * 2,
    color: COLORS[i % COLORS.length],
    size: 6 + Math.random() * 8,
    rot: Math.random() * 360,
  }));
  return (
    <div className="confetti" aria-hidden="true">
      {pieces.map((p) => (
        <i
          key={p.id}
          style={{
            left: `${p.left}%`,
            background: p.color,
            width: p.size,
            height: p.size * 0.5,
            animationDelay: `${p.delay}s`,
            animationDuration: `${p.dur}s`,
            transform: `rotate(${p.rot}deg)`,
          }}
        />
      ))}
    </div>
  );
}

