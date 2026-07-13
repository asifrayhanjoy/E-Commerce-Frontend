"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ExternalLink,
  MapPin,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import axiosInstance from "@/utils/axiosinstance";

type ShopImage = {
  url?: string;
};

type ShopProduct = {
  id?: string;
  images?: ShopImage[];
  sale_price?: number;
  regular_price?: number;
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
  avatar?: ShopImage[];
  address?: string;
  opening_hours?: string;
  website?: string;
  ratings?: number;
  followers?: number | unknown[];
  followerCount?: number;
  followersCount?: number;
  totalFollowers?: number;
  _count?: {
    followers?: number;
  };
  sellers?: Seller;
  products?: ShopProduct[];
};

type ShopsResponse = {
  shops?: Shop[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
};

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

const getCoverImage = (shop: Shop) => {
  const coverBanner = shop.coverBanner;

  if (typeof coverBanner === "string" && coverBanner) {
    return coverBanner;
  }

  if (Array.isArray(coverBanner)) {
    return coverBanner.find((image) => image?.url)?.url;
  }

  if (coverBanner && typeof coverBanner === "object") {
    return coverBanner.url;
  }

  return shop.products?.find((product) => product.images?.[0]?.url)?.images?.[0]
    ?.url;
};

const getAvatarImage = (shop: Shop) =>
  shop.avatar?.find((image) => image?.url)?.url ||
  shop.sellers?.avatar?.find((image) => image?.url)?.url;

const getShopId = (shop: Shop) => shop.id || shop._id || "";

const getFollowerCount = (shop: Shop) => {
  if (Array.isArray(shop.followers)) {
    return shop.followers.length;
  }

  const value =
    typeof shop.followers === "number"
      ? shop.followers
      : shop.followerCount ??
        shop.followersCount ??
        shop.totalFollowers ??
        shop._count?.followers;

  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
};

const getShopText = (shop: Shop) =>
  [
    shop.name,
    shop.bio,
    shop.category,
    shop.address,
    shop.opening_hours,
    shop.website,
    shop.sellers?.country,
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();

const truncateText = (value: string, maxLength: number) =>
  value.length > maxLength ? `${value.slice(0, maxLength - 3)}...` : value;

const hasBackendShopData = (shop: Shop) =>
  Boolean(getShopId(shop) && shop.name?.trim());

const ShopGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
    {Array.from({ length: 6 }).map((_, index) => (
      <div key={index} className="overflow-hidden rounded bg-white shadow-sm">
        <div className="h-[150px] animate-pulse bg-slate-100" />
        <div className="flex flex-col items-center p-6">
          <div className="-mt-14 h-20 w-20 animate-pulse rounded-full border-4 border-white bg-slate-100" />
          <div className="mt-5 h-5 w-36 animate-pulse rounded bg-slate-100" />
          <div className="mt-3 h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="mt-7 h-4 w-full animate-pulse rounded bg-slate-100" />
        </div>
      </div>
    ))}
  </div>
);

const FilterHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="border-b border-slate-200 pb-3 text-[30px] font-bold leading-tight text-slate-950">
    {children}
  </h2>
);

const ShopCard = ({ shop }: { shop: Shop }) => {
  const shopId = getShopId(shop);
  const coverImage = getCoverImage(shop);
  const avatarImage = getAvatarImage(shop);
  const followerCount = getFollowerCount(shop);
  const address = shop.address?.trim();
  const category = shop.category?.trim();
  const rating = Number(shop.ratings || 0);
  const ratingLabel = rating > 0 ? rating.toFixed(1) : "N/A";

  return (
    <article className="overflow-hidden rounded-[3px] bg-white text-center shadow-[0_16px_34px_-28px_rgba(15,23,42,0.65)] transition hover:-translate-y-0.5 hover:shadow-[0_22px_42px_-28px_rgba(15,23,42,0.75)]">
      <div className="relative h-[142px] bg-slate-100">
        {coverImage && (
          <img
            src={coverImage}
            alt={shop.name || "Shop cover"}
            className="h-full w-full object-cover"
          />
        )}
      </div>

      <div className="flex min-h-[268px] flex-col items-center px-7 pb-7">
        {avatarImage ? (
          <img
            src={avatarImage}
            alt={shop.name || "Shop avatar"}
            className="-mt-12 h-24 w-24 rounded-full border-4 border-white bg-white object-cover shadow-[0_10px_28px_-16px_rgba(15,23,42,0.65)]"
          />
        ) : (
          <div className="-mt-12 flex h-24 w-24 items-center justify-center rounded-full border-4 border-white bg-blue-50 text-3xl font-black text-blue-700 shadow-[0_10px_28px_-16px_rgba(15,23,42,0.65)]">
            {shop.name?.trim()?.charAt(0)?.toUpperCase() || "S"}
          </div>
        )}

        {shop.name && (
          <h3 className="mt-5 max-w-full truncate text-[22px] font-bold leading-tight text-slate-950">
            {shop.name}
          </h3>
        )}
        {followerCount !== undefined && (
          <p className="mt-2 text-base font-semibold text-slate-500">
            {followerCount} Followers
          </p>
        )}

        <div
          className={`mt-6 grid w-full items-center gap-4 text-[15px] font-bold text-slate-500 ${
            address ? "grid-cols-[minmax(0,1fr)_auto]" : "grid-cols-1"
          }`}
        >
          {address && (
            <p className="flex min-w-0 items-center justify-center gap-2">
              <MapPin size={19} className="shrink-0 text-slate-400" />
              <span className="truncate">
                {truncateText(address, 18)}
              </span>
            </p>
          )}
          <p className="flex items-center justify-center gap-2">
            <Star size={19} fill="currentColor" className="text-yellow-400" />
            <span>{ratingLabel}</span>
          </p>
        </div>

        {category && (
          <span className="mt-5 rounded-md bg-blue-50 px-4 py-2 text-base font-bold text-blue-700">
            {category}
          </span>
        )}

        <Link
          href={shopId ? `/shops/${encodeURIComponent(shopId)}` : "/shops"}
          className="mt-8 inline-flex items-center gap-2 text-lg font-bold text-slate-700 underline underline-offset-4 transition hover:text-blue-700"
        >
          Visit Shop
          <ExternalLink size={19} strokeWidth={2.5} aria-hidden="true" />
        </Link>
      </div>
    </article>
  );
};

export default function ShopCatalog({
  initialSearch = "",
}: {
  initialSearch?: string;
}) {
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const searchQuery = initialSearch.trim().toLowerCase();

  const {
    data,
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["shop-catalog-all-shops"],
    queryFn: async () => {
      const response = await axiosInstance.get<ShopsResponse>(
        "/api/v1/products/get-filtered-shops?page=1&limit=100"
      );

      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const shops = Array.isArray(data?.shops)
    ? data.shops.filter(hasBackendShopData)
    : [];
  const categoryOptions = useMemo(
    () =>
      Array.from(
        new Set(
          shops
            .map((shop) => shop.category?.trim())
            .filter((category): category is string => Boolean(category))
        )
      ).sort((first, second) => first.localeCompare(second)),
    [shops]
  );
  const filteredShops = useMemo(
    () =>
      shops.filter((shop) => {
        const matchesSearch =
          !searchQuery || getShopText(shop).includes(searchQuery);
        const matchesCategory =
          !selectedCategories.length ||
          selectedCategories.some(
            (category) =>
              shop.category?.toLowerCase() === category.toLowerCase()
          );

        return matchesSearch && matchesCategory;
      }),
    [searchQuery, selectedCategories, shops]
  );
  const hasActiveFilters =
    selectedCategories.length > 0 || Boolean(searchQuery);

  const resetFilters = () => {
    setSelectedCategories([]);
  };

  return (
    <main className="min-h-screen bg-[#f7f6f6] text-slate-950">
      <div className="mx-auto w-[90%] max-w-[1500px] py-9 lg:w-[80%]">
        <h1 className="text-5xl font-black leading-tight text-slate-950 md:text-6xl">
          All Shops
        </h1>
        <div className="mb-14 mt-5 text-lg font-semibold text-slate-600">
          <Link href="/" className="transition hover:text-blue-700">
            Home
          </Link>
          <span className="px-2">.</span>
          <span className="text-slate-800">All Shops</span>
          {initialSearch && (
            <>
              <span className="px-2">.</span>
              <span className="text-blue-700">Search: {initialSearch}</span>
            </>
          )}
        </div>

        <div className="grid gap-8 lg:grid-cols-[300px_minmax(0,1fr)]">
          <aside className="h-fit bg-white p-6 shadow-sm">
            <div>
              <FilterHeading>Categories</FilterHeading>
              <div className="mt-5 space-y-3">
                {isLoading
                  ? Array.from({ length: 12 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-6 animate-pulse rounded bg-slate-100"
                      />
                    ))
                  : categoryOptions.map((category) => (
                      <label
                        key={category}
                        className="flex cursor-pointer items-center gap-3 text-lg font-semibold lowercase text-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => {
                            setSelectedCategories((current) =>
                              toggleValue(current, category)
                            );
                          }}
                          className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
                {!isLoading && categoryOptions.length === 0 && (
                  <p className="text-sm font-semibold text-slate-500">
                    No categories found.
                  </p>
                )}
              </div>
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                className="mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-md bg-slate-950 text-sm font-bold text-white transition hover:bg-blue-700"
                onClick={resetFilters}
              >
                <X size={17} />
                Clear Filters
              </button>
            )}
          </aside>

          <section className="min-w-0">
            {isLoading && <ShopGridSkeleton />}

            {!isLoading && isError && (
              <div className="flex min-h-[360px] items-center justify-center bg-white px-6 text-center shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Shops could not load
                  </h2>
                  <p className="mx-auto mt-2 max-w-[420px] text-sm font-semibold leading-6 text-slate-500">
                    Check that the backend gateway is running on port 8080, then
                    refresh this page.
                  </p>
                  <button
                    type="button"
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-blue-700 px-5 text-sm font-bold text-white transition hover:bg-blue-800"
                    onClick={() => refetch()}
                  >
                    <RefreshCw size={17} />
                    Try Again
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !isError && filteredShops.length === 0 && (
              <div className="flex min-h-[360px] items-center justify-center bg-white px-6 text-center shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {shops.length === 0 ? "No shops available" : "No shops found"}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[420px] text-sm font-semibold leading-6 text-slate-500">
                    {shops.length === 0
                      ? "No shop data is available from the backend right now."
                      : "Clear the filters or try another shop search."}
                  </p>
                  {shops.length > 0 && (
                    <button
                      type="button"
                      className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                      onClick={resetFilters}
                    >
                      <X size={17} />
                      Clear Filters
                    </button>
                  )}
                </div>
              </div>
            )}

            {!isLoading && !isError && filteredShops.length > 0 && (
              <div className="grid grid-cols-1 gap-8 md:grid-cols-2 xl:grid-cols-3">
                {filteredShops.map((shop, index) => (
                  <ShopCard
                    key={shop.id || shop._id || `${shop.name}-${index}`}
                    shop={shop}
                  />
                ))}
              </div>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
