"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { Eye, EyeOff } from "lucide-react";
import axios, { type AxiosError } from "axios";
import GoogleButton from "@/components/auth/GoogleButton";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuthStore } from "@/store/useAuthStor";
import BrandLogo from "@/components/brand/BrandLogo";

type FormData = {
  email: string;
  password: string;
};

const Login = () => {
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [rememberMe, setRememberMe] = useState(false);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { setLoggedIn } = useAuthStore();
  const { register, handleSubmit, formState: { errors }, } = useForm<FormData>();

  const loginMutation = useMutation({
    mutationFn: async (data: FormData) => {
      const response = await axios.post("/api/v1/auth/login", data,
      { withCredentials: true } );
      return response.data;
    },
    onSuccess: () => {
      setServerError(null);
      setLoggedIn(true);
      queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/");
    },
    onError: (error: AxiosError) => {
      const errorMessage = (error.response?.data as { message?: string })?.message || "Invalid Credentials!";
      setServerError(errorMessage);
    },
  });

  const onSubmit = (data: FormData) => {
    loginMutation.mutate(data);
  };

  return (
    <main className="relative isolate flex min-h-[68vh] items-center justify-center overflow-hidden bg-[#fafafa] px-4 py-8 sm:px-6 lg:py-10">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -left-32 top-12 size-80 rounded-full bg-blue-200/30 blur-3xl"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-36 -right-20 size-96 rounded-full bg-indigo-200/30 blur-3xl"
      />

      <div className="login-card-enter relative grid w-full max-w-[1000px] overflow-hidden rounded-[26px] border border-white/10 bg-white shadow-[0_28px_72px_rgba(0,0,0,0.35)] lg:min-h-[560px] lg:grid-cols-[0.92fr_1.08fr]">
        <aside className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-8 text-white lg:flex xl:p-10">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-20 top-24 size-72 rounded-full bg-blue-500/20 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-32 -left-24 size-80 rounded-full bg-indigo-500/20 blur-3xl"
          />
          <BrandLogo tone="light" className="relative z-10" />
          <div className="relative z-10 max-w-md py-8">
            <p className="mb-4 text-xs font-bold uppercase tracking-[0.28em] text-emerald-300">
              A better way to shop
            </p>
            <h1 className="text-4xl font-semibold leading-[1.12] tracking-tight xl:text-5xl">
              Welcome back to the things you love.
            </h1>
            <p className="mt-6 max-w-sm text-base leading-7 text-slate-300">
              Sign in to explore thoughtfully selected products from
              independent sellers and brands.
            </p>
          </div>
          <p className="relative z-10 text-xs font-medium tracking-wide text-slate-400">
            A considered marketplace by ARJ GROUP
          </p>
        </aside>

        <section className="flex flex-col justify-center px-6 py-7 sm:px-9 sm:py-9 lg:px-10 xl:px-12">
          <div className="mb-8 flex justify-center lg:hidden">
            <BrandLogo />
          </div>
          <div className="mb-6">
            <p className="text-xs font-bold uppercase tracking-[0.24em] text-blue-700">
              Member access
            </p>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-slate-950 sm:text-3xl">
              Sign in to ARJ GROUP
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-500">
              Don&apos;t have an account?{" "}
              <Link
                href="/register"
                className="font-bold text-slate-900 underline decoration-[#2563eb] decoration-2 underline-offset-4 transition-colors hover:text-[#1d4ed8]"
              >
                Create one
              </Link>
            </p>
          </div>

          <GoogleButton />

          <div className="my-5 flex items-center gap-4 text-[10px] font-bold uppercase tracking-[0.18em] text-slate-400">
            <span className="h-px flex-1 bg-slate-200" />
            or use email
            <span className="h-px flex-1 bg-slate-200" />
          </div>

          {serverError && (
            <p
              role="alert"
              className="mb-5 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700"
            >
              {serverError}
            </p>
          )}

          <form onSubmit={handleSubmit(onSubmit)} className="auth-form space-y-4">
            <div>
              <label
                htmlFor="login-email"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Email address
              </label>
              <input
                id="login-email"
                type="email"
                autoComplete="email"
                placeholder="you@example.com"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? "login-email-error" : undefined}
                className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-medium text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                {...register("email", {
                  required: "Email is required",
                  pattern: {
                    value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                    message: "Invalid email address",
                  },
                })}
              />
              {errors.email && (
                <p
                  id="login-email-error"
                  className="mt-2 text-sm font-medium text-rose-600"
                >
                  {String(errors.email.message)}
                </p>
              )}
            </div>

            <div>
              <label
                htmlFor="login-password"
                className="mb-2 block text-sm font-semibold text-slate-700"
              >
                Password
              </label>
              <div className="relative">
                <input
                  id="login-password"
                  type={passwordVisible ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Enter your password"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={
                    errors.password ? "login-password-error" : undefined
                  }
                  className="w-full rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-12 text-sm font-medium text-slate-900 outline-none transition duration-200 placeholder:text-slate-400 hover:border-slate-300 hover:bg-white focus:border-[#2563eb] focus:bg-white focus:ring-4 focus:ring-[#2563eb]/10"
                  {...register("password", {
                    required: "Password is required",
                    minLength: {
                      value: 6,
                      message: "Password must be at least 6 characters",
                    },
                  })}
                />
                <button
                  type="button"
                  aria-label={passwordVisible ? "Hide password" : "Show password"}
                  onClick={() => setPasswordVisible((visible) => !visible)}
                  className="absolute inset-y-0 right-3 grid w-10 place-items-center rounded-xl text-slate-400 transition-all duration-200 hover:scale-105 hover:bg-slate-100 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#2563eb]/50 active:scale-95"
                >
                  {passwordVisible ? (
                    <Eye className="rotate-12 scale-110 transition-transform duration-200" size={18} />
                  ) : (
                    <EyeOff className="transition-transform duration-200" size={18} />
                  )}
                </button>
              </div>
              {errors.password && (
                <p
                  id="login-password-error"
                  className="mt-2 text-sm font-medium text-rose-600"
                >
                  {String(errors.password.message)}
                </p>
              )}
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
              <label className="flex cursor-pointer items-center gap-2.5 text-sm font-medium text-slate-600">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={() => setRememberMe(!rememberMe)}
                  className="size-4 rounded border-slate-300 accent-[#2563eb] focus:ring-[#2563eb]"
                />
                Remember me
              </label>
              <Link
                href="/forgot-password"
                className="text-sm font-bold text-slate-700 transition-colors hover:text-[#1d4ed8]"
              >
                Forgot password?
              </Link>
            </div>

            <button
              type="submit"
              disabled={loginMutation.isPending}
              className="group relative mt-1 flex w-full items-center justify-center overflow-hidden rounded-xl bg-[#0b0f19] px-5 py-3.5 text-sm font-bold tracking-wide text-white shadow-lg shadow-slate-900/15 transition duration-300 hover:-translate-y-0.5 hover:bg-[#2563eb] hover:shadow-xl hover:shadow-blue-600/20 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-[#2563eb]/25 disabled:cursor-not-allowed disabled:opacity-60"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              <span className="relative">
                {loginMutation.isPending ? "Signing in…" : "Sign in"}
              </span>
            </button>
          </form>
        </section>
      </div>
    </main>
  );
};

export default Login;
