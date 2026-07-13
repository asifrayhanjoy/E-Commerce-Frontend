"use client";

import Hero from "@/components/Hero/page";
import ProductCard from "@/components/ProductCard/page";
import SectionTitle from "@/components/SectionTitle/page";
import axiosInstance from "@/utils/axiosinstance";
import { useQuery } from "@tanstack/react-query";
import { Eye, Heart, MapPin, ShoppingBag, Star } from "lucide-react";
import Link from "next/link";

type HomeProduct = {
  id?: string;
  _id?: string;
  slug?: string;
  regular_price?: number;
  sale_price?: number;
  price?: number;
  ratings?: number;
};

type ShopImage = {
  url?: string;
};

type HomeShop = {
  id?: string;
  _id?: string;
  name?: string;
  category?: string;
  coverBanner?: ShopImage[] | ShopImage | string | null;
  avatar?: ShopImage[];
  address?: string;
  ratings?: number;
  followersCount?: number;
  followerCount?: number;
  followers?: number | unknown[];
  sellers?: {
    avatar?: ShopImage[];
  };
  products?: {
    images?: ShopImage[];
  }[];
  _count?: {
    products?: number;
    reviews?: number;
    followers?: number;
  };
};

type HomeProductsResponse = {
  suggestedProducts?: HomeProduct[];
  latestProducts?: HomeProduct[];
  topShops?: HomeShop[];
  topOffers?: HomeProduct[];
  products?: HomeProduct[];
  shops?: HomeShop[];
};

type HomeProducts = {
  suggestedProducts: HomeProduct[];
  latestProducts: HomeProduct[];
  topShops: HomeShop[];
  topOffers: HomeProduct[];
};

const normalizeProducts = (value: unknown) =>
  Array.isArray(value) ? (value as HomeProduct[]) : [];

const normalizeShops = (value: unknown) =>
  Array.isArray(value) ? (value as HomeShop[]) : [];

const getDiscountPercent = (product: HomeProduct) => {
  const regularPrice = Number(product.regular_price || 0);
  const salePrice = Number(product.sale_price ?? product.price ?? 0);

  if (!regularPrice || !salePrice || regularPrice <= salePrice) {
    return 0;
  }

  return ((regularPrice - salePrice) / regularPrice) * 100;
};

const getTopOfferFallback = (products: HomeProduct[]) =>
  [...products]
    .filter((product) => getDiscountPercent(product) > 0)
    .sort((first, second) => {
      const discountDifference =
        getDiscountPercent(second) - getDiscountPercent(first);

      if (discountDifference !== 0) {
        return discountDifference;
      }

      return Number(second.ratings || 0) - Number(first.ratings || 0);
    })
    .slice(0, 10);

const getProductKey = (product: HomeProduct, section: string, index: number) =>
  product.id || product._id || product.slug || `${section}-${index}`;

const getShopId = (shop: HomeShop) => shop.id || shop._id || "";

const getShopCoverImage = (shop: HomeShop) => {
  const coverBanner = shop.coverBanner;

  if (typeof coverBanner === "string" && coverBanner.trim()) {
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

const getShopAvatarImage = (shop: HomeShop) =>
  shop.avatar?.find((image) => image?.url)?.url ||
  shop.sellers?.avatar?.find((image) => image?.url)?.url;

const getShopFollowers = (shop: HomeShop) => {
  if (typeof shop.followersCount === "number") {
    return shop.followersCount;
  }

  if (typeof shop.followerCount === "number") {
    return shop.followerCount;
  }

  if (typeof shop.followers === "number") {
    return shop.followers;
  }

  if (Array.isArray(shop.followers)) {
    return shop.followers.length;
  }

  return shop._count?.followers || 0;
};

const formatFollowers = (count: number) =>
  `${count} ${count === 1 ? "Follower" : "Followers"}`;

const hasShopData = (shop: HomeShop) => Boolean(getShopId(shop) && shop.name);

const getHomeProducts = async (): Promise<HomeProducts> => {
  try {
    const response = await axiosInstance.get<HomeProductsResponse>(
      "/api/v1/products/get-home-products?limit=10"
    );

    return {
      suggestedProducts: normalizeProducts(response.data?.suggestedProducts),
      latestProducts: normalizeProducts(response.data?.latestProducts),
      topShops: normalizeShops(response.data?.topShops).filter(hasShopData),
      topOffers: normalizeProducts(response.data?.topOffers),
    };
  } catch (error: any) {
    if (error?.response?.status !== 404) {
      throw error;
    }

    const [suggestedResponse, latestResponse, shopsResponse] =
      await Promise.all([
        axiosInstance.get<HomeProductsResponse>(
          "/api/v1/products/get-all-products?page=1&limit=10"
        ),
        axiosInstance.get<HomeProductsResponse>(
          "/api/v1/products/get-all-products?page=1&limit=10&type=latest"
        ),
        axiosInstance.get<HomeProductsResponse>(
          "/api/v1/products/get-filtered-shops?page=1&limit=10"
        ),
      ]);

    const suggestedProducts = normalizeProducts(
      suggestedResponse.data?.products
    );
    const latestProducts = normalizeProducts(latestResponse.data?.products);

    return {
      suggestedProducts,
      latestProducts,
      topShops: normalizeShops(shopsResponse.data?.shops).filter(hasShopData),
      topOffers: getTopOfferFallback(suggestedProducts),
    };
  }
};

const ProductSkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {Array.from({ length: 10 }).map((_, index) => (
      <div
        key={index}
        className="h-[430px] animate-pulse rounded-lg bg-gray-300"
      />
    ))}
  </div>
);

const ProductSection = ({
  title,
  section,
  products,
  isLoading,
  isError,
}: {
  title: string;
  section: string;
  products: HomeProduct[];
  isLoading: boolean;
  isError: boolean;
}) => (
  <section className="mb-10">
    <div className="mb-8">
      <SectionTitle title={title} />
    </div>

    {isLoading && <ProductSkeletonGrid />}

    {!isLoading && isError && (
      <div className="flex min-h-[160px] items-center justify-center rounded-md bg-white px-6 text-center text-base font-semibold text-slate-500">
        Products could not be loaded from the backend.
      </div>
    )}

    {!isLoading && !isError && products.length === 0 && (
      <div className="flex min-h-[160px] items-center justify-center rounded-md bg-white px-6 text-center text-base font-semibold text-slate-500">
        No products found.
      </div>
    )}

    {!isLoading && !isError && products.length > 0 && (
      <div className="m-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {products.map((product, index) => (
          <ProductCard
            key={getProductKey(product, section, index)}
            product={product}
          />
        ))}
      </div>
    )}
  </section>
);

const ShopSkeletonGrid = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {Array.from({ length: 6 }).map((_, index) => (
      <div
        key={index}
        className="h-[430px] animate-pulse rounded-lg bg-gray-300"
      >
        <div className="mx-5 mt-5 h-[248px] rounded bg-slate-100" />
        <div className="mx-5 mt-5 h-5 rounded bg-slate-100" />
        <div className="mx-5 mt-4 h-6 rounded bg-slate-100" />
        <div className="mx-5 mt-5 h-5 rounded bg-slate-100" />
      </div>
    ))}
  </div>
);

const TopShopCard = ({ shop }: { shop: HomeShop }) => {
  const shopId = getShopId(shop);
  const coverImage = getShopCoverImage(shop);
  const avatarImage = getShopAvatarImage(shop);
  const shopImage = coverImage || avatarImage;
  const address = shop.address?.trim();
  const category = shop.category?.trim();
  const rating = Number(shop.ratings || 0);
  const followers = getShopFollowers(shop);
  const reviewCount = shop._count?.reviews || 0;
  const shopHref = shopId ? `/shops/${encodeURIComponent(shopId)}` : "/shops";

  return (
    <article className="relative h-[430px] w-full overflow-hidden rounded-lg bg-white shadow-[0_18px_24px_-18px_rgba(15,23,42,0.45)]">
      {category && (
        <div className="absolute right-4 top-4 z-10 max-w-[72%] truncate rounded-full bg-yellow-400 px-3 py-1.5 text-sm font-bold leading-none text-slate-950">
          {category}
        </div>
      )}

      <div className="flex h-[278px] w-full bg-white pl-5 pr-3 pt-5">
        <Link
          href={shopHref}
          className="block h-[248px] min-w-0 flex-1 overflow-hidden bg-white"
        >
          {shopImage ? (
            <img
              src={shopImage}
              alt={shop.name || "Shop image"}
              className="h-full w-full object-cover object-top"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-slate-900 text-5xl font-black text-white">
              {shop.name?.trim()?.charAt(0)?.toUpperCase() || "S"}
            </div>
          )}
        </Link>

        <div className="flex w-11 shrink-0 flex-col items-center gap-3 pt-16">
          <button
            type="button"
            aria-label="Follow shop"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
          >
            <Heart
              className="cursor-pointer text-red-500 transition hover:scale-110"
              size={24}
              fill="red"
            />
          </button>

          <Link
            href={shopHref}
            aria-label="View shop"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
          >
            <Eye
              className="cursor-pointer text-slate-900 transition hover:scale-110"
              size={24}
            />
          </Link>

          <Link
            href={shopHref}
            aria-label="Visit shop"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-white shadow-md"
          >
            <ShoppingBag
              className="cursor-pointer text-orange-600 transition hover:scale-110"
              size={24}
            />
          </Link>
        </div>
      </div>

      <div className="h-[152px] px-5 pb-5 pt-3">
        <Link href={shopHref} className="block">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-sm font-semibold text-blue-700">
            <MapPin size={14} className="shrink-0" />
            <span className="truncate">{address || category || "Top Shop"}</span>
          </p>
          <h3 className="mt-2 line-clamp-1 text-lg font-bold text-slate-950">
            {shop.name}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-1">
          {Array.from({ length: 5 }).map((_, index) => (
            <Star
              key={index}
              size={16}
              className={
                index < Math.round(rating)
                  ? "fill-yellow-400 text-yellow-400"
                  : "fill-gray-200 text-gray-200"
              }
            />
          ))}
        </div>

        <div className="mt-4 flex items-end justify-between gap-3">
          <div className="flex min-w-0 items-end gap-2">
            <span
              aria-label={formatFollowers(followers)}
              className="whitespace-nowrap text-[22px] font-black leading-none text-slate-950"
            >
              {followers}
            </span>
            <span className="truncate pb-0.5 text-base font-bold text-slate-400">
              {followers === 1 ? "Follower" : "Followers"}
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pb-0.5 text-base font-bold text-emerald-600">
            {reviewCount} reviews
          </span>
        </div>
      </div>
    </article>
  );
};

const TopShopsSection = ({
  shops,
  isLoading,
  isError,
}: {
  shops: HomeShop[];
  isLoading: boolean;
  isError: boolean;
}) => (
  <section className="mb-10">
    <div className="mb-8">
      <SectionTitle title="Top Shops" />
    </div>

    {isLoading && <ShopSkeletonGrid />}

    {!isLoading && isError && (
      <div className="flex min-h-[160px] items-center justify-center rounded-md bg-white px-6 text-center text-base font-semibold text-slate-500">
        Shops could not be loaded from the backend.
      </div>
    )}

    {!isLoading && !isError && shops.length === 0 && (
      <div className="flex min-h-[160px] items-center justify-center rounded-md bg-white px-6 text-center text-base font-semibold text-slate-500">
        No shops found.
      </div>
    )}

    {!isLoading && !isError && shops.length > 0 && (
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
        {shops.map((shop, index) => (
          <TopShopCard
            key={getShopId(shop) || `top-shop-${index}`}
            shop={shop}
          />
        ))}
      </div>
    )}
  </section>
);

export default function Index() {
  const {
    data = {
      suggestedProducts: [],
      latestProducts: [],
      topShops: [],
      topOffers: [],
    },
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["home-products"],
    queryFn: getHomeProducts,
    staleTime: 1000 * 60 * 2,
  });

  return (
    <main className="min-h-screen bg-[#f7f7f7]">
      <Hero />

      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        <ProductSection
          title="Suggested Products"
          section="suggested"
          products={data.suggestedProducts}
          isLoading={isLoading}
          isError={isError}
        />

        <ProductSection
          title="Latest Products"
          section="latest"
          products={data.latestProducts}
          isLoading={isLoading}
          isError={isError}
        />

        <TopShopsSection
          shops={data.topShops}
          isLoading={isLoading}
          isError={isError}
        />

        <ProductSection
          title="Top Offers"
          section="top-offers"
          products={data.topOffers}
          isLoading={isLoading}
          isError={isError}
        />
      </div>
    </main>
  );
}
