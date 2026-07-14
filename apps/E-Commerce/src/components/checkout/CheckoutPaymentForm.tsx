"use client";

import { PaymentElement, useElements, useStripe } from "@stripe/react-stripe-js";
import { Lock, Loader2 } from "lucide-react";
import { useState } from "react";

type CheckoutPaymentFormProps = {
  sessionId: string;
};

export default function CheckoutPaymentForm({
  sessionId,
}: CheckoutPaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState("");

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsSubmitting(true);
    setMessage("");

    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/payment_success?sessionId=${encodeURIComponent(sessionId)}`,
      },
    });

    if (error) {
      setMessage(error.message || "Payment could not be completed.");
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <PaymentElement
        options={{
          layout: "tabs",
        }}
      />

      {message && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {message}
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || !elements || isSubmitting}
        className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-lg bg-slate-950 px-5 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Processing payment
          </>
        ) : (
          <>
            <Lock className="h-4 w-4" />
            Pay securely
          </>
        )}
      </button>
    </form>
  );
}
