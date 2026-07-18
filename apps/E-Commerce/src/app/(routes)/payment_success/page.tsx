"use client";

import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CheckCircle2,
  Home,
  PackageCheck,
  ReceiptText,
  ShieldCheck,
  ShoppingBag,
  Truck,
  type LucideIcon,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import axios from "axios";

const compactReference = (value?: string) => {
  if (!value) {
    return "Confirmed";
  }

  if (value.length <= 24) {
    return value;
  }

  return `${value.slice(0, 12)}...${value.slice(-8)}`;
};

const successHighlights: {
  title: string;
  value: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Status",
    value: "Paid",
    Icon: BadgeCheck,
  },
  {
    title: "Protection",
    value: "Stripe secured",
    Icon: ShieldCheck,
  },
  {
    title: "Fulfillment",
    value: "In progress",
    Icon: PackageCheck,
  },
];

const nextSteps: {
  title: string;
  description: string;
  Icon: LucideIcon;
}[] = [
  {
    title: "Receipt saved",
    description: "Your payment record is attached to this checkout session.",
    Icon: ReceiptText,
  },
  {
    title: "Seller notified",
    description: "The seller can now prepare your items for delivery.",
    Icon: ShoppingBag,
  },
  {
    title: "Delivery updates",
    description: "Track progress from your profile as the order moves forward.",
    Icon: Truck,
  },
];

const PaymentSuccessFallback = () => (
  <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
    <div className="mx-auto min-h-[420px] w-full max-w-6xl rounded-xl border border-slate-200 bg-white" />
  </main>
);

function PaymentSuccessContent() {
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("sessionId") || "";
  const paymentIntent = searchParams.get("payment_intent") || "";
  const redirectStatus = searchParams.get("redirect_status") || "";
  const [confirmStatus, setConfirmStatus] = useState<
    "idle" | "saving" | "saved" | "error"
  >("idle");
  const [confirmMessage, setConfirmMessage] = useState("");
  const reference = sessionId || paymentIntent;
  const statusLabel =
    confirmStatus === "saved"
      ? "Order saved"
      : redirectStatus === "succeeded"
      ? "Payment verified"
      : "Payment received";

  useEffect(() => {
    if (!sessionId || !paymentIntent || redirectStatus !== "succeeded") {
      return;
    }

    let isMounted = true;
    setConfirmStatus("saving");
    setConfirmMessage("Saving your order to the backend...");

    axios
      .post("/api/order/confirm-payment-session", {
        sessionId,
        paymentIntentId: paymentIntent,
      })
      .then((response) => {
        if (!isMounted) {
          return;
        }

        setConfirmStatus("saved");
        setConfirmMessage(
          response.data?.message || "Your order has been saved."
        );
      })
      .catch((error) => {
        if (!isMounted) {
          return;
        }

        setConfirmStatus("error");
        setConfirmMessage(
          error?.response?.data?.message ||
            "Payment succeeded, but the order could not be saved."
        );
      });

    return () => {
      isMounted = false;
    };
  }, [paymentIntent, redirectStatus, sessionId]);

  const receiptRows = [
    { label: "Payment status", value: statusLabel },
    { label: "Order reference", value: compactReference(reference) },
    paymentIntent
      ? { label: "Payment intent", value: compactReference(paymentIntent) }
      : null,
    sessionId ? { label: "Session ID", value: compactReference(sessionId) } : null,
  ].filter(Boolean) as { label: string; value: string }[];

  return (
    <main className="min-h-screen bg-[#f6f7fb] px-4 py-8 text-slate-950 sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Link
            href="/"
            className="inline-flex w-fit items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-slate-950"
          >
            <Home className="h-4 w-4" />
            Back to home
          </Link>

          <div className="inline-flex w-fit items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            <ShieldCheck className="h-4 w-4" />
            Secure checkout complete
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_380px]">
          <section className="relative overflow-hidden rounded-xl border border-slate-200 bg-white p-6 shadow-[0_18px_45px_rgba(15,23,42,0.08)] sm:p-8 lg:p-10">
            <div className="absolute inset-x-0 top-0 h-1 bg-[linear-gradient(90deg,#10b981,#2563eb,#f59e0b)]" />

            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 ring-8 ring-emerald-100/70">
              <CheckCircle2 className="h-9 w-9" />
            </div>

            <p className="mt-7 text-sm font-bold uppercase tracking-[0.16em] text-emerald-600">
              Payment successful
            </p>
            <h1 className="mt-3 max-w-2xl text-3xl font-semibold leading-tight text-slate-950 sm:text-4xl">
              Thank you. Your order is confirmed.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
              We received your payment and the order is ready for the next step.
              You can keep shopping or check your order status from your profile.
            </p>

            {confirmMessage && (
              <p
                className={`mt-4 max-w-2xl rounded-lg px-4 py-3 text-sm font-semibold ${
                  confirmStatus === "error"
                    ? "border border-red-200 bg-red-50 text-red-700"
                    : "border border-emerald-200 bg-emerald-50 text-emerald-700"
                }`}
              >
                {confirmMessage}
              </p>
            )}

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                href="/products"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-amber-50 px-5 text-sm font-semibold text-white transition hover:bg-amber-100"
              >
                <ShoppingBag className="h-4 w-4" />
                Continue shopping
                <ArrowRight className="h-4 w-4" />
              </Link>
              <Link
                href="/profile?active=My%20Orders"
                className="inline-flex h-12 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-neutral-100 px-5 text-sm font-semibold text-slate-800 transition hover:border-slate-300 hover:bg-amber-100"
              >
                <ReceiptText className="h-4 w-4" />
                View orders
              </Link>
            </div>

            <div className="mt-8 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-3">
              {successHighlights.map(({ title, value, Icon }) => (
                <div key={title} className="flex items-start gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                    <Icon className="h-5 w-5" />
                  </div>
                  <div>
                    <p className="text-xs font-bold uppercase tracking-[0.12em] text-slate-400">
                      {title}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-slate-950">
                      {value}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </section>

          <aside className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <div className="flex items-center gap-3 border-b border-slate-200 pb-5">
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                <ReceiptText className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-semibold text-slate-950">
                  Payment receipt
                </h2>
                <p className="text-sm text-slate-500">
                  Keep this reference for support.
                </p>
              </div>
            </div>

            <dl className="mt-5 space-y-4">
              {receiptRows.map((row) => (
                <div
                  key={row.label}
                  className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
                >
                  <dt className="text-sm text-slate-500">{row.label}</dt>
                  <dd className="max-w-[190px] break-all text-right text-sm font-semibold text-slate-950">
                    {row.value}
                  </dd>
                </div>
              ))}
            </dl>

            <div className="mt-6 border-t border-slate-200 pt-5">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <p className="text-sm leading-6 text-slate-600">
                  The order is now available in your profile. Delivery and seller
                  updates will appear there as they are processed.
                </p>
              </div>
            </div>
          </aside>
        </div>

        <section className="mt-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-2 border-b border-slate-200 pb-5 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.16em] text-slate-400">
                What happens next
              </p>
              <h2 className="mt-2 text-xl font-semibold text-slate-950">
                Your order is moving forward
              </h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-500">
              Payment is complete, so the remaining steps focus on seller
              processing and delivery updates.
            </p>
          </div>

          <div className="mt-6 grid gap-6 md:grid-cols-3">
            {nextSteps.map(({ title, description, Icon }) => (
              <div key={title} className="flex gap-4">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-slate-800">
                  <Icon className="h-5 w-5" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-slate-950">
                    {title}
                  </h3>
                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    {description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      </div>
    </main>
  );
}

export default function Page() {
  return (
    <Suspense fallback={<PaymentSuccessFallback />}>
      <PaymentSuccessContent />
    </Suspense>
  );
}
