"use client";

import { Elements } from "@stripe/react-stripe-js";
import { loadStripe, type Appearance } from "@stripe/stripe-js";
import { AlertCircle, ArrowLeft, CreditCard, Loader2, PackageCheck } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import axios from "axios";
import CheckoutPaymentForm from "./CheckoutPaymentForm";
import OrderSummary, { type CheckoutSession } from "./OrderSummary";

const stripePublishableKey = (
  process.env.NEXT_PUBLIC_STRIPE_PUBLIC_KEY ||
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ||
  ""
)
  .trim()
  .replace(/^['"]|['"]$/g, "");
const stripePromise = stripePublishableKey ? loadStripe(stripePublishableKey) : null;

const appearance: Appearance = {
  theme: "stripe",
  variables: {
    colorPrimary: "#111827",
    colorBackground: "#ffffff",
    colorText: "#111827",
    colorDanger: "#dc2626",
    borderRadius: "8px",
    fontFamily: "Inter, ui-sans-serif, system-ui, sans-serif",
  },
};

const getSellerStripeAccountId = (session: CheckoutSession | null) => {
  const seller = session?.sellers?.find((item) => item.stripeAccountId);
  return seller?.stripeAccountId || "";
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const [session, setSession] = useState<CheckoutSession | null>(null);
  const [clientSecret, setClientSecret] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const prepareCheckout = async () => {
      if (!sessionId) {
        setStatus("error");
        setError("Payment session ID is missing.");
        return;
      }

      if (!stripePublishableKey) {
        setStatus("error");
        setError("Stripe publishable key is missing.");
        return;
      }

      try {
        setStatus("loading");
        setError("");

        const sessionResponse = await axios.get(
          "/api/order/verifying-payment-session",
          {
            params: { sessionId },
          }
        );
        const checkoutSession = sessionResponse.data?.session as CheckoutSession;

        if (!checkoutSession) {
          throw new Error("Checkout session was not found.");
        }

        const sellerStripeAccountId = getSellerStripeAccountId(checkoutSession);

        if (!sellerStripeAccountId) {
          throw new Error("Seller Stripe account is missing for this order.");
        }

        const paymentResponse = await axios.post(
          "/api/order/create-payment-intent",
          {
            amount: checkoutSession.totalAmount,
            sellerStripeAccountId,
            sessionId,
          }
        );
        const nextClientSecret = paymentResponse.data?.clientSecret;

        if (!nextClientSecret) {
          throw new Error("Payment intent client secret is missing.");
        }

        setSession(checkoutSession);
        setClientSecret(nextClientSecret);
        setStatus("ready");
      } catch (err: any) {
        setStatus("error");
        setError(
          err?.response?.data?.message ||
            err?.response?.data?.error ||
            err?.message ||
            "Unable to prepare checkout."
        );
      }
    };

    void prepareCheckout();
  }, [sessionId]);

  const options = useMemo(
    () => ({
      clientSecret,
      appearance,
    }),
    [clientSecret]
  );

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <div className="flex flex-col gap-4 border-b border-slate-200 pb-5 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <Link
              href="/cart"
              className="mb-3 inline-flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-950"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to cart
            </Link>
            <h1 className="text-2xl font-semibold text-slate-950 sm:text-3xl">
              Checkout
            </h1>
            <p className="mt-2 text-sm text-slate-600">
              Review your order and complete the secure Stripe payment.
            </p>
          </div>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-medium text-emerald-700">
            <PackageCheck className="h-4 w-4" />
            Secure payment
          </div>
        </div>

        {status === "loading" && (
          <div className="flex min-h-[360px] items-center justify-center rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center gap-3 text-sm font-medium text-slate-600">
              <Loader2 className="h-5 w-5 animate-spin" />
              Preparing checkout
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-5 text-red-700">
            <div className="flex items-start gap-3">
              <AlertCircle className="mt-0.5 h-5 w-5" />
              <div>
                <p className="font-semibold">Checkout unavailable</p>
                <p className="mt-1 text-sm">{error}</p>
              </div>
            </div>
          </div>
        )}

        {status === "ready" && session && clientSecret && (
          <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
            <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-950 text-white">
                  <CreditCard className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-slate-950">
                    Payment details
                  </h2>
                  <p className="text-sm text-slate-500">
                    Enter your card details below.
                  </p>
                </div>
              </div>

              <Elements stripe={stripePromise} options={options}>
                <CheckoutPaymentForm sessionId={sessionId} />
              </Elements>
            </section>

            <OrderSummary session={session} />
          </div>
        )}
      </div>
    </main>
  );
}
