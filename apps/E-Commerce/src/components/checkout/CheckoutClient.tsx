"use client";

import {
  AlertCircle,
  ArrowLeft,
  Banknote,
  Check,
  CheckCircle2,
  CreditCard,
  Loader2,
  LockKeyhole,
  Smartphone,
  ShieldCheck,
  X,
} from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import axios from "axios";
import BrandLogo from "@/components/brand/BrandLogo";
import useUser from "@/hooks/use.User";
import { useCart } from "@/contexts/CartContext";
import CheckoutPaymentForm, {
  type CheckoutGateway,
} from "./CheckoutPaymentForm";
import OrderSummary, {
  type AuthoritativeCheckoutTotals,
} from "./OrderSummary";

type PaymentMethodOption = {
  id: CheckoutGateway;
  name: string;
  enabled: boolean;
  currency: "USD" | "BDT";
  merchantNumber?: string;
  bankDetails?: unknown;
};

type PreparedCheckout = {
  success: true;
  checkoutSessionId: string;
  paymentMethod: CheckoutGateway;
  currency: "USD" | "BDT";
  totals: AuthoritativeCheckoutTotals;
  expiresInSeconds: number;
  demoLocked: boolean;
  checks: {
    serverPriceVerified: boolean;
    couponVerified: boolean;
    stockVerified: boolean;
    sessionIntegrityVerified: boolean;
  };
  merchantNumber?: string;
  bankDetails?: unknown;
};

type DemoPaymentResult = {
  status: "DEMO_PAYMENT_BLOCKED";
  code: "DEMO_MODE_FINAL_CHARGE_LOCKED";
  serverConfirmed: boolean;
  gateway: CheckoutGateway;
  currency: "USD" | "BDT";
  totalAmount: number;
  maskedPaymentIdentifier?: string;
  checks: PreparedCheckout["checks"];
  message: string;
};

const gatewayIcon = {
  STRIPE_CARD: CreditCard,
  BANK_TRANSFER: Banknote,
  BKASH: Smartphone,
  NAGAD: Smartphone,
} satisfies Record<CheckoutGateway, typeof CreditCard>;

const getApiError = (error: unknown, fallback: string) => {
  if (axios.isAxiosError(error)) {
    const data = error.response?.data as { message?: string; error?: string } | undefined;
    return data?.message || data?.error || fallback;
  }
  return error instanceof Error ? error.message : fallback;
};

const isDemoPaymentLocked =
  process.env.NEXT_PUBLIC_PAYMENT_DEMO_LOCK?.trim().toLowerCase() !== "false";

const getMaskedPaymentIdentifier = (
  method: CheckoutGateway,
  details: Record<string, unknown>
) => {
  if (method === "STRIPE_CARD" && typeof details.cardLast4 === "string" && /^\d{4}$/.test(details.cardLast4)) {
    return `**** ${details.cardLast4}`;
  }
  if (method === "BANK_TRANSFER" && typeof details.accountLast4 === "string" && /^\d{4}$/.test(details.accountLast4)) {
    return `**** ${details.accountLast4}`;
  }
  if (
    (method === "BKASH" || method === "NAGAD") &&
    typeof details.walletNumber === "string" &&
    /^01[3-9]\d{8}$/.test(details.walletNumber)
  ) {
    return `${details.walletNumber.slice(0, 2)}*******${details.walletNumber.slice(-2)}`;
  }
  return undefined;
};

export default function CheckoutClient() {
  const searchParams = useSearchParams();
  const selectedAddressId = searchParams.get("address") || "";
  const couponCode = searchParams.get("coupon") || "";
  const { cartItems, isReady: isCartReady } = useCart();
  const { user, isLoading: isUserLoading } = useUser();
  const userId = user?.id || user?._id;
  const [methods, setMethods] = useState<PaymentMethodOption[]>([]);
  const [activeMethod, setActiveMethod] = useState<CheckoutGateway | "">("");
  const [prepared, setPrepared] = useState<PreparedCheckout | null>(null);
  const [isLoadingMethods, setIsLoadingMethods] = useState(true);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [demoResult, setDemoResult] = useState<DemoPaymentResult | null>(null);
  const requestVersion = useRef(0);

  const cartPayload = useMemo(
    () =>
      cartItems.map(({ product, quantity }) => ({
        id: product.id || product._id || product.productId || "",
        quantity,
      })),
    [cartItems]
  );

  const prepareCheckout = useCallback(
    async (method: CheckoutGateway) => {
      const currentVersion = ++requestVersion.current;
      setPrepared(null);
      setErrorMessage("");
      setIsPreparing(true);

      try {
        const response = await axios.post("/api/v1/payments/prepare-checkout", {
          paymentMethod: method,
          cart: cartPayload,
          couponCode: couponCode || undefined,
          selectedAddressId: selectedAddressId || undefined,
        });
        if (currentVersion !== requestVersion.current) return;
        setPrepared(response.data as PreparedCheckout);
      } catch (error) {
        if (currentVersion !== requestVersion.current) return;
        setErrorMessage(getApiError(error, "Unable to verify your checkout."));
      } finally {
        if (currentVersion === requestVersion.current) {
          setIsPreparing(false);
        }
      }
    },
    [cartPayload, couponCode, selectedAddressId]
  );

  useEffect(() => {
    if (!isCartReady || isUserLoading || !userId) return;
    let active = true;
    setIsLoadingMethods(true);

    axios
      .get("/api/v1/payments/methods")
      .then((response) => {
        if (!active) return;
        const enabledMethods = (response.data?.methods || []).filter(
          (method: PaymentMethodOption) => method.enabled
        ) as PaymentMethodOption[];
        setMethods(enabledMethods);
        if (enabledMethods.length === 0) {
          setErrorMessage("No payment methods are currently available.");
          return;
        }
        const defaultMethod =
          enabledMethods.find((method) => method.id === "STRIPE_CARD") ||
          enabledMethods[0];
        setActiveMethod(defaultMethod.id);
      })
      .catch((error) => {
        if (active) {
          setErrorMessage(getApiError(error, "Payment methods could not be loaded."));
        }
      })
      .finally(() => {
        if (active) setIsLoadingMethods(false);
      });

    return () => {
      active = false;
    };
  }, [isCartReady, isUserLoading, userId]);

  useEffect(() => {
    if (
      !isCartReady ||
      isUserLoading ||
      !userId ||
      !activeMethod ||
      methods.length === 0
    ) {
      return;
    }

    if (cartPayload.length === 0) {
      setErrorMessage("Your cart is empty.");
      return;
    }
    if (!selectedAddressId) {
      setErrorMessage("Choose a delivery address from your cart before checkout.");
      return;
    }
    void prepareCheckout(activeMethod);
  }, [
    activeMethod,
    cartPayload,
    isCartReady,
    isUserLoading,
    methods.length,
    prepareCheckout,
    selectedAddressId,
    userId,
  ]);

  const handleGatewaySelect = (method: CheckoutGateway) => {
    if (method === activeMethod) return;
    requestVersion.current += 1;
    setActiveMethod(method);
    setPrepared(null);
    setDemoResult(null);
    setErrorMessage("");
  };

  const executePayment = async (paymentDetails: Record<string, unknown>) => {
    if (!prepared || prepared.paymentMethod !== activeMethod) {
      setErrorMessage("Verify this checkout before submitting payment.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage("");
    const localDemoResult: DemoPaymentResult = {
      status: "DEMO_PAYMENT_BLOCKED",
      code: "DEMO_MODE_FINAL_CHARGE_LOCKED",
      serverConfirmed: false,
      gateway: activeMethod,
      currency: prepared.currency,
      totalAmount: prepared.totals.totalAmount,
      maskedPaymentIdentifier: getMaskedPaymentIdentifier(
        activeMethod,
        paymentDetails
      ),
      checks: prepared.checks,
      message:
        "Demo Mode is enabled, but the server could not confirm or record this attempt. No charge or paid-order confirmation was received.",
    };
    try {
      const response = await axios.post("/api/v1/payments/execute", {
        checkoutSessionId: prepared.checkoutSessionId,
        paymentMethod: activeMethod,
        paymentDetails,
      });
      const result = response.data as DemoPaymentResult;
      if (result?.code === "DEMO_MODE_FINAL_CHARGE_LOCKED") {
        setDemoResult({ ...result, serverConfirmed: true });
      } else if (isDemoPaymentLocked) {
        setDemoResult(localDemoResult);
      } else {
        setErrorMessage("The gateway returned an unexpected payment response.");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        const result = error.response?.data as DemoPaymentResult | undefined;
        if (result?.code === "DEMO_MODE_FINAL_CHARGE_LOCKED") {
          setDemoResult({ ...result, serverConfirmed: true });
        } else if (error.response?.status === 409 || error.response?.status === 410) {
          setPrepared(null);
          setErrorMessage("Checkout details changed or expired. Revalidating prices and stock…");
          if (activeMethod) void prepareCheckout(activeMethod);
        } else if (
          isDemoPaymentLocked &&
          (!error.response || error.response.status >= 500)
        ) {
          setDemoResult(localDemoResult);
        } else {
          setErrorMessage(getApiError(error, "Payment could not be submitted."));
        }
      } else if (isDemoPaymentLocked) {
        setDemoResult(localDemoResult);
      } else {
        setErrorMessage(getApiError(error, "Payment could not be submitted."));
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isUserLoading || !isCartReady || (Boolean(userId) && isLoadingMethods)) {
    return (
      <main className="min-h-[70vh] bg-[#f7f7f5] px-4 py-10 sm:px-6">
        <div className="mx-auto flex min-h-[420px] max-w-6xl items-center justify-center rounded-[28px] border border-slate-200 bg-white">
          <div className="flex items-center gap-3 text-sm font-semibold text-slate-600">
            <Loader2 className="size-5 animate-spin text-blue-600" />
            Preparing secure checkout…
          </div>
        </div>
      </main>
    );
  }

  if (!user) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f7f7f5] px-4 py-10">
        <section className="max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <ShieldCheck className="mx-auto size-10 text-emerald-600" />
          <h1 className="mt-4 text-2xl font-bold text-slate-950">
            Sign in to check out
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Your account is required to validate stock, shipping, and payment details.
          </p>
          <Link
            href="/login"
            className="mt-6 inline-flex min-h-12 items-center justify-center rounded-xl bg-[#0b0f19] px-6 text-sm font-bold text-white transition hover:bg-blue-700"
          >
            Sign in
          </Link>
        </section>
      </main>
    );
  }

  if (cartItems.length === 0) {
    return (
      <main className="grid min-h-[70vh] place-items-center bg-[#f7f7f5] px-4 py-10">
        <section className="max-w-lg rounded-[28px] border border-slate-200 bg-white p-8 text-center shadow-xl">
          <h1 className="text-2xl font-bold text-slate-950">Your cart is empty</h1>
          <Link href="/products" className="mt-5 inline-flex font-bold text-blue-700">
            Browse products
          </Link>
        </section>
      </main>
    );
  }

  const selectedMethod = methods.find((method) => method.id === activeMethod);
  const methodTitle = selectedMethod?.name || activeMethod;
  const currency = prepared?.currency || selectedMethod?.currency || "USD";

  return (
    <main className="min-h-screen bg-[radial-gradient(ellipse_at_10%_0%,#10233c_0%,transparent_32%),#070b14] px-4 py-7 text-slate-950 sm:px-6 lg:px-8 lg:py-10">
      <div className="mx-auto max-w-[1240px]">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-5 border-b border-slate-200/80 pb-6">
          <div>
            <Link
              href="/cart"
              className="mb-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 transition hover:text-slate-950"
            >
              <ArrowLeft className="size-4" />
              Back to cart
            </Link>
            <h1 className="text-3xl font-bold tracking-tight text-slate-950 sm:text-4xl">
              Secure checkout
            </h1>
            <p className="mt-2 text-sm leading-6 text-slate-500">
              Choose a payment method. Your final charge remains locked in Demo Mode.
            </p>
          </div>
          <div className="flex items-center gap-4">
            <BrandLogo />
            <span className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-4 py-2 text-xs font-bold text-emerald-800 sm:inline-flex">
              <ShieldCheck className="size-4" />
              Secure demo
            </span>
          </div>
        </header>

        <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_390px]">
          <section className="fade-up overflow-hidden rounded-[28px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.07)]">
            <div className="border-b border-slate-100 p-5 sm:p-7">
              <div className="mb-5 flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.2em] text-blue-700">
                    Payment method
                  </p>
                  <h2 className="mt-2 text-xl font-bold tracking-tight text-slate-950">
                    Select how to pay
                  </h2>
                </div>
                <span className="rounded-full bg-slate-100 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  {methods.length} options
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
                {methods.map((method) => {
                  const Icon = gatewayIcon[method.id];
                  const selected = method.id === activeMethod;
                  return (
                    <button
                      key={method.id}
                      aria-pressed={selected}
                      className={`group rounded-2xl border p-4 text-left transition duration-200 hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-blue-500/15 ${
                        selected
                          ? "border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-900/15"
                          : "border-slate-200 bg-white text-slate-700 hover:border-blue-300 hover:bg-blue-50/40"
                      }`}
                      onClick={() => handleGatewaySelect(method.id)}
                      type="button"
                    >
                      <span className="flex items-center justify-between gap-2">
                        <Icon className={`size-5 ${selected ? "text-emerald-300" : "text-blue-700"}`} />
                        {selected && <Check className="size-4 text-emerald-300" />}
                      </span>
                      <span className="mt-4 block text-sm font-bold">{method.name}</span>
                      <span className={`mt-1 block text-[10px] font-semibold ${selected ? "text-slate-300" : "text-slate-400"}`}>
                        {method.currency}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="mb-6 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">
                <LockKeyhole className="mt-0.5 size-5 shrink-0 text-blue-700" />
                <p className="text-xs font-medium leading-5 text-slate-600">
                  Prices, coupon eligibility, stock, and checkout-session integrity are rechecked on the server before the final payment step.
                </p>
              </div>

              {errorMessage && (
                <div
                  role="alert"
                  className="mb-5 flex items-start gap-3 rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700"
                >
                  <AlertCircle className="mt-0.5 size-4 shrink-0" />
                  <span>{errorMessage}</span>
                </div>
              )}

              {isPreparing ? (
                <div className="flex min-h-[250px] items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60">
                  <div className="flex items-center gap-3 text-sm font-semibold text-slate-500">
                    <Loader2 className="size-5 animate-spin text-blue-600" />
                    Verifying server prices and stock…
                  </div>
                </div>
              ) : prepared ? (
                <CheckoutPaymentForm
                  key={activeMethod}
                  method={prepared.paymentMethod}
                  merchantNumber={prepared.merchantNumber || selectedMethod?.merchantNumber}
                  bankDetails={prepared.bankDetails || selectedMethod?.bankDetails}
                  isSubmitting={isSubmitting}
                  onSubmit={executePayment}
                />
              ) : (
                <div className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-slate-50/60 p-6 text-center">
                  <AlertCircle className="size-7 text-amber-600" />
                  <p className="mt-3 text-sm font-bold text-slate-800">
                    Checkout is not ready to submit
                  </p>
                  {selectedAddressId ? (
                    <button
                      type="button"
                      disabled={!activeMethod || methods.length === 0}
                      onClick={() => activeMethod && void prepareCheckout(activeMethod)}
                      className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white disabled:opacity-50"
                    >
                      Retry secure verification
                    </button>
                  ) : (
                    <Link
                      href="/cart"
                      className="mt-4 rounded-xl bg-slate-950 px-5 py-3 text-xs font-bold text-white"
                    >
                      Choose a delivery address
                    </Link>
                  )}
                </div>
              )}
            </div>
          </section>

          <OrderSummary
            cartItems={cartItems}
            totals={prepared?.totals || null}
            currency={currency}
            isPreparing={isPreparing}
          />
        </div>
      </div>

      {demoResult && (
        <div
          className="fixed inset-0 z-[200] grid place-items-center bg-slate-950/60 p-4 backdrop-blur-sm"
          role="presentation"
        >
          <section
            aria-labelledby="demo-lock-title"
            aria-modal="true"
            className="fade-up relative w-full max-w-[560px] overflow-hidden rounded-[30px] border border-white/60 bg-white p-6 shadow-[0_35px_100px_rgba(0,0,0,0.3)] sm:p-8"
            role="dialog"
          >
            <button
              aria-label="Close demo payment notice"
              className="absolute right-5 top-5 grid size-9 place-items-center rounded-full bg-slate-100 text-slate-500 transition hover:bg-slate-200 hover:text-slate-900"
              onClick={() => setDemoResult(null)}
              type="button"
            >
              <X className="size-4" />
            </button>
            <div className="grid size-14 place-items-center rounded-2xl bg-emerald-50 text-emerald-700 ring-1 ring-emerald-100">
              <CheckCircle2 className="size-7" />
            </div>
            <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.22em] text-emerald-700">
              {demoResult.serverConfirmed
                ? "Security validation complete"
                : "Demo Mode is active"}
            </p>
            <h2
              id="demo-lock-title"
              className="mt-2 pr-8 text-2xl font-bold tracking-tight text-slate-950"
            >
              {demoResult.serverConfirmed
                ? "Payment safely stopped"
                : "Payment not confirmed"}
            </h2>
            <p className="mt-3 text-sm leading-6 text-slate-600">
              {demoResult.message}{" "}
              {demoResult.serverConfirmed
                ? "Your order has not been marked paid and no real money was charged."
                : "The browser did not send a full card number, security code, wallet PIN, or OTP."}
            </p>

            <div className="mt-6 rounded-2xl bg-slate-950 p-5 text-white">
              <div className="flex items-center justify-between gap-4 text-sm">
                <span className="font-medium text-slate-300">Verified total</span>
                <span className="text-lg font-black">
                  {new Intl.NumberFormat(demoResult.currency === "BDT" ? "en-BD" : "en-US", {
                    style: "currency",
                    currency: demoResult.currency,
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2,
                  }).format(demoResult.totalAmount)}
                </span>
              </div>
              <div className="mt-3 flex items-center justify-between gap-4 border-t border-white/10 pt-3 text-xs">
                <span className="text-slate-400">Gateway</span>
                <span className="font-bold">{methodTitle}</span>
              </div>
              {demoResult.maskedPaymentIdentifier && (
                <div className="mt-2 flex items-center justify-between gap-4 text-xs">
                  <span className="text-slate-400">Payment identifier</span>
                  <span className="font-bold">{demoResult.maskedPaymentIdentifier}</span>
                </div>
              )}
            </div>

            {demoResult.serverConfirmed && (
              <ul className="mt-5 grid gap-2 sm:grid-cols-2">
                {[
                  ["Server price verified", demoResult.checks.serverPriceVerified],
                  ["Stock verified", demoResult.checks.stockVerified],
                  ["Coupon checked", demoResult.checks.couponVerified],
                  ["Session integrity verified", demoResult.checks.sessionIntegrityVerified],
                ].map(([label]) => (
                  <li
                    key={String(label)}
                    className="flex items-center gap-2 rounded-xl bg-emerald-50 px-3 py-2 text-xs font-bold text-emerald-800"
                  >
                    <Check className="size-4 shrink-0" />
                    {label}
                  </li>
                ))}
              </ul>
            )}
            <p className="mt-5 rounded-2xl border border-amber-400/20 bg-[#302313] px-4 py-3 text-xs font-semibold leading-5 text-amber-100">
              {demoResult.serverConfirmed
                ? "Demo Mode is locked by the platform. This submission was recorded as a blocked payment attempt only; no paid order was created."
                : "The server could not confirm or record this attempt. The checkout remains unpaid; retry once the server is available."}
            </p>
            <button
              className="mt-6 min-h-12 w-full rounded-2xl bg-[#0b0f19] px-5 text-sm font-bold text-white transition hover:bg-blue-700"
              onClick={() => setDemoResult(null)}
              type="button"
            >
              Return to checkout
            </button>
          </section>
        </div>
      )}
    </main>
  );
}
