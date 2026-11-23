"use client";

import {
  Eye,
  Heart,
  MapPin,
  MessageCircle,
  Minus,
  Plus,
  ShoppingBag,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/contexts/CartContext";
import { useWishlist } from "@/contexts/WishlistContext";
import useUser from "@/hooks/use.User";
import {
  PRODUCT_DETAILS_PATH,
  saveSelectedProductDetails,
} from "@/utils/productDetailsRoute";
import { getShopAvatarImage } from "@/utils/shopImages";
import Ratings from "../Ratings/page";

const formatPrice = (value: number | string) => {
  const numericValue = Number(value);

  if (!Number.isFinite(numericValue)) {
    return `$${value}`;
  }

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    notation: numericValue >= 100000 ? "compact" : "standard",
    maximumFractionDigits: numericValue >= 100000 ? 1 : 0,
  }).format(numericValue);
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

const getDeliveryDate = () => {
  const deliveryDate = new Date();
  deliveryDate.setDate(deliveryDate.getDate() + 5);

  return new Intl.DateTimeFormat("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(deliveryDate);
};

const ProductQuickView = ({
  product,
  imageUrl,
  productName,
  productTitle,
  salePrice,
  regularPrice,
  soldCount,
  isAddedToCart,
  cartQuantity,
  onAddToCart,
  isWishlisted,
  onWishlistClick,
  onClose,
}: {
  product: any;
  imageUrl: string;
  productName: string;
  productTitle: string;
  salePrice?: number | string;
  regularPrice?: number | string;
  soldCount: number;
  isAddedToCart: boolean;
  cartQuantity: number;
  onAddToCart: (quantity: number) => void;
  isWishlisted: boolean;
  onWishlistClick: () => void;
  onClose: () => void;
}) => {
  const [quantity, setQuantity] = useState(1);
  const productImages = product?.images?.length
    ? product.images
        .map((image: { url?: string }) => image?.url)
        .filter(Boolean)
    : [imageUrl];
  const [activeImage, setActiveImage] = useState(productImages[0] || imageUrl);
  const shortDescription =
    stripHtml(product?.short_description) ||
    stripHtml(product?.detailed_description) ||
    "No description available.";
  const sizes = toList(product?.sizes);
  const shop = product?.Shop || product?.shop;
  const shopName = typeof shop?.name === "string" ? shop.name.trim() : "";
  const shopAddress =
    typeof shop?.address === "string" ? shop.address.trim() : "";
  const shopIdValue = shop?.id || shop?._id;
  const shopRating = Number(shop?.ratings) || 0;
  const shopAvatar = getShopAvatarImage(shop);
  const hasShop = Boolean(shopName || shopIdValue);
  const isInStock = Number(product?.stock ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[92vh] min-h-[640px] w-full max-w-[1180px] overflow-y-auto rounded-[28px] bg-white shadow-2xl md:grid-cols-[52%_48%]"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          aria-label="Close quick view"
          className="absolute right-5 top-5 z-10 rounded-full bg-white p-2 text-slate-950"
          onClick={onClose}
        >
          <X size={30} strokeWidth={3} />
        </button>

        <div className="flex min-h-[720px] flex-col justify-between bg-white px-8 pb-8 pt-20">
          <div className="flex flex-1 items-center justify-center">
            <img
              src={activeImage}
              alt={productTitle}
              width={520}
              height={520}
              className="max-h-[520px] w-full object-contain"
            />
          </div>

          <div className="mt-8 flex gap-4">
            {productImages.slice(0, 4).map((image: string) => (
              <button
                key={image}
                type="button"
                className={`h-[96px] w-[96px] rounded-md border bg-white p-2 ${
                  activeImage === image ? "border-slate-950" : "border-slate-300"
                }`}
                onClick={() => setActiveImage(image)}
              >
                <img
                  src={image}
                  alt={productTitle}
                  width={80}
                  height={80}
                  className="h-full w-full object-contain"
                />
              </button>
            ))}
          </div>
        </div>

        <div className="px-8 pb-10 pt-10">
          {hasShop && (
            <div className="flex items-start justify-between gap-6 border-b border-slate-200 pb-7 pr-14">
              <div className="flex items-start gap-4">
                {shopAvatar ? (
                  <img
                    src={shopAvatar}
                    alt={shopName || "Shop avatar"}
                    width={76}
                    height={76}
                    className="h-[76px] w-[76px] rounded-full object-cover"
                  />
                ) : (
                  <div className="flex h-[76px] w-[76px] items-center justify-center rounded-full bg-blue-50 text-2xl font-black text-blue-700">
                    {shopName.charAt(0).toUpperCase() || "S"}
                  </div>
                )}
                <div>
                  {shopName && (
                    <h3 className="text-2xl font-bold text-slate-950">
                      {shopName}
                    </h3>
                  )}
                  <div className="mt-2 flex gap-1">
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Star
                        key={index}
                        size={22}
                        className={
                          index < Math.round(shopRating)
                            ? "fill-yellow-400 text-yellow-400"
                            : "text-yellow-300"
                        }
                      />
                    ))}
                  </div>
                  {shopAddress && (
                    <div className="mt-2 flex items-center gap-2 text-base font-medium text-slate-500">
                      <MapPin size={22} />
                      <span>{shopAddress}</span>
                    </div>
                  )}
                </div>
              </div>

              <Link
                href={PRODUCT_DETAILS_PATH}
                onClick={() => saveSelectedProductDetails(product)}
                className="flex h-[48px] shrink-0 items-center gap-2 rounded-xl bg-sky-500 px-5 text-sm font-bold text-slate-950 shadow-md transition hover:-translate-y-0.5 hover:bg-sky-300"
              >
                <MessageCircle size={22} />
                Seller details & chat
              </Link>
            </div>
          )}

          <div className="pt-6">
            <h2 className="text-2xl font-bold text-slate-950">
              {productTitle}
            </h2>

            <p className="mt-5 text-xl font-semibold leading-7 text-slate-500">
              {shortDescription}
            </p>

            {sizes.length > 0 && (
              <div className="mt-7">
                <h3 className="text-sm font-bold text-slate-300">
                  Available sizes
                </h3>
                <div className="mt-3 flex flex-wrap gap-2">
                  {sizes.map((size) => (
                    <span
                      key={size}
                      className="rounded-lg border border-white/10 bg-[#111827] px-3 py-2 text-sm font-semibold text-slate-200"
                    >
                      {size}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <div className="mt-8 flex items-end gap-5">
              {salePrice !== undefined && salePrice !== null && (
                <span className="text-4xl font-bold text-slate-950">
                  {formatPrice(salePrice)}
                </span>
              )}
              {regularPrice !== undefined && regularPrice !== null && (
                <span className="pb-1 text-2xl font-bold text-rose-700 line-through">
                  {formatPrice(regularPrice)}
                </span>
              )}
            </div>

            <div className="mt-8 flex flex-wrap items-center gap-6">
              <div className="flex h-[48px] overflow-hidden rounded-md bg-slate-100">
                <button
                  type="button"
                  className="flex w-14 items-center justify-center bg-slate-200"
                  onClick={() =>
                    setQuantity((current) => Math.max(1, current - 1))
                  }
                >
                  <Minus size={18} strokeWidth={3} />
                </button>
                <span className="flex w-16 items-center justify-center text-xl font-bold text-slate-950">
                  {quantity}
                </span>
                <button
                  type="button"
                  className="flex w-14 items-center justify-center bg-slate-200"
                  onClick={() => setQuantity((current) => current + 1)}
                >
                  <Plus size={18} strokeWidth={3} />
                </button>
              </div>

              <button
                type="button"
                aria-label={
                  isAddedToCart
                    ? `Add to cart, ${cartQuantity} in cart`
                    : "Add to cart"
                }
                className="relative flex h-[52px] cursor-pointer items-center gap-3 rounded-xl bg-[#0b0f19] px-8 text-lg font-bold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-blue-700"
                onClick={() => onAddToCart(quantity)}
              >
                <ShoppingBag size={24} />
                {isAddedToCart ? "Added to Cart" : "Add to Cart"}
                <span className="absolute -right-1 -top-1 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#0b0f19] bg-amber-400 px-1.5 text-xs font-extrabold leading-none text-[#111827] shadow-md">
                  {cartQuantity > 9 ? "9+" : cartQuantity}
                </span>
              </button>

              <button
                type="button"
                aria-label={
                  isWishlisted ? "Remove from wishlist" : "Add to wishlist"
                }
                className={`relative flex h-[52px] w-[52px] items-center justify-center rounded-md border-2 transition ${
                  isWishlisted
                    ? "border-blue-600 bg-red-50 text-red-500"
                    : "border-slate-200 bg-white text-slate-900 hover:border-red-200 hover:text-red-500"
                }`}
                onClick={onWishlistClick}
              >
                <Heart
                  size={34}
                  className="transition"
                  fill={isWishlisted ? "currentColor" : "none"}
                />
                {isWishlisted && (
                  <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
                    1
                  </span>
                )}
              </button>
            </div>

            <p className="mt-7 text-xl font-bold text-emerald-600">
              {isInStock ? "In Stock" : "Out of Stock"}
            </p>

            <p className="mt-6 text-lg font-medium text-slate-600">
              Estimated Delivery:{" "}
              <span className="font-bold text-slate-950">
                {getDeliveryDate()}
              </span>
            </p>

            <div className="mt-4 flex items-center gap-3 text-sm font-semibold text-slate-500">
              <span>{soldCount} sold</span>
              <span>|</span>
              <Ratings rating={product?.ratings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductCard = ({
  product,
  isEvent,
}: {
  product: any;
  isEvent?: boolean;
}) => {
  const [isQuickViewOpen, setIsQuickViewOpen] = useState(false);
  const router = useRouter();
  const { user, isLoading } = useUser();
  const { addToCart, getCartQuantity } = useCart();
  const { isInWishlist, toggleWishlist } = useWishlist();
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
  const salePrice = product?.sale_price ?? product?.price;
  const regularPrice = product?.regular_price;
  const soldCount =
    product?.sold ?? product?.totalSold ?? product?.sold_out ?? 0;
  const isWishlisted = isInWishlist(product);
  const cartQuantity = getCartQuantity(product);
  const isAddedToCart = cartQuantity > 0;

  const handleWishlistClick = () => {
    if (isLoading) {
      return;
    }

    if (!isLoading && !user) {
      router.push("/login");
      return;
    }

    toggleWishlist(product);
  };

  const handleAddToCart = (quantity = 1) => {
    if (isLoading) {
      return;
    }

    if (!user) {
      router.push("/login");
      return;
    }

    addToCart(product, quantity);
  };

  return (
    <article className="fade-up group relative flex h-[430px] w-full flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.48)] transition duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_58px_-30px_rgba(15,23,42,0.38)]">
      {isEvent && (
        <div className="absolute left-4 top-4 z-10 rounded-full border border-rose-200/70 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold tracking-[0.16em] text-rose-700 shadow-sm backdrop-blur">
          OFFER
        </div>
      )}

      {product?.stock <= 5 && (
        <div className="absolute right-4 top-4 z-10 rounded-full border border-emerald-400/20 bg-[#0c2a25]/95 px-3 py-1.5 text-[10px] font-bold leading-none text-emerald-200 shadow-sm backdrop-blur">
          Limited Stock
        </div>
      )}

      <div className="relative h-[260px] w-full shrink-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#f8f7f3_100%)]">
        <Link
          href={PRODUCT_DETAILS_PATH}
          onClick={() => saveSelectedProductDetails(product)}
          className="image-zoom block h-full w-full overflow-hidden"
        >
          <img
            src={imageUrl}
            alt={product?.title || "Product image"}
            width={300}
            height={300}
            className="h-full w-full object-contain p-5 transition-transform duration-700 ease-out group-hover:scale-105"
          />
        </Link>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2 sm:translate-x-2 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100">
          <button
            type="button"
            aria-label="Add to wishlist"
            className="grid size-10 place-items-center rounded-full border border-slate-200/80 bg-white/95 text-rose-500 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:border-rose-200 hover:bg-rose-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-rose-300"
            onClick={handleWishlistClick}
          >
            <Heart
              className="transition-transform duration-200"
              size={24}
              fill={isWishlisted ? "currentColor" : "none"}
            />
          </button>
          <button
            type="button"
            aria-label="Quick view"
            className="grid size-10 place-items-center rounded-full border border-slate-200/80 bg-white/95 text-slate-700 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:border-slate-300 hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-slate-300"
            onClick={() => setIsQuickViewOpen(true)}
          >
            <Eye size={21} />
          </button>
          <button
            type="button"
            aria-label={
              isAddedToCart
                ? `Add to cart, ${cartQuantity} in cart`
                : "Add to cart"
            }
            className={`relative grid size-10 place-items-center rounded-full border border-slate-200/80 bg-white/95 shadow-lg backdrop-blur transition duration-200 hover:scale-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/50 ${
              isAddedToCart
                ? "text-blue-700 ring-2 ring-blue-500/25"
                : "text-slate-700 hover:text-blue-700"
            }`}
            onClick={() => handleAddToCart()}
          >
            <ShoppingBag
              className="transition-transform duration-200"
              size={21}
            />
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-sky-300 px-1 text-[11px] font-extrabold leading-none text-[#07111f] shadow-md">
              {cartQuantity > 9 ? "9+" : cartQuantity}
            </span>
          </button>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4">
        <Link
          href={PRODUCT_DETAILS_PATH}
          onClick={() => saveSelectedProductDetails(product)}
          className="block"
        >
          <p className="truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
            {productName}
          </p>
          <h3 className="mt-2 line-clamp-1 text-base font-bold tracking-tight text-slate-950 transition-colors duration-200 group-hover:text-blue-700">
            {productTitle}
          </h3>
        </Link>

        <div className="mt-2">
          <Ratings rating={product?.ratings} />
        </div>

        <div className="mt-auto flex items-end justify-between gap-3 pt-4">
          <div className="flex min-w-0 items-end gap-2">
            {salePrice !== undefined && salePrice !== null && (
              <span className="whitespace-nowrap text-xl font-black leading-none tracking-tight text-slate-950">
                {formatPrice(salePrice)}
              </span>
            )}
            {regularPrice !== undefined && regularPrice !== null && (
              <span className="truncate pb-0.5 text-xs font-semibold text-slate-400 line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>
          <span className="shrink-0 whitespace-nowrap pb-0.5 text-[10px] font-bold text-slate-400">
            {soldCount} sold
          </span>
        </div>
      </div>

      {isQuickViewOpen && (
        <ProductQuickView
          product={product}
          imageUrl={imageUrl}
          productName={productName}
          productTitle={productTitle}
          salePrice={salePrice}
          regularPrice={regularPrice}
          soldCount={soldCount}
          isAddedToCart={isAddedToCart}
          cartQuantity={cartQuantity}
          onAddToCart={handleAddToCart}
          isWishlisted={isWishlisted}
          onWishlistClick={handleWishlistClick}
          onClose={() => setIsQuickViewOpen(false)}
        />
      )}
    </article>
  );
};

export default ProductCard;
