"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";

type FormData = {
  name: string;
  email: string;
  password: string;
};

const Register = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
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

  const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();

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
  const onSubmit = async (data: FormData) => { setServerError(null); setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: data.name,
          email: data.email,
          password: data.password,
        }),
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
      const res = await fetch("http://localhost:8080/api/v1/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          name: userData.name,
          email: userData.email,
          password: userData.password,
        }),
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
      const res = await fetch("http://localhost:8080/api/v1/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: userData.email,
          otp: otpValue,
          name: userData.name,
          password: userData.password,
        }),
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
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-semibold text-black text-center">
        Register
      </h1>
      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
        Home . Register
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

          {!showOtp ? (
            /* ── Step 1: Registration Form ── */
            <>
              <h3 className="text-3xl font-semibold text-center mb-2">
                Register to Eshop
              </h3>
              <p className="text-center text-gray-500 mb-4">
                Already have an account?{" "}
                <Link href="/login" style={{ color: "#3b82f6" }} className="font-medium">
                  Sign in
                </Link>
              </p>

              <GoogleButton />

              <div className="flex items-center my-5 text-gray-400 text-sm">
                <div className="flex-1 border-t border-gray-300" />
                <span className="px-3">or Sign up with Email</span>
                <div className="flex-1 border-t border-gray-300" />
              </div>

              {serverError && (
                <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
              )}

              <form onSubmit={handleSubmit(onSubmit)}>
                <label className="block text-gray-700 mb-1">Name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
                  {...register("name", {
                    required: "Name is required",
                    minLength: { value: 2, message: "Name must be at least 2 characters" },
                  })}
                />
                {errors.name && (
                  <p className="text-red-500 text-sm mb-2">{String(errors.name.message)}</p>
                )}

                <label className="block text-gray-700 mt-3 mb-1">Email</label>
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
                  {...register("email", {
                    required: "Email is required",
                    pattern: {
                      value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                      message: "Invalid email address",
                    },
                  })}
                />
                {errors.email && (
                  <p className="text-red-500 text-sm mb-2">{String(errors.email.message)}</p>
                )}

                <label className="block text-gray-700 mt-3 mb-1">Password</label>
                <div className="relative">
                  <input
                    type={passwordVisible ? "text" : "password"}
                    placeholder="Min. 6 characters"
                    className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 pr-12"
                    {...register("password", {
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
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1">{String(errors.password.message)}</p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-black text-white py-3 rounded-lg text-lg mt-5 cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60"
                >
                  {loading ? "Sending OTP..." : "Register"}
                </button>
              </form>
            </>
          ) : (
            /* ── Step 2: OTP Verification ── */
            <>
              <h3 className="text-2xl font-semibold text-center mb-2">
                Verify Your Email
              </h3>
              <p className="text-center text-gray-500 text-sm mb-6">
                We sent a 4-digit OTP to{" "}
                <span className="font-medium text-gray-800">{userData?.email}</span>
              </p>

              {serverError && (
                <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
              )}

              {/* 4 OTP input boxes */}
              <div className="flex justify-center gap-3 mb-5">
                {otp.map((digit, index) => (
                  <input key={index} ref={(el) => { inputRefs.current[index] = el; }} type="text" inputMode="numeric" maxLength={1} value={digit}
                    onChange={(e) => handleOtpChange(index, e.target.value)}
                    onKeyDown={(e) => handleOtpKeyDown(index, e)}
                    className="w-14 h-14 text-center text-2xl font-semibold border-2 border-gray-300 rounded-lg outline-none focus:border-blue-500 bg-blue-50 transition-colors"
                  />
                ))}
              </div>

              {/* Countdown / Resend */}
              <div className="text-center mb-5 text-sm text-gray-500">
                {timer > 0 ? (
                  <span>
                    Resend OTP in{" "}
                    <span className="font-semibold text-gray-800">{timer}s</span>
                  </span>
                ) : (
                  <button
                    onClick={resendOtp}
                    className="font-medium hover:underline"
                    style={{ color: "#3b82f6" }}
                  >
                    Resend OTP
                  </button>
                )}
              </div>

              <button onClick={verifyOtp} disabled={loading} className="w-full bg-black text-white py-3 rounded-lg text-lg cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60">
                {loading ? "Verifying..." : "Verify OTP"}
              </button>

              <button type="button" onClick={() => {
                  setShowOtp(false);
                  setServerError(null);
                  setOtp(["", "", "", ""]);
                }}
                className="w-full mt-3 text-sm text-gray-500 hover:text-gray-700 transition-colors">
                ← Back to registration
              </button>
            </>
          )}

        </div>
      </div>
    </div>
  );
};

export default Register;
