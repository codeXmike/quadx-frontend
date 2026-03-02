import Icon from "../components/Icon";

function LandingPage({ onOpenLogin }) {
  const features = [
    { icon: "zap", title: "Multiplayer", desc: "Online matches with 2, 3, or 4 players simultaneously." },
    { icon: "trophy", title: "Rank Ladder", desc: "Elo based rating system with daily, weekly, and all-time leaderboards." },
    { icon: "target", title: "Swiss Tournaments", desc: "Competitive events with smart Swiss-system pairings and live standings." },
    { icon: "friends", title: "Friends & Challenges", desc: "Add friends, send invites, and challenge anyone directly." },
    { icon: "clock", title: "Clock Timing", desc: "Per-player time banks that carry across turns for true competitive format." },
    { icon: "eye", title: "Live Spectating", desc: "Watch any active game live with real-time board and chat." }
  ];

  return (
    <div className="landing-page">
      <nav className="landing-nav">
        <div style={{ display: "flex", alignItems: "center", gap: "0.6rem" }}>
          <div className="sidebar-brand-mark">Q</div>
          <span style={{ fontFamily: "'Syne', sans-serif", fontWeight: 800, fontSize: "1.1rem" }}>QuadX</span>
        </div>
        <button className="btn btn-primary" onClick={onOpenLogin}>
          Play Now <Icon name="arrow-right" size={14} />
        </button>
      </nav>

      <section className="landing-hero">
        <div className="hero-eyebrow">
          <span className="live-dot" />
          Competitive & Tatical
        </div>
        <h1 className="hero-title">
          Drop.<br />
          Connect.<br />
          <span className="accent">Dominate.</span>
        </h1>
        <p className="hero-sub">
          The multiplayer platform for QuadX. Rated matches, tournaments,
          live spectating. Join the community and prove you're the best!
        </p>
        <div className="hero-cta">
          <button className="btn btn-primary btn-lg" onClick={onOpenLogin}>Get Started Free</button>
          <button className="btn btn-secondary btn-lg" onClick={onOpenLogin}>View Leaderboard</button>
        </div>
      </section>

      <div className="feature-grid">
        {features.map((f) => (
          <div key={f.title} className="feature-card">
            <div className="feature-icon"><Icon name={f.icon} size={22} /></div>
            <div className="feature-title">{f.title}</div>
            <div className="feature-desc">{f.desc}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LandingPage;
