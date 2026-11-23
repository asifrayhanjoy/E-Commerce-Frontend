"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";
import AuthShell from "@/components/auth/AuthShell";

type FormData = {
  firstName: string;
  lastName: string;
  mobileNumber: string;
  email: string;
  password: string;
  confirmPassword: string;
};

const toAuthPayload = (data: FormData) => ({
  name: `${data.firstName.trim()} ${data.lastName.trim()}`,
  email: data.email.trim(),
  password: data.password,
});

const labelClassName = "mb-2 block text-sm font-semibold text-slate-200";
const inputClassName =
  "w-full rounded-xl border border-slate-700 bg-[#0b1120] px-4 py-3 text-sm text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-sky-400 focus:bg-[#111827] focus:ring-4 focus:ring-sky-400/10";
const errorClassName = "mt-1 text-sm font-medium text-rose-300";

const Register = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [canResend, setCanResend] = useState(false);
  const [showOtp, setShowOtp] = useState(false);
  const [timer, setTimer] = useState(60);
  const [timerKey, setTimerKey] = useState(0);
  const [otp, setOtp] = useState(["", "", "", ""]);
  const [userData, setUserData] = useState<FormData | null>(null);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    getValues,
    formState: { errors },
  } = useForm<FormData>({ mode: "onTouched" });

  // Countdown timer — restarts whenever OTP screen opens or resend triggered
  useEffect(() => {
    if (!showOtp) return;
    setTimer(60);
    setCanResend(false);
    const id = setInterval(() => { setTimer((prev) => {
        if (prev <= 1) {
          clearInterval(id);
          setCanResend(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [showOtp, timerKey]);

  // Step 1 — Submit registration form → send OTP to email
  const onSubmit = async (data: FormData) => {
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(toAuthPayload(data)),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to send OTP");
      setUserData(data);
      setShowOtp(true);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  // OTP input change — auto-advance to next box
  const handleOtpChange = (index: number, value: string) => {
    if (!/^\d*$/.test(value)) return;
    const newOtp = [...otp];
    newOtp[index] = value.slice(-1);
    setOtp(newOtp);
    if (value && index < 3) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  // OTP backspace — go back to previous box
  const handleOtpKeyDown = ( index: number, e: React.KeyboardEvent<HTMLInputElement> ) => {
    if (e.key === "Backspace" && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  // Resend OTP — re-calls register endpoint after timer expires
  const resendOtp = async () => {
    if (!canResend || !userData) return;
    setServerError(null);
    try {
      const res = await fetch("/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(toAuthPayload(userData)),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Failed to resend OTP");
      setOtp(["", "", "", ""]);
      setTimerKey((k) => k + 1);
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    }
  };

  // Step 2 — Verify OTP
  // Correct OTP → create user → redirect to /login
  // Wrong OTP   → show error, stay on OTP screen
  const verifyOtp = async () => {
    if (!userData) return;
    const otpValue = otp.join("");
    if (otpValue.length < 4) {
      setServerError("Please enter all 4 digits");
      return;
    }
    setServerError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ ...toAuthPayload(userData), otp: otpValue }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Invalid OTP");
      router.push("/login");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Invalid OTP. Please try again.");
      setOtp(["", "", "", ""]);
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      eyebrow={showOtp ? "SECURE VERIFICATION" : "JOIN ARJ GROUP"}
      title={showOtp ? "Verify your email" : "Create your account"}
      description={
        showOtp
          ? "Confirm your email to finish creating your account."
          : "Create an account to discover trusted sellers and keep your shopping in one place."
      }
    >
      {!showOtp ? (
        <>
              <p className="mb-5 text-center text-sm text-slate-400">
                Already have an account?{" "}
                <Link
                  href="/login"
                  className="font-bold text-sky-300 underline decoration-sky-400 underline-offset-4 transition-colors hover:text-sky-200"
                >
                  Sign in
                </Link>
              </p>

              <GoogleButton />

              <div className="my-6 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
                <span className="h-px flex-1 bg-slate-700" />
                <span>or sign up with email</span>
                <span className="h-px flex-1 bg-slate-700" />
              </div>

              {serverError && (
                <p role="alert" className="mb-4 text-center text-sm font-medium text-rose-300">{serverError}</p>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="auth-form space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label htmlFor="register-first-name" className={labelClassName}>First Name</label>
                    <input
                      id="register-first-name"
                      type="text"
                      autoComplete="given-name"
                      placeholder="First name"
                      aria-invalid={Boolean(errors.firstName)}
                      className={inputClassName}
                      {...register("firstName", {
                        required: "First name is required.",
                        validate: (value) => Boolean(value.trim()) || "First name is required.",
                      })}
                    />
                    {errors.firstName && (
                      <p className={errorClassName}>{String(errors.firstName.message)}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="register-last-name" className={labelClassName}>Last Name</label>
                    <input
                      id="register-last-name"
                      type="text"
                      autoComplete="family-name"
                      placeholder="Last name"
                      aria-invalid={Boolean(errors.lastName)}
                      className={inputClassName}
                      {...register("lastName", {
                        required: "Last name is required.",
                        validate: (value) => Boolean(value.trim()) || "Last name is required.",
                      })}
                    />
                    {errors.lastName && (
                      <p className={errorClassName}>{String(errors.lastName.message)}</p>
                    )}
                  </div>
                </div>

                <div>
                  <label htmlFor="register-mobile" className={labelClassName}>Mobile Number</label>
                  <input
                    id="register-mobile"
                    type="tel"
                    autoComplete="tel"
                    placeholder="Enter your mobile number"
                    aria-invalid={Boolean(errors.mobileNumber)}
                    className={inputClassName}
                    {...register("mobileNumber", {
                      required: "Mobile number is required.",
                      pattern: {
                        value: /^\+?[0-9][0-9\s().-]{6,19}$/,
                        message: "Enter a valid mobile number.",
                      },
                    })}
                  />
                  {errors.mobileNumber && (
                    <p className={errorClassName}>{String(errors.mobileNumber.message)}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="register-email" className={labelClassName}>Email Address</label>
                  <input
                    id="register-email"
                    type="email"
                    autoComplete="email"
                    placeholder="Enter your email"
                    aria-invalid={Boolean(errors.email)}
                    className={inputClassName}
                    {...register("email", {
                      required: "Email address is required.",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/,
                        message: "Enter a valid email address.",
                      },
                    })}
                  />
                  {errors.email && (
                    <p className={errorClassName}>{String(errors.email.message)}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="register-password" className={labelClassName}>Password</label>
                  <div className="relative">
                    <input
                      id="register-password"
                      type={passwordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Create a strong password"
                      aria-invalid={Boolean(errors.password)}
                      className={`${inputClassName} pr-12`}
                      {...register("password", {
                        required: "Password is required.",
                        minLength: {
                          value: 7,
                          message: "Password must be at least 7 characters.",
                        },
                        deps: "confirmPassword",
                        validate: {
                          uppercase: (value) =>
                            /[A-Z]/.test(value) || "Add at least one uppercase letter.",
                          lowercase: (value) =>
                            /[a-z]/.test(value) || "Add at least one lowercase letter.",
                          number: (value) =>
                            /\d/.test(value) || "Add at least one number.",
                          special: (value) =>
                            /[^A-Za-z0-9\s]/.test(value) ||
                            "Add a special character, such as @.",
                        },
                      })}
                    />
                    <button
                      type="button"
                      aria-label={passwordVisible ? "Hide password" : "Show password"}
                      onClick={() => setPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                    >
                      {passwordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  <p className="mt-2 text-xs leading-5 text-slate-400">
                    Use at least 7 characters, including uppercase and lowercase letters, a number, and a symbol (for example @).
                  </p>
                  {errors.password && (
                    <p className={errorClassName}>{String(errors.password.message)}</p>
                  )}
                </div>

                <div>
                  <label htmlFor="register-confirm-password" className={labelClassName}>Confirm Password</label>
                  <div className="relative">
                    <input
                      id="register-confirm-password"
                      type={confirmPasswordVisible ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Re-enter your password"
                      aria-invalid={Boolean(errors.confirmPassword)}
                      className={`${inputClassName} pr-12`}
                      {...register("confirmPassword", {
                        required: "Please confirm your password.",
                        validate: (value) =>
                          value === getValues("password") || "Passwords do not match.",
                      })}
                    />
                    <button
                      type="button"
                      aria-label={confirmPasswordVisible ? "Hide confirmation" : "Show confirmation"}
                      onClick={() => setConfirmPasswordVisible((visible) => !visible)}
                      className="absolute inset-y-0 right-2 grid w-10 place-items-center rounded-xl text-slate-400 transition-all duration-200 hover:bg-slate-800 hover:text-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
                    >
                      {confirmPasswordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className={errorClassName}>{String(errors.confirmPassword.message)}</p>
                  )}
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="mt-2 w-full rounded-2xl bg-[#2563eb] px-5 py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Register"}
                </button>
              </form>
            </>
      ) : (
        <>
              <p className="mb-6 text-center text-sm leading-6 text-slate-300">
                We sent a 4-digit OTP to{" "}
                <span className="font-medium text-slate-100">{userData?.email}</span>
              </p>

              {serverError && (
                <p role="alert" className="mb-4 text-center text-sm font-medium text-rose-300">{serverError}</p>
              )}

              {/* 4 OTP input boxes */}
              <div className="mb-6 flex justify-center gap-3">
                {otp.map((digit, index) => (
                  <input key={index} ref={(el) => { inputRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} aria-label={`OTP digit ${index + 1}`} value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="auth-otp-input size-14 text-center text-2xl font-bold text-slate-100"
                  />
                ))}
              </div>

              {/* Countdown / Resend */}
              <div className="mb-5 text-center text-sm text-slate-300">
                {timer > 0 ? (
                  <span>
                    Resend OTP in{" "}
                    <span className="font-semibold text-slate-100">{timer}s</span>
                  </span>
                ) : (
                  <button
                    onClick={resendOtp}
                    className="font-bold text-sky-300 underline-offset-4 hover:underline"
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button onClick={verifyOtp} disabled={loading} className="w-full rounded-2xl bg-[#2563eb] py-3.5 text-sm font-bold text-white shadow-lg transition duration-200 hover:-translate-y-0.5 hover:bg-blue-500 disabled:cursor-not-allowed disabled:opacity-60">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button type="button" onClick={() => {
                  setShowOtp(false);
                  setServerError(null);
                  setOtp(["", "", "", ""]);
                }}
                className="mt-3 w-full rounded-xl py-3 text-sm font-semibold text-slate-400 transition-colors hover:text-slate-100">
                ← Back to registration
              </button>
            </>
      )}
    </AuthShell>
  );
};

export default Register;
