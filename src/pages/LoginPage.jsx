import { useEffect, useRef, useState } from "react";
import { api } from "../api";
import { GoogleOAuthProvider, GoogleLogin } from "@react-oauth/google";

const ENV_GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || "";

function LoginPage({
  onEmailLogin,
  onGoogleLogin,
  onVerifyEmail,
  onResendVerification,
  otpEmail,
  showOtpPage,
  onBackToLogin,
  loading,
  error,
  mfaRequired,
}) {
  const [mode, setMode] = useState("login");
  const [email, setEmail] = useState(otpEmail || "");
  const [password, setPassword] = useState("");
  const [username, setUsername] = useState("");
  const [mfaCode, setMfaCode] = useState("");
  const [verifyOtp, setVerifyOtp] = useState("");
  const [googleReady, setGoogleReady] = useState(false);
  const [googleError, setGoogleError] = useState("");
  const [googleClientId, setGoogleClientId] = useState("");
  const [googleWidth, setGoogleWidth] = useState(320);
  const googleWrapRef = useRef(null);

  useEffect(() => {
    if (otpEmail) setEmail(otpEmail);
  }, [otpEmail]);

  function submitEmail(e) {
    e.preventDefault();
    onEmailLogin({ mode, email, password, username, mfaCode });
  }

  function submitOtp(e) {
    e.preventDefault();
    onVerifyEmail({ email, otp: verifyOtp });
  }

  useEffect(() => {
    let active = true;
    if (showOtpPage) return () => {};
    setGoogleReady(false);
    setGoogleError("");

    async function setupGoogle() {
      try {
        let resolvedClientId = String(ENV_GOOGLE_CLIENT_ID || "").trim();
        if (!resolvedClientId || resolvedClientId.startsWith("your_google_client_id")) {
          const config = await api.getGoogleConfig();
          resolvedClientId = String(config?.clientId || "").trim();
        }
        if (!resolvedClientId) {
          if (active) setGoogleError("Google Sign-In is not configured yet.");
          return;
        }
        if (active) {
          setGoogleClientId(resolvedClientId);
          setGoogleReady(true);
        }
      } catch (_error) {
        if (active) setGoogleError("Unable to load Google Sign-In.");
      }
    }

    setupGoogle();
    return () => { active = false; };
  }, [onGoogleLogin, showOtpPage]);

  useEffect(() => {
    const measure = () => {
      const containerWidth = Math.floor(googleWrapRef.current?.clientWidth || (window.innerWidth - 24));
      const nextWidth = Math.max(120, Math.min(400, containerWidth - 2));
      setGoogleWidth(nextWidth);
    };

    measure();
    const ro = new ResizeObserver(measure);
    if (googleWrapRef.current) ro.observe(googleWrapRef.current);
    window.addEventListener("resize", measure);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  if (showOtpPage) {
    return (
      <div className="auth-page">
        <div className="auth-card">
          <div className="auth-logo">Verify <span>Email</span></div>
          <p className="auth-sub">Enter the OTP sent to your email.</p>

          <form onSubmit={submitOtp} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div className="field">
              <label className="label">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label className="label">OTP</label>
              <input
                value={verifyOtp}
                onChange={(e) => setVerifyOtp(e.target.value)}
                placeholder="6-digit OTP"
                maxLength={6}
                required
              />
            </div>
            <button className="btn btn-primary btn-full" disabled={loading} type="submit">
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              className="btn btn-secondary btn-full"
              disabled={loading || !email}
              onClick={() => onResendVerification({ email })}
            >
              Resend OTP
            </button>
            <button type="button" className="btn btn-ghost btn-full" onClick={onBackToLogin}>
              Back to Login
            </button>
          </form>

          {error && <p className="mt-sm text-sm" style={{ color: "var(--danger)", textAlign: "center" }}>{error}</p>}
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-logo">
          Quad<span>X</span>
        </div>
        <p className="auth-sub">The competitive Connect 4 platform</p>

        <div className="tabs mb">
          <button className={`tab ${mode === "login" ? "active" : ""}`} onClick={() => setMode("login")}>Sign In</button>
          <button className={`tab ${mode === "register" ? "active" : ""}`} onClick={() => setMode("register")}>Create Account</button>
        </div>

        <form onSubmit={submitEmail} style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          {mode === "register" && (
            <div className="field">
              <label className="label">Username</label>
              <input
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Your display name"
                minLength={2}
                maxLength={24}
              />
            </div>
          )}
          <div className="field">
            <label className="label">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
            />
          </div>
          <div className="field">
            <label className="label">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="10+ chars, upper/lower/number/symbol"
              required
            />
          </div>
          {mode === "login" && mfaRequired && (
            <div className="field">
              <label className="label">MFA Code</label>
              <input
                value={mfaCode}
                onChange={(e) => setMfaCode(e.target.value)}
                placeholder="6-digit code"
                maxLength={6}
                required
              />
            </div>
          )}
          <button className="btn btn-primary btn-full" disabled={loading} type="submit">
            {loading ? "Loading..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </form>

        <div className="auth-divider">or continue with</div>

        <div className="google-wrap" ref={googleWrapRef}>
          {googleReady && googleClientId ? (
            <GoogleOAuthProvider clientId={googleClientId}>
              <GoogleLogin
                onSuccess={async (credentialResponse) => {
                  if (!credentialResponse?.credential) {
                    setGoogleError("Google sign-in failed. No credential returned.");
                    return;
                  }
                  setGoogleError("");
                  await onGoogleLogin({ idToken: credentialResponse.credential });
                }}
                onError={() => setGoogleError("Google sign-in failed. Please try again.")}
                type="standard"
                text="continue_with"
                logo_alignment="left"
                shape="rectangular"
                size={googleWidth < 230 ? "medium" : "large"}
                width={String(googleWidth)}
              />
            </GoogleOAuthProvider>
          ) : null}
          {!googleReady && !googleError && <p className="text-muted text-sm">Loading Google...</p>}
          {googleError && <p className="text-sm" style={{ color: "var(--danger)" }}>{googleError}</p>}
          {googleClientId && !googleError && <p className="text-xs text-dim">Google sign-in enabled</p>}
        </div>

        {error && (
          <p className="mt-sm text-sm" style={{ color: "var(--danger)", textAlign: "center" }}>{error}</p>
        )}
      </div>
    </div>
  );
}

export default LoginPage;
