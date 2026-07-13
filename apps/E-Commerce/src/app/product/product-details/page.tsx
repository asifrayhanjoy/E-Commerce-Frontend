"use client";

import {
  Heart,
  MapPin,
  MessageSquare,
  Minus,
  PackageCheck,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState, type MouseEvent } from "react";
import { useQuery } from "@tanstack/react-query";
import ProductCard from "@/components/ProductCard/page";
import Ratings from "@/components/Ratings/page";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import useUser from "@/hooks/use.User";
import axiosInstance from "@/utils/axiosinstance";
import { loadSelectedProductDetails } from "@/utils/productDetailsRoute";

const fallbackImage =
  "https://images.unsplash.com/photo-1635405074683-96d6921a2a68?w=900&auto=format";

const formatPrice = (value: number | string) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return `$${value}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(numericValue);
};

const ShippingAddressSection = () => {
  return (
    <div className="flex h-40 items-center justify-center">
      <p className="text-sm font-medium text-slate-500">No reviews yet.</p>
    </div>
  );
};

const stripHtml = (value?: string) => {
  if (!value) {
    return "";
  }

  return value
    .replace(/<[^>]*>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();
};

const toList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const getDiscountPercent = (regularPrice?: number, salePrice?: number) => {
  if (!regularPrice || !salePrice || regularPrice <= salePrice) {
    return null;
  }

  return Math.round(((regularPrice - salePrice) / regularPrice) * 100);
};

const getProductReviews = (product: any) => {
  const reviews = Array.isArray(product?.reviews)
    ? product.reviews
    : Array.isArray(product?.Shop?.reviews)
      ? product.Shop.reviews
      : Array.isArray(product?.shop?.reviews)
        ? product.shop.reviews
        : [];

  return reviews.map((review: any) => ({
    ...review,
    comment: review?.comment || review?.review || review?.reviews || "",
    user: review?.user || {
      name: review?.userName || review?.name || "Customer",
    },
  }));
};

export default function ProductDetailsPage() {
  const router = useRouter();
  const { user, isLoading: isUserLoading } = useUser();
  const { addToCart, getCartQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
  const [selectedReference, setSelectedReference] = useState<{
    productId?: string;
    slug?: string;
  } | null>(null);
  const [referenceReady, setReferenceReady] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [activeImage, setActiveImage] = useState("");
  const [isZooming, setIsZooming] = useState(false);
  const [zoomPosition, setZoomPosition] = useState({ x: 50, y: 50 });

  useEffect(() => {
    setSelectedReference(loadSelectedProductDetails());
    setReferenceReady(true);
  }, []);

  const {
    data: product,
    isLoading: isProductLoading,
    isError,
  } = useQuery({
    queryKey: [
      "product-details",
      selectedReference?.productId,
      selectedReference?.slug,
    ],
    enabled: referenceReady,
    queryFn: async () => {
      const params = new URLSearchParams();

      if (selectedReference?.productId) {
        params.set("productId", selectedReference.productId);
      } else if (selectedReference?.slug) {
        params.set("slug", selectedReference.slug);
      }

      const query = params.toString();
      const response = await axiosInstance.get(
        `/api/v1/products/product-details${query ? `?${query}` : ""}`
      );

      return response.data.product;
    },
    staleTime: 1000 * 60 * 2,
  });

  const { data: suggestedProducts = [] } = useQuery({
    queryKey: ["product-details-suggestions", product?.id, product?.category],
    enabled: Boolean(product?.id),
    queryFn: async () => {
      const response = await axiosInstance.get(
        "/api/v1/products/get-all-products?page=1&limit=8"
      );
      const products = Array.isArray(response.data?.products)
        ? response.data.products
        : [];

      return products
        .filter((item: any) => item?.id !== product?.id)
        .sort((first: any, second: any) => {
          if (first?.category === product?.category) {
            return -1;
          }

          if (second?.category === product?.category) {
            return 1;
          }

          return 0;
        })
        .slice(0, 4);
    },
    staleTime: 1000 * 60 * 2,
  });

  const productImages = useMemo(() => {
    if (!product?.images?.length) {
      return [fallbackImage];
    }

    const images = product.images
      .map((image: { url?: string }) => image?.url)
      .filter(Boolean);

    return images.length > 0 ? images : [fallbackImage];
  }, [product]);

  useEffect(() => {
    setActiveImage(productImages[0] || fallbackImage);
  }, [productImages]);

  if (!referenceReady || isProductLoading) {
    return (
      <main className="bg-[#f6f7fb] py-8">
        <section className="mx-auto h-[520px] w-[80%] animate-pulse bg-white" />
      </main>
    );
  }

  if (isError || !product) {
    return (
      <main className="bg-[#f6f7fb] py-8">
        <section className="mx-auto flex min-h-[360px] w-[80%] items-center justify-center bg-white px-6 text-center">
          <div>
            <h1 className="text-2xl font-bold text-slate-950">
              Product not found
            </h1>
            <p className="mt-2 text-sm font-medium text-slate-500">
              Please select another product from the shop.
            </p>
            <Link
              href="/"
              className="mt-5 inline-flex rounded bg-slate-950 px-4 py-2 text-sm font-semibold text-white"
            >
              Continue Shopping
            </Link>
          </div>
        </section>
      </main>
    );
  }

  const productTitle = product?.title || "Untitled product";
  const productReviews = getProductReviews(product);
  const shop = product?.Shop || product?.shop;
  const shopName = typeof shop?.name === "string" ? shop.name.trim() : "";
  const shopAddress =
    typeof shop?.address === "string" ? shop.address.trim() : "";
  const shopIdValue = shop?.id || shop?._id;
  const shopId = shopIdValue ? String(shopIdValue) : "";
  const hasShop = Boolean(shopName || shopId);
  const shopRating = Number(shop?.ratings || 0);
  const brand = product?.brand || "No Brand";
  const sizes = toList(product?.sizes);
  const availableSizes = sizes.length > 0 ? sizes : ["XS"];
  const salePrice = Number(product?.sale_price ?? product?.price ?? 0);
  const regularPrice = Number(product?.regular_price ?? 0);
  const discountPercent = getDiscountPercent(regularPrice, salePrice);
  const cartQuantity = getCartQuantity(product);
  const isAddedToCart = cartQuantity > 0;
  const isWishlisted = isInWishlist(product);

  const handleAddToCart = () => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    addToCart(product, quantity);
  };

  const handleWishlistClick = () => {
    if (isUserLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    toggleWishlist(product);
  };

  const handleImageMouseMove = (event: MouseEvent<HTMLDivElement>) => {
    const bounds = event.currentTarget.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;

    setZoomPosition({
      x: Math.min(100, Math.max(0, x)),
      y: Math.min(100, Math.max(0, y)),
    });
  };

  return (
    <main className="bg-[#f6f7fb]">
      <section className="mx-auto w-[80%] py-8">
        <div className="grid min-h-[520px] grid-cols-[31%_44%_25%] bg-white px-5 py-8 shadow-[0_12px_28px_-26px_rgba(15,23,42,0.5)]">
          <div className="flex flex-col justify-between pr-8">
            <div
              className="relative flex min-h-[360px] cursor-crosshair items-center justify-center overflow-hidden bg-slate-100"
              onMouseEnter={() => setIsZooming(true)}
              onMouseLeave={() => setIsZooming(false)}
              onMouseMove={handleImageMouseMove}
            >
              <img
                src={activeImage}
                alt={productTitle}
                width={360}
                height={360}
                className="max-h-[360px] w-full object-contain"
              />
              {isZooming && (
                <>
                  <div className="absolute inset-0 bg-slate-950/25" />
                  <div
                    className="pointer-events-none absolute h-[42%] w-[42%] border border-white/70 bg-white/45 shadow-[0_12px_32px_rgba(15,23,42,0.22)]"
                    style={{
                      left: `${zoomPosition.x}%`,
                      top: `${zoomPosition.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  />
                </>
              )}
            </div>

            <div className="flex gap-3 overflow-x-auto pt-5">
              {productImages.slice(0, 4).map((image: string) => (
                <button
                  key={image}
                  type="button"
                  className={`h-[76px] w-[76px] shrink-0 rounded-md border bg-white p-2 ${
                    activeImage === image
                      ? "border-blue-500"
                      : "border-slate-200"
                  }`}
                  onClick={() => setActiveImage(image)}
                >
                  <img
                    src={image}
                    alt={productTitle}
                    width={58}
                    height={58}
                    className="h-full w-full object-contain"
                  />
                </button>
              ))}
            </div>
          </div>

          <div className="relative py-6 pr-10">
            {isZooming ? (
              <div
                className="h-full min-h-[460px] border border-slate-100 bg-white bg-no-repeat"
                style={{
                  backgroundImage: `url(${activeImage})`,
                  backgroundSize: "240%",
                  backgroundPosition: `${zoomPosition.x}% ${zoomPosition.y}%`,
                }}
              />
            ) : (
              <>
                <h1 className="text-2xl font-bold text-slate-950">
                  {productTitle}
                </h1>

                <div className="mt-5 flex items-center gap-3">
                  <Ratings rating={product?.ratings} />
                  <span className="text-sm font-semibold text-blue-500">
                    ({productReviews.length} Reviews)
                  </span>
                </div>

                <p className="mt-3 text-base font-semibold text-slate-500">
                  Brand: <span className="text-blue-500">{brand}</span>
                </p>

                <div className="mt-5 border-t border-slate-100 pt-5">
                  <div className="text-4xl font-black text-orange-600">
                    {formatPrice(salePrice)}
                  </div>
                  {regularPrice > 0 && (
                    <div className="mt-2 flex items-center gap-2 text-xl font-bold text-slate-500">
                      <span className="line-through">
                        {formatPrice(regularPrice)}
                      </span>
                      {discountPercent !== null && (
                        <span>-{discountPercent}%</span>
                      )}
                    </div>
                  )}
                </div>

                <div className="mt-6 border-t border-slate-100 pt-5">
                  <h2 className="text-base font-bold text-slate-950">Size:</h2>
                  <div className="mt-3 flex flex-wrap gap-3">
                    {availableSizes.map((size) => (
                      <button
                        key={size}
                        type="button"
                        className="rounded-md bg-slate-900 px-4 py-2 text-sm font-bold text-white"
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <div className="flex h-10 overflow-hidden rounded-md bg-slate-100">
                    <button
                      type="button"
                      aria-label="Decrease quantity"
                      className="flex w-10 items-center justify-center bg-slate-200 font-bold text-slate-800"
                      onClick={() =>
                        setQuantity((current) => Math.max(1, current - 1))
                      }
                    >
                      <Minus size={16} strokeWidth={3} />
                    </button>
                    <span className="flex w-12 items-center justify-center text-base font-bold text-slate-950">
                      {quantity}
                    </span>
                    <button
                      type="button"
                      aria-label="Increase quantity"
                      className="flex w-10 items-center justify-center bg-slate-200 font-bold text-slate-800"
                      onClick={() => setQuantity((current) => current + 1)}
                    >
                      <Plus size={16} strokeWidth={3} />
                    </button>
                  </div>

                  <span className="text-base font-bold text-emerald-600">
                    {Number(product?.stock ?? 0) > 0
                      ? `In Stock (Stock ${product.stock})`
                      : "Out of Stock"}
                  </span>
                </div>

                <button
                  type="button"
                  className="mt-6 inline-flex h-12 items-center gap-3 rounded-md bg-orange-600 px-7 text-base font-bold text-white transition hover:bg-orange-700"
                  onClick={handleAddToCart}
                >
                  <ShoppingBag size={22} />
                  {isAddedToCart ? "Added to Cart" : "Add to Cart"}
                </button>

                <p className="mt-6 max-w-[600px] text-sm font-medium leading-6 text-slate-500">
                  {stripHtml(product?.short_description) ||
                    stripHtml(product?.detailed_description) ||
                    shopName ||
                    "Product details are loaded from the database."}
                </p>
              </>
            )}
          </div>

          <aside className="border-l border-slate-100 px-6 py-6">
            <div className="flex items-center justify-end gap-3">
              {hasShop && (
                <button
                  type="button"
                  className="inline-flex h-10 shrink-0 items-center gap-2 rounded-md border border-blue-100 bg-blue-50 px-3 text-sm font-black text-blue-600 transition hover:bg-blue-100"
                >
                  <MessageSquare size={17} />
                  Chat Now
                </button>
              )}
              <button
                type="button"
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
                className="flex h-11 w-11 items-center justify-center rounded-full border border-red-100 bg-red-50 text-red-500 transition hover:border-red-200 hover:bg-red-100"
                onClick={handleWishlistClick}
              >
                <Heart size={24} fill={isWishlisted ? "currentColor" : "none"} />
              </button>
            </div>

            <div className="mt-5 space-y-6 text-slate-500">
              {shopAddress && (
                <section className="rounded-md border border-slate-100 bg-slate-50/60 p-4">
                  <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Delivery Option
                  </h2>
                  <p className="mt-3 flex items-start gap-3 text-base font-bold leading-6 text-slate-800">
                    <MapPin
                      size={20}
                      className="mt-0.5 shrink-0 text-slate-500"
                    />
                    <span>{shopAddress}</span>
                  </p>
                </section>
              )}

              <section className="rounded-md border border-slate-100 bg-white p-4">
                <h2 className="text-sm font-bold uppercase tracking-wide text-slate-500">
                  Return & Warranty
                </h2>
                <p className="mt-3 flex items-center gap-3 text-base font-bold text-slate-700">
                  <PackageCheck size={20} className="text-slate-500" />
                  <span>7 Days Returns</span>
                </p>
                <p className="mt-3 flex items-start gap-3 text-base font-bold leading-6 text-slate-700">
                  <ShieldCheck size={20} className="mt-0.5 shrink-0 text-slate-500" />
                  <span>{product?.warranty || "Warranty not available"}</span>
                </p>
              </section>

              {hasShop && (
                <section className="rounded-md border border-slate-100 bg-white p-4">
                  <p className="text-sm font-bold uppercase tracking-wide text-slate-500">
                    Sold by
                  </p>
                  {shopName && (
                    <h2 className="mt-3 line-clamp-2 text-xl font-black leading-7 text-slate-950">
                      {shopName}
                    </h2>
                  )}

                  {shopRating > 0 && (
                    <div className="mt-5 border-t border-slate-100 pt-5">
                      <div className="rounded-md bg-slate-50 px-2.5 py-3 text-center">
                        <p className="text-[11px] font-black uppercase leading-4 text-slate-500">
                          Seller Rating
                        </p>
                        <p className="mt-2 text-xl font-black leading-none text-slate-950">
                          {Math.round(shopRating * 20)}%
                        </p>
                      </div>
                    </div>
                  )}

                  {shopId && (
                    <Link
                      href={`/shops/${encodeURIComponent(shopId)}`}
                      className="mt-5 flex h-11 items-center justify-center gap-2 rounded-md border border-blue-100 bg-blue-50 text-sm font-black uppercase text-blue-600 transition hover:bg-blue-100"
                    >
                      <Store size={18} />
                      Go To Store
                    </Link>
                  )}
                </section>
              )}
            </div>
          </aside>
        </div>
      </section>

      <div className="mx-auto mt-5 w-[90%] lg:w-[80%]">
        <div className="h-full min-h-[60vh] bg-white p-5">
          <h3 className="text-lg font-semibold">
            Product details of {productTitle}
          </h3>
          <div
            className="product-details-content mt-4 max-w-none text-slate-600"
            dangerouslySetInnerHTML={{
              __html: product?.detailed_description || "",
            }}
          />
        </div>
      </div>

      <div className="mx-auto mt-5 w-[90%] lg:w-[80%]">
        <div className="h-full min-h-[60vh] bg-white p-5">
          <h3 className="text-lg font-semibold">
            Ratings & Reviews of {productTitle}
          </h3>

          {productReviews.length > 0 ? (
            <div className="mt-8 space-y-5">
              {productReviews.map((review: any, index: number) => (
                <div
                  key={review?.id || review?._id || index}
                  className="border-b border-slate-100 pb-5 last:border-b-0"
                >
                  <div className="flex items-center gap-3">
                    <Ratings rating={review?.rating || 0} />
                    <span className="text-sm font-semibold text-slate-500">
                      {review?.user?.name || review?.name || "Customer"}
                    </span>
                  </div>
                  {review?.comment && (
                    <p className="mt-3 text-sm font-medium leading-6 text-slate-600">
                      {review.comment}
                    </p>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <ShippingAddressSection />
          )}
        </div>
      </div>

      {suggestedProducts.length > 0 && (
        <section className="mx-auto mt-10 w-[90%] lg:w-[80%]">
          <h2 className="mb-5 text-2xl font-bold text-slate-950">
            You may also like
          </h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {suggestedProducts.map((suggestedProduct: any) => (
              <ProductCard
                key={suggestedProduct.id || suggestedProduct.slug}
                product={suggestedProduct}
              />
            ))}
          </div>
        </section>
      )}

    </main>
  );
}
