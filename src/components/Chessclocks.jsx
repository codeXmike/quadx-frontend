function formatMs(ms) {
  if (ms == null) return "8";
  const totalSec = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function ChessClocks({ players, currentTurnMark, status, timeControlSec, clockEnabled }) {
  if (!players || players.length === 0) return null;

  const totalMs = clockEnabled ? (timeControlSec || 0) * 1000 : null;

  return (
    <div className="chess-clocks">
      {players.map((p) => {
        const ms = p.remainingMs;
        const isActive = p.mark === currentTurnMark && status === "in_progress" && !p.eliminated;
        const low = ms != null && ms <= 10000;
        const pct = totalMs ? Math.max(0, Math.min(1, ms / totalMs)) : 1;

        return (
          <div
            key={p.mark}
            className={`chess-clock${isActive ? " active-clock" : ""}${low && isActive ? " low-time" : ""}${p.eliminated ? " eliminated-clock" : ""}`}
            style={{ "--player-color": p.color }}
          >
            <div className="clock-name">{p.username}</div>
            <div className="clock-time">{formatMs(ms)}</div>
            {p.eliminatedByTimeout && <div className="clock-flag">Timed Out</div>}
            {clockEnabled && !p.eliminated && (
              <div
                className="clock-drain"
                style={{
                  transform: `scaleX(${pct})`,
                  background: low ? "var(--danger)" : p.color,
                }}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default ChessClocks;
