import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "./api";
import { socket, connectSocket, disconnectSocket } from "./socket";
import { ToastContainer } from "./components/Toast";
import { useToast } from "./hooks/useToast";
import LandingPage from "./pages/LandingPage";
import LoginPage from "./pages/LoginPage";
import HomePage from "./pages/HomePage";
import RoomView from "./pages/RoomView";
import LeaderboardPage from "./pages/LeaderboardPage";
import ProfilePage from "./pages/ProfilePage";
import TournamentsPage from "./pages/TournamentsPage";
import SettingsPage from "./pages/SettingsPage";
import FriendsPage from "./pages/FriendsPage";
import { getRatingTier } from "./utils/ratingTier";
import Icon from "./components/Icon";
import "./styles.css";

const NAV = [
  { key: "home", icon: "home", label: "Dashboard" },
  { key: "friends", icon: "friends", label: "Friends" },
  { key: "game", icon: "game", label: "Game Room" },
  { key: "leaderboard", icon: "trophy", label: "Leaderboard" },
  { key: "tournaments", icon: "target", label: "Tournaments" },
  { key: "profile", icon: "user", label: "Profile" },
  { key: "settings", icon: "settings", label: "Settings" },
];
const SESSION_TOKEN_KEY = "quadx_token";
const SESSION_USER_KEY = "quadx_user";

export default function App() {
  // Auth
  const [token, setToken] = useState(null);
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [mfaRequired, setMfaRequired] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [showOtpPage, setShowOtpPage] = useState(false);

  // UI
  const [page, setPage] = useState("landing");
  const [booting, setBooting] = useState(true);
  const { toasts, toast } = useToast();

  // Socket
  const [connected, setConnected] = useState(false);

  // Game
  const [room, setRoom] = useState(null);
  const [queueStatus, setQueueStatus] = useState(null);
  const [chatMessages, setChatMessages] = useState([]);
  const [pingMs, setPingMs] = useState(null);
  const userRef = useRef(null);
  const pingIntervalRef = useRef(null);
  const roomsPollRef = useRef(null);
  const [pendingChallengeTarget, setPendingChallengeTarget] = useState(null);
  const [pendingFriendInvites, setPendingFriendInvites] = useState({});

  // Data
  const [friends, setFriends] = useState([]);
  const [incomingRequests, setIncomingRequests] = useState([]);
  const [outgoingRequests, setOutgoingRequests] = useState([]);
  const [liveRooms, setLiveRooms] = useState([]);
  const [recentMatches, setRecentMatches] = useState([]);
  const [leaderboard, setLeaderboard] = useState([]);
  const [leaderboardPeriod, setLeaderboardPeriod] = useState("all");
  const [profileData, setProfileData] = useState(null);
  const [tournaments, setTournaments] = useState([]);
  const [currentTournament, setCurrentTournament] = useState(null);
  const [settings, setSettings] = useState({ hideDropButtons: false });
  const [settingsLoading, setSettingsLoading] = useState(false);

  function insertChatDivider(label = "New match started") {
    setChatMessages((prev) => {
      if (!prev.length) return prev;
      return [
        ...prev,
        {
          id: `divider_${Date.now()}_${Math.random().toString(16).slice(2)}`,
          type: "divider",
          message: label
        }
      ];
    });
  }

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  function persistSession(nextToken, nextUser) {
    try {
      if (nextToken) localStorage.setItem(SESSION_TOKEN_KEY, nextToken);
      else localStorage.removeItem(SESSION_TOKEN_KEY);
      if (nextUser) localStorage.setItem(SESSION_USER_KEY, JSON.stringify(nextUser));
      else localStorage.removeItem(SESSION_USER_KEY);
    } catch (_) {}
  }

  function clearSession() {
    persistSession(null, null);
  }

  // ── Auth ──────────────────────────────────────────
  async function handleEmailLogin({ mode, email, password, username, mfaCode }) {
    setAuthLoading(true);
    setAuthError("");
    try {
      const data =
        mode === "register"
          ? await api.registerWithEmail({ email, password, username })
          : await api.loginWithEmail({ email, password, mfaCode });
      if (data?.requiresVerification) {
        setAuthError(data.message || "OTP sent to your email.");
        setMfaRequired(false);
        setOtpEmail(data.email || email);
        setShowOtpPage(true);
        return;
      }
      setMfaRequired(false);
      setShowOtpPage(false);
      setOtpEmail("");
      loginSuccess(data);
    } catch (err) {
      setAuthError(err.message);
      setMfaRequired(Boolean(err?.data?.mfaRequired));
      if (err?.data?.requiresVerification) {
        setOtpEmail(err?.data?.email || email);
        setShowOtpPage(true);
      }
      if (String(err.message || "").toLowerCase().includes("verify your email")) {
        setOtpEmail(email);
        setShowOtpPage(true);
      }
    } finally {
      setAuthLoading(false);
    }
  }

  const handleGoogleLogin = useCallback(async ({ idToken }) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const data = await api.loginWithGoogle({ idToken });
      loginSuccess(data);
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }, []);

  function loginSuccess({ token: t, user: u }) {
    const nextToken = t || "cookie";
    setToken(nextToken);
    setUser(u);
    userRef.current = u;
    setSettings(u.settings || { hideDropButtons: false });
    persistSession(nextToken, u);
    setPage("home");
  }

  async function handleVerifyEmail({ email, otp }) {
    setAuthLoading(true);
    setAuthError("");
    try {
      await api.verifyEmail({ email, otp });
      toast.success("Email verified. You can sign in now.");
      setShowOtpPage(false);
      setOtpEmail("");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleResendVerification({ email }) {
    setAuthLoading(true);
    setAuthError("");
    try {
      await api.resendVerification({ email });
      toast.info("OTP resent to your email.");
    } catch (err) {
      setAuthError(err.message);
    } finally {
      setAuthLoading(false);
    }
  }

  async function logout() {
    try {
      await api.logout();
    } catch (_) {}
    setToken(null);
    setUser(null);
    userRef.current = null;
    setRoom(null);
    setLiveRooms([]);
    setQueueStatus(null);
    setPendingChallengeTarget(null);
    setPendingFriendInvites({});
    clearSession();
    disconnectSocket();
    setPage("landing");
  }

  // ── Boot ──────────────────────────────────────────
  useEffect(() => {
    let cancelled = false;

    async function restoreSession() {
      let storedToken = null;
      let storedUser = null;
      try {
        storedToken = localStorage.getItem(SESSION_TOKEN_KEY);
        const rawUser = localStorage.getItem(SESSION_USER_KEY);
        storedUser = rawUser ? JSON.parse(rawUser) : null;
      } catch (_) {}

      if (storedUser) {
        setUser(storedUser);
        userRef.current = storedUser;
        setSettings(storedUser.settings || { hideDropButtons: false });
        setToken(storedToken || "cookie");
        setPage("home");
      }

      try {
        const { user: freshUser } = await api.getMe(storedToken || undefined);
        if (cancelled) return;
        const nextToken = storedToken || "cookie";
        setToken(nextToken);
        setUser(freshUser);
        userRef.current = freshUser;
        setSettings(freshUser.settings || { hideDropButtons: false });
        persistSession(nextToken, freshUser);
        setPage("home");
      } catch (err) {
        if (cancelled) return;
        if (storedUser) {
          setPage("home");
          setToken(storedToken || "cookie");
          setUser(storedUser);
          userRef.current = storedUser;
          setSettings(storedUser.settings || { hideDropButtons: false });
          console.warn("Using cached local session. Server auth check failed.");
        } else {
          setToken(null);
          setUser(null);
          userRef.current = null;
          clearSession();
          setPage("landing");
        }
      } finally {
        if (!cancelled) setBooting(false);
      }
    }

    restoreSession();
    return () => {
      cancelled = true;
    };
  }, []);

  // ── Socket ────────────────────────────────────────
  useEffect(() => {
    if (!token) return;
    connectSocket(token);

    socket.on("connect", () => {
      setConnected(true);
      socket.emit("rooms:live");
    });
    socket.on("disconnect", () => {
      setConnected(false);
    });
    socket.on("room:state", (r) => {
      setRoom(r);
    });
    socket.on("room:created", ({ roomId }) => {
      toast.info(`Room ${roomId} created`);
    });
    socket.on("queue:status", (s) => setQueueStatus(s));
    socket.on("queue:matched", ({ roomId }) => {
      toast.success(`Match found! Room ${roomId}`);
      setQueueStatus(null);
      setPage("game");
    });
    socket.on("queue:left", () => setQueueStatus(null));
    socket.on("game:over", async ({ winner, endedReason }) => {
      if (winner) toast.success(`${winner.username} wins!`);
      else toast.info(`Game ended: ${endedReason}`);
      const before = userRef.current;
      const fresh = await refreshCurrentUser();
      if (before && fresh) {
        const delta = Number(fresh.rating || 1000) - Number(before.rating || 1000);
        if (delta !== 0) toast.info(`Rating ${delta > 0 ? `+${delta}` : delta}`);
        if (before.provisional && !fresh.provisional) {
          toast.success(`Placement complete! Initial rating: ${fresh.rating}`);
        }
      }
      loadRecentMatches();
    });
    socket.on("chat:message", (msg) => {
      setChatMessages((prev) => [...prev.slice(-199), msg]);
    });
    socket.on("ping:pong", ({ clientTime }) => {
      setPingMs(Date.now() - clientTime);
    });
    socket.on("room:invite", ({ roomId, from }) => {
      const inviter = String(from?.username || "").toLowerCase();
      if (inviter && roomId) {
        setPendingFriendInvites((prev) => ({ ...prev, [inviter]: roomId }));
      }
      toast.info(`${from.username} invited you to room ${roomId}`);
    });
    socket.on("room:spectating", ({ roomId }) => {
      toast.info(`Spectating room ${roomId}`);
    });
    socket.on("rooms:live", ({ rooms }) => {
      setLiveRooms(Array.isArray(rooms) ? rooms : []);
    });
    socket.on("turn:timeout", ({ player }) => {
      toast.info(`${player}'s turn timed out`);
    });
    socket.on("error:event", ({ message }) => toast.error(message));
    socket.on("move:rejected", ({ message }) => toast.error(message));
    socket.on("room:rematch", () => {
      insertChatDivider("New match");
      toast.info("Rematch started!");
    });

    // Ping loop
    pingIntervalRef.current = setInterval(() => {
      if (socket.connected) socket.emit("ping:check", { clientTime: Date.now() });
    }, 5000);
    roomsPollRef.current = setInterval(() => {
      if (socket.connected) socket.emit("rooms:live");
    }, 7000);

    return () => {
      socket.off("connect");
      socket.off("disconnect");
      socket.off("room:state");
      socket.off("room:created");
      socket.off("queue:status");
      socket.off("queue:matched");
      socket.off("queue:left");
      socket.off("game:over");
      socket.off("chat:message");
      socket.off("ping:pong");
      socket.off("room:invite");
      socket.off("room:spectating");
      socket.off("rooms:live");
      socket.off("turn:timeout");
      socket.off("error:event");
      socket.off("move:rejected");
      socket.off("room:rematch");
      clearInterval(pingIntervalRef.current);
      clearInterval(roomsPollRef.current);
    };
  }, [token]);

  // ── Data loaders ──────────────────────────────────
  const loadRecentMatches = useCallback(async () => {
    if (!token) return;
    try {
      const { matches } = await api.getRecentMatches(token, 10);
      setRecentMatches(matches);
    } catch (_) {}
  }, [token]);

  const loadFriends = useCallback(async () => {
    console.log("Loading friends and requests...", token);
    if (!token) return;
    try {
      const [fr, rq] = await Promise.all([api.getFriends(token), api.getFriendRequests(token)]);
      setFriends(fr.friends);
      setIncomingRequests(rq.incoming);
      setOutgoingRequests(rq.outgoing);
    } catch (_) {}
  }, [token]);

  const loadLeaderboard = useCallback(async (period = "all") => {
    if (!token) return;
    try {
      const { players } = await api.getLeaderboard(token, period);
      setLeaderboard(players);
    } catch (_) {}
  }, [token]);

  const loadTournaments = useCallback(async () => {
    if (!token) return;
    try {
      const { tournaments: ts } = await api.getTournaments(token);
      setTournaments(ts);
    } catch (_) {}
  }, [token]);

  const loadLiveRooms = useCallback(() => {
    if (socket.connected) socket.emit("rooms:live");
  }, []);

  const refreshCurrentUser = useCallback(async () => {
    if (!token) return null;
    try {
      const { user: freshUser } = await api.getMe(token);
      setUser(freshUser);
      userRef.current = freshUser;
      persistSession(token, freshUser);
      return freshUser;
    } catch (_) {
      return null;
    }
  }, [token]);

  // Load on page open
  useEffect(() => {
    if (!user || !token) return;
    if (page === "home") { loadRecentMatches(); loadFriends(); }
    if (page === "friends") { loadFriends(); loadLiveRooms(); }
    if (page === "leaderboard") loadLeaderboard(leaderboardPeriod);
    if (page === "tournaments") loadTournaments();
  }, [page, user, token, leaderboardPeriod, loadFriends, loadLeaderboard, loadLiveRooms, loadRecentMatches, loadTournaments]);

  // ── Game actions ──────────────────────────────────
  function createRoom(maxPlayers, timeControlSec = 120) {
    socket.emit("room:create", { maxPlayers, timeControlSec });
    setPage("game");
    setChatMessages([]);
  }

  function joinRoom(roomId) {
    if (!roomId) return;
    socket.emit("room:join", { roomId });
    setPage("game");
    setChatMessages([]);
    setPendingFriendInvites((prev) => {
      const next = { ...prev };
      for (const inviter of Object.keys(next)) {
        if (next[inviter] === roomId) delete next[inviter];
      }
      return next;
    });
  }

  function queueJoin(maxPlayers, timeControlSec = 120) {
    socket.emit("queue:join", { maxPlayers, timeControlSec });
  }

  function queueLeave() {
    socket.emit("queue:leave");
    setQueueStatus(null);
  }

  function dropMove(column) {
    if (!room) return;
    socket.emit("move:drop", { roomId: room.id, column });
  }

  function leaveRoom() {
    if (room) socket.emit("room:leave", { roomId: room.id });
    setRoom(null);
    setPage("home");
    setChatMessages([]);
  }

  function sendChat(message) {
    if (!room) return;
    socket.emit("chat:send", { roomId: room.id, message });
  }

  function inviteFriends(targets) {
    if (!room) return;
    socket.emit("room:invite", { roomId: room.id, targets });
    toast.success("Invites sent!");
  }

  function spectateRoom(roomId) {
    if (!roomId) return;
    socket.emit("room:spectate", { roomId });
    setPage("game");
    setChatMessages([]);
  }

  function challengeFriend(username) {
    const target = String(username || "").trim();
    if (!target) return;
    const targetKey = target.toLowerCase();

    if (room?.status === "in_progress") {
      toast.info("Leave your current game before sending a challenge.");
      return;
    }

    const inviteRoomId = pendingFriendInvites[targetKey];
    if (inviteRoomId) {
      joinRoom(inviteRoomId);
      return;
    }

    const existingFriendRoom = (liveRooms || []).find((r) => {
      const players = Array.isArray(r.players) ? r.players : [];
      const hasTarget = players.some((p) => String(p.username || "").toLowerCase() === targetKey);
      const canJoin = r.status === "waiting" && players.length < Number(r.maxPlayers || 0);
      return hasTarget && canJoin;
    });
    if (existingFriendRoom?.roomId) {
      joinRoom(existingFriendRoom.roomId);
      return;
    }

    if (room?.status === "waiting") {
      inviteFriends([target]);
      setPage("game");
      return;
    }

    setPendingChallengeTarget(target);
    createRoom(2, 120);
  }

  function startRoom() {
    if (!room) return;
    socket.emit("room:start", { roomId: room.id });
  }

  function rematch() {
    if (!room) return;
    socket.emit("room:rematch", { roomId: room.id });
  }

  useEffect(() => {
    if (!pendingChallengeTarget || !room || room.status !== "waiting") return;
    inviteFriends([pendingChallengeTarget]);
    setPendingChallengeTarget(null);
  }, [pendingChallengeTarget, room]);

  // ── Friend actions ────────────────────────────────
  async function sendFriendRequest(identifier) {
    try {
      await api.sendFriendRequest(token, identifier);
      toast.success("Friend request sent!");
      loadFriends();
    } catch (err) {
      toast.error(err.message);
    }
  }
  
  async function respondFriendRequest(requestId, action) {
    try {
      await api.respondFriendRequest(token, requestId, action);
      toast.success(action === "accept" ? "Friend added!" : "Request rejected");
      loadFriends();
    } catch (err) {
      toast.error(err.message);
    }
  }

  const searchFriendUsers = useCallback(async (query) => {
    try {
      const data = await api.searchFriendUsers(token, query);
      return data.users || [];
    } catch (_) {
      return [];
    }
  }, [token]);

  // ── Leaderboard ───────────────────────────────────
  function changeLeaderboardPeriod(p) {
    setLeaderboardPeriod(p);
    loadLeaderboard(p);
  }

  async function openProfile(username) {
    try {
      const data = await api.getProfile(token, username);
      setProfileData(data);
      setPage("profile");
    } catch (err) {
      toast.error(err.message);
    }
  }

  // ── Tournaments ───────────────────────────────────
  async function createTournament(payload) {
    try {
      const { id } = await api.createTournament(token, payload);
      toast.success("Tournament created!");
      loadTournaments();
      const data = await api.getTournament(token, id);
      setCurrentTournament({ ...data.tournament, id });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function joinTournament(id) {
    try {
      await api.joinTournament(token, id);
      toast.success("Joined!");
      const data = await api.getTournament(token, id);
      setCurrentTournament({ ...data.tournament, id });
      loadTournaments();
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function openTournament(id) {
    try {
      const data = await api.getTournament(token, id);
      setCurrentTournament({ ...data.tournament, id });
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function startTournament(id) {
    try {
      await api.startTournament(token, id);
      toast.success("Tournament started!");
      openTournament(id);
    } catch (err) {
      toast.error(err.message);
    }
  }

  async function reportResult(id, roundNumber, table, result) {
    try {
      const data = await api.reportTournamentResult(token, id, roundNumber, { table, result });
      if (data.standings) {
        setCurrentTournament((prev) => prev ? { ...prev, standings: data.standings } : prev);
      }
      openTournament(id);
    } catch (err) {
      toast.error(err.message);
    }
  }

  // ── Settings ──────────────────────────────────────
  async function saveSettings(payload) {
    setSettingsLoading(true);
    try {
      const data = await api.updateSettings(token, payload);
      setUser(data.user);
      userRef.current = data.user;
      setSettings(data.settings);
      if (data.token) {
        setToken(data.token || "cookie");
      }
      persistSession(data.token || token || "cookie", data.user);
      toast.success("Settings saved!");
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSettingsLoading(false);
    }
  }

  async function uploadAvatar(file) {
    try {
      if (!token) throw new Error("Not authenticated");
      const auth = await api.getAvatarUploadAuth(token);
      const ext = String(file.name || "").split(".").pop() || "png";
      const usernameSlug = String(userRef.current?.username || "player").replace(/[^a-zA-Z0-9_-]/g, "").toLowerCase() || "player";
      const fileName = `${usernameSlug}-${Date.now()}.${ext}`;

      const form = new FormData();
      form.append("file", file);
      form.append("fileName", fileName);
      form.append("publicKey", auth.publicKey);
      form.append("signature", auth.signature);
      form.append("expire", String(auth.expire));
      form.append("token", auth.token);
      form.append("folder", auth.uploadFolder || "/quadx/avatars");
      form.append("useUniqueFileName", "true");

      const response = await fetch("https://upload.imagekit.io/api/v1/files/upload", {
        method: "POST",
        body: form
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok || !data?.url) {
        throw new Error(data?.message || "Image upload failed");
      }
      toast.success("Image uploaded. Save changes to apply.");
      return { url: data.url };
    } catch (error) {
      toast.error(error.message || "Image upload failed");
      throw error;
    }
  }

  // ── Nav items ─────────────────────────────────────
  const visibleNav = user
    ? NAV.filter((n) => n.key !== "game" || room)
    : [];

  // ─── RENDER ───────────────────────────────────────
  if (booting) {
    return (
      <>
        <div className="app">
          <main className="content" style={{ display: "grid", placeItems: "center", minHeight: "100vh" }}>
            <div className="text-muted">Loading session...</div>
          </main>
        </div>
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  if (!user) {
    if (page === "landing") {
      return (
        <>
          <LandingPage onOpenLogin={() => setPage("login")} />
          <ToastContainer toasts={toasts} />
        </>
      );
    }
    return (
      <>
        <LoginPage
          onEmailLogin={handleEmailLogin}
          onGoogleLogin={handleGoogleLogin}
          onVerifyEmail={handleVerifyEmail}
          onResendVerification={handleResendVerification}
          otpEmail={otpEmail}
          showOtpPage={showOtpPage}
          onBackToLogin={() => { setShowOtpPage(false); setAuthError(""); }}
          loading={authLoading}
          error={authError}
          mfaRequired={mfaRequired}
        />
        <ToastContainer toasts={toasts} />
      </>
    );
  }

  return (
    <>
      <div className="app">
        {/* ─── Sidebar ─── */}
        <aside className="sidebar">
          <div className="sidebar-brand">
            <div className="sidebar-brand-mark">Q</div>
            <span className="sidebar-brand-name">QuadX</span>
          </div>

          {visibleNav.map((n) => (
            <button
              key={n.key}
              className={`nav-item ${page === n.key ? "active" : ""}`}
              onClick={() => setPage(n.key)}
            >
              <span className="nav-icon"><Icon name={n.icon} size={16} /></span>
              <span>{n.label}</span>
            </button>
          ))}

          <div className="sidebar-spacer" />

          {connected ? (
            <div className="flex items-center gap-sm" style={{ padding: "0 0.75rem", marginBottom: "0.5rem" }}>
              <span className="live-indicator"><span className="live-dot" />Live</span>
            </div>
          ) : null}

          <div className="sidebar-user" onClick={logout} title="Click to sign out">
            <div className="user-avatar">
              {user.avatarUrl ? (
                <img src={user.avatarUrl} alt={user.username} />
              ) : (
                user.username[0].toUpperCase()
              )}
            </div>
            <div className="user-info">
              <div className="user-name">{user.username}</div>
              <div className="user-rating">
                {user.provisional
                  ? `Provisional (${Math.max(0, (user.placementTotal || 6) - (user.placementGamesPlayed || 0))}/6 left)`
                  : `${user.rating} - ${getRatingTier(user.rating)}`}
              </div>
            </div>
          </div>
        </aside>

        {/* ─── Content ─── */}
        <main className="content">
          {page === "home" && (
            <HomePage
              user={user}
              connected={connected}
              room={room}
              queueStatus={queueStatus}
              recentMatches={recentMatches}
              onCreateRoom={createRoom}
              onJoinRoom={joinRoom}
              onQueueJoin={queueJoin}
              onQueueLeave={queueLeave}
              onGoSettings={() => setPage("settings")}
              onGoFriends={() => setPage("friends")}
              onOpenGame={() => setPage("game")}
            />
          )}

          {page === "friends" && (
            <FriendsPage
              connected={connected}
              room={room}
              friends={friends}
              incomingRequests={incomingRequests}
              outgoingRequests={outgoingRequests}
              liveRooms={liveRooms}
              onRefresh={() => { loadFriends(); loadLiveRooms(); }}
              onSendFriendRequest={sendFriendRequest}
              onSearchFriendUsers={searchFriendUsers}
              onRespondFriendRequest={respondFriendRequest}
              onChallengeFriend={challengeFriend}
              onJoinFriendRoom={joinRoom}
              onSpectateRoom={spectateRoom}
              onOpenGame={() => setPage("game")}
            />
          )}

          {page === "game" && room && (
            <RoomView
              room={room}
              currentUserId={user?.id}
              onStart={startRoom}
              onDrop={dropMove}
              onLeave={leaveRoom}
              hideDropButtons={settings.hideDropButtons}
              pingMs={pingMs}
              chatMessages={chatMessages}
              onSendChat={sendChat}
              onInvite={inviteFriends}
              onRematch={rematch}
            />
          )}

          {page === "game" && !room && (
            <div style={{ textAlign: "center", padding: "4rem 2rem" }}>
              <div style={{ marginBottom: "1rem" }}><Icon name="game" size={44} /></div>
              <h2 className="page-title mb">No Active Game</h2>
              <p className="text-muted mb-lg">Queue up or create a custom room to get started.</p>
              <button className="btn btn-primary" onClick={() => setPage("home")}><Icon name="arrow-left" size={14} /> Back to Dashboard</button>
            </div>
          )}

          {page === "leaderboard" && (
            <LeaderboardPage
              data={leaderboard}
              period={leaderboardPeriod}
              onChangePeriod={changeLeaderboardPeriod}
              onOpenProfile={openProfile}
            />
          )}

          {page === "profile" && (
            <ProfilePage
              profileData={profileData}
              onBack={() => setPage("leaderboard")}
            />
          )}

          {page === "tournaments" && (
            <TournamentsPage
              tournaments={tournaments}
              currentTournament={currentTournament}
              onCreate={createTournament}
              onJoin={joinTournament}
              onOpen={openTournament}
              onStart={startTournament}
              onReport={reportResult}
              userId={user?.id}
            />
          )}

          {page === "settings" && (
            <SettingsPage
              user={user}
              settings={settings}
              onSave={saveSettings}
              onUploadAvatar={uploadAvatar}
              onBack={() => setPage("home")}
              loading={settingsLoading}
            />
          )}
        </main>
      </div>

      <ToastContainer toasts={toasts} />
    </>
  );
}





