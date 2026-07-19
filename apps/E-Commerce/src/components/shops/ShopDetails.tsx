"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  Calendar,
  Clock,
  Globe2,
  Heart,
  MapPin,
  PackageSearch,
  RefreshCw,
  Star,
  Store,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import ProductCard from "@/components/ProductCard/page";
import {
  PRODUCT_DETAILS_PATH,
  saveSelectedProductDetails,
} from "@/utils/productDetailsRoute";
import axiosInstance from "@/utils/axiosinstance";
import {
  getImageUrl,
  getShopAvatarImage,
  getShopCoverImage,
  getShopGalleryImages,
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
  productId?: string;
  slug?: string;
  title?: string;
  name?: string;
  brand?: string;
  category?: string;
  short_description?: string;
  detailed_description?: string;
  description?: string;
  sale_price?: number | string;
  regular_price?: number | string;
  price?: number | string;
  ratings?: number;
  stock?: number;
  images?: ShopImage[];
  image?: ShopImage | string;
  thumbnail?: ShopImage | string;
  sold?: number;
  totalSold?: number;
  sold_out?: number;
  Shop?: ProductShop;
  shop?: ProductShop;
};

type Seller = {
  name?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  country?: string;
  avatar?: ShopImage[];
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
};

type SocialLink = {
  label?: string;
  name?: string;
  platform?: string;
  url?: string;
  href?: string;
  link?: string;
};

type Shop = {
  id?: string;
  _id?: string;
  name?: string;
  bio?: string;
  category?: string;
  email?: string;
  phone?: string;
  phone_number?: string;
  profileImage?: string;
  profileImageUrl?: string;
  coverImage?: string;
  coverImageUrl?: string;
  coverBanner?: ShopImage[] | ShopImage | string | null;
  coverBannerUrl?: string;
  coverPhoto?: string;
  coverPhotoUrl?: string;
  galleryImages?: (ShopImage | string)[];
  avatar?: ShopImage[];
  avatarUrl?: string;
  profilePhoto?: string;
  profilePhotoUrl?: string;
  address?: string;
  opening_hours?: string;
  website?: string;
  ratings?: number;
  isFollowing?: boolean;
  isFollowed?: boolean;
  followed?: boolean;
  followers?: number | unknown[];
  followerCount?: number;
  followersCount?: number;
  totalFollowers?: number;
  createdAt?: string;
  created_at?: string;
  updatedAt?: string;
  updated_at?: string;
  joinedAt?: string;
  socialLinks?: SocialLink[];
  socials?: SocialLink[];
  youtube?: string;
  youtubeUrl?: string;
  twitter?: string;
  twitterUrl?: string;
  x?: string;
  facebook?: string;
  facebookUrl?: string;
  instagram?: string;
  instagramUrl?: string;
  _count?: {
    followers?: number;
  };
  sellers?: Seller;
  products?: ShopProduct[];
};

type ShopsResponse = {
  shops?: Shop[];
};

type ShopTab = "Products" | "Offers" | "Reviews";

const normalizeId = (value?: string) => decodeURIComponent(value || "").trim();

const getShopId = (shop?: Shop) => shop?.id || shop?._id || "";

const formatRating = (value?: number) => {
  const rating = Number(value || 0);

  return rating > 0 ? rating.toFixed(1) : "N/A";
};

const formatPrice = (value?: number | string) => {
  if (value === undefined || value === null || value === "") {
    return "";
  }

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
    .replace(/\s+/g, " ")
    .trim();
};

const uniqueValues = (values: string[]) => {
  const seen = new Set<string>();

  return values.filter((value) => {
    const normalizedValue = value.trim();

    if (!normalizedValue || seen.has(normalizedValue)) {
      return false;
    }

    seen.add(normalizedValue);
    return true;
  });
};

const getFollowerCount = (shop?: Shop) => {
  if (!shop) {
    return 0;
  }

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

  return typeof value === "number" && Number.isFinite(value) ? value : 0;
};

const isShopFollowed = (shop?: Shop) =>
  Boolean(shop?.isFollowing ?? shop?.isFollowed ?? shop?.followed);

const getFollowerCountFromResponse = (data: any) => {
  const shop =
    data?.shop ||
    data?.data?.shop ||
    data?.data ||
    data?.updatedShop ||
    data?.followedShop;

  if (!shop) {
    return undefined;
  }

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

const requestShopFollowChange = async (
  shopId: string,
  shouldFollow: boolean
) => {
  const requestConfig = {
    headers: {
      "x-auth-role": "user",
    },
  };

  if (shouldFollow) {
    return axiosInstance.put(
      `/api/v1/products/follow-shop/${shopId}`,
      {},
      requestConfig
    );
  }

  return axiosInstance.delete(`/api/v1/products/follow-shop/${shopId}`, requestConfig);
};

const getShopInitial = (name?: string) =>
  name?.trim()?.charAt(0)?.toUpperCase() || "S";

const getDisplayDate = (value?: string) => {
  const trimmedValue = value?.trim();

  if (!trimmedValue) {
    return "";
  }

  const parsedDate = new Date(trimmedValue);

  if (Number.isNaN(parsedDate.getTime())) {
    return trimmedValue;
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(parsedDate);
};

const getJoinedDate = (shop?: Shop) =>
  getDisplayDate(
    shop?.joinedAt ||
      shop?.createdAt ||
      shop?.created_at ||
      shop?.sellers?.createdAt ||
      shop?.sellers?.created_at
  );

const getFirstText = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value !== "string") {
      continue;
    }

    const trimmedValue = value.trim();

    if (trimmedValue) {
      return trimmedValue;
    }
  }

  return "";
};

const displayText = (value?: string) => value || "N/A";

const getProductImage = (product?: ShopProduct) =>
  getImageUrl(product?.images, product?.image, product?.thumbnail);

const getProductPrice = (product?: ShopProduct) =>
  product?.sale_price ?? product?.price ?? product?.regular_price;

const getProductDescription = (product?: ShopProduct) =>
  stripHtml(
    product?.short_description ||
      product?.description ||
      product?.detailed_description
  );

const getHeroTags = (shop: Shop | undefined, productCount: number) => {
  const tags = uniqueValues(
    [
      shop?.category || "",
      shop?.sellers?.country || "",
      productCount > 0 ? `${productCount} Products` : "",
      "Featured",
    ].filter(Boolean)
  );

  return tags.length > 0 ? tags.slice(0, 3) : ["Shop", "Products", "Deals"];
};

const getSocialLinks = (shop?: Shop) => {
  const directLinks = [...(shop?.socialLinks || []), ...(shop?.socials || [])];
  const mappedLinks: SocialLink[] = [
    { label: "YT", url: shop?.youtubeUrl || shop?.youtube },
    { label: "X", url: shop?.twitterUrl || shop?.twitter || shop?.x },
    { label: "FB", url: shop?.facebookUrl || shop?.facebook },
    { label: "IG", url: shop?.instagramUrl || shop?.instagram },
  ];

  return [...directLinks, ...mappedLinks]
    .map((link) => ({
      label:
        link.label ||
        link.platform?.slice(0, 2).toUpperCase() ||
        link.name?.slice(0, 2).toUpperCase() ||
        "Link",
      url: link.url || link.href || link.link || "",
    }))
    .filter((link) => link.url);
};

const EmptyTabPanel = ({ title }: { title: string }) => (
  <div className="mt-5 flex min-h-[230px] items-center justify-center rounded-md bg-[#e5e7ef] px-6 text-center shadow-[0_12px_32px_-30px_rgba(15,23,42,0.7)]">
    <div>
      <PackageSearch className="mx-auto text-blue-700" size={42} />
      <h3 className="mt-4 text-xl font-black text-slate-950">{title}</h3>
    </div>
  </div>
);

const ShopDetailsSkeleton = () => (
  <main className="min-h-screen bg-[#f4f5f7] text-slate-950">
    <section className="bg-[#06020d]">
      <div className="mx-auto grid max-w-[1500px] gap-7 px-4 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] xl:px-0">
        <div className="space-y-7">
          <div className="h-[280px] animate-pulse bg-[#171326] md:h-[360px]" />
          <div className="grid grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-[96px] animate-pulse bg-[#171326] sm:h-[124px]"
              />
            ))}
          </div>
        </div>
        <div className="pt-11">
          <div className="h-5 w-full max-w-[720px] animate-pulse rounded bg-[#171326]" />
          <div className="mt-4 h-5 w-4/5 animate-pulse rounded bg-[#171326]" />
          <div className="mt-9 h-7 w-20 animate-pulse rounded bg-[#171326]" />
          <div className="mt-4 flex gap-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <div
                key={index}
                className="h-10 w-20 animate-pulse rounded-full bg-[#171326]"
              />
            ))}
          </div>
          <div className="mt-9 h-12 w-32 animate-pulse rounded bg-[#171326]" />
        </div>
      </div>
    </section>

    <section className="relative -mt-20">
      <div className="mx-auto grid max-w-[1110px] gap-7 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_410px] xl:px-0">
        <div className="h-[230px] animate-pulse rounded-md bg-[#e5e7ef]" />
        <div className="h-[230px] animate-pulse rounded-md bg-[#e5e7ef]" />
      </div>
    </section>
  </main>
);

export default function ShopDetails({ shopId }: { shopId: string }) {
  const selectedShopId = normalizeId(shopId);
  const [activeHeroImageIndex, setActiveHeroImageIndex] = useState(0);
  const [activeTab, setActiveTab] = useState<ShopTab>("Products");
  const [isFollowing, setIsFollowing] = useState(false);
  const [displayFollowerCount, setDisplayFollowerCount] = useState(0);
  const [isFollowUpdating, setIsFollowUpdating] = useState(false);
  const [persistedFollowShopId, setPersistedFollowShopId] = useState("");
  const followRequestVersionRef = useRef(0);
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
  const productCount = shop?.products?.length || 0;
  const followerCount = getFollowerCount(shop);
  const joinedDate = getJoinedDate(shop);
  const socialLinks = getSocialLinks(shop);
  const shopDescription = getFirstText(shop?.bio);
  const businessHours = getFirstText(shop?.opening_hours);
  const shopAddress = getFirstText(address);
  const shopWebsite = getFirstText(shop?.website);
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
  const galleryImages = useMemo(
    () => {
      const storedGalleryImages = getShopGalleryImages(shop);

      if (storedGalleryImages.length > 0) {
        return storedGalleryImages;
      }

      return uniqueValues([
        coverImage,
        ...shopProducts.map((product) => getProductImage(product)),
        avatarImage,
      ]).slice(0, 3);
    },
    [avatarImage, coverImage, shop, shopProducts]
  );
  const selectedHeroImageIndex = galleryImages.length
    ? Math.min(activeHeroImageIndex, galleryImages.length - 1)
    : 0;
  const activeHeroImage = galleryImages.length
    ? galleryImages[selectedHeroImageIndex]
    : coverImage || "";
  const heroTags = useMemo(
    () => getHeroTags(shop, productCount),
    [productCount, shop]
  );
  const firstProduct = shopProducts[0];
  const firstProductPrice = getProductPrice(firstProduct);
  const buyNowLabel = firstProductPrice
    ? `Buy now ${formatPrice(firstProductPrice)}`
    : "Buy now";
  const heroDescription =
    shop?.bio?.trim() ||
    getProductDescription(firstProduct) ||
    "Browse the latest products, offers, and store updates from this shop.";

  useEffect(() => {
    setActiveHeroImageIndex(0);
  }, [selectedShopId, galleryImages.join("|")]);

  useEffect(() => {
    if (persistedFollowShopId !== selectedShopId) {
      setDisplayFollowerCount(followerCount);
    }
  }, [followerCount, persistedFollowShopId, selectedShopId]);

  useEffect(() => {
    if (persistedFollowShopId !== selectedShopId) {
      setIsFollowing(isShopFollowed(shop));
    }
  }, [persistedFollowShopId, selectedShopId, shop]);

  useEffect(() => {
    let isMounted = true;
    const requestVersion = followRequestVersionRef.current;

    if (!selectedShopId) {
      return;
    }

    axiosInstance
      .get<ShopsResponse>("/api/v1/products/get-filtered-shops?page=1&limit=100", {
        headers: {
          "x-auth-role": "user",
        },
      })
      .then((response) => {
        const freshShop = Array.isArray(response.data?.shops)
          ? response.data.shops.find((item) => getShopId(item) === selectedShopId)
          : undefined;
        const savedFollowerCount = getFollowerCount(freshShop);

        if (
          !isMounted ||
          requestVersion !== followRequestVersionRef.current ||
          !freshShop
        ) {
          return;
        }

        setDisplayFollowerCount(savedFollowerCount);
        setIsFollowing(isShopFollowed(freshShop));
        setPersistedFollowShopId(selectedShopId);
      })
      .catch(() => undefined);

    return () => {
      isMounted = false;
    };
  }, [selectedShopId]);

  const handleFollowToggle = async () => {
    if (!shop || isFollowUpdating) {
      return;
    }

    const currentShopId = getShopId(shop);

    if (!currentShopId) {
      return;
    }

    const previousFollowState = isFollowing;
    const previousFollowerCount = displayFollowerCount;
    const nextFollowState = !isFollowing;
    const requestVersion = followRequestVersionRef.current + 1;

    followRequestVersionRef.current = requestVersion;

    setIsFollowing(nextFollowState);
    setDisplayFollowerCount((currentCount) =>
      nextFollowState ? currentCount + 1 : Math.max(0, currentCount - 1)
    );
    setIsFollowUpdating(true);

    try {
      const response = await requestShopFollowChange(
        currentShopId,
        nextFollowState
      );
      const savedFollowerCount = getFollowerCountFromResponse(response.data);

      if (requestVersion !== followRequestVersionRef.current) {
        return;
      }

      if (savedFollowerCount !== undefined) {
        setDisplayFollowerCount(savedFollowerCount);
      }
      setIsFollowing(
        response.data?.shop?.isFollowing === undefined
          ? nextFollowState
          : Boolean(response.data.shop.isFollowing)
      );
      setPersistedFollowShopId(selectedShopId);
    } catch {
      if (requestVersion !== followRequestVersionRef.current) {
        return;
      }

      setIsFollowing(previousFollowState);
      setDisplayFollowerCount(previousFollowerCount);
    } finally {
      setIsFollowUpdating(false);
    }
  };

  if (isLoading) {
    return <ShopDetailsSkeleton />;
  }

  if (isError) {
    return (
      <main className="min-h-screen bg-[#f4f5f7] text-slate-950">
        <div className="mx-auto flex min-h-[560px] w-[90%] max-w-[900px] items-center justify-center py-12 lg:w-[80%]">
          <div className="w-full rounded-md bg-white px-6 py-12 text-center shadow-sm">
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
      <main className="min-h-screen bg-[#f4f5f7] text-slate-950">
        <div className="mx-auto flex min-h-[560px] w-[90%] max-w-[900px] items-center justify-center py-12 lg:w-[80%]">
          <div className="w-full rounded-md bg-white px-6 py-12 text-center shadow-sm">
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
    <main className="min-h-screen bg-[#f4f5f7] text-slate-950">
      <section className="relative overflow-hidden bg-[#06020d]">
        <div className="mx-auto grid max-w-[1500px] gap-7 px-4 pb-28 sm:px-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(380px,0.95fr)] lg:pb-32 xl:px-0">
          <div className="space-y-7">
            <div className="h-[280px] overflow-hidden bg-[#11101c] sm:h-[320px] md:h-[360px]">
              {activeHeroImage ? (
                <img
                  src={activeHeroImage}
                  alt={shop.name || "Shop cover"}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center text-5xl font-black text-white/30">
                  {getShopInitial(shop.name)}
                </div>
              )}
            </div>

            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 shadow-[0_14px_34px_-28px_rgba(15,23,42,0.7)]">
              <div className="grid grid-cols-3 gap-3 sm:gap-4">
                {(galleryImages.length ? galleryImages : ["", "", ""])
                  .slice(0, 3)
                  .map((image, index) => (
                    <button
                      key={`${image || "placeholder"}-${index}`}
                      type="button"
                      aria-label={`Show shop gallery image ${index + 1}`}
                      onClick={() => setActiveHeroImageIndex(index)}
                      className={`group h-[82px] overflow-hidden rounded-md border-0 bg-white outline-none transition sm:h-[108px] lg:h-[124px] ${
                        selectedHeroImageIndex === index
                          ? "shadow-[0_0_0_1px_rgba(37,99,235,0.22),0_12px_24px_-20px_rgba(15,23,42,0.7)]"
                          : "shadow-[0_0_0_1px_rgba(226,232,240,0.8)] hover:shadow-[0_0_0_1px_rgba(96,165,250,0.8)] focus-visible:shadow-[0_0_0_1px_rgba(59,130,246,0.9)]"
                      }`}
                    >
                      {image ? (
                        <img
                          src={image}
                          alt={`${shop.name || "Shop"} gallery ${index + 1}`}
                          className="h-full w-full object-cover object-top transition duration-200 group-hover:scale-105"
                        />
                      ) : (
                        <span className="flex h-full w-full items-center justify-center bg-slate-100 text-2xl font-black text-slate-400">
                          {getShopInitial(shop.name)}
                        </span>
                      )}
                    </button>
                  ))}
              </div>
            </div>
          </div>

          <div className="px-1 pt-8 sm:pt-11">
            <p className="max-w-[780px] text-sm font-semibold leading-7 text-gray-400 sm:text-base">
              {heroDescription}
            </p>

            <h2 className="mt-7 text-xl font-semibold text-white">Tags</h2>
            <div className="mt-4 flex flex-wrap gap-3">
              {heroTags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-full bg-[#222033] px-4 py-2 text-sm font-semibold text-gray-100"
                >
                  {tag}
                </span>
              ))}
            </div>

            {firstProduct ? (
              <Link
                href={PRODUCT_DETAILS_PATH}
                onClick={() => saveSelectedProductDetails(firstProduct)}
                className="mt-9 inline-flex h-12 items-center rounded-md bg-[#72f24e] px-6 text-sm font-bold text-[#17320f] shadow-[0_12px_34px_rgba(114,242,78,0.18)] transition hover:bg-[#83ff63]"
              >
                {buyNowLabel}
              </Link>
            ) : (
              <a
                href="#shop-products"
                className="mt-9 inline-flex h-12 items-center rounded-md bg-[#72f24e] px-6 text-sm font-bold text-[#17320f] shadow-[0_12px_34px_rgba(114,242,78,0.18)] transition hover:bg-[#83ff63]"
              >
                Browse products
              </a>
            )}
          </div>
        </div>
      </section>

      <section className="relative z-10 -mt-20 sm:-mt-24">
        <div className="mx-auto grid max-w-[1110px] gap-6 px-4 sm:px-6 lg:grid-cols-[minmax(0,2fr)_410px] xl:px-0">
          <article className="relative rounded-lg bg-[#f4f5f9] px-6 py-6 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.75)] ring-1 ring-slate-200/70 sm:px-7 sm:py-7 md:min-h-[205px]">
            <div className="flex flex-col gap-4 md:pr-[170px]">
              <div className="flex min-w-0 flex-col gap-4 sm:flex-row sm:items-start">
                {avatarImage ? (
                  <img
                    src={avatarImage}
                    alt={shop.name || "Shop avatar"}
                    className="h-[92px] w-[92px] shrink-0 rounded-full border-[3px] border-[#9f56f3] bg-white object-cover shadow-[0_10px_24px_-18px_rgba(15,23,42,0.75)] sm:h-[96px] sm:w-[96px]"
                  />
                ) : (
                  <div className="flex h-[92px] w-[92px] shrink-0 items-center justify-center rounded-full border-[3px] border-[#9f56f3] bg-[#a855f7] text-3xl font-black text-white shadow-[0_10px_24px_-18px_rgba(15,23,42,0.75)] sm:h-[96px] sm:w-[96px]">
                    {getShopInitial(shop.name)}
                  </div>
                )}

                <div className="min-w-0 pt-0">
                  <h1 className="truncate text-[22px] font-bold leading-7 text-slate-950 sm:text-[24px]">
                    {displayText(getFirstText(shop.name))}
                  </h1>
                  <p className="mt-1 max-w-[520px] text-[14px] font-semibold leading-5 text-slate-600 sm:text-[15px]">
                    {displayText(shopDescription)}
                  </p>

                  <div className="mt-3 space-y-3 text-[14px] font-semibold text-slate-600 sm:text-[15px]">
                    <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
                      <span className="inline-flex items-center gap-2 text-blue-500">
                        <Star size={17} fill="currentColor" />
                        {formatRating(shop.ratings)}
                      </span>
                      <span className="inline-flex items-center gap-2">
                        <Users size={17} className="text-slate-500" />
                        {displayFollowerCount}{" "}
                        {displayFollowerCount === 1 ? "Follower" : "Followers"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock size={17} className="shrink-0 text-slate-500" />
                      <span>{displayText(businessHours)}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin size={17} className="shrink-0 text-slate-500" />
                      <span>{displayText(shopAddress)}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <button
              type="button"
              aria-pressed={isFollowing}
              disabled={isFollowUpdating}
              onClick={handleFollowToggle}
              className={`mt-4 inline-flex h-10 w-full shrink-0 items-center justify-center gap-2 rounded-md px-4 text-[14px] font-bold text-white shadow-[0_9px_20px_-16px_rgba(15,23,42,0.85)] transition sm:w-[142px] md:absolute md:right-7 md:top-7 md:mt-0 ${
                isFollowing
                  ? "bg-[#e33434] hover:bg-[#cf2d2d]"
                  : "bg-blue-700 hover:bg-blue-800"
              } disabled:cursor-not-allowed disabled:opacity-70`}
            >
              <Heart
                size={18}
                strokeWidth={2.4}
                fill={isFollowing ? "currentColor" : "none"}
              />
              {isFollowUpdating
                ? "Saving..."
                : isFollowing
                  ? "Unfollow"
                  : "Follow"}
            </button>
          </article>

          <aside className="rounded-lg bg-[#f4f5f9] px-6 py-6 shadow-[0_16px_34px_-30px_rgba(15,23,42,0.75)] ring-1 ring-slate-200/70 sm:px-7 sm:py-7 md:min-h-[205px]">
            <h2 className="text-[22px] font-semibold leading-7 text-slate-950">
              Shop Details
            </h2>

            <div className="mt-5 space-y-3.5 text-[14px] font-semibold text-slate-600 sm:text-[15px]">
              <p className="flex items-center gap-4">
                <Calendar size={19} className="shrink-0 text-slate-500" />
                <span>Joined At: {displayText(joinedDate)}</span>
              </p>
              {shopWebsite ? (
                <a
                  href={shopWebsite}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-4 text-blue-600 transition hover:text-blue-700"
                >
                  <Globe2 size={19} className="shrink-0 text-slate-500" />
                  <span className="min-w-0 truncate">{shopWebsite}</span>
                </a>
              ) : (
                <p className="flex items-center gap-4">
                  <Globe2 size={19} className="shrink-0 text-slate-500" />
                  <span>Website: N/A</span>
                </p>
              )}
            </div>

            <h3 className="mt-5 text-[19px] font-semibold leading-6 text-slate-950">
              Follow Us:
            </h3>
            <div className="mt-3 flex flex-wrap items-center gap-3">
              {socialLinks.length > 0 ? (
                <>
                  {socialLinks.map((link) => (
                    <a
                      key={`${link.label}-${link.url}`}
                      href={link.url}
                      target="_blank"
                      rel="noreferrer"
                      className="flex h-7 min-w-7 items-center justify-center rounded-md text-[15px] font-black text-slate-700 transition hover:text-blue-700"
                    >
                      {link.label}
                    </a>
                  ))}
                </>
              ) : (
                <span className="text-[14px] font-semibold text-slate-600">
                  N/A
                </span>
              )}
            </div>
          </aside>
        </div>
      </section>

      <section
        id="shop-products"
        className="mx-auto mt-12 max-w-[1110px] px-4 pb-16 sm:px-6 xl:px-0"
      >
        <div className="flex items-end justify-between gap-4 border-b border-slate-300">
          <div className="flex gap-8 sm:gap-14">
            {(["Products", "Offers", "Reviews"] as ShopTab[]).map((tab) => (
              <button
                key={tab}
                type="button"
                onClick={() => setActiveTab(tab)}
                className={`relative pb-5 text-base font-semibold transition ${
                  activeTab === tab
                    ? "text-slate-950"
                    : "text-slate-500 hover:text-slate-800"
                }`}
              >
                {tab}
                {activeTab === tab && (
                  <span className="absolute bottom-[-1px] left-0 h-[3px] w-full rounded-full bg-blue-600" />
                )}
              </button>
            ))}
          </div>

          <Link
            href="/shops"
            className="mb-4 hidden h-10 items-center justify-center gap-2 rounded-md bg-white px-4 text-sm font-bold text-slate-700 shadow-sm transition hover:text-blue-700 sm:inline-flex"
          >
            <ArrowLeft size={17} />
            All Shops
          </Link>
        </div>

        {activeTab === "Products" &&
          (shopProducts.length > 0 ? (
            <div className="mt-5 rounded-md bg-[#e5e7ef] p-5 shadow-[0_12px_32px_-30px_rgba(15,23,42,0.7)]">
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
                {shopProducts.map((product, index) => (
                  <ProductCard
                    key={product.id || product._id || `${product.title}-${index}`}
                    product={product}
                  />
                ))}
              </div>
            </div>
          ) : (
            <EmptyTabPanel title="No products found" />
          ))}

        {activeTab === "Offers" && (
          <EmptyTabPanel title="No offers published yet" />
        )}

        {activeTab === "Reviews" && (
          <EmptyTabPanel title="No reviews published yet" />
        )}
      </section>
    </main>
  );
}
