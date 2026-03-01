import { useMemo, useState } from "react";
import { getRatingTier } from "../utils/ratingTier";
import Icon from "../components/Icon";

function LeaderboardPage({ data, period, onChangePeriod, onOpenProfile }) {
  const [search, setSearch] = useState("");

  const rows = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return data || [];
    return (data || []).filter((p) => p.username.toLowerCase().includes(q));
  }, [data, search]);

  function rankDisplay(rank) {
    if (rank === 1) return <span className="lb-rank gold"><Icon name="medal-1" size={16} /></span>;
    if (rank === 2) return <span className="lb-rank silver"><Icon name="medal-2" size={16} /></span>;
    if (rank === 3) return <span className="lb-rank bronze"><Icon name="medal-3" size={16} /></span>;
    return <span className="lb-rank">{rank}</span>;
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Leader<span>board</span></h1>
        <div className="tabs" style={{ width: "auto" }}>
          {["daily", "weekly", "all"].map((p) => (
            <button
              key={p}
              className={`tab ${period === p ? "active" : ""}`}
              onClick={() => onChangePeriod(p)}
              style={{ minWidth: "64px" }}
            >
              {p === "all" ? "All Time" : p.charAt(0).toUpperCase() + p.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb" style={{ display: "flex", alignItems: "center", gap: "0.5rem", maxWidth: "320px" }}>
        <Icon name="search" size={15} className="text-muted" />
        <input
          placeholder="Search player..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      <div className="lb-table">
        <div className="lb-head">
          <span>#</span>
          <span>Player</span>
          <span>Rating</span>
          <span>W - L - D</span>
          <span>Games</span>
        </div>

        {rows.length === 0 && (
          <div className="empty-state">No players found.</div>
        )}

        {rows.map((p) => (
          <button
            key={`${p.rank}_${p.username}`}
            className="lb-row"
            onClick={() => onOpenProfile(p.username)}
          >
            <span>{rankDisplay(p.rank)}</span>
            <span className="lb-player">
              {p.avatarUrl ? (
                <img src={p.avatarUrl} alt={p.username} className="lb-avatar" />
              ) : (
                <div className="lb-avatar-placeholder">{p.username[0].toUpperCase()}</div>
              )}
              <span className="lb-username">{p.username}</span>
            </span>
            <span className="lb-rating">
              {p.rating}
              <span className="lb-tier">{getRatingTier(p.rating)}</span>
            </span>
            <span className="lb-wld">
              <span style={{ color: "var(--green)" }}>{p.wins}</span>
              {" - "}
              <span style={{ color: "var(--red)" }}>{p.losses}</span>
              {" - "}
              <span style={{ color: "var(--text2)" }}>{p.draws}</span>
            </span>
            <span className="lb-games">{p.gamesPlayed}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default LeaderboardPage;
