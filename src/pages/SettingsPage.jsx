import { useEffect, useState } from "react";
import Icon from "../components/Icon";

function SettingsPage({ user, settings, onSave, onBack, loading, onUploadAvatar }) {
  const [username, setUsername] = useState(user?.username || "");
  const [avatarUrl, setAvatarUrl] = useState(user?.avatarUrl || "");
  const [hideDropButtons, setHideDropButtons] = useState(Boolean(settings?.hideDropButtons));
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    setUsername(user?.username || "");
    setAvatarUrl(user?.avatarUrl || "");
  }, [user?.username, user?.avatarUrl]);

  useEffect(() => {
    setHideDropButtons(Boolean(settings?.hideDropButtons));
  }, [settings?.hideDropButtons]);

  const initials = (username || "?")[0].toUpperCase();

  async function handleAvatarFile(event) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) return;
    if (file.size > 8 * 1024 * 1024) return;
    if (typeof onUploadAvatar !== "function") return;
    setUploading(true);
    try {
      const uploaded = await onUploadAvatar(file);
      if (uploaded?.url) setAvatarUrl(uploaded.url);
    } catch (_error) {
      // toast is handled at App level
    } finally {
      setUploading(false);
    }
  }

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Set<span>tings</span></h1>
        <button className="btn btn-ghost" onClick={onBack}><Icon name="arrow-left" size={14} /> Back</button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "1.25rem" }}>
        {/* Profile */}
        <div className="card">
          <div className="panel-title mb">Profile</div>

          <div className="flex items-center gap mb-lg">
            <div className="avatar-preview">
              {avatarUrl ? <img src={avatarUrl} alt="avatar" onError={(e) => { e.target.style.display = "none"; }} /> : initials}
            </div>
            <div>
              <div className="fw-bold" style={{ fontSize: "0.95rem" }}>{username || "Your name"}</div>
              <div className="text-sm text-muted"><Icon name="zap" size={13} /> {user?.rating ?? 1000} ELO</div>
            </div>
          </div>

          <div className="field mb">
            <label className="label">Username</label>
            <input
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              minLength={2}
              maxLength={24}
              placeholder="Your public display name"
            />
          </div>

          <div className="field mb-lg">
            <label className="label">Avatar URL</label>
            <input
              value={avatarUrl}
              onChange={(e) => setAvatarUrl(e.target.value)}
              placeholder="https://example.com/avatar.jpg"
            />
            <div className="text-xs text-muted" style={{ marginTop: "0.35rem" }}>
              Or upload an image (max 8MB).
            </div>
            <div style={{ marginTop: "0.5rem", display: "flex", gap: "0.5rem", alignItems: "center" }}>
              <label className="btn btn-secondary btn-sm" style={{ cursor: uploading ? "wait" : "pointer" }}>
                {uploading ? "Uploading..." : "Upload Image"}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarFile}
                  disabled={uploading || loading}
                  style={{ display: "none" }}
                />
              </label>
            </div>
          </div>

          <button
            className="btn btn-primary btn-full"
            onClick={() => onSave({ username, avatarUrl, hideDropButtons })}
            disabled={loading}
          >
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </div>

        {/* Gameplay */}
        <div className="card">
          <div className="panel-title mb">Gameplay</div>

          <div className="toggle-row">
            <div>
              <div className="toggle-label">Hide Drop Buttons</div>
              <div className="toggle-desc">Click the board cells directly to drop pieces</div>
            </div>
            <label className="switch">
              <input
                type="checkbox"
                checked={hideDropButtons}
                onChange={(e) => setHideDropButtons(e.target.checked)}
              />
              <span className="switch-track" />
            </label>
          </div>

          <div className="sep" />

          <div className="card" style={{ background: "rgba(0,0,0,0.2)", marginTop: "0.75rem" }}>
            <div className="text-xs text-muted mb-sm">Account Info</div>
            <div className="flex justify-between text-sm mb-sm">
              <span className="text-muted">Email</span>
              <span className="mono">{user?.email || "—"}</span>
            </div>
            <div className="flex justify-between text-sm mb-sm">
              <span className="text-muted">Games Played</span>
              <span className="mono">{user?.gamesPlayed ?? 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted">Record</span>
              <span className="mono text-sm">
                <span style={{ color: "var(--green)" }}>{user?.wins ?? 0}W</span>
                {" / "}
                <span style={{ color: "var(--danger)" }}>{user?.losses ?? 0}L</span>
                {" / "}
                {user?.draws ?? 0}D
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default SettingsPage;


