"use client";

import { Minus, Plus, X } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCart } from "@/contexts/CartContext";
import {
  useWishlist,
  type WishlistProduct,
} from "@/contexts/WishlistContext";
import useUser from "@/hooks/use.User";

const getProductKey = (product: WishlistProduct) => product.id || product.slug;

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

const getProductPrice = (product: WishlistProduct) =>
  product.sale_price ?? product.price ?? 0;

export default function WishlistPage() {
  const { addToCart } = useCart();
  const { wishlistItems, removeFromWishlist } = useWishlist();
  const { user, isLoading } = useUser();
  const [quantities, setQuantities] = useState<Record<string, number>>({});
  const [addedProductKeys, setAddedProductKeys] = useState<
    Record<string, boolean>
  >({});

  const quantityByProduct = useMemo(() => {
    return wishlistItems.reduce<Record<string, number>>((nextQuantities, product) => {
      const productKey = getProductKey(product);

      if (productKey) {
        nextQuantities[productKey] = quantities[productKey] || 1;
      }

      return nextQuantities;
    }, {});
  }, [quantities, wishlistItems]);

  const updateQuantity = (product: WishlistProduct, quantity: number) => {
    const productKey = getProductKey(product);

    if (!productKey) {
      return;
    }

    setQuantities((currentQuantities) => ({
      ...currentQuantities,
      [productKey]: Math.max(1, quantity),
    }));
  };

  const handleAddToCart = (product: WishlistProduct) => {
    const productKey = getProductKey(product);
    const quantity = productKey ? quantityByProduct[productKey] || 1 : 1;

    addToCart(product, quantity);

    if (productKey) {
      setAddedProductKeys((currentKeys) => ({
        ...currentKeys,
        [productKey]: true,
      }));

      window.setTimeout(() => {
        setAddedProductKeys((currentKeys) => ({
          ...currentKeys,
          [productKey]: false,
        }));
      }, 1200);
    }
  };

  const handleRemove = (product: WishlistProduct) => {
    const productKey = getProductKey(product);

    removeFromWishlist(product);

    if (productKey) {
      setQuantities((currentQuantities) => {
        const nextQuantities = { ...currentQuantities };
        delete nextQuantities[productKey];
        return nextQuantities;
      });
    }
  };

  if (isLoading) {
    return (
      <main className="mx-auto w-[80%] py-16">
        <div className="h-[320px] animate-pulse rounded bg-slate-100" />
      </main>
    );
  }

  if (!user) {
    return (
      <main className="mx-auto w-[80%] py-16">
        <div className="flex min-h-[320px] items-center justify-center border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Sign in to view your wishlist
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Wishlist products are saved for logged-in users.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Sign In
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="mx-auto w-[80%] py-16">
      <section className="mb-16">
        <h1 className="text-[42px] font-semibold leading-tight text-black">
          Wishlist
        </h1>
        <p className="mt-5 text-lg font-medium text-slate-500">
          Home . Wishlist
        </p>
      </section>

      {wishlistItems.length > 0 ? (
        <section className="w-full overflow-x-auto">
          <div className="min-w-[900px]">
            <div className="grid grid-cols-[2fr_1.45fr_1.3fr_2fr] bg-slate-100 px-6 py-5 text-lg font-bold text-slate-950">
              <div>Product</div>
              <div>Price</div>
              <div>Quantity</div>
              <div>Action</div>
            </div>

            <div className="divide-y divide-slate-100 bg-white">
              {wishlistItems.map((product) => {
                const productKey = getProductKey(product) || product.title;
                const quantity = productKey
                  ? quantityByProduct[productKey] || 1
                  : 1;
                const isAdded = productKey
                  ? addedProductKeys[productKey]
                  : false;
                const imageUrl =
                  product.images?.[0]?.url ||
                  "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=500&auto=format";
                const productTitle = product.title || "Untitled product";

                return (
                  <div
                    key={productKey}
                    className="grid min-h-[130px] grid-cols-[2fr_1.45fr_1.3fr_2fr] items-center px-6 py-8"
                  >
                    <div className="flex items-center gap-8">
                      <Link
                        href={`/product/${product.slug}`}
                        className="h-[76px] w-[76px] shrink-0 overflow-hidden rounded bg-white"
                      >
                        <img
                          src={imageUrl}
                          alt={productTitle}
                          width={76}
                          height={76}
                          className="h-full w-full object-cover object-top"
                        />
                      </Link>
                      <Link
                        href={`/product/${product.slug}`}
                        className="text-lg font-medium text-slate-950"
                      >
                        {productTitle}
                      </Link>
                    </div>

                    <div className="text-lg font-medium text-slate-950">
                      {formatPrice(getProductPrice(product))}
                    </div>

                    <div>
                      <div className="inline-flex h-10 items-center overflow-hidden rounded-full border border-slate-200 bg-white shadow-sm">
                        <button
                          type="button"
                          aria-label="Decrease quantity"
                          className="flex h-full w-10 items-center justify-center text-slate-950"
                          onClick={() => updateQuantity(product, quantity - 1)}
                        >
                          <Minus size={15} strokeWidth={3} />
                        </button>
                        <span className="flex h-full w-8 items-center justify-center text-lg font-medium text-slate-950">
                          {quantity}
                        </span>
                        <button
                          type="button"
                          aria-label="Increase quantity"
                          className="flex h-full w-10 items-center justify-center text-slate-950"
                          onClick={() => updateQuantity(product, quantity + 1)}
                        >
                          <Plus size={16} strokeWidth={3} />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center gap-24">
                      <button
                        type="button"
                        className="h-11 rounded bg-blue-500 px-7 text-base font-semibold text-white transition hover:bg-blue-600"
                        onClick={() => handleAddToCart(product)}
                      >
                        {isAdded ? "Added" : "Add To Cart"}
                      </button>

                      <button
                        type="button"
                        className="flex items-center gap-1 text-base font-medium text-slate-500 transition hover:text-red-500"
                        onClick={() => handleRemove(product)}
                      >
                        <X size={20} />
                        Remove
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      ) : (
        <div className="flex min-h-[280px] items-center justify-center border border-dashed border-slate-300 bg-white px-6 text-center">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">
              Your wishlist is empty
            </h2>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Click the heart icon on a product to save it here.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Browse Products
            </Link>
          </div>
        </div>
      )}
    </main>
  );
}
