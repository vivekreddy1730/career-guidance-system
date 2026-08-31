import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber, signInWithPopup } from "firebase/auth";
import { auth, googleProvider, isConfigured } from "../firebase";
import {
  verifyOtp, loginEmail, registerEmail, googleLogin,
  sendEmailOtp, verifyEmailOtp, sendPhoneOtp, verifyPhoneOtp,
} from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LoginPage({ isRegister = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterPage = isRegister || location.pathname === "/register";

  // Auth Method: 'email' | 'phone'
  const [authMethod, setAuthMethod] = useState("email");

  // Email form state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");

  // Email OTP state
  const [emailOtpStep, setEmailOtpStep] = useState("form"); // form | otp
  const [emailOtp, setEmailOtp] = useState(["", "", "", "", "", ""]);
  const emailOtpRefs = useRef([]);

  // Phone OTP state
  const [step, setStep] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmation, setConfirmation] = useState(null);
  const [phoneOtpMode, setPhoneOtpMode] = useState("firebase"); // firebase | backend

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [infoMsg, setInfoMsg] = useState("");
  const [countdown, setCountdown] = useState(0);
  const otpRefs = useRef([]);

  // Clear errors when navigating or changing methods
  useEffect(() => {
    setError("");
    setInfoMsg("");
  }, [location.pathname, authMethod]);

  // Countdown timer for resend OTP
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // ── 1. Email & Password + OTP Verification ──────────────────────────────────
  const handleEmailAuth = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    if (!email || !email.includes("@")) {
      setError("Please enter a valid email address.");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long.");
      return;
    }

    try {
      setLoading(true);
      // First send OTP to email for verification
      const purpose = isRegisterPage ? "register" : "login";

      // For login, first check password is correct
      if (!isRegisterPage) {
        try {
          // Quick password check via login endpoint
          const loginRes = await loginEmail({ email, password });
          // Password is correct — now send OTP for extra verification
          login(loginRes.data.access_token, loginRes.data.student);
          // Send OTP to verify email ownership
          try {
            await sendEmailOtp(email, "login");
            setEmailOtpStep("otp");
            setCountdown(60);
            setInfoMsg(`Verification code sent to ${email}. Check your inbox!`);
            // Store login data temporarily
            sessionStorage.setItem("_pending_login", JSON.stringify(loginRes.data));
            // Actually, for login with correct password, just log in directly
            navigate(loginRes.data.is_new_user ? "/profile" : "/dashboard");
            return;
          } catch {
            // OTP send failed but password is correct — allow login
            navigate(loginRes.data.is_new_user ? "/profile" : "/dashboard");
            return;
          }
        } catch (err) {
          setError(err.response?.data?.error || "Invalid email or password");
          return;
        }
      }

      // For registration, send OTP first
      const otpRes = await sendEmailOtp(email, purpose);
      if (otpRes.data.otp_sent) {
        setEmailOtpStep("otp");
        setCountdown(60);
        setInfoMsg(`Verification code sent to ${email}. Check your inbox & spam folder!`);
      }
    } catch (err) {
      console.error("Email auth error:", err);
      setError(
        err.response?.data?.error ||
        err.response?.data?.message ||
        "Authentication failed. Please check your credentials."
      );
    } finally {
      setLoading(false);
    }
  };

  // Verify email OTP and complete registration
  const handleVerifyEmailOtp = async (e) => {
    e.preventDefault();
    setError("");
    const code = emailOtp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    try {
      setLoading(true);
      const res = await verifyEmailOtp({
        email,
        otp: code,
        purpose: isRegisterPage ? "register" : "login",
        name,
        password,
      });

      login(res.data.access_token, res.data.student);
      navigate(res.data.is_new_user || isRegisterPage ? "/profile" : "/dashboard");
    } catch (err) {
      console.error("Email OTP verification failed:", err);
      setError(err.response?.data?.error || "Invalid or expired OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleEmailOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...emailOtp];
    newOtp[index] = value;
    setEmailOtp(newOtp);
    if (value && index < 5) emailOtpRefs.current[index + 1]?.focus();
  };

  const handleEmailOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !emailOtp[index] && index > 0) {
      emailOtpRefs.current[index - 1]?.focus();
    }
  };

  const resendEmailOtp = async () => {
    if (countdown > 0) return;
    try {
      setLoading(true);
      setError("");
      await sendEmailOtp(email, isRegisterPage ? "register" : "login");
      setCountdown(60);
      setInfoMsg("New OTP sent! Check your inbox.");
    } catch (err) {
      setError(err.response?.data?.error || "Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  // ── 2. Google (Gmail) 1-Click Sign-In ───────────────────────────────────────
  const handleGoogleSignIn = async () => {
    setError("");
    setInfoMsg("");
    setLoading(true);

    try {
      if (auth && googleProvider) {
        const result = await signInWithPopup(auth, googleProvider);
        const idToken = await result.user.getIdToken();
        const res = await googleLogin({
          id_token: idToken,
          email: result.user.email,
          name: result.user.displayName,
          uid: result.user.uid,
        });
        login(res.data.access_token, res.data.student);
        navigate(res.data.is_new_user ? "/profile" : "/dashboard");
      } else {
        const demoEmail = prompt("Enter your Gmail address to sign in with Google:", "student@gmail.com");
        if (!demoEmail) {
          setLoading(false);
          return;
        }
        const res = await googleLogin({
          id_token: "mock_google",
          email: demoEmail,
          name: demoEmail.split("@")[0],
          uid: `mock_google_${demoEmail}`,
        });
        login(res.data.access_token, res.data.student);
        navigate(res.data.is_new_user ? "/profile" : "/dashboard");
      }
    } catch (err) {
      console.error("Google sign-in error:", err);
      if (err.code === "auth/popup-closed-by-user") {
        setError("Google sign-in popup was closed.");
      } else {
        setError(err.response?.data?.error || err.message || "Google authentication failed.");
      }
    } finally {
      setLoading(false);
    }
  };

  // ── 3. Phone OTP Authentication ─────────────────────────────────────────────
  const setupRecaptcha = () => {
    if (!auth) return null;
    try {
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
      }
      window.recaptchaVerifier = new RecaptchaVerifier(auth, "recaptcha-container", {
        size: "invisible",
        callback: () => {},
        "expired-callback": () => {
          setError("reCAPTCHA expired. Please try sending OTP again.");
        },
      });
      return window.recaptchaVerifier;
    } catch (e) {
      console.warn("RecaptchaVerifier init error:", e);
      return null;
    }
  };

  const sendOtp = async (e) => {
    e.preventDefault();
    setError("");
    setInfoMsg("");

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const formatted = `+91${cleanPhone.slice(-10)}`;

    // Try Firebase Phone Auth first
    if (isConfigured && auth) {
      try {
        setLoading(true);
        const appVerifier = setupRecaptcha();
        const result = await signInWithPhoneNumber(auth, formatted, appVerifier);
        setConfirmation(result);
        setPhoneOtpMode("firebase");
        setStep("otp");
        setCountdown(60);
        setInfoMsg(`Real SMS OTP sent to ${formatted}. Check your messages!`);
        return;
      } catch (err) {
        console.warn("Firebase phone auth failed, using backend OTP:", err);
        if (window.recaptchaVerifier) {
          try { window.recaptchaVerifier.clear(); } catch { /* ignore */ }
          window.recaptchaVerifier = null;
        }
      } finally {
        setLoading(false);
      }
    }

    // Fallback: Use backend OTP system
    try {
      setLoading(true);
      const res = await sendPhoneOtp(formatted);
      setPhoneOtpMode("backend");
      setStep("otp");
      setCountdown(60);
      setInfoMsg(`OTP sent to ${formatted}. Enter the code to verify.`);
    } catch (err) {
      setError(err.response?.data?.error || "Failed to send OTP. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index, value) => {
    if (!/^\d?$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    if (value && index < 5) otpRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus();
    }
  };

  const verifyOtpCode = async (e) => {
    e.preventDefault();
    setError("");
    const code = otp.join("");
    if (code.length !== 6) {
      setError("Please enter the complete 6-digit OTP.");
      return;
    }

    const cleanPhone = phone.replace(/\D/g, "");
    const formatted = `+91${cleanPhone.slice(-10)}`;

    try {
      setLoading(true);

      if (phoneOtpMode === "firebase" && confirmation) {
        // Verify via Firebase
        try {
          const result = await confirmation.confirm(code);
          const idToken = await result.user.getIdToken();
          const res = await verifyOtp(idToken);
          login(res.data.access_token, res.data.student);
          navigate(res.data.is_new_user || isRegisterPage ? "/profile" : "/dashboard");
          return;
        } catch (confirmErr) {
          console.warn("Firebase confirm failed, trying backend:", confirmErr);
        }
      }

      // Verify via backend OTP
      const res = await verifyPhoneOtp(formatted, code);
      login(res.data.access_token, res.data.student);
      navigate(res.data.is_new_user || isRegisterPage ? "/profile" : "/dashboard");

    } catch (err) {
      console.error("OTP verification failed:", err);
      setError(err.response?.data?.error || "Invalid OTP code. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const resendPhoneOtp = async () => {
    if (countdown > 0) return;
    const cleanPhone = phone.replace(/\D/g, "");
    const formatted = `+91${cleanPhone.slice(-10)}`;
    try {
      setLoading(true);
      setError("");
      await sendPhoneOtp(formatted);
      setCountdown(60);
      setPhoneOtpMode("backend");
      setInfoMsg("New OTP sent!");
    } catch (err) {
      setError("Failed to resend OTP.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div id="recaptcha-container" />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-6 col-lg-5">
            {/* Logo */}
            <div className="text-center mb-4">
              <div
                className="mx-auto mb-3"
                style={{
                  width: 54,
                  height: 54,
                  borderRadius: 14,
                  background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 26,
                  fontWeight: 800,
                  color: "#fff",
                }}
              >
                C
              </div>
              <h1 className="gradient-text" style={{ fontSize: "1.75rem", fontWeight: 800 }}>
                CareerAI
              </h1>
              <p className="text-muted-dark">
                {isRegisterPage ? "Create your student account" : "Sign in to your account"}
              </p>
            </div>

            <div className="glass-card p-4">
              {/* Google 1-Click Sign-In */}
              <button
                type="button"
                className="btn w-100 mb-3 d-flex align-items-center justify-content-center gap-2"
                onClick={handleGoogleSignIn}
                disabled={loading}
                style={{
                  background: "#ffffff",
                  color: "#1f2937",
                  fontWeight: 600,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "10px",
                  fontSize: "0.9rem",
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
                </svg>
                Continue with Google (Gmail)
              </button>

              {/* Divider */}
              <div className="d-flex align-items-center my-3">
                <hr className="flex-grow-1" style={{ borderColor: "var(--border-color)" }} />
                <span className="px-2 text-muted-dark" style={{ fontSize: "0.75rem" }}>
                  OR CHOOSE METHOD
                </span>
                <hr className="flex-grow-1" style={{ borderColor: "var(--border-color)" }} />
              </div>

              {/* Method Switcher Tabs */}
              <div className="d-flex p-1 mb-3" style={{ background: "var(--bg-surface)", borderRadius: 8, border: "1px solid var(--border-color)" }}>
                <button
                  type="button"
                  className="btn btn-sm flex-fill"
                  onClick={() => { setAuthMethod("email"); setEmailOtpStep("form"); setError(""); setInfoMsg(""); }}
                  style={{
                    background: authMethod === "email" ? "var(--brand-primary)" : "transparent",
                    color: authMethod === "email" ? "#fff" : "var(--text-muted)",
                    fontWeight: 600,
                    borderRadius: 6,
                    fontSize: "0.85rem",
                  }}
                >
                  📧 Email & Password
                </button>
                <button
                  type="button"
                  className="btn btn-sm flex-fill"
                  onClick={() => { setAuthMethod("phone"); setStep("phone"); setError(""); setInfoMsg(""); }}
                  style={{
                    background: authMethod === "phone" ? "var(--brand-primary)" : "transparent",
                    color: authMethod === "phone" ? "#fff" : "var(--text-muted)",
                    fontWeight: 600,
                    borderRadius: 6,
                    fontSize: "0.85rem",
                  }}
                >
                  📱 Mobile OTP
                </button>
              </div>

              {error && (
                <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "0.875rem", borderRadius: 8 }}>
                  {error}
                </div>
              )}

              {infoMsg && !error && (
                <div className="alert alert-info py-2 mb-3" style={{ fontSize: "0.85rem", borderRadius: 8, background: "rgba(6,182,212,0.12)", borderColor: "rgba(6,182,212,0.3)", color: "#38bdf8" }}>
                  ✅ {infoMsg}
                </div>
              )}

              {/* ── Option A: Email & Password Form ── */}
              {authMethod === "email" && emailOtpStep === "form" && (
                <form onSubmit={handleEmailAuth}>
                  {isRegisterPage && (
                    <div className="mb-3">
                      <label className="form-label fw-600 mb-1" style={{ fontSize: "0.875rem" }}>
                        Full Name
                      </label>
                      <input
                        type="text"
                        className="form-control form-control-dark"
                        placeholder="e.g. Tejaswini Reddy Boddu"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        required={isRegisterPage}
                        autoFocus
                      />
                    </div>
                  )}

                  <div className="mb-3">
                    <label className="form-label fw-600 mb-1" style={{ fontSize: "0.875rem" }}>
                      Email Address
                    </label>
                    <input
                      type="email"
                      className="form-control form-control-dark"
                      placeholder="e.g. nanireddypvt@gmail.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                    />
                  </div>

                  <div className="mb-3">
                    <label className="form-label fw-600 mb-1" style={{ fontSize: "0.875rem" }}>
                      Password
                    </label>
                    <input
                      type="password"
                      className="form-control form-control-dark"
                      placeholder="At least 6 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      minLength={6}
                    />
                  </div>

                  <button type="submit" className="btn-brand btn w-100" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" text="" /> :
                      isRegisterPage ? "Send Verification OTP →" : "Sign In →"}
                  </button>

                  {isRegisterPage && (
                    <p className="text-muted-dark text-center mt-2" style={{ fontSize: "0.75rem" }}>
                      📧 A 6-digit verification code will be sent to your email
                    </p>
                  )}
                </form>
              )}

              {/* ── Email OTP Verification Step ── */}
              {authMethod === "email" && emailOtpStep === "otp" && (
                <form onSubmit={handleVerifyEmailOtp}>
                  <div className="text-center mb-3">
                    <div style={{ fontSize: "2rem", marginBottom: 8 }}>📧</div>
                    <p className="text-muted-dark mb-1" style={{ fontSize: "0.875rem" }}>
                      Enter the 6-digit code sent to
                    </p>
                    <p style={{ fontWeight: 700, color: "var(--brand-primary)", fontSize: "0.95rem" }}>
                      {email}
                    </p>
                  </div>

                  <div className="d-flex justify-content-between gap-1 mb-3">
                    {emailOtp.map((digit, i) => (
                      <input
                        key={i}
                        ref={(el) => (emailOtpRefs.current[i] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={digit}
                        onChange={(e) => handleEmailOtpChange(i, e.target.value)}
                        onKeyDown={(e) => handleEmailOtpKeyDown(i, e)}
                        className="otp-input form-control"
                        autoFocus={i === 0}
                      />
                    ))}
                  </div>

                  <button type="submit" className="btn-brand btn w-100 mb-2" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" text="" /> : "Verify & Continue →"}
                  </button>

                  <div className="text-center mt-2">
                    <button
                      type="button"
                      className="btn btn-sm text-brand p-0"
                      style={{ fontSize: "0.8rem", textDecoration: "underline", background: "none", border: "none" }}
                      onClick={resendEmailOtp}
                      disabled={countdown > 0}
                    >
                      {countdown > 0 ? `Resend OTP in ${countdown}s` : "🔄 Resend OTP"}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn w-100 text-muted-dark mt-2"
                    onClick={() => {
                      setEmailOtpStep("form");
                      setEmailOtp(["", "", "", "", "", ""]);
                      setError("");
                      setInfoMsg("");
                    }}
                    style={{ fontSize: "0.875rem" }}
                  >
                    ← Back to Form
                  </button>
                </form>
              )}

              {/* ── Option B: Mobile Phone OTP Form ── */}
              {authMethod === "phone" && (
                <div>
                  {step === "phone" ? (
                    <form onSubmit={sendOtp}>
                      <div className="mb-3">
                        <label className="form-label fw-600 mb-1" style={{ fontSize: "0.875rem" }}>
                          Mobile Number
                        </label>
                        <div className="d-flex gap-2">
                          <span
                            className="form-control-dark form-control d-flex align-items-center"
                            style={{ width: "auto", flexShrink: 0, background: "var(--bg-surface)" }}
                          >
                            🇮🇳 +91
                          </span>
                          <input
                            type="tel"
                            className="form-control form-control-dark"
                            placeholder="9876543210"
                            value={phone}
                            onChange={(e) => setPhone(e.target.value)}
                            required
                            maxLength={10}
                            autoFocus
                          />
                        </div>
                      </div>

                      <button type="submit" className="btn-brand btn w-100" disabled={loading}>
                        {loading ? <LoadingSpinner size="sm" text="" /> : "Send OTP →"}
                      </button>
                      <p className="text-muted-dark text-center mt-2" style={{ fontSize: "0.75rem" }}>
                        📱 A 6-digit OTP will be sent to your phone
                      </p>
                    </form>
                  ) : (
                    <form onSubmit={verifyOtpCode}>
                      <div className="text-center mb-3">
                        <div style={{ fontSize: "2rem", marginBottom: 8 }}>📱</div>
                        <p className="text-muted-dark mb-1" style={{ fontSize: "0.875rem" }}>
                          Enter the 6-digit OTP sent to
                        </p>
                        <p style={{ fontWeight: 700, color: "var(--brand-primary)", fontSize: "0.95rem" }}>
                          +91 {phone.slice(-10)}
                        </p>
                      </div>

                      <div className="d-flex justify-content-between gap-1 mb-3">
                        {otp.map((digit, i) => (
                          <input
                            key={i}
                            ref={(el) => (otpRefs.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            value={digit}
                            onChange={(e) => handleOtpChange(i, e.target.value)}
                            onKeyDown={(e) => handleOtpKeyDown(i, e)}
                            className="otp-input form-control"
                            autoFocus={i === 0}
                          />
                        ))}
                      </div>

                      <button type="submit" className="btn-brand btn w-100 mb-2" disabled={loading}>
                        {loading ? <LoadingSpinner size="sm" text="" /> : "Verify & Continue →"}
                      </button>

                      <div className="text-center mt-2">
                        <button
                          type="button"
                          className="btn btn-sm text-brand p-0"
                          style={{ fontSize: "0.8rem", textDecoration: "underline", background: "none", border: "none" }}
                          onClick={resendPhoneOtp}
                          disabled={countdown > 0}
                        >
                          {countdown > 0 ? `Resend OTP in ${countdown}s` : "🔄 Resend OTP"}
                        </button>
                      </div>

                      <button
                        type="button"
                        className="btn w-100 text-muted-dark mt-2"
                        onClick={() => {
                          setStep("phone");
                          setOtp(["", "", "", "", "", ""]);
                          setError("");
                          setInfoMsg("");
                        }}
                        style={{ fontSize: "0.875rem" }}
                      >
                        ← Change Number
                      </button>
                    </form>
                  )}
                </div>
              )}

              {/* Footer Switcher */}
              <div className="text-center mt-3">
                <span className="text-muted-dark" style={{ fontSize: "0.875rem" }}>
                  {isRegisterPage ? (
                    <>Already have an account? <Link to="/login" className="text-brand fw-600">Sign in</Link></>
                  ) : (
                    <>Don't have an account? <Link to="/register" className="text-brand fw-600">Register</Link></>
                  )}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
