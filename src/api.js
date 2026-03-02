const API_URL = import.meta.env.VITE_API_URL || "http://localhost:4000";

async function request(path, { method = "GET", body, token } = {}) {
  const useBearer = Boolean(token && token !== "cookie");
  const response = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(useBearer ? { Authorization: `Bearer ${token}` } : {})
    },
    body: body ? JSON.stringify(body) : undefined
  });

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const err = new Error(data.message || "Request failed");
    err.data = data;
    err.status = response.status;
    throw err;
  }
  return data;
}


export const api = {
  registerWithEmail: (payload) => request("/api/auth/register", { method: "POST", body: payload }),
  verifyEmail: (payload) => request("/api/auth/verify-email", { method: "POST", body: payload }),
  resendVerification: (payload) => request("/api/auth/resend-verification", { method: "POST", body: payload }),
  getGoogleConfig: () => request("/api/auth/google/config"),
  loginWithEmail: (payload) => request("/api/auth/login", { method: "POST", body: payload }),
  loginWithGoogle: (payload) => request("/api/auth/google", { method: "POST", body: payload }),
  logout: () => request("/api/auth/logout", { method: "POST" }),
  enableMfa: (token) => request("/api/auth/mfa/enable", { method: "POST", token }),
  disableMfa: (token) => request("/api/auth/mfa/disable", { method: "POST", token }),
  getMe: (token) => request("/api/auth/me", { token }),
  getSettings: (token) => request("/api/user/settings", { token }),
  getAvatarUploadAuth: (token) => request("/api/user/avatar-upload/auth", { token }),
  updateSettings: (token, payload) =>
    request("/api/user/settings", { method: "PATCH", token, body: payload }),
  deleteAccount: (token, payload) =>
    request("/api/user/account", { method: "DELETE", token, body: payload }),
  getFriends: (token) => request("/api/friends", { token }),
  getFriendRequests: (token) => request("/api/friends/requests", { token }),
  searchFriendUsers: (token, query) =>
    request(`/api/friends/search?q=${encodeURIComponent(query)}`, { token }),
  sendFriendRequest: (token, identifier) =>
    request("/api/friends/request", { method: "POST", token, body: { identifier } }),
  respondFriendRequest: (token, requestId, action) =>
    request(`/api/friends/requests/${requestId}`, { method: "PATCH", token, body: { action } }),
  getRecentMatches: (token, limit = 10) => request(`/api/matches/recent?limit=${limit}`, { token }),
  reportSuspiciousMatch: (token, payload) => request("/api/matches/report", { method: "POST", token, body: payload }),
  getLeaderboard: (token, period = "all", limit = 50) =>
    request(`/api/ratings/leaderboard?period=${period}&limit=${limit}`, { token }),
  getProfile: (token, username) => request(`/api/ratings/profile/${encodeURIComponent(username)}`, { token }),
  getTournaments: (token) => request("/api/tournaments", { token }),
  createTournament: (token, payload) => request("/api/tournaments", { method: "POST", token, body: payload }),
  joinTournament: (token, id) => request(`/api/tournaments/${id}/join`, { method: "POST", token }),
  startTournament: (token, id) => request(`/api/tournaments/${id}/start`, { method: "POST", token }),
  getTournament: (token, id) => request(`/api/tournaments/${id}`, { token }),
  reportTournamentResult: (token, id, roundNumber, payload) =>
    request(`/api/tournaments/${id}/rounds/${roundNumber}/report`, { method: "PATCH", token, body: payload })
};
