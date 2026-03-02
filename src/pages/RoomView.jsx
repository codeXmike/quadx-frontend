import { useState, useEffect, useRef } from "react";
import Board from "../components/Board";
import ChessClocks from "../components/Chessclocks";
import Icon from "../components/Icon";

function RoomView({
  room,
  currentUserId,
  onStart,
  onDrop,
  onLeave,
  hideDropButtons,
  pingMs,
  chatMessages,
  onSendChat,
  onInvite,
  onRematch,
}) {
  const isHost = String(room.players[0]?.userId || "") === String(currentUserId || "");
  const myPlayer = room.players.find((p) => String(p.userId || "") === String(currentUserId || ""));
  const isSpectator = !myPlayer;
  const myTurn = String(room.turn?.userId || "") === String(currentUserId || "");
  const canPlay = Boolean(myPlayer && myTurn && room.status === "in_progress" && !room.winner);
  const playersByMark = Object.fromEntries(room.players.map((p) => [p.mark, { ...p }]));
  const [chatInput, setChatInput] = useState("");
  const [inviteInput, setInviteInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  function submitChat(e) {
    e.preventDefault();
    const msg = chatInput.trim();
    if (!msg) return;
    onSendChat(msg);
    setChatInput("");
  }

  function submitInvite(e) {
    e.preventDefault();
    const targets = inviteInput.split(",").map((v) => v.trim()).filter(Boolean);
    if (!targets.length) return;
    onInvite(targets);
    setInviteInput("");
  }

  const gameOver = room.status === "completed";
  const currentTurnMark = room.turn?.mark || null;
  const boardRows = room.board?.length || 0;
  const boardCols = room.board?.[0]?.length || 0;
  const reconnectingPlayer = room.players.find((p) => !p.connected && !p.eliminated && Number(p.reconnectGraceRemainingMs || 0) > 0);

  return (
    <div className="room-layout">
      <div className="board-container">
        <div className="flex items-center justify-between mb-sm">
          <div className="flex items-center gap">
            <h2 className="page-title" style={{ fontSize: "1.1rem" }}>
              Room <span>{room.id}</span>
            </h2>
            <span className={`badge ${room.status === "in_progress" ? "badge-green" : room.status === "waiting" ? "badge-amber" : "badge-grey"}`}>
              {room.status === "in_progress" ? "Live" : room.status === "waiting" ? "Waiting" : "Ended"}
            </span>
            {isSpectator && <span className="badge badge-blue"><Icon name="eye" size={12} /> Spectating</span>}
          </div>
          <div className="flex items-center gap-sm">
            {pingMs != null && (
              <span className="text-xs text-dim mono">{pingMs}ms</span>
            )}
            {room.spectatorCount > 0 && (
              <span className="text-xs text-muted" style={{ display: "inline-flex", alignItems: "center", gap: "0.2rem" }}>
                <Icon name="eye" size={12} /> {room.spectatorCount}
              </span>
            )}
            <button className="btn btn-ghost btn-sm" onClick={onLeave}>Leave</button>
          </div>
        </div>

        <div className="players-strip">
          {room.players.map((p) => (
            <div
              key={p.playerId || p.userId || p.username}
              className={`player-chip${room.turn?.playerId === p.playerId ? " active-turn" : ""}${p.eliminated ? " eliminated" : ""}`}
              style={{ "--player-color": p.color }}
            >
              <span className="chip-color" style={{ background: p.color, boxShadow: `0 0 6px ${p.color}` }} />
              <span className="chip-name">{p.username}</span>
              <span className="text-xs text-dim">{Number(p.rating || 1000)}</span>
              <span className="chip-mark">({p.mark})</span>
              {String(p.userId || "") === String(currentUserId || "") && <span className="chip-you">YOU</span>}
              {!p.connected && !p.eliminated && (
                <span className="text-xs text-amber">
                  reconnect {Math.ceil(Number(p.reconnectGraceRemainingMs || 0) / 1000)}s
                </span>
              )}
              {p.eliminated && <span className="text-xs text-dim">{p.eliminatedByTimeout ? "timeout" : "out"}</span>}
              {isHost && (room.players[0]?.playerId === p.playerId) && <span className="text-xs text-amber"><Icon name="crown" size={11} /></span>}
            </div>
          ))}
        </div>

        <ChessClocks
          players={room.players}
          currentTurnMark={currentTurnMark}
          status={room.status}
          timeControlSec={room.timeControlSec}
          clockEnabled={room.clockEnabled}
        />

        {gameOver ? (
          room.winner ? (
            <div className="game-status win">
              <Icon name="trophy" size={14} /> {room.winner.username} wins! - {room.endedReason?.replace(/_/g, " ")}
            </div>
          ) : (
            <div className="game-status draw">Draw - {room.endedReason?.replace(/_/g, " ")}</div>
          )
        ) : room.status === "in_progress" ? (
          <div className="game-status playing">
            {reconnectingPlayer
              ? `${reconnectingPlayer.username} reconnecting...`
              : myTurn
                ? (<><Icon name="zap" size={14} /> Your turn - drop a piece!</>)
                : `Waiting for ${room.turn?.username || "opponent"}...`}
          </div>
        ) : null}

        <Board
          board={room.board}
          canPlay={canPlay}
          onDrop={onDrop}
          playersByMark={playersByMark}
          hideDropButtons={hideDropButtons}
          winningCells={[]}
        />

        {room.status === "waiting" && isHost && (
          <div style={{ display: "flex", gap: "0.6rem", flexWrap: "wrap", marginTop: "0.75rem" }}>
            <button
              className="btn btn-primary"
              onClick={onStart}
              disabled={room.players.length < 2}
            >
              Start Match ({room.players.length}/{room.maxPlayers})
            </button>
            <form onSubmit={submitInvite} style={{ display: "flex", gap: "0.5rem", flex: 1, minWidth: "200px" }}>
              <input
                value={inviteInput}
                onChange={(e) => setInviteInput(e.target.value)}
                placeholder="Invite by username or email..."
                style={{ fontSize: "0.82rem" }}
              />
              <button type="submit" className="btn btn-secondary">Invite</button>
            </form>
          </div>
        )}

        {gameOver && isHost && (
          <div style={{ marginTop: "0.75rem" }}>
            <button className="btn btn-secondary" onClick={onRematch}><Icon name="refresh" size={13} /> Rematch</button>
          </div>
        )}
      </div>

      <div className="room-sidebar">
        <div className="card card-sm">
          <div className="panel-title">Match Info</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", marginTop: "0.5rem" }}>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Format</span>
              <span className="text-sm mono">{room.maxPlayers}P - {boardRows}x{boardCols} - Connect 4</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Time Bank</span>
              <span className="text-sm mono">{room.clockEnabled ? `${room.timeControlSec}s / player` : "Unlimited"}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted">Moves</span>
              <span className="text-sm mono">{room.moveCount || 0}</span>
            </div>
          </div>
        </div>

        <div className="card card-sm" style={{ flex: 1 }}>
          <div className="panel-title" style={{ marginBottom: "0.6rem" }}>Match Chat</div>
          <div className="chat-log">
            {(chatMessages || []).length === 0 && (
              <div className="text-xs text-dim" style={{ textAlign: "center", padding: "1rem 0" }}>No messages yet</div>
            )}
            {(chatMessages || []).map((msg) => (
              msg.type === "divider" ? (
                <div key={msg.id} className="chat-divider">
                  <span>{msg.message || "New match"}</span>
                </div>
              ) : (
                <div key={msg.id} className="chat-msg">
                  <span className="chat-user" style={{ color: playersByMark[msg.mark]?.color || "var(--amber)" }}>
                    {msg.username}
                  </span>
                  <span className="chat-text">{msg.message}</span>
                </div>
              )
            ))}
            <div ref={chatEndRef} />
          </div>
          <form className="chat-input-row" onSubmit={submitChat} style={{ marginTop: "0.5rem" }}>
            <input
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Say something..."
              maxLength={400}
            />
            <button type="submit" className="btn btn-secondary btn-sm">Send</button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default RoomView;
