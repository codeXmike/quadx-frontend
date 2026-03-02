import { useEffect, useMemo, useState } from "react";

function FriendsPage({
  connected,
  room,
  friends,
  incomingRequests,
  outgoingRequests,
  liveRooms,
  onRefresh,
  onSendFriendRequest,
  onSearchFriendUsers,
  onRespondFriendRequest,
  onChallengeFriend,
  onJoinFriendRoom,
  onSpectateRoom,
  onOpenGame,
  onOpenProfile,
}) {
  const [friendQuery, setFriendQuery] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  const roomByFriend = useMemo(() => {
    const map = new Map();
    for (const r of liveRooms || []) {
      for (const p of r.players || []) {
        map.set(String(p.username || "").toLowerCase(), {
          roomId: r.roomId,
          status: r.status,
          maxPlayers: r.maxPlayers,
          playerCount: (r.players || []).length,
          canJoinAsPlayer: r.status === "waiting" && (r.players || []).length < r.maxPlayers,
        });
      }
    }
    return map;
  }, [liveRooms]);

  useEffect(() => {
    const query = friendQuery.trim();
    if (query.length < 2) {
      setSearchResults([]);
      setSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setSearching(true);
      const users = await onSearchFriendUsers(query);
      setSearchResults(users);
      setSearching(false);
    }, 250);

    return () => clearTimeout(timer);
  }, [friendQuery, onSearchFriendUsers]);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
      <div className="page-header">
        <h1 className="page-title">Friends <span>Hub</span></h1>
        <div style={{ display: "flex", gap: "0.5rem" }}>
          {room && <button className="btn btn-secondary btn-sm" onClick={onOpenGame}>Open Current Game</button>}
          <button className="btn btn-secondary btn-sm" onClick={onRefresh}>Refresh</button>
        </div>
      </div>

      <div className="card">
        <div className="panel-title mb-sm">Add Friend</div>
        <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
          <input
            value={friendQuery}
            onChange={(e) => setFriendQuery(e.target.value)}
            placeholder="Search by username (min 2 characters)"
          />
          {searching && <div className="text-xs text-dim">Searching users...</div>}
          {!searching && friendQuery.trim().length >= 2 && !searchResults.length && (
            <div className="text-xs text-dim">No users found.</div>
          )}
          {searchResults.map((u) => (
            <div key={u.id} className="friend-row">
              <div className="friend-main">
                <div className="friend-avatar">
                  {u.avatarUrl ? <img src={u.avatarUrl} alt={u.username} style={{ width: "100%", height: "100%", objectFit: "cover", borderRadius: "50%" }} /> : (u.username?.[0]?.toUpperCase() || "?")}
                </div>
                <div>
                  <div className="friend-name">{u.username || "Unknown"}</div>
                  <div className="text-xs text-dim">Rank: {u.rating}</div>
                </div>
              </div>
              <div className="friend-actions">
                {u.isFriend ? (
                  <span className="text-xs text-dim">Already friend</span>
                ) : u.pending === "outgoing" ? (
                  <span className="text-xs text-dim">Request sent</span>
                ) : u.pending === "incoming" ? (
                  <span className="text-xs text-dim">Sent you request</span>
                ) : (
                  <button
                    className="btn btn-sm btn-primary"
                    onClick={() => {
                      onSendFriendRequest(u.id);
                      setFriendQuery("");
                      setSearchResults([]);
                    }}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {incomingRequests?.length > 0 && (
        <div className="card">
          <div className="panel-title mb-sm">Incoming Requests</div>
          {incomingRequests.map((r) => (
            <div key={r.id} className="friend-row">
              <div className="friend-main">
                <div className="friend-avatar">{r.from?.username?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <div className="friend-name">{r.from?.username || "Unknown"}</div>
                  <div className="text-xs text-dim">Wants to connect</div>
                </div>
              </div>
              <div className="friend-actions">
                <button className="btn btn-sm" style={{ background: "rgba(34,197,94,0.15)", color: "var(--green)", border: "1px solid rgba(34,197,94,0.3)" }} onClick={() => onRespondFriendRequest(r.id, "accept")}>Accept</button>
                <button className="btn btn-sm btn-ghost" onClick={() => onRespondFriendRequest(r.id, "reject")}>Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div className="panel-title mb-sm">Friends ({friends?.length || 0})</div>
        {!friends?.length && <div className="empty-state">No friends yet. Add someone to start playing.</div>}
        {friends?.map((f) => {
          const live = roomByFriend.get(String(f.username || "").toLowerCase());
          const statusText = live
            ? live.status === "in_progress"
              ? `In game (${live.roomId})`
              : `In lobby (${live.playerCount}/${live.maxPlayers})`
            : "Offline or idle";

          return (
            <div key={f.id} className="friend-row">
              <div className="friend-main" style={{ cursor: "pointer" }} onClick={() => onOpenProfile?.(f.username)}>
                <div className="friend-avatar">{f.username?.[0]?.toUpperCase() || "?"}</div>
                <div>
                  <div className="friend-name">{f.username || "Unknown"}</div>
                  <div className="text-xs text-dim">{statusText}</div>
                </div>
              </div>
              <div className="friend-actions">
                <button className="btn btn-sm btn-secondary" disabled={!connected} onClick={() => onChallengeFriend(f.username)}>
                  Match
                </button>
                {live?.canJoinAsPlayer && (
                  <button className="btn btn-sm btn-secondary" disabled={!connected} onClick={() => onJoinFriendRoom(live.roomId)}>
                    Join
                  </button>
                )}
                {live?.status === "in_progress" && (
                  <button className="btn btn-sm btn-secondary" disabled={!connected} onClick={() => onSpectateRoom(live.roomId)}>
                    Spectate
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {outgoingRequests?.length > 0 && (
        <div className="card">
          <div className="panel-title mb-sm">Pending Sent ({outgoingRequests.length})</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.35rem" }}>
            {outgoingRequests.map((r) => (
              <div key={r.id} className="text-sm text-muted">
                {r.to?.username || "Unknown"}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default FriendsPage;
