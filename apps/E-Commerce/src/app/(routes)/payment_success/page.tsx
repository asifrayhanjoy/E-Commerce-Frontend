"use client";

import Link from "next/link";
import { AlertTriangle, ArrowLeft, ShieldCheck } from "lucide-react";

export default function PaymentStatusPage() {
  return (
    <main className="grid min-h-[75vh] place-items-center bg-[#fafafa] px-4 py-10">
      <section className="w-full max-w-xl rounded-[28px] border border-slate-200 bg-white p-7 shadow-[0_24px_70px_rgba(15,23,42,0.09)] sm:p-10">
        <div className="grid size-14 place-items-center rounded-2xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
          <AlertTriangle className="size-7" />
        </div>
        <p className="mt-6 text-[10px] font-extrabold uppercase tracking-[0.2em] text-amber-700">
          Payment status unverified
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-slate-950">
          No paid order is confirmed
        </h1>
        <p className="mt-3 text-sm leading-6 text-slate-600">
          This page cannot confirm a payment by itself. In Secure Demo Mode, final
          payment execution is intentionally blocked and no order is marked paid.
        </p>
        <div className="mt-6 flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 p-4">
          <ShieldCheck className="mt-0.5 size-5 shrink-0 text-emerald-700" />
          <p className="text-xs font-medium leading-5 text-slate-600">
            Only a verified server-side gateway event can confirm a real payment.
            No real charge was made by reaching this page.
          </p>
        </div>
        <Link
          href="/cart"
          className="mt-7 inline-flex min-h-12 items-center justify-center gap-2 rounded-xl bg-[#0b0f19] px-5 text-sm font-bold text-white transition hover:bg-blue-700"
        >
          <ArrowLeft className="size-4" />
          Return to cart
        </Link>
      </section>
    </main>
  );
}
