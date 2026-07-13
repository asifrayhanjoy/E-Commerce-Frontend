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
  const availableSizes = sizes.length > 0 ? sizes : ["XS"];
  const shop = product?.Shop || product?.shop;
  const shopName = typeof shop?.name === "string" ? shop.name.trim() : "";
  const shopAddress =
    typeof shop?.address === "string" ? shop.address.trim() : "";
  const shopIdValue = shop?.id || shop?._id;
  const shopRating = Number(shop?.ratings) || 0;
  const shopAvatar = shop?.avatar?.find((image: { url?: string }) => image?.url)
    ?.url;
  const hasShop = Boolean(shopName || shopIdValue);
  const isInStock = Number(product?.stock ?? 0) > 0;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4 py-8"
      onClick={onClose}
    >
      <div
        className="relative grid max-h-[92vh] min-h-[720px] w-full max-w-[1180px] overflow-y-auto rounded-lg bg-white shadow-2xl md:grid-cols-[52%_48%]"
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

              <button
                type="button"
                className="flex h-[48px] shrink-0 cursor-pointer items-center gap-2 rounded-md bg-blue-700 px-5 text-base font-bold text-white shadow-md transition hover:bg-blue-800"
              >
                <MessageCircle size={22} />
                Chat with Seller
              </button>
            </div>
          )}

          <div className="pt-6">
            <h2 className="text-2xl font-bold text-slate-950">
              {productTitle}
            </h2>

            <p className="mt-5 text-xl font-semibold leading-7 text-slate-500">
              {shortDescription}
            </p>

            <div className="mt-7">
              <h3 className="text-xl font-bold text-slate-950">Size:</h3>
              <div className="mt-3 flex flex-wrap gap-3">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    className="rounded-md bg-slate-950 px-5 py-3 text-lg font-semibold text-white"
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

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
                className="relative flex h-[52px] cursor-pointer items-center gap-3 rounded-md bg-orange-600 px-8 text-lg font-bold text-white shadow-md transition hover:bg-orange-700"
                onClick={() => onAddToCart(quantity)}
              >
                <ShoppingBag size={24} />
                {isAddedToCart ? "Added to Cart" : "Add to Cart"}
                {isAddedToCart && (
                  <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1.5 text-xs font-bold leading-none text-white">
                    {cartQuantity > 9 ? "9+" : cartQuantity}
                  </span>
                )}
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
    <div className="relative h-[430px] w-full overflow-hidden rounded-lg bg-white shadow-[0_18px_24px_-18px_rgba(15,23,42,0.45)]">
      {isEvent && (
        <div className="absolute left-4 top-4 z-10 rounded-full bg-red-600 px-3 py-1 text-xs font-bold text-white">
          OFFER
        </div>
      )}

      {product?.stock <= 5 && (
        <div className="absolute right-4 top-4 z-10 rounded-full bg-yellow-400 px-3 py-1.5 text-sm font-bold leading-none text-slate-950">
          Limited Stock
        </div>
      )}

      <div className="flex h-[278px] w-full bg-white pl-5 pr-3 pt-5">
        <Link
          href={PRODUCT_DETAILS_PATH}
          onClick={() => saveSelectedProductDetails(product)}
          className="block h-[248px] min-w-0 flex-1 overflow-hidden bg-white"
        >
          <img
            src={imageUrl}
            alt={product?.title || "Product image"}
            width={300}
            height={300}
            className="h-full w-full object-cover object-top"
          />
        </Link>

        <div className="flex w-11 shrink-0 flex-col items-center gap-3 pt-16">
          <button
            type="button"
            aria-label="Add to wishlist"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            onClick={handleWishlistClick}
          >
            <Heart
              className="cursor-pointer text-red-500 transition hover:scale-110"
              size={24}
              fill={isWishlisted ? "red" : "none"}
            />
          </button>
          <button
            type="button"
            aria-label="Quick view"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
            onClick={() => setIsQuickViewOpen(true)}
          >
            <Eye
              className="cursor-pointer text-slate-900 transition hover:scale-110"
              size={24}
            />
          </button>
          <button
            type="button"
            aria-label={
              isAddedToCart
                ? `Add to cart, ${cartQuantity} in cart`
                : "Add to cart"
            }
            className={`relative flex h-10 w-10 items-center justify-center rounded-full shadow-md transition ${
              isAddedToCart
                ? "bg-orange-50 ring-2 ring-orange-200"
                : "bg-white"
            }`}
            onClick={() => handleAddToCart()}
          >
            <ShoppingBag
              className={`cursor-pointer transition hover:scale-110 ${
                isAddedToCart ? "text-orange-600" : "text-slate-900"
              }`}
              size={24}
            />
            {isAddedToCart && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-5 items-center justify-center rounded-full border-2 border-white bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
                {cartQuantity > 9 ? "9+" : cartQuantity}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="h-[152px] px-5 pb-5 pt-3">
        <Link
          href={PRODUCT_DETAILS_PATH}
          onClick={() => saveSelectedProductDetails(product)}
          className="block"
        >
          <p className="truncate text-sm font-semibold text-blue-700">
            {productName}
          </p>
          <h3 className="mt-2 line-clamp-1 text-lg font-bold text-slate-950">
            {productTitle}
          </h3>
        </Link>

        <div className="mt-2">
          <Ratings rating={product?.ratings} />
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-end gap-2">
            {salePrice !== undefined && salePrice !== null && (
              <span className="whitespace-nowrap text-[22px] font-black leading-none text-slate-950">
                {formatPrice(salePrice)}
              </span>
            )}
            {regularPrice !== undefined && regularPrice !== null && (
              <span className="truncate pb-0.5 text-base font-bold text-slate-400 line-through">
                {formatPrice(regularPrice)}
              </span>
            )}
          </div>
          <span className="shrink-0 whitespace-nowrap pb-0.5 text-base font-bold text-emerald-600">
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
    </div>
  );
};

export default ProductCard;
