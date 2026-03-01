import { getRatingTier } from "../utils/ratingTier";

function RatingChart({ history }) {
  if (!history || history.length < 2) {
    return <div className="empty-state">Not enough data yet.</div>;
  }

  const points = history.slice(-40);
  const ratings = points.map((p) => p.rating);
  const min = Math.min(...ratings) - 30;
  const max = Math.max(...ratings) + 30;
  const range = max - min || 1;
  const W = 100;
  const H = 100;

  const coords = points.map((p, i) => {
    const x = (i / (points.length - 1)) * W;
    const y = H - ((p.rating - min) / range) * H;
    return [x, y];
  });

  const pathD = coords
    .map(([x, y], i) => (i === 0 ? `M ${x},${y}` : `L ${x},${y}`))
    .join(" ");

  const fillD = `${pathD} L ${coords[coords.length - 1][0]},${H} L ${coords[0][0]},${H} Z`;
  const latest = ratings[ratings.length - 1];
  const first = ratings[0];
  const delta = latest - first;
  const isUp = delta >= 0;

  return (
    <div>
      <div className="flex items-center gap-sm mb-sm">
        <span className="stat-value" style={{ fontSize: "1.4rem" }}>{latest}</span>
        <span
          className="badge"
          style={{
            background: isUp ? "rgba(34,197,94,0.12)" : "rgba(239,68,68,0.12)",
            color: isUp ? "var(--green)" : "var(--danger)",
            border: `1px solid ${isUp ? "rgba(34,197,94,0.3)" : "rgba(239,68,68,0.3)"}`,
          }}
        >
          {isUp ? "?" : "?"} {Math.abs(delta)}
        </span>
        <span className="text-xs text-dim">last {points.length} data points</span>
      </div>
      <div className="rating-chart">
        <svg viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="none">
          <defs>
            <linearGradient id="chartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity="0.3" />
              <stop offset="100%" stopColor={isUp ? "#22c55e" : "#ef4444"} stopOpacity="0" />
            </linearGradient>
          </defs>
          <path d={fillD} fill="url(#chartGrad)" />
          <path d={pathD} stroke={isUp ? "#22c55e" : "#ef4444"} strokeWidth="2" fill="none" vectorEffect="non-scaling-stroke" />
          {coords.map(([x, y], i) =>
            i === coords.length - 1 ? (
              <circle key={i} cx={x} cy={y} r="3" fill={isUp ? "#22c55e" : "#ef4444"} />
            ) : null
          )}
        </svg>
      </div>
    </div>
  );
}

function ProfilePage({ profileData, onBack }) {
  const profile = profileData?.profile;
  const matches = profileData?.recentMatches || [];
  const placementTotal = Number(profile?.placementTotal || 6);
  const placementPlayed = Number(profile?.placementGamesPlayed || 0);
  const placementLeft = Math.max(0, placementTotal - placementPlayed);

  function formatDate(d) {
    return new Date(d).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" });
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Player <span>Profile</span></h1>
        <button className="btn btn-ghost" onClick={onBack}>Back</button>
      </div>

      {!profile ? (
        <div className="empty-state">Select a player from the leaderboard to view their profile.</div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
          <div className="profile-header">
            <div className="profile-avatar">
              {profile.avatarUrl ? <img src={profile.avatarUrl} alt={profile.username} /> : profile.username[0].toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <div className="profile-name">{profile.username}</div>
              <div className="profile-rating">
                {profile.provisional
                  ? `Provisional (${placementLeft}/${placementTotal} left)`
                  : `${profile.rating} ELO - ${getRatingTier(profile.rating)}`}
              </div>
              {profile.provisional && (
                <div className="placement-wrap mt-sm" style={{ maxWidth: "260px" }}>
                  <div className="placement-label">Placement Progress {placementPlayed}/{placementTotal}</div>
                  <div className="placement-track">
                    <div className="placement-fill" style={{ width: `${Math.min(100, (placementPlayed / placementTotal) * 100)}%` }} />
                  </div>
                </div>
              )}
              <div className="flex items-center gap-sm" style={{ marginTop: "0.6rem", flexWrap: "wrap" }}>
                <span className="badge badge-green">{profile.wins}W</span>
                <span className="badge badge-red">{profile.losses}L</span>
                <span className="badge badge-grey">{profile.draws}D</span>
                <span className="text-xs text-dim">{profile.gamesPlayed} total games</span>
              </div>
            </div>
            {profile.gamesPlayed > 0 && (
              <div className="stat-card" style={{ textAlign: "center", minWidth: "90px" }}>
                <div className="stat-label">Win Rate</div>
                <div className="stat-value">{((profile.wins / profile.gamesPlayed) * 100).toFixed(0)}%</div>
              </div>
            )}
          </div>

          <div className="card">
            <div className="panel-title mb-sm">Rating History</div>
            <RatingChart history={profile.ratingHistory} />
          </div>

          <div className="card">
            <div className="panel-title mb-sm">Recent Matches</div>
            {matches.length === 0 ? (
              <div className="empty-state">No matches recorded yet.</div>
            ) : (
              matches.map((m) => {
                const won = m.winnerUsername === profile.username;
                const draw = !m.winnerUsername;
                return (
                  <div key={m.id} className="match-item">
                    <div className={`match-result ${draw ? "draw" : won ? "win" : "loss"}`}>
                      {draw ? "D" : won ? "W" : "L"}
                    </div>
                    <div className="match-info">
                      <div className="match-desc">
                        {m.winnerUsername ? `${m.winnerUsername} won` : "Draw"} - {m.maxPlayers}P - {m.endedReason?.replace(/_/g, " ")}
                      </div>
                      <div className="match-date">
                        {formatDate(m.createdAt)}
                        {m.ratingChange?.delta != null && (
                          <span className={`rating-delta ${m.ratingChange.delta >= 0 ? "up" : "down"}`}>
                            {m.ratingChange.delta >= 0 ? ` +${m.ratingChange.delta}` : ` ${m.ratingChange.delta}`}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default ProfilePage;

