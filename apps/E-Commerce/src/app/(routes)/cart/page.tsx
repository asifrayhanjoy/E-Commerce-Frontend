"use client";

import {
  ArrowLeft,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import useUser from "@/hooks/use.User";
import {
  PRODUCT_DETAILS_PATH,
  saveSelectedProductDetails,
} from "@/utils/productDetailsRoute";
import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosinstance";
import axios from "axios";

type ShippingAddress = {
  id?: string;
  _id?: string;
  label?: string;
  name?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  isDefault?: boolean;
};

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

const getAddressOptionLabel = (address: ShippingAddress) => {
  const addressTitle = [address.label, address.name].filter(Boolean).join(" - ");
  const addressDetails = [
    address.street,
    address.city,
    address.zip,
    address.country,
  ]
    .filter(Boolean)
    .join(", ");

  return [addressTitle || "Address", addressDetails].filter(Boolean).join(", ");
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
  const { user, isLoading: isUserLoading } = useUser();
  const [couponCode, setCouponCode] = useState("");
  const [selectedAddressId, setSelectedAddressId] = useState<string>("");
  const [isLoading, setLoading] = useState(false);
  const [storedCouponCode, setStoredCouponCode] = useState("");
  const [error, setError] = useState("");
  const [checkoutError, setCheckoutError] = useState("");
  const [discountAmount, setDiscountAmount] = useState<number>(0);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [discountedProductId, setDiscountedProductId] = useState<string>("");
  const orderCartItems = cartItems.map(({ product, quantity }) => ({
    id: product.id || product._id || product.productId || product.slug,
    title: product.title || product.name,
    quantity,
    sale_price: Number(product.sale_price ?? product.price ?? 0),
    shopId:
      product.shopId ||
      product.Shop?.id ||
      product.Shop?._id ||
      product.shop?.id ||
      product.shop?._id,
    selectedOptions: {},
    discount_codes: (product as any).discount_codes || [],
  }));

  const createPaymentSession = async () => {
    if (addresses.length === 0 || !selectedAddressId) {
      setCheckoutError("Please set your delivery address to create an order!");
      return;
    }

    const appliedCoupon = storedCouponCode
      ? {
          storedCouponCode,
          discountAmount,
          discountPercent,
          discountedProductId,
        }
      : null;

    setLoading(true);
    setCheckoutError("");

    try {
      const response = await axios.post("/api/order/create-payment-session", {
        cart: orderCartItems,
        selectedAddressId,
        coupon: appliedCoupon,
      });

      const sessionId = response.data?.sessionId;
      if (sessionId) {
        window.location.href = `/checkout?sessionId=${sessionId}`;
      } else {
        console.error("Payment session ID is missing");
      }
    } catch (error) {
      console.error(error);
      setCheckoutError("Could not prepare checkout. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const {
    data: addresses = [],
    isLoading: areAddressesLoading,
    isError: isAddressError,
  } = useQuery({
    queryKey: ["user-addresses"],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await axiosInstance.get("/api/v1/auth/addresses");

      return Array.isArray(response.data?.addresses)
        ? (response.data.addresses as ShippingAddress[])
        : [];
    },
    staleTime: 1000 * 60,
  });

  const couponCodeApplyHandler = async () => {
    setError("");

    if (!couponCode.trim()) {
      setError("Coupon code is required!");
      return;
    }

    try {
      const res = await axios.put("/api/order/verify-coupon", {
        couponCode: couponCode.trim(),
        cart: orderCartItems,
      });

      if (res.data.valid) {
        setStoredCouponCode(couponCode.trim());
        setDiscountAmount(parseFloat(res.data.discountAmount));
        setDiscountPercent(res.data.discount);
        setDiscountedProductId(res.data.discountedProductId);
        setCouponCode("");
      } else {
        setDiscountAmount(0);
        setDiscountPercent(0);
        setDiscountedProductId("");
        setError(
          res.data.message || "Coupon not valid for any items in cart."
        );
      }
    } catch (error: any) {
      setDiscountAmount(0);
      setDiscountPercent(0);
      setDiscountedProductId("");
      setError(error?.response?.data?.message);
    }
  };

  useEffect(() => {
    if (addresses.length === 0) {
      setSelectedAddressId("");
      return;
    }

    const hasSelectedAddress = addresses.some(
      (address) => (address.id || address._id) === selectedAddressId
    );

    if (hasSelectedAddress) {
      return;
    }

    const defaultAddress = addresses.find((address) => address.isDefault);
    const firstAddress = defaultAddress || addresses[0];
    setSelectedAddressId(firstAddress.id || firstAddress._id || "");
  }, [addresses, selectedAddressId]);

  if (isUserLoading) {
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
                    href={PRODUCT_DETAILS_PATH}
                    onClick={() => saveSelectedProductDetails(product)}
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
                    <Link
                      href={PRODUCT_DETAILS_PATH}
                      onClick={() => saveSelectedProductDetails(product)}
                    >
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
              <div className="flex h-12 overflow-hidden rounded border border-slate-200 bg-gray-200">
                <input
                  id="coupon-code"
                  type="text"
                  value={couponCode}
                  onChange={(event) => setCouponCode(event.target.value)}
                  placeholder="Enter coupon code"
                  className="min-w-0 flex-1 px-3 text-base font-medium text-slate-700 outline-none placeholder:text-slate-400"
                />
                <button
                  onClick={couponCodeApplyHandler}
                  type="button"
                  className="w-24 bg-blue-600 text-base font-semibold text-white transition hover:bg-blue-700"
                >
                  Apply
                </button>
              </div>
              {error && (
                <p className="mt-2 text-sm font-semibold text-red-600">
                  {error}
                </p>
              )}
            </div>

            <div className="border-t border-slate-200 py-5">
              <label
                htmlFor="shipping-address"
                className="mb-3 block text-base font-bold text-slate-950"
              >
                Select Shipping Address
              </label>
              {areAddressesLoading ? (
                <div className="flex h-12 w-full items-center rounded border border-slate-200 bg-white px-3 text-base font-semibold text-slate-500">
                  Loading addresses...
                </div>
              ) : isAddressError ? (
                <div className="flex h-12 w-full items-center rounded border border-red-200 bg-red-50 px-3 text-sm font-semibold text-red-600">
                  Could not load shipping addresses.
                </div>
              ) : addresses.length > 0 ? (
                <select
                  id="shipping-address"
                  className="h-12 w-full rounded border border-slate-300 bg-white px-3 text-base font-semibold text-slate-800 outline-none focus:border-blue-500"
                  value={selectedAddressId}
                  onChange={(event) => setSelectedAddressId(event.target.value)}
                >
                  {addresses.map((address, index) => {
                    const addressId = address.id || address._id || "";

                    return (
                      <option key={addressId || index} value={addressId}>
                        {getAddressOptionLabel(address)}
                      </option>
                    );
                  })}
                </select>
              ) : (
                <select
                  id="shipping-address"
                  className="h-12 w-full rounded border border-slate-300 bg-white px-3 text-base font-semibold text-slate-500 outline-none"
                  value=""
                  disabled
                >
                  <option value="">No saved address found</option>
                </select>
              )}
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

            {checkoutError && (
              <p className="mb-3 text-sm font-semibold text-red-600">
                {checkoutError}
              </p>
            )}

            <button
              type="button"
              onClick={createPaymentSession}
              disabled={isLoading}
              className="h-14 w-full rounded-md bg-slate-950 text-base font-bold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:bg-slate-400"
            >
              {isLoading ? "Preparing Checkout..." : "Proceed to Checkout"}
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
