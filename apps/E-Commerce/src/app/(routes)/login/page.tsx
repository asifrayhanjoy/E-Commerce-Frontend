"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import GoogleButton from "@/components/auth/GoogleButton";

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();

  const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();

  const onSubmit = async (data: FormData) => { setServerError(null); 
    setLoading(true);
    try {
      const res = await fetch("http://localhost:8080/api/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email: data.email, password: data.password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.message || "Login failed");
      router.push("/");
    } catch (err: unknown) {
      setServerError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full py-10 min-h-[85vh] bg-[#f1f1f1]">
      <h1 className="text-4xl font-semibold text-black text-center">
        Login
      </h1>

      <p className="text-center text-lg font-medium py-3 text-[#00000099]">
        Home . Login
      </p>

      <div className="w-full flex justify-center">
        <div className="md:w-[480px] p-8 bg-white shadow rounded-lg">

          <h3 className="text-3xl font-semibold text-center mb-2">
            Login to Eshop
          </h3>

          <p className="text-center text-gray-500 mb-4">
            Don&apos;t have an account?{" "}
            <Link href="/register" style={{ color: "#3b82f6" }} className="font-medium">
              Sign up
            </Link>
          </p>

          <GoogleButton />

          <div className="flex items-center my-5 text-gray-400 text-sm">
            <div className="flex-1 border-t border-gray-300" />
            <span className="px-3">or Sign in with Email</span>
            <div className="flex-1 border-t border-gray-300" />
          </div>

          {serverError && (
            <p className="text-red-500 text-sm text-center mb-3">{serverError}</p>
          )}

          <form onSubmit={handleSubmit(onSubmit)}>
            {/* Email */}
            <label className="block text-gray-700 mt-3 mb-1">Email</label>
            <input type="email" placeholder="support@example.com" className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 mb-1"
              {...register("email", { required: "Email is required",
                pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Invalid email address",
                },
              })}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mb-2">
                {String(errors.email.message)}
              </p>
            )}

            {/* Password */}
            <label className="block text-gray-700 mt-3 mb-1">Password</label>
            <div className="relative">
              <input type={passwordVisible ? "text" : "password"} placeholder="Min. 6 characters" className="w-full px-4 py-3 bg-blue-50 border border-blue-100 rounded-lg outline-none focus:border-blue-400 transition-colors text-gray-800 pr-12"
                {...register("password", {
                  required: "Password is required",
                  minLength: {
                    value: 6,
                    message: "Password must be at least 6 characters",
                  },
                })}
              />
              <button type="button" onClick={() => setPasswordVisible(!passwordVisible)} className="absolute inset-y-0 right-4 flex items-center text-gray-400 hover:text-gray-600">
                {passwordVisible ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
            </div>
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">
                {String(errors.password.message)}
              </p>
            )}

            <div className="flex justify-between items-center my-4">
              <label className="flex items-center gap-2 text-gray-600 text-sm cursor-pointer">
                <input type="checkbox" checked={rememberMe} onChange={() => setRememberMe(!rememberMe)} className="w-4 h-4" />
                Remember me
              </label>
              <Link href="/forgot-password" style={{ color: "#3b82f6" }} className="text-sm font-medium">
                Forgot Password?
              </Link>
            </div>

            <button type="submit" disabled={loading} className="w-full bg-black text-white py-3 rounded-lg text-lg cursor-pointer hover:bg-gray-900 transition-colors disabled:opacity-60">
              {loading ? "Logging in..." : "Login"}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
};

export default Login;
