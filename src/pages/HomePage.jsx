import { useState } from "react";
import { getRatingTier } from "../utils/ratingTier";

function HomePage({
  user,
  connected,
  room,
  queueStatus,
  onCreateRoom,
  onJoinRoom,
  onQueueJoin,
  onQueueLeave,
  onGoSettings,
  onGoFriends,
  onOpenGame,
  recentMatches,
}) {
  const [activeMode, setActiveMode] = useState("play");
  const [maxPlayers, setMaxPlayers] = useState(2);
  const [roomCode, setRoomCode] = useState("");
  const [timeControl, setTimeControl] = useState(60);

  const isQueuing = queueStatus != null;

  function formatDate(d) {
    const date = new Date(d);
    const now = new Date();
    const diffH = (now - date) / 3600000;
    if (diffH < 24) return `${Math.floor(diffH)}h ago`;
    return date.toLocaleDateString();
  }

  function getMatchResult(match) {
    if (!match.winnerUsername) return "draw";
    if (match.winnerUsername === user.username) return "win";
    return "loss";
  }

  function getResultLabel(r) {
    return r === "win" ? "W" : r === "loss" ? "L" : "D";
  }

  const placementTotal = Number(user.placementTotal || 6);
  const placementPlayed = Number(user.placementGamesPlayed || 0);
  const placementLeft = Math.max(0, placementTotal - placementPlayed);

  function parseTimeControl(value) {
    if (value === "unlimited") return null;
    return Number(value);
  }

  const timeControlValue = timeControl == null ? "unlimited" : String(timeControl);

  return (
    <div>
      <div className="welcome-banner mb-lg">
        <p className="text-muted text-sm mb-sm">Good to have you back</p>
        <div className="welcome-name">
          {user.username}<span>.</span>
        </div>
        <div className="flex items-center gap-sm mt-sm">
          {user.provisional ? (
            <span className="badge badge-blue">Provisional ({placementLeft}/{placementTotal} left)</span>
          ) : (
            <span className="badge badge-amber">{user.rating} ELO - {getRatingTier(user.rating)}</span>
          )}
          {connected ? (
            <span className="live-indicator"><span className="live-dot" />Connected</span>
          ) : (
            <span className="badge badge-grey">Offline</span>
          )}
        </div>
        {user.provisional && (
          <div className="placement-wrap mt-sm">
            <div className="placement-label">Placement Progress {placementPlayed}/{placementTotal}</div>
            <div className="placement-track">
              <div className="placement-fill" style={{ width: `${Math.min(100, (placementPlayed / placementTotal) * 100)}%` }} />
            </div>
          </div>
        )}
      </div>

      <div className="stats-row">
        {[
          { label: "Games", value: user.gamesPlayed ?? 0 },
          { label: "Wins", value: user.wins ?? 0, sub: user.gamesPlayed ? `${((user.wins / user.gamesPlayed) * 100).toFixed(0)}% WR` : null },
          { label: "Losses", value: user.losses ?? 0 },
          { label: "Draws", value: user.draws ?? 0 },
        ].map((s) => (
          <div key={s.label} className="stat-card">
            <div className="stat-label">{s.label}</div>
            <div className="stat-value">{s.value}</div>
            {s.sub && <div className="stat-sub">{s.sub}</div>}
          </div>
        ))}
      </div>

      <div className="home-grid">
        <div>
          <div className="tabs mb">
            {[
              { key: "play", label: "Quick Play" },
              { key: "custom", label: "Custom Room" },
            ].map((m) => (
              <button
                key={m.key}
                className={`tab ${activeMode === m.key ? "active" : ""}`}
                onClick={() => setActiveMode(m.key)}
              >
                {m.label}
              </button>
            ))}
          </div>

          {activeMode === "play" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              <div className="field mb-sm">
                <label className="label">Time Bank (per player)</label>
                <select value={timeControlValue} onChange={(e) => setTimeControl(parseTimeControl(e.target.value))}>
                  <option value={30}>30 seconds</option>
                  <option value={60}>1 minute</option>
                  <option value={120}>2 minutes</option>
                  <option value="unlimited">Unlimited</option>
                </select>
              </div>

              {[
                { players: 2, label: "1v1 - Classic Duel", desc: "Head-to-head rated match" },
                { players: 3, label: "3-Player Arena", desc: "Three-way competitive chaos" },
                { players: 4, label: "4-Player Arena", desc: "Full board free-for-all" },
              ].map(({ players, label, desc }) => (
                <button
                  key={players}
                  className={`mode-btn${isQueuing && queueStatus?.modeSize === players ? " queuing" : ""}`}
                  onClick={() => onQueueJoin(players, timeControl)}
                  disabled={!connected}
                >
                  <div className="mode-info">
                    <div className="mode-title">{label}</div>
                    <div className="mode-desc">{desc}</div>
                    {isQueuing && queueStatus?.modeSize === players && (
                      <div className="queue-pulse">
                        <span className="queue-dot" />
                        Position #{queueStatus.position} - {queueStatus.waiting}/{queueStatus.required} players
                      </div>
                    )}
                    {isQueuing && queueStatus?.modeSize === players && (
                      <div className="mode-desc" style={{ marginTop: "0.25rem" }}>
                        Queue: {queueStatus.queuePopulation || 0} | Online: {queueStatus.activePlayers || 0} | Live: {queueStatus.ongoingMatches || 0}
                      </div>
                    )}
                  </div>
                </button>
              ))}

              {isQueuing && (
                <button className="btn btn-secondary btn-sm" onClick={onQueueLeave}>
                  Leave Queue
                </button>
              )}
            </div>
          )}

          {activeMode === "custom" && (
            <div className="card">
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.75rem", marginBottom: "0.75rem" }}>
                <div className="field">
                  <label className="label">Players</label>
                  <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))}>
                    <option value={2}>2 players</option>
                    <option value={3}>3 players</option>
                    <option value={4}>4 players</option>
                  </select>
                </div>
                <div className="field">
                  <label className="label">Time Bank</label>
                  <select value={timeControlValue} onChange={(e) => setTimeControl(parseTimeControl(e.target.value))}>
                    <option value={30}>30s</option>
                    <option value={60}>1 min</option>
                    <option value={120}>2 min</option>
                    <option value="unlimited">Unlimited</option>
                  </select>
                </div>
              </div>
              <button className="btn btn-primary btn-full mb-sm" onClick={() => onCreateRoom(maxPlayers, timeControl)} disabled={!connected}>
                Create Room
              </button>
              <div className="sep" />
              <div className="field mb-sm">
                <label className="label">Join by Room Code</label>
                <div className="room-input-row">
                  <input
                    value={roomCode}
                    onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                    placeholder="e.g. A3F9B2"
                    style={{ fontFamily: "'DM Mono', monospace", letterSpacing: "0.1em" }}
                    maxLength={6}
                  />
                  <button
                    className="btn btn-secondary"
                    onClick={() => onJoinRoom(roomCode)}
                    disabled={!roomCode || !connected}
                  >
                    Join
                  </button>
                </div>
              </div>
              {room && (
                <button className="btn btn-ghost btn-sm btn-full" onClick={onOpenGame}>
                  Rejoin current room ({room.id})
                </button>
              )}
            </div>
          )}
        </div>

        <div className="sidebar-panel">
          <div className="card">
            <div className="panel-title mb-sm">Recent Games</div>
            {recentMatches?.length ? (
              recentMatches.slice(0, 8).map((m) => {
                const result = getMatchResult(m);
                return (
                  <div key={m.id} className="match-item">
                    <div className={`match-result ${result}`}>{getResultLabel(result)}</div>
                    <div className="match-info">
                      <div className="match-desc">
                        {m.winnerUsername ? `${m.winnerUsername} won` : "Draw"} - {m.maxPlayers}P
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
            ) : (
              <div className="empty-state">No games yet - queue up!</div>
            )}
          </div>

          <div className="card">
            <div className="panel-title mb-sm">Quick Links</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              <button className="btn btn-secondary btn-sm btn-full" onClick={onGoFriends}>Friends</button>
              <button className="btn btn-secondary btn-sm btn-full" onClick={onGoSettings}>Settings</button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default HomePage;

