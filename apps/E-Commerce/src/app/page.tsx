"use client";

import Hero from "@/components/Hero/page";
import ProductCard from "@/components/ProductCard/page";
import RecommendedProducts from "@/components/RecommendedProducts";
import SectionTitle from "@/components/SectionTitle/page";
import axiosInstance from "@/utils/axiosinstance";
import {
  getImageUrl,
  getShopAvatarImage,
  getShopCoverImage,
} from "@/utils/shopImages";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Eye, MapPin, ShoppingBag, Star } from "lucide-react";
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

type ShopSeller = {
  avatar?: ShopImage[] | ShopImage | string | null;
  avatarUrl?: string;
  image?: ShopImage | string;
  imageUrl?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  profileImage?: string;
  profileImageUrl?: string;
  updatedAt?: string;
  updated_at?: string;
};

type HomeShop = {
  id?: string;
  _id?: string;
  name?: string;
  category?: string;
  image?: ShopImage | string;
  imageUrl?: string;
  profileImage?: string;
  profileImageUrl?: string;
  coverBanner?: ShopImage[] | ShopImage | string | null;
  coverBannerUrl?: string;
  coverPhoto?: string;
  coverPhotoUrl?: string;
  coverImage?: string;
  coverImageUrl?: string;
  banner?: ShopImage | string;
  bannerUrl?: string;
  siteBanner?: string;
  avatar?: ShopImage[];
  avatarUrl?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  address?: string;
  ratings?: number;
  updatedAt?: string;
  updated_at?: string;
  followersCount?: number;
  followerCount?: number;
  followers?: number | unknown[];
  seller?: ShopSeller;
  sellers?: ShopSeller;
  storefront?: {
    avatarImage?: ShopImage | string;
    coverImage?: ShopImage | string;
    cover?: {
      images?: ShopImage[] | ShopImage | string | null;
    };
    updatedAt?: string;
    updated_at?: string;
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

const getExplicitShopCoverImage = (shop: HomeShop) =>
  getImageUrl(
    shop.coverBannerUrl,
    shop.coverPhotoUrl,
    shop.coverPhoto,
    shop.coverImageUrl,
    shop.coverImage,
    shop.bannerUrl,
    shop.banner,
    shop.siteBanner,
    shop.coverBanner,
    shop.storefront?.coverImage,
    shop.storefront?.cover?.images
  );

const getShopImageVersion = (shop: HomeShop) =>
  [
    shop.updatedAt,
    shop.updated_at,
    shop.sellers?.updatedAt,
    shop.sellers?.updated_at,
    shop.seller?.updatedAt,
    shop.seller?.updated_at,
    shop.storefront?.updatedAt,
    shop.storefront?.updated_at,
  ]
    .filter(Boolean)
    .join("-");

const getVersionedImageUrl = (url: string, version: string) => {
  const imageUrl = url.trim();

  if (!imageUrl || !version || /^(data|blob):/i.test(imageUrl)) {
    return imageUrl;
  }

  const hashIndex = imageUrl.indexOf("#");
  const source = hashIndex >= 0 ? imageUrl.slice(0, hashIndex) : imageUrl;
  const hash = hashIndex >= 0 ? imageUrl.slice(hashIndex) : "";
  const separator = source.includes("?") ? "&" : "?";

  return `${source}${separator}v=${encodeURIComponent(version)}${hash}`;
};

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
        className="skeleton-shimmer h-[430px] rounded-3xl"
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
  <section className="mb-14">
    <div className="mb-7 flex items-end justify-between gap-4">
      <SectionTitle title={title} />
      <Link
        href={section === "top-offers" ? "/offers" : "/products"}
        className="group mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
      >
        View all
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>

    {isLoading && <ProductSkeletonGrid />}

    {!isLoading && isError && (
      <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 text-center text-base font-semibold text-slate-500 shadow-sm">
        Products could not be loaded from the backend.
      </div>
    )}

    {!isLoading && !isError && products.length === 0 && (
      <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 text-center text-base font-semibold text-slate-500 shadow-sm">
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
        className="skeleton-shimmer h-[430px] rounded-3xl"
      >
        <div className="skeleton-shimmer mx-5 mt-5 h-[248px] rounded-2xl" />
        <div className="skeleton-shimmer mx-5 mt-5 h-5 rounded" />
        <div className="skeleton-shimmer mx-5 mt-4 h-6 rounded" />
        <div className="skeleton-shimmer mx-5 mt-5 h-5 rounded" />
      </div>
    ))}
  </div>
);

const TopShopCard = ({ shop }: { shop: HomeShop }) => {
  const shopId = getShopId(shop);
  const imageVersion = getShopImageVersion(shop);
  const coverImage = getVersionedImageUrl(
    getExplicitShopCoverImage(shop),
    imageVersion
  );
  const avatarImage = getVersionedImageUrl(
    getShopAvatarImage(shop),
    imageVersion
  );
  const fallbackImage = getVersionedImageUrl(
    getShopCoverImage(shop),
    imageVersion
  );
  const shopImage = coverImage || avatarImage || fallbackImage;
  const address = shop.address?.trim();
  const category = shop.category?.trim();
  const rating = Number(shop.ratings || 0);
  const followers = getShopFollowers(shop);
  const reviewCount = shop._count?.reviews || 0;
  const shopHref = shopId ? `/shops/${encodeURIComponent(shopId)}` : "/shops";

  return (
    <article className="fade-up group relative flex h-[430px] w-full flex-col overflow-hidden rounded-[24px] border border-slate-200/80 bg-white shadow-[0_18px_38px_-28px_rgba(15,23,42,0.48)] transition duration-500 hover:-translate-y-1 hover:border-blue-200 hover:shadow-[0_28px_58px_-30px_rgba(15,23,42,0.38)]">
      {category && (
        <div className="absolute left-4 top-4 z-10 max-w-[72%] truncate rounded-full border border-white/60 bg-white/90 px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-[0.12em] text-blue-700 shadow-sm backdrop-blur">
          {category}
        </div>
      )}

      <div className="relative h-[260px] w-full shrink-0 overflow-hidden bg-[radial-gradient(ellipse_at_50%_45%,#ffffff_0%,#f8f7f3_100%)]">
        <Link
          href={shopHref}
          className="image-zoom block h-full w-full overflow-hidden"
        >
          {shopImage ? (
            <img
              src={shopImage}
              alt={shop.name || "Shop image"}
              className="h-full w-full object-cover object-center transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-slate-950 via-slate-800 to-blue-700 text-5xl font-black text-white">
              {shop.name?.trim()?.charAt(0)?.toUpperCase() || "S"}
            </div>
          )}
        </Link>

        <div className="absolute bottom-4 right-4 flex flex-col gap-2 sm:translate-x-2 sm:opacity-0 sm:transition-all sm:duration-300 sm:group-hover:translate-x-0 sm:group-hover:opacity-100 sm:group-focus-within:translate-x-0 sm:group-focus-within:opacity-100">
          <Link
            href={shopHref}
            aria-label="View shop details"
            className="grid size-10 place-items-center rounded-full border border-slate-700/80 bg-[#111827]/95 text-slate-200 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:border-sky-300/40 hover:bg-[#18243a] hover:text-sky-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300"
          >
            <Eye size={21} />
          </Link>

          <Link
            href={shopHref}
            aria-label="Visit shop"
            className="grid size-10 place-items-center rounded-full border border-slate-700/80 bg-[#111827]/95 text-sky-300 shadow-lg backdrop-blur transition duration-200 hover:scale-110 hover:border-sky-300/40 hover:bg-[#18243a] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-400/50"
          >
            <ShoppingBag size={21} />
          </Link>
        </div>
      </div>

      <div className="flex min-h-0 flex-1 flex-col px-5 pb-5 pt-4">
        <Link href={shopHref} className="block">
          <p className="flex min-w-0 items-center gap-1.5 truncate text-[10px] font-extrabold uppercase tracking-[0.16em] text-blue-700">
            <MapPin size={13} className="shrink-0" />
            <span className="truncate">{address || category || "Top Shop"}</span>
          </p>
          <h3 className="mt-2 line-clamp-1 text-base font-bold tracking-tight text-slate-950 transition-colors duration-200 group-hover:text-blue-700">
            {shop.name}
          </h3>
        </Link>

        <div className="mt-3 flex items-center gap-1">
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
              className="whitespace-nowrap text-xl font-black leading-none tracking-tight text-slate-950"
            >
              {followers}
            </span>
            <span className="truncate pb-0.5 text-xs font-semibold text-slate-400">
              {followers === 1 ? "Follower" : "Followers"}
            </span>
          </div>
          <span className="shrink-0 whitespace-nowrap pb-0.5 text-[10px] font-bold text-slate-400">
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
  <section className="mb-14">
    <div className="mb-7 flex items-end justify-between gap-4">
      <SectionTitle title="Top Shops" />
      <Link
        href="/shops"
        className="group mb-1 inline-flex shrink-0 items-center gap-2 text-sm font-bold text-slate-600 transition hover:text-blue-700"
      >
        View all
        <ArrowRight className="size-4 transition-transform group-hover:translate-x-1" />
      </Link>
    </div>

    {isLoading && <ShopSkeletonGrid />}

    {!isLoading && isError && (
      <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 text-center text-base font-semibold text-slate-500 shadow-sm">
        Shops could not be loaded from the backend.
      </div>
    )}

    {!isLoading && !isError && shops.length === 0 && (
      <div className="flex min-h-[160px] items-center justify-center rounded-3xl border border-slate-100 bg-white px-6 text-center text-base font-semibold text-slate-500 shadow-sm">
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
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: "always",
    refetchOnReconnect: "always",
  });

  return (
    <main className="min-h-screen bg-[#fafafa]">
      <Hero />

      <div className="mx-auto my-14 w-[92%] max-w-[1320px] md:my-16">
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

        <RecommendedProducts />

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
