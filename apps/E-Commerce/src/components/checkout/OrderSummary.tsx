"use client";

import { ShoppingBag } from "lucide-react";
import type { CartItem } from "@/contexts/CartContext";

export type AuthoritativeCheckoutTotals = {
  subtotalAmount: number;
  discountAmount: number;
  platformFeeAmount: number;
  sellerNetAmount: number;
  totalAmount: number;
};

type OrderSummaryProps = {
  cartItems: CartItem[];
  totals: AuthoritativeCheckoutTotals | null;
  currency: "USD" | "BDT";
  isPreparing: boolean;
};

const formatPrice = (value: number, currency: "USD" | "BDT") =>
  new Intl.NumberFormat(currency === "BDT" ? "en-BD" : "en-US", {
    style: "currency",
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(value) ? value : 0);

export default function OrderSummary({
  cartItems,
  totals,
  currency,
  isPreparing,
}: OrderSummaryProps) {
  return (
    <aside className="h-fit overflow-hidden rounded-[26px] border border-slate-200/80 bg-white shadow-[0_24px_70px_rgba(15,23,42,0.08)]">
      <div className="border-b border-slate-100 bg-gradient-to-br from-blue-50/80 to-white p-6">
        <div className="flex items-center gap-3">
          <div className="grid size-11 place-items-center rounded-2xl bg-slate-950 text-emerald-300 shadow-md">
            <ShoppingBag className="size-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold tracking-tight text-slate-950">
              Order summary
            </h2>
            <p className="mt-1 text-xs font-semibold text-slate-500">
              {cartItems.length} item{cartItems.length === 1 ? "" : "s"}
            </p>
          </div>
        </div>
      </div>

      <div className="max-h-[320px] space-y-4 overflow-y-auto p-6">
        {cartItems.map(({ product, quantity }, index) => {
          const key =
            product.id || product._id || product.productId || product.slug || index;

          return (
            <div
              key={key}
              className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
            >
              <div className="min-w-0">
                <p className="truncate text-sm font-bold text-slate-900">
                  {product.title || product.name || "Product"}
                </p>
                <p className="mt-1 text-xs font-medium text-slate-500">
                  Quantity {quantity}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="border-t border-slate-100 px-6 pb-6">
        <div className="space-y-3 pt-5 text-sm">
          {[
            ["Subtotal", totals?.subtotalAmount],
            ["Coupon discount", totals?.discountAmount],
            ["Platform fee (10%)", totals?.platformFeeAmount],
          ].map(([label, amount]) => (
            <div
              key={String(label)}
              className="flex items-center justify-between gap-4 text-slate-500"
            >
              <span>{label}</span>
              <span className="font-semibold text-slate-700">
                {typeof amount === "number"
                  ? `${label === "Coupon discount" ? "−" : ""}${formatPrice(amount, currency)}`
                  : isPreparing
                    ? "Verifying…"
                    : "—"}
              </span>
            </div>
          ))}
          <div className="mt-4 flex items-end justify-between gap-4 border-t border-slate-200 pt-5">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.14em] text-slate-400">
                Verified total
              </p>
              <p className="mt-1 text-xs font-medium text-slate-500">
                {isPreparing ? "Rechecking prices and stock" : "Server-calculated"}
              </p>
            </div>
            <p className="text-2xl font-black tracking-tight text-slate-950">
              {typeof totals?.totalAmount === "number"
                ? formatPrice(totals.totalAmount, currency)
                : "—"}
            </p>
          </div>
        </div>
      </div>
    </aside>
  );
}
