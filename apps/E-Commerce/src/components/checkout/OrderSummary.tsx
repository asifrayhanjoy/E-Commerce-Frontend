"use client";

import { ShoppingBag } from "lucide-react";

type CheckoutCartItem = {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  quantity?: number;
  sale_price?: number;
  price?: number;
  product?: {
    id?: string;
    _id?: string;
    title?: string;
    name?: string;
    sale_price?: number;
    price?: number;
    images?: { url?: string }[];
  };
};

export type CheckoutSession = {
  cart?: CheckoutCartItem[];
  sellers?: {
    shopId?: string;
    sellerId?: string;
    stripeAccountId?: string | null;
  }[];
  totalAmount?: number;
  coupon?: {
    discountAmount?: number;
    discountPercent?: number;
  } | null;
};

const formatPrice = (value?: number) => {
  const numericValue = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(numericValue) ? numericValue : 0);
};

const getItemTitle = (item: CheckoutCartItem) =>
  item.title || item.name || item.product?.title || item.product?.name || "Product";

const getItemPrice = (item: CheckoutCartItem) =>
  Number(item.sale_price ?? item.price ?? item.product?.sale_price ?? item.product?.price ?? 0);

const getItemQuantity = (item: CheckoutCartItem) => Number(item.quantity || 1);

const getOrderTotal = (session: CheckoutSession) => {
  if (typeof session.totalAmount === "number") {
    return session.totalAmount;
  }

  return (session.cart || []).reduce(
    (total, item) => total + getItemPrice(item) * getItemQuantity(item),
    0
  );
};

export default function OrderSummary({ session }: { session: CheckoutSession }) {
  const cart = session.cart || [];
  const subtotal = getOrderTotal(session);
  const discount = Number(session.coupon?.discountAmount || 0);
  const total = Math.max(subtotal - discount, 0);

  return (
    <aside className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      <div className="mb-5 flex items-center gap-3 border-b border-slate-200 pb-4">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-slate-100 text-slate-950">
          <ShoppingBag className="h-5 w-5" />
        </div>
        <div>
          <h2 className="text-lg font-semibold text-slate-950">Order summary</h2>
          <p className="text-sm text-slate-500">
            {cart.length} item{cart.length === 1 ? "" : "s"}
          </p>
        </div>
      </div>

      <div className="space-y-4">
        {cart.map((item, index) => {
          const quantity = getItemQuantity(item);
          const lineTotal = getItemPrice(item) * quantity;

          return (
            <div
              key={item.id || item._id || item.product?.id || item.product?._id || index}
              className="flex items-start justify-between gap-4 border-b border-slate-100 pb-4 last:border-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-semibold text-slate-950">
                  {getItemTitle(item)}
                </p>
                <p className="mt-1 text-sm text-slate-500">Qty {quantity}</p>
              </div>
              <p className="text-sm font-semibold text-slate-950">
                {formatPrice(lineTotal)}
              </p>
            </div>
          );
        })}
      </div>

      <div className="mt-5 space-y-3 border-t border-slate-200 pt-5 text-sm">
        <div className="flex items-center justify-between text-slate-600">
          <span>Subtotal</span>
          <span>{formatPrice(subtotal)}</span>
        </div>
        <div className="flex items-center justify-between text-slate-600">
          <span>Discount</span>
          <span>-{formatPrice(discount)}</span>
        </div>
        <div className="flex items-center justify-between border-t border-slate-200 pt-4 text-base font-semibold text-slate-950">
          <span>Total</span>
          <span>{formatPrice(total)}</span>
        </div>
      </div>
    </aside>
  );
}
