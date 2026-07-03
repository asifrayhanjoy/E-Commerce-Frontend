"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";

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
      const res = await fetch("http://localhost:8080/api/v1/auth/forgot-password-user", {
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
      const res = await fetch("http://localhost:8080/api/v1/auth/forgot-password-user", {
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
      const res = await fetch("http://localhost:8080/api/v1/auth/verify-forgot-password-user", {
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
      const res = await fetch("http://localhost:8080/api/v1/auth/reset-password-user", {
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
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-semibold text-black text-center">Forgot Password</h1>
      <p className="text-center text-lg font-medium py-3 text-[#00000099]">Forgot . Password</p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

          {step === "email" && (
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">Forgot Password</h3>
              <p className="text-center text-gray-500 mb-4">
                Go back to?{" "}
                <Link href="/login" style={{ color: "#3b82f6" }} className="font-medium">Login</Link>
              </p>

              {serverError && (
                <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
              )}

              <form onSubmit={emailForm.handleSubmit(onEmailSubmit)}>
                <label className="block text-gray-700 mt-3 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="support@example.com"
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
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
                  className="w-full bg-black mt-4 text-white py-3 rounded-lg text-lg cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Send OTP"}
                </button>
              </form>
            </>
          )}

          {step === "otp" && (
            <>
              <h3 className="text-2xl font-semibold text-center mb-2">Verify Your Email</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                We sent a 4-digit OTP to{" "}
                <span className="font-medium text-gray-800">{userEmail}</span>
              </p>

              {serverError && (
                <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
              )}

              <div className="flex justify-center gap-3 mb-5">
                {otp.map((digit, index) => (
                  <input
                    key={index}
                    ref={(el) => { inputRefs.current[index] = el; }}
                    type="text"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-blue-50 transition-colors"
                  />
                ))}
              </div>

              <div className="text-center mb-5 text-sm text-gray-500">
                {timer > 0 ? (
                  <span>Resend OTP in <span className="font-semibold text-gray-800">{timer}s</span></span>
                ) : (
                  <button onClick={resendOtp} className="font-medium hover:underline" style={{ color: "#3b82f6" }}>
                    Resend OTP
                  </button>
                )}
              </div>

              <button
                onClick={verifyOtp}
                disabled={loading}
                className="w-full bg-black text-white py-3 rounded-lg text-lg cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60"
              >
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button
                type="button"
                onClick={() => { setStep("email"); setServerError(null); setOtp(["", "", "", ""]); }}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors"
              >
                ← Back to forgot password
              </button>
            </>
          )}

          {step === "reset" && (
            <>
              <h3 className="text-2xl font-semibold text-center mb-2">Reset Password</h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                Enter a new password for{" "}
                <span className="font-medium text-gray-800">{userEmail}</span>
              </p>

              {serverError && (
                <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
              )}

              <form onSubmit={resetForm.handleSubmit(onResetSubmit)}>
                <label className="block text-gray-700 mt-3 mb-1">New Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 pr-12"
                    {...resetForm.register("password", {
                      required: "Password is required",
                      minLength: { value: 6, message: "Password must be at least 6 characters" },
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setPasswordVisible(!passwordVisible)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {passwordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                  </button>
                </div>
                {resetForm.formState.errors.password && (
                  <p className="text-red-500 text-sm mt-1">
                    {String(resetForm.formState.errors.password.message)}
                  </p>
                )}

                <label className="block text-gray-700 mt-3 mb-1">Confirm Password</label>
                <div className="relative">
                  <input
                    type={confirmPasswordVisible ? "text" : "password"}
                    placeholder="Repeat your password"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 pr-12"
                    {...resetForm.register("confirmPassword", {
                      required: "Please confirm your password",
                    })}
                  />
                  <button
                    type="button"
                    onClick={() => setConfirmPasswordVisible(!confirmPasswordVisible)}
                    className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600"
                  >
                    {confirmPasswordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
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
                  className="w-full bg-black mt-5 text-white py-3 rounded-lg text-lg cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  {loading ? "Resetting..." : "Reset Password"}
                </button>
              </form>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
