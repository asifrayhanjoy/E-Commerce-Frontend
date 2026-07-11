"use client";

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import useUser from "@/hooks/use.User";

const formatPrice = (value: number | string) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return `$${value}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(numericValue);
};

const getProductPrice = (product: any) => {
  const price = Number(product?.sale_price ?? product?.price ?? 0);
  return Number.isFinite(price) ? price : 0;
};

export default function CartPage() {
  const {
    cartItems,
    cartCount,
    cartTotal,
    updateCartQuantity,
    removeFromCart,
    clearCart,
  } = useCart();
  const { user, isLoading } = useUser();
  const [couponCode, setCouponCode] = useState("");

  if (isLoading) {
    return (
      <main className="mx-auto w-[90%] max-w-[1240px] py-10">
        <div className="h-[320px] animate-pulse rounded-lg bg-slate-100" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-[90%] max-w-[1240px] py-10">
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Sign in to view your cart
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Cart products are saved for logged-in users.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-[90%] max-w-[1240px] py-10">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <Link
            href="/"
            className="mb-3 inline-flex items-center gap-2 text-sm font-semibold text-slate-500 hover:text-slate-950"
          >
            <ArrowLeft size={18} />
            Continue Shopping
          </Link>
          <h1 className="text-3xl font-bold text-slate-950">Cart</h1>
          <p className="mt-1 text-sm font-medium text-slate-500">
            {cartCount} item{cartCount === 1 ? "" : "s"} ready for checkout
          </p>
        </div>

        {cartItems.length > 0 && (
          <button
            type="button"
            className="inline-flex items-center gap-2 rounded border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600"
            onClick={clearCart}
          >
            <Trash2 size={16} />
            Clear Cart
          </button>
        )}
      </div>

      {cartItems.length > 0 ? (
        <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
          <section className="space-y-4">
            {cartItems.map(({ product, quantity }) => {
              const imageUrl =
                product?.images?.[0]?.url ||
                "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format";
              const productTitle = product?.title || "Untitled product";
              const productName =
                product?.Shop?.name ||
                product?.shop?.name ||
                product?.name ||
                product?.brand ||
                productTitle;
              const price = getProductPrice(product);

              return (
                <article
                  key={product.id || product.slug}
                  className="grid gap-4 rounded-lg bg-white p-4 shadow-[0_16px_28px_-24px_rgba(15,23,42,0.55)] sm:grid-cols-[130px_1fr_auto]"
                >
                  <Link
                    href={`/product/${product.slug}`}
                    className="h-[130px] overflow-hidden rounded-md bg-slate-50"
                  >
                    <img
                      src={imageUrl}
                      alt={productTitle}
                      width={130}
                      height={130}
                      className="h-full w-full object-cover object-top"
                    />
                  </Link>

                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-blue-700">
                      {productName}
                    </p>
                    <Link href={`/product/${product.slug}`}>
                      <h2 className="mt-2 line-clamp-2 text-lg font-bold text-slate-950">
                        {productTitle}
                      </h2>
                    </Link>
                    <p className="mt-3 text-sm font-semibold text-slate-500">
                      Unit price:{" "}
                      <span className="text-slate-950">
                        {formatPrice(price)}
                      </span>
                    </p>
                    <p className="mt-1 text-sm font-semibold text-emerald-600">
                      {Number(product?.stock ?? 0) > 0 ? "In Stock" : "Out of Stock"}
                    </p>
                  </div>

                  <div className="flex flex-col items-start justify-between gap-4 sm:items-end">
                    <button
                      type="button"
                      aria-label="Remove from cart"
                      className="rounded-full p-2 text-slate-400 transition hover:bg-red-50 hover:text-red-600"
                      onClick={() => removeFromCart(product)}
                    >
                      <Trash2 size={20} />
                    </button>

                    <div className="flex items-center overflow-hidden rounded-md bg-slate-100">
                      <button
                        type="button"
                        aria-label="Decrease quantity"
                        className="flex h-10 w-11 items-center justify-center bg-slate-200 text-slate-900"
                        onClick={() =>
                          updateCartQuantity(product, quantity - 1)
                        }
                      >
                        <Minus size={16} strokeWidth={3} />
                      </button>
                      <span className="flex h-10 w-12 items-center justify-center text-base font-bold text-slate-950">
                        {quantity}
                      </span>
                      <button
                        type="button"
                        aria-label="Increase quantity"
                        className="flex h-10 w-11 items-center justify-center bg-slate-200 text-slate-900"
                        onClick={() =>
                          updateCartQuantity(product, quantity + 1)
                        }
                      >
                        <Plus size={16} strokeWidth={3} />
                      </button>
                    </div>

                    <p className="text-xl font-bold text-slate-950">
                      {formatPrice(price * quantity)}
                    </p>
                  </div>
                </article>
              );
            })}
          </section>

          <aside className="h-max bg-white p-7 shadow-[0_8px_24px_rgba(15,23,42,0.08)]">
            <div className="flex items-center justify-between pb-7 text-xl font-bold text-slate-950">
              <span>Subtotal</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>

            <div className="border-t border-slate-200 py-5">
              <label
                htmlFor="coupon-code"
                className="mb-3 block text-base font-bold text-slate-950"
              >
                Have a Coupon?
              </label>
              <div className="flex h-12 overflow-hidden rounded border border-slate-200 bg-white">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 px-3 text-base font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  type="button"
                  className="w-24 bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
            </div>

            <div className="border-t border-slate-200 py-5">
              <label
                htmlFor="shipping-address"
                className="mb-3 block text-base font-bold text-slate-950"
              >
                Select Shipping Address
              </label>
              <select
                id="shipping-address"
                className="h-12 w-full rounded border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 outline-none"
                defaultValue="home"
              >
                <option value="home">Home - New York - USA</option>
                <option value="office">Office - New York - USA</option>
              </select>
            </div>

            <div className="border-t border-slate-200 py-5">
              <label
                htmlFor="payment-method"
                className="mb-3 block text-base font-bold text-slate-950"
              >
                Select Payment Method
              </label>
              <select
                id="payment-method"
                className="h-12 w-full rounded border border-slate-200 bg-white px-3 text-base font-semibold text-slate-800 outline-none"
                defaultValue="online"
              >
                <option value="online">Online Payment</option>
                <option value="cash">Cash On Delivery</option>
              </select>
            </div>

            <div className="flex items-center justify-between border-t border-slate-200 py-7 text-xl font-bold text-slate-950">
              <span>Total</span>
              <span>{formatPrice(cartTotal)}</span>
            </div>

            <button
              type="button"
              className="h-14 w-full rounded-md bg-slate-950 text-base font-bold text-white transition hover:bg-slate-800"
            >
              Proceed to Checkout
            </button>
          </aside>
        </div>
      ) : (
        <div className="flex min-h-[320px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100 text-slate-700">
              <ShoppingBag size={26} />
            </div>
            <h2 className="mt-4 text-xl font-semibold text-slate-950">
              Your cart is empty
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Click the shopping bag icon on a product to add it here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Browse Products
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
