"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import AuthShell from "@/components/auth/AuthShell";

type EmailForm = { email: string };
type ResetForm = { password: string; confirmPassword: string };

const ForgotPassword = () => {
  const [step, setStep] = useState<"email" | "otp" | "reset">("email");
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userEmail, setUserEmail] = useState("");
  const [canResend, setCanResend] = useState(false);
  const [timer, setTimer] = useState(60);
  const [timerKey, setTimerKey] = useState(0);
  const [loading, setLoading] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const emailForm = useForm<EmailForm>();
  const resetForm = useForm<ResetForm>();

  useEffect(() => {
    if (step !== "otp") return;
    setTimer(60);
    setCanResend(false);
    const id = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) { clearInterval(id); setCanResend(true); return 0; }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [step, timerKey]);

  const onEmailSubmit = async (data: EmailForm) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.email }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Failed to send OTP");
      setUserEmail(data.email);
      setStep("otp");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) inputRefs.current[index + 1]?.focus();
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const resendOtp = async () => {
    if (!canResend) return;
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/forgot-password-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Failed to resend OTP");
      setOtp(["", "", "", ""]);
      setTimerKey((k) => k + 1);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const verifyOtp = async () => {
    const otpValue = otp.join("");
    if (otpValue.length < 4) { setServerError("Please enter all 4 digits"); return; }
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/verify-forgot-password-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, otp: otpValue }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Invalid OTP");
      setStep("reset");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const onResetSubmit = async (data: ResetForm) => {
    if (data.password !== data.confirmPassword) {
      resetForm.setError("confirmPassword", { message: "Passwords do not match" });
      return;
    }
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/reset-password-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: userEmail, newPassword: data.password }),
      });
      const result = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(result.message || "Failed to reset password");
      router.push("/login");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow="ACCOUNT RECOVERY"
      title={
        step === "email"
          ? "Reset your password"
          : step === "otp"
            ? "Verify your email"
            : "Choose a new password"
      }
      description="We’ll help you securely regain access to your ARJ GROUP account."
    >
      {step === "email" && (
            <>
              <p className="mb-5 text-center text-sm text-slate-500">
                Remembered your password?{" "}
                <Link
                  href="/login"
                  className="font-bold text-slate-900 underline decoration-[#2563eb] underline-offset-4 transition-colors hover:text-[#1d4ed8]"
                >
                  Sign in
                </Link>
              </p>

              {serverError && (
                <p role="alert" className="mb-4 text-center text-sm font-medium text-rose-600">{serverError}</p>
              )}

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)} className="auth-form space-y-3">
                <label htmlFor="recovery-email" className="block text-sm font-semibold text-slate-700">Email address</label>
                <input
                  id="recovery-email"
                  type="email"
                  placeholder="support@example.com"
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                  {...emailForm.register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: "Invalid email address",
                    },
                  })}
                />
                {emailForm.formState.errors.email && (
                  <p className="text-red-500 text-sm mb-2">
                    {String(emailForm.formState.errors.email.message)}
                  </p>
                )}
                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-[#0b0f19] py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            </>
      )}

      {step === "otp" && (
            <>
              <p className="mb-6 text-center text-sm leading-6 text-slate-500">
                We sent a 4-digit OTP to{" "}
                <span className="font-medium text-gray-800">{userEmail}</span>
              </p>

              {serverError && (
                <p role="alert" className="mb-4 text-center text-sm font-medium text-rose-600">{serverError}</p>
              )}

              <div className="mb-6 flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    aria-label={`OTP digit ${index + 1}`}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="auth-otp-input size-14 text-center text-2xl font-bold text-slate-800"
                  />
                ))}
              </div>

              <div className="mb-5 text-center text-sm text-slate-500">
                {timer > 0 ? (
                  <span>Resend OTP in <span className="font-semibold text-slate-800">{timer}s</span></span>
                ) : (
                  <button onClick={resendOtp} className="font-bold text-[#2563eb] underline-offset-4 hover:underline">
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full rounded-2xl bg-[#0b0f19] py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-[#2563eb] disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setServerError(null); setOtp(["", "", "", ""]); }}
                className="mt-3 w-full rounded-xl py-3 text-sm font-semibold text-slate-500 transition-colors hover:text-slate-900"
              >
                ← Back to forgot password
              </button>
            </>
      )}

      {step === "reset" && (
            <>
              <p className="mb-6 text-center text-sm leading-6 text-slate-500">
                Enter a new password for{" "}
                <span className="font-medium text-gray-800">{userEmail}</span>
              </p>

              {serverError && (
                <p role="alert" className="mb-4 text-center text-sm font-medium text-rose-600">{serverError}</p>
              )}

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)} className="auth-form space-y-3">
                <label htmlFor="recovery-password" className="block text-sm font-semibold text-slate-700">New password</label>
                <div className="relative">
                  <input
                    id="recovery-password"
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    {...resetForm.register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    aria-label={passwordVisible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 grid w-10 place-items-center rounded-xl text-slate-400 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/50 active:scale-95"
                  >
                    {passwordVisible ? (
                      <Eye className="rotate-12 scale-110 transition-transform duration-200" size={18} />
                    ) : (
                      <EyeOff className="transition-transform duration-200" size={18} />
                    )}
                  </button>
                </div>
                {resetForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(resetForm.formState.errors.password.message)}
                  </p>
                )}

                <label htmlFor="recovery-confirm-password" className="block text-sm font-semibold text-slate-700">Confirm password</label>
                <div className="relative">
                  <input
                    id="recovery-confirm-password"
                    type={confirmPasswordVisible ? "text" : "password"}
                    placeholder="Repeat your password"
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm text-slate-800 outline-none transition focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10"
                    {...resetForm.register("confirmPassword", {
                      required: "Please confirm your password",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    aria-label={confirmPasswordVisible ? "Hide password" : "Show password"}
                    className="absolute inset-y-0 right-3 grid w-10 place-items-center rounded-xl text-slate-400 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/50 active:scale-95"
                  >
                    {confirmPasswordVisible ? (
                      <Eye className="rotate-12 scale-110 transition-transform duration-200" size={18} />
                    ) : (
                      <EyeOff className="transition-transform duration-200" size={18} />
                    )}
                  </button>
                </div>
                {resetForm.formState.errors.confirmPassword && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(resetForm.formState.errors.confirmPassword.message)}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-[#0b0f19] py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
      )}
    </AuthShell>
  );
};

export default ForgotPassword;
