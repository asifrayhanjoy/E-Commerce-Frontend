"use client";

import { Suspense } from "react";
import CheckoutClient from "@/components/checkout/CheckoutClient";

const CheckoutFallback = () => (
  <main className="min-h-screen bg-[#fafafa] px-4 py-8">
    <div className="mx-auto min-h-[360px] w-full max-w-6xl rounded-[28px] border border-slate-200 bg-white" />
  </main>
);

export default function Page() {
  return (
    <Suspense fallback={<CheckoutFallback />}>
      <CheckoutClient />
    </Suspense>
  );
}
