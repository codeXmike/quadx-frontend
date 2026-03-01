import { useState } from "react";

function TournamentsPage({ tournaments, currentTournament, onCreate, onJoin, onOpen, onStart, onReport, userId }) {
  const [name, setName] = useState("");
  const [maxPlayers, setMaxPlayers] = useState(16);
  const nameById = Object.fromEntries((currentTournament?.standings || []).map((s) => [s.userId, s.username]));

  function statusColor(s) {
    if (s === "open") return "badge-green";
    if (s === "active") return "badge-amber";
    return "badge-grey";
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Tourna<span>ments</span></h1>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: currentTournament ? "1fr 1.5fr" : "1fr", gap: "1.25rem" }}>
        {/* Left: list + create */}
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
          <div className="card">
            <div className="panel-title mb">Create Tournament</div>
            <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap" }}>
              <input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Tournament name..."
                style={{ flex: 1, minWidth: "160px" }}
              />
              <select value={maxPlayers} onChange={(e) => setMaxPlayers(Number(e.target.value))} style={{ width: "auto" }}>
                {[8, 16, 32, 64].map((n) => <option key={n} value={n}>{n}p</option>)}
              </select>
              <button
                className="btn btn-primary"
                onClick={() => { onCreate({ name, maxPlayers }); setName(""); }}
                disabled={!name.trim()}
              >
                Create
              </button>
            </div>
          </div>

          <div className="card">
            <div className="panel-title mb">Open Tournaments</div>
            {tournaments?.length === 0 && <div className="empty-state">No tournaments yet.</div>}
            {(tournaments || []).map((t) => (
              <div key={t.id} className="t-item">
                <div>
                  <div className="t-name">{t.name}</div>
                  <div className="t-meta">
                    {t.players}/{t.maxPlayers} players · Round {t.rounds}/{Math.ceil(Math.log2(Math.max(2, t.players)))}
                  </div>
                </div>
                <div style={{ display: "flex", gap: "0.4rem", alignItems: "center" }}>
                  <span className={`badge ${statusColor(t.status)}`}>{t.status}</span>
                  <button className="btn btn-secondary btn-sm" onClick={() => onOpen(t.id)}>View</button>
                  {t.status === "open" && (
                    <button className="btn btn-sm" style={{ background: "rgba(245,158,11,0.12)", color: "var(--amber)", border: "1px solid rgba(245,158,11,0.3)" }} onClick={() => onJoin(t.id)}>Join</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: current tournament detail */}
        {currentTournament && (
          <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
            <div className="card">
              <div className="flex items-center justify-between mb">
                <div>
                  <div className="page-title" style={{ fontSize: "1.1rem" }}>{currentTournament.name}</div>
                  <div className="text-sm text-muted mt-sm">
                    {currentTournament.players}/{currentTournament.maxPlayers} players
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`badge ${statusColor(currentTournament.status)}`}>{currentTournament.status}</span>
                  {currentTournament.status === "open" && (
                    <button className="btn btn-primary btn-sm" onClick={() => onStart(currentTournament.id)}>Start</button>
                  )}
                </div>
              </div>

              {/* Standings */}
              <div className="panel-title mb-sm">Standings</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
                {(currentTournament.standings || []).map((s) => (
                  <div key={s.userId} className="flex items-center justify-between" style={{ padding: "0.45rem 0.65rem", background: "rgba(0,0,0,0.2)", borderRadius: "8px" }}>
                    <div className="flex items-center gap-sm">
                      <span className="text-xs text-muted mono" style={{ width: "20px" }}>#{s.rank}</span>
                      <span className="fw-bold text-sm">{s.username}</span>
                      {s.userId === userId && <span className="chip-you">YOU</span>}
                    </div>
                    <span className="mono text-sm text-amber">{s.score} pts</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Rounds */}
            {(currentTournament.rounds || []).map((r) => (
              <div key={r.number} className="card">
                <div className="flex items-center justify-between mb-sm">
                  <div className="panel-title">Round {r.number}</div>
                  {r.completed && <span className="badge badge-green">Complete</span>}
                </div>
                {(r.pairings || []).map((p) => (
                  <div key={`${r.number}_${p.table}`} className="pairing-row">
                    <div>
                      <div className="pairing-players">
                        {nameById[p.playerA] || p.playerA}
                        {" vs "}
                        {p.playerB ? nameById[p.playerB] || p.playerB : <span className="text-muted">BYE</span>}
                      </div>
                      <div className="text-xs text-muted">Table {p.table}</div>
                    </div>
                    <div className="flex items-center gap-sm">
                      {p.result !== "pending" ? (
                        <span className="badge badge-grey pairing-result">
                          {p.result === "A" ? nameById[p.playerA] || "A" : p.result === "B" ? nameById[p.playerB] || "B" : "Draw"}
                        </span>
                      ) : p.playerB ? (
                        <div className="flex gap-sm">
                          <button className="btn btn-sm btn-secondary" onClick={() => onReport(currentTournament.id, r.number, p.table, "a")}>A won</button>
                          <button className="btn btn-sm btn-secondary" onClick={() => onReport(currentTournament.id, r.number, p.table, "b")}>B won</button>
                          <button className="btn btn-sm btn-ghost" onClick={() => onReport(currentTournament.id, r.number, p.table, "draw")}>Draw</button>
                        </div>
                      ) : (
                        <span className="badge badge-amber">BYE</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default TournamentsPage;