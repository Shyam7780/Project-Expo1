import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const WORDS = ["phone", "wallet", "bag", "keys", "watch", "laptop"];
const FLOATERS = [
  { e: "📱", style: { top: "12%", left: "6%", animationDelay: "0s" } },
  { e: "👛", style: { top: "62%", left: "10%", animationDelay: "1s" } },
  { e: "🎒", style: { top: "18%", right: "8%", animationDelay: "0.5s" } },
  { e: "🔑", style: { top: "70%", right: "12%", animationDelay: "1.5s" } },
  { e: "⌚", style: { top: "40%", left: "3%", animationDelay: "2s" } },
  { e: "💻", style: { top: "42%", right: "3%", animationDelay: "0.8s" } },
];

const FEATURES = [
  { icon: "🤖", cls: "f1", title: "AI Auto Tags", text: "Photo daalte hi AI item ko pehchan kar tags bana deta hai." },
  { icon: "📍", cls: "f2", title: "Map Location", text: "Item kahan rakha hai, map par pin lagao ya area ka naam likho." },
  { icon: "⚡", cls: "f3", title: "Smart Match", text: "Aapke shabdon ko items se match karke best result upar dikhata hai." },
  { icon: "🏆", cls: "f4", title: "Karma Points", text: "Madad karne walon ko rating aur points milenge (jald aa raha hai)." },
];

const STEPS = [
  { n: 1, title: "Photo ya description", text: "Finder photo upload karta hai, seeker likhta hai kya khoya." },
  { n: 2, title: "Location chuno", text: "Map par landmark ya area select karo." },
  { n: 3, title: "Match mil gaya!", text: "AI aas-paas ke items me se sabse milta hua dikhata hai." },
];

export default function Home() {
  const [i, setI] = useState(0);
  useEffect(() => {
    const t = setInterval(() => setI((x) => (x + 1) % WORDS.length), 1800);
    return () => clearInterval(t);
  }, []);

  return (
    <>
      <section className="hero">
        <div className="blob b1" /><div className="blob b2" /><div className="blob b3" />
        {FLOATERS.map((f, k) => (
          <span className="floater" key={k} style={f.style}>{f.e}</span>
        ))}

        <div className="hero-content">
          <span className="pill">✨ AI Powered Lost &amp; Found</span>
          <h1>
            Aapka <span className="rotator" key={i}>{WORDS[i]}</span> kho gaya?
            <br />Ab <span className="grad-text">milega!</span>
          </h1>
          <p>Photo daalo, location batao, baaki kaam AI karega. Seconds me apna samaan dhundho.</p>
          <div className="hero-actions">
            <Link className="btn btn-white btn-lg pulse" to="/search">🔍 Mera item kho gaya</Link>
            <Link className="btn btn-outline btn-lg" to="/found">📦 Mujhe item mila</Link>
          </div>
        </div>
      </section>

      <h2 className="home-title">Kyun <span className="grad-text">FoundIT</span>?</h2>
      <section className="features">
        {FEATURES.map((f) => (
          <div className={`feature ${f.cls}`} key={f.title}>
            <div className="feature-icon">{f.icon}</div>
            <h3>{f.title}</h3>
            <p>{f.text}</p>
          </div>
        ))}
      </section>

      <h2 className="home-title">Kaise <span className="grad-text">kaam karta hai</span></h2>
      <section className="how">
        {STEPS.map((s) => (
          <div className="how-step" key={s.n}>
            <div className="how-n">{s.n}</div>
            <div>
              <h3>{s.title}</h3>
              <p>{s.text}</p>
            </div>
          </div>
        ))}
      </section>

      <section className="cta">
        <h2>Kisi ki madad karna chahte ho?</h2>
        <p>Agar aapko koi samaan mila hai, to 30 second me upload kar do.</p>
        <Link className="btn btn-white btn-lg" to="/found">📦 Found item daalo</Link>
      </section>
    </>
  );
}
