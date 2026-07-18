"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ExternalLink,
  Globe2,
  MapPin,
  PackageSearch,
  RefreshCw,
  Star,
  Store,
} from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";
import ProductCard from "@/components/ProductCard/page";
import axiosInstance from "@/utils/axiosinstance";
import {
  getShopAvatarImage,
  getShopCoverImage,
} from "@/utils/shopImages";

type ShopImage = {
  url?: string;
};

type ProductShop = {
  id?: string;
  _id?: string;
  name?: string;
  address?: string;
  ratings?: number;
  avatar?: ShopImage[];
};

type ShopProduct = {
  id?: string;
  _id?: string;
  title?: string;
  brand?: string;
  category?: string;
  short_description?: string;
  detailed_description?: string;
  sale_price?: number;
  regular_price?: number;
  price?: number;
  ratings?: number;
  stock?: number;
  images?: ShopImage[];
  sold?: number;
  totalSold?: number;
  sold_out?: number;
  Shop?: ProductShop;
  shop?: ProductShop;
};

type Seller = {
  country?: string;
  avatar?: ShopImage[];
};

type Shop = {
  id?: string;
  _id?: string;
  name?: string;
  bio?: string;
  category?: string;
  coverBanner?: ShopImage[] | ShopImage | string | null;
  coverBannerUrl?: string;
  coverPhoto?: string;
  coverPhotoUrl?: string;
  avatar?: ShopImage[];
  avatarUrl?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  address?: string;
  opening_hours?: string;
  website?: string;
  ratings?: number;
  sellers?: Seller;
  products?: ShopProduct[];
};

type ShopsResponse = {
  shops?: Shop[];
};

const normalizeId = (value?: string) => decodeURIComponent(value || "").trim();

const getShopId = (shop?: Shop) => shop?.id || shop?._id || "";

const formatRating = (value?: number) => {
  const rating = Number(value || 0);

  return rating > 0 ? rating.toFixed(1) : "N/A";
};

const ShopDetailsSkeleton = () => (
  <main className="min-h-screen bg-[#f7f6f6] text-slate-950">
    <div className="mx-auto w-[90%] max-w-[1500px] py-9 lg:w-[80%]">
      <div className="h-7 w-40 animate-pulse rounded bg-slate-200" />
      <div className="mt-8 overflow-hidden rounded bg-white shadow-sm">
        <div className="h-[320px] animate-pulse bg-slate-200" />
        <div className="px-7 pb-9 md:px-10">
          <div className="-mt-16 h-32 w-32 animate-pulse rounded-full border-4 border-white bg-slate-100" />
          <div className="mt-7 h-10 w-72 animate-pulse rounded bg-slate-100" />
          <div className="mt-5 h-5 w-full max-w-[620px] animate-pulse rounded bg-slate-100" />
        </div>
      </div>
      <div className="mt-9 grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-4">
        {Array.from({ length: 4 }).map((_, index) => (
          <div
            key={index}
            className="h-[540px] animate-pulse rounded-lg bg-white shadow-sm"
          />
        ))}
      </div>
    </div>
  </main>
);

export default function ShopDetails({ shopId }: { shopId: string }) {
  const selectedShopId = normalizeId(shopId);
  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["shop-details", selectedShopId],
    queryFn: async () => {
      const response = await axiosInstance.get<ShopsResponse>(
        "/api/v1/products/get-filtered-shops?page=1&limit=100"
      );

      return response.data;
    },
    enabled: Boolean(selectedShopId),
    staleTime: 1000 * 60 * 2,
  });

  const shops = Array.isArray(data?.shops) ? data.shops : [];
  const shop = useMemo(
    () => shops.find((item) => getShopId(item) === selectedShopId),
    [selectedShopId, shops]
  );
  const coverImage = getShopCoverImage(shop);
  const avatarImage = getShopAvatarImage(shop);
  const address = shop?.address?.trim();
  const category = shop?.category?.trim();
  const productCount = shop?.products?.length || 0;
  const shopProducts = useMemo(
    () =>
      (shop?.products || []).map((product) => ({
        ...product,
        Shop: {
          ...(product.Shop || product.shop || {}),
          id: getShopId(shop),
          _id: getShopId(shop),
          name: shop?.name,
          address: shop?.address,
          ratings: shop?.ratings,
          avatar: shop?.avatar,
        },
      })),
    [shop]
  );

  if (isLoading) {
    return <ShopDetailsSkeleton />;
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[#f7f6f6] text-slate-950">
        <div className="mx-auto flex min-h-[560px] w-[90%] max-w-[900px] items-center justify-center py-12 lg:w-[80%]">
          <div className="w-full bg-white px-6 py-12 text-center shadow-sm">
            <Store className="mx-auto text-blue-700" size={46} />
            <h1 className="mt-5 text-3xl font-black text-slate-950">
              Shop could not load
            </h1>
            <p className="mx-auto mt-3 max-w-[480px] text-base font-semibold leading-7 text-slate-500">
              Shop information is unavailable right now. Please try loading
              this shop again.
            </p>
            <div className="mt-7 flex flex-wrap items-center justify-center gap-3">
              <button
                type="button"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
                onClick={() => refetch()}
              >
                <RefreshCw size={17} />
                Try Again
              </button>
              <Link
                href="/shops"
                className="inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-slate-800"
              >
                <ArrowLeft size={17} />
                All Shops
              </Link>
            </div>
          </div>
        </div>
      </main>
    );
  }

  if (!shop) {
    return (
      <main className="min-h-screen bg-[#f7f6f6] text-slate-950">
        <div className="mx-auto flex min-h-[560px] w-[90%] max-w-[900px] items-center justify-center py-12 lg:w-[80%]">
          <div className="w-full bg-white px-6 py-12 text-center shadow-sm">
            <PackageSearch className="mx-auto text-blue-700" size={50} />
            <h1 className="mt-5 text-3xl font-black text-slate-950">
              Shop not found
            </h1>
            <p className="mx-auto mt-3 max-w-[480px] text-base font-semibold leading-7 text-slate-500">
              This shop may have been removed or is not available right now.
            </p>
            <Link
              href="/shops"
              className="mt-7 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
            >
              <ArrowLeft size={17} />
              Back to Shops
            </Link>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#f7f6f6] text-slate-950">
      <div className="mx-auto w-[90%] max-w-[1500px] py-9 lg:w-[80%]">
        <div className="mb-8 text-lg font-semibold text-slate-600">
          <Link href="/" className="transition hover:text-blue-700">
            Home
          </Link>
          <span className="px-2">.</span>
          <Link href="/shops" className="transition hover:text-blue-700">
            All Shops
          </Link>
          <span className="px-2">.</span>
          {shop.name && <span className="text-slate-800">{shop.name}</span>}
        </div>

        <section className="overflow-hidden rounded bg-white shadow-sm">
          <div className="h-[260px] bg-slate-100 md:h-[340px]">
            {coverImage && (
              <img
                src={coverImage}
                alt={shop.name || "Shop cover"}
                className="h-full w-full object-cover"
              />
            )}
          </div>

          <div className="px-6 pb-8 md:px-10">
            <div className="-mt-16 flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
              <div className="flex min-w-0 flex-col gap-5 md:flex-row md:items-end">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={shop.name || "Shop avatar"}
                    className="h-32 w-32 rounded-full border-4 border-white bg-white object-cover shadow-sm"
                  />
                ) : (
                  <div className="h-32 w-32 rounded-full border-4 border-white bg-white shadow-sm" />
                )}
                <div className="min-w-0 pb-1">
                  {shop.name && (
                    <h1 className="max-w-full text-4xl font-black leading-tight text-slate-950 md:text-5xl">
                      {shop.name}
                    </h1>
                  )}
                  <div className="mt-4 flex flex-wrap gap-3 text-sm font-bold text-slate-600">
                    {category && (
                      <span className="rounded-md bg-blue-50 px-3 py-2 text-blue-700">
                        {category}
                      </span>
                    )}
                    <span className="rounded-md bg-slate-100 px-3 py-2">
                      {productCount} products
                    </span>
                    <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-3 py-2">
                      <Star
                        size={16}
                        fill="currentColor"
                        className="text-yellow-400"
                      />
                      {formatRating(shop.ratings)}
                    </span>
                  </div>
                </div>
              </div>

              {shop.website && (
                <a
                  href={shop.website}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex h-11 shrink-0 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                >
                  <Globe2 size={17} />
                  Website
                  <ExternalLink size={15} />
                </a>
              )}
            </div>

            <div className="mt-7 grid gap-5 border-t border-slate-200 pt-7 lg:grid-cols-[minmax(0,1fr)_320px]">
              <p className="max-w-[820px] text-lg font-semibold leading-8 text-slate-600">
                {shop.bio ||
                  "Browse the latest products, offers, and store updates from this shop."}
              </p>
              <div className="space-y-3 text-base font-semibold text-slate-600">
                {address && (
                  <p className="flex items-start gap-3">
                    <MapPin
                      className="mt-0.5 shrink-0 text-slate-400"
                      size={20}
                    />
                    <span>{address}</span>
                  </p>
                )}
                {shop.opening_hours && (
                  <p className="flex items-start gap-3">
                    <Store className="mt-0.5 shrink-0 text-slate-400" size={20} />
                    <span>{shop.opening_hours}</span>
                  </p>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mt-10">
          <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-slate-950">
                Shop Products
              </h2>
              <p className="mt-2 text-base font-semibold text-slate-500">
                Browse available items from this shop.
              </p>
            </div>
            <Link
              href="/shops"
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:text-blue-700"
            >
              <ArrowLeft size={17} />
              All Shops
            </Link>
          </div>

          {shopProducts.length > 0 ? (
            <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
              {shopProducts.map((product, index) => (
                <ProductCard
                  key={product.id || product._id || `${product.title}-${index}`}
                  product={product}
                />
              ))}
            </div>
          ) : (
            <div className="flex min-h-[300px] items-center justify-center bg-white px-6 text-center shadow-sm">
              <div>
                <PackageSearch className="mx-auto text-blue-700" size={46} />
                <h3 className="mt-4 text-2xl font-black text-slate-950">
                  No products found
                </h3>
                <p className="mx-auto mt-2 max-w-[420px] text-sm font-semibold leading-6 text-slate-500">
                  This shop does not have products available yet.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  );
}
