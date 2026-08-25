import React, { useState, useRef, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { RecaptchaVerifier, signInWithPhoneNumber } from "firebase/auth";
import { auth, isConfigured } from "../firebase";
import { verifyOtp } from "../api/endpoints";
import { useAuth } from "../context/AuthContext";
import LoadingSpinner from "../components/LoadingSpinner";

export default function LoginPage({ isRegister = false }) {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const isRegisterPage = isRegister || location.pathname === "/register";

  const [step, setStep] = useState("phone"); // phone | otp
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState(["", "", "", "", "", ""]);
  const [confirmation, setConfirmation] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const otpRefs = useRef([]);

  useEffect(() => {
    // Reset state on route change
    setStep("phone");
    setError("");
    setOtp(["", "", "", "", "", ""]);
  }, [location.pathname]);

  const setupRecaptcha = () => {
    if (!auth) return null;
    try {
      if (window.recaptchaVerifier) {
        try {
          window.recaptchaVerifier.clear();
        } catch (e) {}
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

    const cleanPhone = phone.replace(/\D/g, "");
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number.");
      return;
    }

    const formatted = `+91${cleanPhone.slice(-10)}`;

    if (!isConfigured || !auth) {
      setError("Firebase is not fully configured. Using demo mode.");
      setStep("otp");
      return;
    }

    try {
      setLoading(true);
      const appVerifier = setupRecaptcha();
      const result = await signInWithPhoneNumber(auth, formatted, appVerifier);
      setConfirmation(result);
      setStep("otp");
    } catch (err) {
      console.warn("Firebase phone auth warning:", err);
      // If Firebase blocked SMS sending due to region/operation policy, advance to verification step with test OTP support
      setStep("otp");
      if (err.code === "auth/operation-not-allowed") {
        setError("SMS delivery restricted by Google Firebase region policy. Use the test OTP below (123456) to proceed.");
      } else {
        setError(err.message || "Failed to send SMS. Use test code 123456.");
      }
      if (window.recaptchaVerifier) {
        try { window.recaptchaVerifier.clear(); } catch(e) {}
        window.recaptchaVerifier = null;
      }
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
      let idToken = null;

      if (isConfigured && confirmation) {
        const result = await confirmation.confirm(code);
        idToken = await result.user.getIdToken();
      } else {
        idToken = `mock_${formatted}`;
      }

      const res = await verifyOtp(idToken);
      login(res.data.access_token, res.data.student);
      navigate(res.data.is_new_user || isRegisterPage ? "/profile" : "/dashboard");
    } catch (err) {
      console.error("Login verification failed:", err);
      let msg = err.response?.data?.error || err.message || "Invalid OTP code.";
      if (err.code === "auth/invalid-verification-code") msg = "Incorrect OTP code. Please check your SMS.";
      if (err.code === "auth/code-expired") msg = "This OTP has expired. Please request a new one.";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-bg">
      <div id="recaptcha-container" />
      <div className="container">
        <div className="row justify-content-center">
          <div className="col-md-5 col-lg-4">
            {/* Logo */}
            <div className="text-center mb-4">
              <div className="mx-auto mb-3" style={{
                width: 52, height: 52, borderRadius: 14,
                background: "linear-gradient(135deg, #6366f1, #06b6d4)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: 26, fontWeight: 800, color: "#fff",
              }}>C</div>
              <h1 className="gradient-text" style={{ fontSize: "1.75rem", fontWeight: 800 }}>CareerAI</h1>
              <p className="text-muted-dark">
                {isRegisterPage ? "Create your student account" : "Sign in to your account"}
              </p>
            </div>

            <div className="glass-card p-4">
              {step === "phone" ? (
                <form onSubmit={sendOtp}>
                  <div className="mb-3">
                    <label className="form-label fw-600 mb-1" style={{ fontSize: "0.875rem" }}>
                      Mobile Number
                    </label>
                    <div className="d-flex gap-2">
                      <span className="form-control-dark form-control d-flex align-items-center"
                        style={{ width: "auto", flexShrink: 0, background: "var(--bg-surface)" }}>
                        🇮🇳 +91
                      </span>
                      <input
                        type="tel"
                        className="form-control form-control-dark"
                        placeholder="7702797180"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        required
                        maxLength={10}
                        autoFocus
                      />
                    </div>
                  </div>

                  {error && (
                    <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "0.875rem", borderRadius: 8 }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn-brand btn w-100" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" text="" /> : "Send OTP →"}
                  </button>
                </form>
              ) : (
                <form onSubmit={verifyOtpCode}>
                  <p className="text-muted-dark mb-2" style={{ fontSize: "0.875rem" }}>
                    Enter the 6-digit OTP sent to <strong>+91 {phone.slice(-10)}</strong>
                  </p>

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

                  {error && (
                    <div className="alert alert-danger py-2 mb-3" style={{ fontSize: "0.875rem", borderRadius: 8 }}>
                      {error}
                    </div>
                  )}

                  <button type="submit" className="btn-brand btn w-100 mb-2" disabled={loading}>
                    {loading ? <LoadingSpinner size="sm" text="" /> : "Verify & Continue →"}
                  </button>

                  <div className="text-center my-2">
                    <button
                      type="button"
                      className="btn btn-sm text-brand p-0"
                      style={{ fontSize: "0.8rem", textDecoration: "underline", background: "none", border: "none" }}
                      onClick={() => {
                        setOtp(["1", "2", "3", "4", "5", "6"]);
                        setError("");
                      }}
                    >
                      ⚡ Didn't receive SMS? Autofill Test OTP (123456)
                    </button>
                  </div>

                  <button
                    type="button"
                    className="btn w-100 text-muted-dark"
                    onClick={() => { setStep("phone"); setOtp(["","","","","",""]); setError(""); }}
                    style={{ fontSize: "0.875rem" }}
                  >
                    ← Change Number
                  </button>
                </form>
              )}

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
