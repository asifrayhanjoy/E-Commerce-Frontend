"use client";

import Script from "next/script";
import { useEffect, useState } from "react";
import axios, { type AxiosError } from "axios";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/useAuthStor";

type GoogleCredentialResponse = {
  credential?: string;
};

type GooglePromptNotification = {
  isNotDisplayed: () => boolean;
  isSkippedMoment: () => boolean;
};

const GoogleIcon = () => (
  <svg
    aria-hidden="true"
    viewBox="0 0 48 48"
    className="size-5 shrink-0"
  >
    <path
      fill="#4285F4"
      d="M43.6 24.5c0-1.4-.1-2.8-.4-4.1H24v7.8h11a9.4 9.4 0 0 1-4.1 6.2v5.1h6.7c3.9-3.6 6-8.8 6-15Z"
    />
    <path
      fill="#34A853"
      d="M24 44c5.5 0 10.1-1.8 13.5-4.8l-6.7-5.1c-1.8 1.2-4.1 2-6.8 2-5.2 0-9.6-3.5-11.2-8.2H5.9v5.2A20 20 0 0 0 24 44Z"
    />
    <path
      fill="#FBBC05"
      d="M12.8 27.9a12 12 0 0 1 0-7.8v-5.2H5.9a20 20 0 0 0 0 18.2l6.9-5.2Z"
    />
    <path
      fill="#EA4335"
      d="M24 12c3 0 5.7 1 7.8 3.1l5.8-5.8C34.1 6 29.5 4 24 4A20 20 0 0 0 5.9 14.9l6.9 5.2C14.4 15.5 18.8 12 24 12Z"
    />
  </svg>
);

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: {
            client_id: string;
            callback: (response: GoogleCredentialResponse) => void;
          }) => void;
          prompt: (
            listener?: (notification: GooglePromptNotification) => void
          ) => void;
        };
      };
    };
  }
}

const configuredGoogleClientId =
  process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID?.trim() || "";
const googleClientId =
  configuredGoogleClientId &&
  !/(?:demo|fake|placeholder|example|change[-_ ]?me)/i.test(
    configuredGoogleClientId
  )
    ? configuredGoogleClientId
    : "";

const GoogleButton = () => {
  const [scriptReady, setScriptReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const queryClient = useQueryClient();
  const router = useRouter();
  const { setLoggedIn } = useAuthStore();
  const { mutate: signIn, isPending } = useMutation<
    unknown,
    AxiosError<{ message?: string }>,
    string
  >({
    mutationFn: async (credential: string) => {
      const response = await axios.post(
        "/api/v1/auth/google",
        { credential },
        { withCredentials: true }
      );
      return response.data;
    },
    onSuccess: () => {
      setErrorMessage("");
      setLoggedIn(true);
      void queryClient.invalidateQueries({ queryKey: ["user"] });
      router.push("/");
    },
    onError: (error) => {
      setErrorMessage(
        error.response?.data?.message ||
          "Google sign-in could not be completed. Please try again."
      );
    },
  });

  useEffect(() => {
    if (!googleClientId || !scriptReady) {
      return;
    }

    const googleIdentity = window.google;
    if (!googleIdentity) {
      setErrorMessage("Google sign-in could not load. Please try again.");
      return;
    }

    googleIdentity.accounts.id.initialize({
      client_id: googleClientId,
      callback: ({ credential }) => {
        if (!credential) {
          setErrorMessage("Google did not return a sign-in credential.");
          return;
        }

        setErrorMessage("");
        signIn(credential);
      },
    });
  }, [scriptReady, signIn]);

  const handleGoogleSignIn = () => {
    if (!googleClientId) {
      setErrorMessage(
        "Google sign-in is not configured yet. Please continue with email."
      );
      return;
    }

    const googleIdentity = window.google;
    if (!scriptReady || !googleIdentity) {
      setErrorMessage("Google sign-in is loading. Please try again shortly.");
      return;
    }

    setErrorMessage("");
    googleIdentity.accounts.id.prompt((notification) => {
      if (notification.isNotDisplayed() || notification.isSkippedMoment()) {
        setErrorMessage(
          "Google sign-in could not be opened. Please try again or continue with email."
        );
      }
    });
  };

  return (
    <div className="w-full">
      {googleClientId ? (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onLoad={() => setScriptReady(true)}
          onError={() =>
            setErrorMessage("Google sign-in could not load. Please try again.")
          }
        />
      ) : null}
      <button
        type="button"
        aria-busy={isPending}
        disabled={isPending}
        onClick={handleGoogleSignIn}
        className="google-auth-button group relative flex min-h-14 w-full items-center justify-center gap-3 overflow-hidden rounded-2xl border border-slate-200 bg-white px-5 py-3 text-sm font-bold text-slate-800 shadow-[0_8px_24px_rgba(15,23,42,0.06)] transition duration-300 hover:-translate-y-0.5 hover:border-blue-300 hover:shadow-[0_14px_34px_rgba(15,23,42,0.12)] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 active:translate-y-0 disabled:cursor-wait disabled:opacity-65"
      >
        <span className="pointer-events-none absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-blue-500/[0.08] to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        <GoogleIcon />
        <span className="relative">
          {isPending ? "Signing in securely…" : "Continue with Google"}
        </span>
      </button>
      {errorMessage && (
        <p
          role="alert"
          className="mt-3 text-center text-xs font-medium leading-5 text-slate-500"
        >
          {errorMessage}
        </p>
      )}
    </div>
  );
};

export default GoogleButton;
