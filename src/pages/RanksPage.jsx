import { useMemo } from "react";
import { RATING_TIERS, getRatingTier } from "../utils/ratingTier";

const TRACK_MAX_POINTS = 3000;

function clampTrackPoints(points) {
  const score = Number(points) || 0;
  if (score < 0) return 0;
  if (score > TRACK_MAX_POINTS) return TRACK_MAX_POINTS;
  return score;
}

function toPercent(points) {
  return (clampTrackPoints(points) / TRACK_MAX_POINTS) * 100;
}

function RanksPage({ user, friends }) {
  const players = useMemo(() => {
    const map = new Map();
    map.set(String(user.username || "").toLowerCase(), {
      id: `me_${user.id || user.username}`,
      username: user.username,
      rating: Number(user.rating || 1000),
      avatarUrl: user.avatarUrl || "",
      isYou: true
    });

    for (const friend of friends || []) {
      const key = String(friend.username || "").toLowerCase();
      if (!key || map.has(key)) continue;
      map.set(key, {
        id: friend.id || key,
        username: friend.username,
        rating: Number(friend.rating || 1000),
        avatarUrl: friend.avatarUrl || "",
        isYou: false
      });
    }

    return Array.from(map.values()).sort((a, b) => b.rating - a.rating);
  }, [user, friends]);

  const tierStops = RATING_TIERS.map((tier) => ({
    ...tier,
    at: toPercent(tier.min)
  }));

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Ranks <span>Line</span></h1>
      </div>

      <div className="card mb">
        <div className="panel-title mb-sm">Points To The One</div>
        <div className="ranks-track-wrap">
          <div className="ranks-track" />

          {tierStops.map((tier) => (
            <div
              key={tier.name}
              className="ranks-stop"
              style={{ left: `${tier.at}%` }}
              title={`${tier.name} (${tier.min}${Number.isFinite(tier.max) ? `-${tier.max}` : "+"})`}
            >
              <span className="ranks-stop-dot" />
              <span className="ranks-stop-label">{tier.name}</span>
              <span className="ranks-stop-points">{tier.min}</span>
            </div>
          ))}

          {players.map((p) => (
            <div
              key={p.id}
              className={`ranks-marker${p.isYou ? " you" : ""}`}
              style={{ left: `${toPercent(p.rating)}%` }}
              title={`${p.username}: ${p.rating} (${getRatingTier(p.rating)})`}
            >
              <span className="ranks-marker-dot" />
              <span className="ranks-marker-label">{p.isYou ? "You" : p.username}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="card">
        <div className="panel-title mb-sm">You + Friends Placement</div>
        <div className="ranks-list">
          {players.map((p, idx) => (
            <div key={`${p.id}_row`} className="ranks-row">
              <div className="ranks-row-main">
                <div className={`ranks-avatar${p.isYou ? " you" : ""}`}>
                  {p.avatarUrl ? (
                    <img src={p.avatarUrl} alt={p.username} />
                  ) : (
                    p.username?.[0]?.toUpperCase() || "?"
                  )}
                </div>
                <div>
                  <div className="friend-name">
                    {p.username} {p.isYou ? <span className="text-xs text-amber">(You)</span> : null}
                  </div>
                  <div className="text-xs text-dim">{getRatingTier(p.rating)}</div>
                </div>
              </div>
              <div className="ranks-row-stats">
                <span className="mono">{p.rating} pts</span>
                <span className="text-xs text-dim">Line: {toPercent(p.rating).toFixed(1)}%</span>
                <span className="text-xs text-dim">#{idx + 1}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default RanksPage;
