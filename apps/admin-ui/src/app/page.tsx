"use client";

import { useMutation } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useForm } from "react-hook-form";

type LoginFormData = {
  email: string;
  password: string;
};

const API_URL = "http://localhost:8383/api/v1/auth";

const getErrorMessage = (error: AxiosError) =>
  (error.response?.data as { message?: string })?.message ||
  error.message ||
  "Login failed!";

const Page = () => {
  const [serverError, setServerError] = useState<string | null>(null);
  const router = useRouter();
  const { handleSubmit, register } = useForm<LoginFormData>({
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const loginMutation = useMutation({
    mutationFn: async (data: LoginFormData) => {
      const response = await axios.post(
        `${API_URL}/login-admin`,
        {
          email: data.email,
          password: data.password,
        },
        { withCredentials: true }
      );
      return response;
    },
    onSuccess: (response) => {
      const admin = response.data?.admin || response.data?.user;

      if (admin) {
        window.localStorage.setItem("admin", JSON.stringify(admin));
      }

      setServerError(null);
      router.push("/dashboard");
    },
    onError: (error: AxiosError) => {
      setServerError(getErrorMessage(error));
    },
  });

  type InputProps = React.InputHTMLAttributes<HTMLInputElement> & {
    label: string;
  };

  const Input = React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, ...props }, ref) => {
      return (
        <label className="flex w-full flex-col text-sm text-slate-300">
          <span className="mb-2">{label}</span>
          <input
            ref={ref}
            {...props}
            className="rounded-md border border-slate-700 bg-slate-900 px-3 py-2 text-white outline-none"
          />
        </label>
      );
    }
  );
  Input.displayName = "Input";

  return (
    <main className="flex min-h-screen w-full items-center justify-center px-4">
      <section className="w-full max-w-[450px] rounded-md bg-slate-800 pb-8 shadow">
        <form
          className="p-5"
          onSubmit={handleSubmit((data) => loginMutation.mutate(data))}
        >
          <h1 className="pb-3 pt-4 text-center text-3xl font-semibold text-white">
            Welcome Admin
          </h1>

          <Input
            label="Email"
            placeholder="g22nqqniae@bltiwd.com"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/,
                message: "Invalid email address",
              },
            })}
          />

          <div className="mt-3">
            <Input
              label="Password"
              type="password"
              placeholder="******"
              {...register("password", {
                required: "Password is required",
              })}
            />
          </div>

          <button
            type="submit"
            disabled={loginMutation.isPending}
            className="mt-5 flex w-full cursor-pointer justify-center rounded-lg bg-blue-600 py-2 font-Poppins text-xl font-semibold text-white disabled:cursor-not-allowed disabled:opacity-70"
          >
            {loginMutation.isPending ? (
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-100 border-t-transparent" />
            ) : (
              "Login"
            )}
          </button>

          {serverError && (
            <p className="mt-2 text-sm text-red-500">{serverError}</p>
          )}

          <button
            type="button"
            onClick={() => router.push("/register-admin")}
            className="mt-5 w-full text-center text-sm font-medium text-blue-300"
          >
            Create admin account
          </button>
        </form>
      </section>
    </main>
  );
};

export default Page;
