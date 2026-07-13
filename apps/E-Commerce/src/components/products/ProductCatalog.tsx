"use client";

import { useQuery } from "@tanstack/react-query";
import {
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Star,
  X,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProductCard from "@/components/ProductCard/page";
import axiosInstance from "@/utils/axiosinstance";

type ProductImage = {
  url?: string;
};

type ProductShop = {
  id?: string;
  name?: string;
  ratings?: number;
};

type CatalogProduct = {
  id?: string;
  _id?: string;
  title?: string;
  brand?: string;
  category?: string;
  subCategory?: string;
  short_description?: string;
  detailed_description?: string;
  tags?: string;
  colors?: string | string[];
  sizes?: string[];
  sale_price?: number;
  regular_price?: number;
  price?: number;
  ratings?: number;
  stock?: number;
  images?: ProductImage[];
  Shop?: ProductShop;
  shop?: ProductShop;
};

type CatalogResponse = {
  products?: CatalogProduct[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
};

type CategoriesResponse = {
  categories?: string[];
};

type ProductCatalogMode = "products" | "offers";

const pageSize = 12;
const priceLimit = 1000;
const fallbackCategories = [
  "Electronics",
  "Fashion",
  "Home & Kitchen",
  "Sports & Fitness",
];

const colorOptions = [
  { label: "Black", value: "Black", swatch: "bg-black" },
  { label: "Red", value: "Red", swatch: "bg-red-600" },
  { label: "Green", value: "Green", swatch: "bg-lime-400" },
  { label: "Blue", value: "Blue", swatch: "bg-blue-700" },
  { label: "Yellow", value: "Yellow", swatch: "bg-yellow-300" },
  { label: "Magenta", value: "Magenta", swatch: "bg-fuchsia-600" },
  { label: "Cyan", value: "Cyan", swatch: "bg-cyan-300" },
];

const sizeOptions = ["XS", "S", "M", "L", "XL", "XXL"];

const toggleValue = (values: string[], value: string) =>
  values.includes(value)
    ? values.filter((item) => item !== value)
    : [...values, value];

const formatNumber = (value: number) =>
  new Intl.NumberFormat("en-US", {
    notation: value >= 1000 ? "compact" : "standard",
    maximumFractionDigits: 1,
  }).format(value);

const getProductPrice = (product: CatalogProduct) => {
  const price = Number(product.sale_price ?? product.price ?? 0);
  return Number.isFinite(price) ? price : 0;
};

const hasProductOffer = (product: CatalogProduct) => {
  const salePrice = getProductPrice(product);
  const regularPrice = Number(product.regular_price ?? 0);

  return (
    Number.isFinite(regularPrice) &&
    regularPrice > 0 &&
    salePrice > 0 &&
    regularPrice > salePrice
  );
};

const toValueList = (value: unknown) => {
  if (Array.isArray(value)) {
    return value.map(String).map((item) => item.trim()).filter(Boolean);
  }

  if (typeof value === "string") {
    return value.split(",").map((item) => item.trim()).filter(Boolean);
  }

  return [];
};

const hasMatchingValue = (source: unknown, selectedValues: string[]) => {
  if (!selectedValues.length) {
    return true;
  }

  const sourceValues = toValueList(source).map((item) => item.toLowerCase());

  return selectedValues.some((value) =>
    sourceValues.includes(value.toLowerCase())
  );
};

const getSearchableProductText = (product: CatalogProduct) =>
  [
    product.title,
    product.brand,
    product.category,
    product.subCategory,
    product.short_description,
    product.detailed_description,
    product.tags,
    product.Shop?.name,
    product.shop?.name,
  ]
    .filter(Boolean)
    .join(" ")
    .replace(/<[^>]*>/g, " ")
    .toLowerCase();

const ProductGridSkeleton = () => (
  <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
    {Array.from({ length: 8 }).map((_, index) => (
      <div
        key={index}
        className="h-[540px] overflow-hidden rounded-lg bg-white shadow-sm"
      >
        <div className="h-[360px] animate-pulse bg-slate-100" />
        <div className="space-y-4 px-5 py-5">
          <div className="h-4 w-24 animate-pulse rounded bg-slate-100" />
          <div className="h-5 w-full animate-pulse rounded bg-slate-100" />
          <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
          <div className="flex justify-between">
            <div className="h-7 w-24 animate-pulse rounded bg-slate-100" />
            <div className="h-5 w-16 animate-pulse rounded bg-slate-100" />
          </div>
        </div>
      </div>
    ))}
  </div>
);

const FilterHeading = ({ children }: { children: React.ReactNode }) => (
  <h2 className="border-b border-slate-200 pb-2 text-[26px] font-bold leading-tight text-slate-950">
    {children}
  </h2>
);

export default function ProductCatalog({
  initialSearch = "",
  mode = "products",
}: {
  initialSearch?: string;
  mode?: ProductCatalogMode;
}) {
  const router = useRouter();
  const isOffersPage = mode === "offers";
  const routePath = isOffersPage ? "/offers" : "/products";
  const pageLabel = isOffersPage ? "Offers" : "All Products";
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [maxPriceDraft, setMaxPriceDraft] = useState(808);
  const [appliedMaxPrice, setAppliedMaxPrice] = useState(priceLimit);
  const [minRating, setMinRating] = useState("");
  const [page, setPage] = useState(1);
  const searchQuery = initialSearch.trim().toLowerCase();

  useEffect(() => {
    setPage(1);
  }, [searchQuery]);

  const { data: categories = [], isLoading: areCategoriesLoading } = useQuery({
    queryKey: ["product-catalog-categories"],
    queryFn: async () => {
      const response = await axiosInstance.get<CategoriesResponse>(
        "/api/v1/products/get-categories"
      );

      return Array.isArray(response.data?.categories)
        ? response.data.categories
        : [];
    },
    staleTime: 1000 * 60 * 10,
  });

  const categoryOptions = categories.length ? categories : fallbackCategories;
  const {
    data,
    isLoading,
    isFetching,
    isError,
    refetch,
  } = useQuery({
    queryKey: ["product-catalog-all-products"],
    queryFn: async () => {
      const response = await axiosInstance.get<CatalogResponse>(
        "/api/v1/products/get-all-products?page=1&limit=100"
      );

      return response.data;
    },
    staleTime: 1000 * 60 * 2,
  });

  const backendProducts = Array.isArray(data?.products) ? data.products : [];
  const catalogProducts = useMemo(
    () =>
      isOffersPage
        ? backendProducts.filter((product) => hasProductOffer(product))
        : backendProducts,
    [backendProducts, isOffersPage]
  );
  const filteredProducts = useMemo(
    () =>
      catalogProducts.filter((product) => {
        const matchesSearch =
          !searchQuery ||
          getSearchableProductText(product).includes(searchQuery);
        const matchesCategory =
          !selectedCategories.length ||
          selectedCategories.some(
            (category) =>
              product.category?.toLowerCase() === category.toLowerCase()
          );
        const matchesColors = hasMatchingValue(product.colors, selectedColors);
        const matchesSizes = hasMatchingValue(product.sizes, selectedSizes);
        const matchesPrice =
          appliedMaxPrice >= priceLimit ||
          getProductPrice(product) <= appliedMaxPrice;
        const rating = Number(product.ratings || 0);
        const matchesRating = !minRating || rating >= Number(minRating);

        return (
          matchesSearch &&
          matchesCategory &&
          matchesColors &&
          matchesSizes &&
          matchesPrice &&
          matchesRating
        );
      }),
    [
      appliedMaxPrice,
      catalogProducts,
      minRating,
      searchQuery,
      selectedCategories,
      selectedColors,
      selectedSizes,
    ]
  );
  const total = filteredProducts.length;
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const currentPage = Math.min(page, totalPages);
  const products = filteredProducts.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );
  const hasActiveFilters =
    selectedCategories.length > 0 ||
    selectedColors.length > 0 ||
    selectedSizes.length > 0 ||
    appliedMaxPrice < priceLimit ||
    Boolean(minRating) ||
    Boolean(searchQuery);

  const resetFilters = () => {
    setSelectedCategories([]);
    setSelectedColors([]);
    setSelectedSizes([]);
    setMaxPriceDraft(808);
    setAppliedMaxPrice(priceLimit);
    setMinRating("");
    setPage(1);

    if (searchQuery) {
      router.push(routePath);
    }
  };

  return (
    <main className="min-h-screen bg-[#f7f6f6] text-slate-950">
      <div className="mx-auto w-[90%] max-w-[1500px] py-9 lg:w-[80%]">
        <div className="mb-10 text-lg font-semibold text-slate-600">
          <Link href="/" className="transition hover:text-blue-700">
            Home
          </Link>
          <span className="px-2">.</span>
          <span className="text-slate-800">{pageLabel}</span>
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
              <FilterHeading>Price Filter</FilterHeading>
              <div className="pt-8">
                <input
                  type="range"
                  min="0"
                  max={priceLimit}
                  value={maxPriceDraft}
                  onChange={(event) =>
                    setMaxPriceDraft(Number(event.target.value))
                  }
                  className="h-2 w-full cursor-pointer accent-blue-700"
                />
                <div className="mt-6 flex items-center justify-between gap-4">
                  <span className="text-lg font-bold text-slate-600">
                    $0 - ${maxPriceDraft}
                  </span>
                  <button
                    type="button"
                    className="h-10 rounded-md bg-slate-100 px-5 text-base font-bold text-slate-800 transition hover:bg-blue-700 hover:text-white"
                    onClick={() => {
                      setAppliedMaxPrice(maxPriceDraft);
                      setPage(1);
                    }}
                  >
                    Apply
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-9">
              <FilterHeading>Categories</FilterHeading>
              <div className="mt-4 space-y-3">
                {areCategoriesLoading && !categories.length
                  ? Array.from({ length: 4 }).map((_, index) => (
                      <div
                        key={index}
                        className="h-6 animate-pulse rounded bg-slate-100"
                      />
                    ))
                  : categoryOptions.map((category) => (
                      <label
                        key={category}
                        className="flex cursor-pointer items-center gap-3 text-base font-semibold text-slate-600"
                      >
                        <input
                          type="checkbox"
                          checked={selectedCategories.includes(category)}
                          onChange={() => {
                            setSelectedCategories((current) =>
                              toggleValue(current, category)
                            );
                            setPage(1);
                          }}
                          className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                        />
                        <span>{category}</span>
                      </label>
                    ))}
              </div>
            </div>

            <div className="mt-9">
              <FilterHeading>Filter by Color</FilterHeading>
              <div className="mt-4 space-y-3">
                {colorOptions.map((color) => (
                  <label
                    key={color.value}
                    className="flex cursor-pointer items-center gap-3 text-base font-semibold text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedColors.includes(color.value)}
                      onChange={() => {
                        setSelectedColors((current) =>
                          toggleValue(current, color.value)
                        );
                        setPage(1);
                      }}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                    />
                    <span
                      className={`h-4 w-4 rounded-full ${color.swatch}`}
                      aria-hidden="true"
                    />
                    <span>{color.label}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-9">
              <FilterHeading>Filter by Size</FilterHeading>
              <div className="mt-4 space-y-3">
                {sizeOptions.map((size) => (
                  <label
                    key={size}
                    className="flex cursor-pointer items-center gap-3 text-base font-semibold text-slate-600"
                  >
                    <input
                      type="checkbox"
                      checked={selectedSizes.includes(size)}
                      onChange={() => {
                        setSelectedSizes((current) =>
                          toggleValue(current, size)
                        );
                        setPage(1);
                      }}
                      className="h-4 w-4 rounded border-slate-300 accent-blue-700"
                    />
                    <span>{size}</span>
                  </label>
                ))}
              </div>
            </div>

            <div className="mt-9">
              <FilterHeading>Rating</FilterHeading>
              <div className="mt-4 grid grid-cols-2 gap-2">
                {["", "3", "4", "5"].map((rating) => (
                  <button
                    key={rating || "all"}
                    type="button"
                    className={`flex h-10 items-center justify-center gap-1 rounded-md text-sm font-bold transition ${
                      minRating === rating
                        ? "bg-blue-700 text-white"
                        : "bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700"
                    }`}
                    onClick={() => {
                      setMinRating(rating);
                      setPage(1);
                    }}
                  >
                    {rating || "Any"}
                    {rating && <Star size={14} fill="currentColor" />}
                  </button>
                ))}
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
            {isLoading && <ProductGridSkeleton />}

            {!isLoading && isError && (
              <div className="flex min-h-[360px] items-center justify-center bg-white px-6 text-center shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    Products could not load
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

            {!isLoading && !isError && products.length === 0 && (
              <div className="flex min-h-[360px] items-center justify-center bg-white px-6 text-center shadow-sm">
                <div>
                  <h2 className="text-2xl font-bold text-slate-950">
                    {isOffersPage ? "No offers found" : "No products found"}
                  </h2>
                  <p className="mx-auto mt-2 max-w-[420px] text-sm font-semibold leading-6 text-slate-500">
                    Clear the filters or try a different search.
                  </p>
                  <button
                    type="button"
                    className="mt-5 inline-flex h-11 items-center justify-center gap-2 rounded-md bg-slate-950 px-5 text-sm font-bold text-white transition hover:bg-blue-700"
                    onClick={resetFilters}
                  >
                    <X size={17} />
                    Clear Filters
                  </button>
                </div>
              </div>
            )}

            {!isLoading && !isError && products.length > 0 && (
              <>
                <div className="grid grid-cols-1 gap-7 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {products.map((product, index) => (
                    <ProductCard
                      key={product.id || product._id || `${product.title}-${index}`}
                      product={product}
                      isEvent={isOffersPage}
                    />
                  ))}
                </div>

                <div className="mt-8 flex flex-col gap-4 bg-white p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
                  <p className="text-sm font-bold text-slate-600">
                    {formatNumber(total)} products found | Page {currentPage} of{" "}
                    {totalPages}
                  </p>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md border border-slate-200 px-4 text-sm font-bold text-slate-700 transition hover:border-blue-200 hover:text-blue-700 disabled:cursor-not-allowed disabled:opacity-40"
                      onClick={() =>
                        setPage((current) => Math.max(1, current - 1))
                      }
                      disabled={currentPage <= 1 || isFetching}
                    >
                      <ChevronLeft size={17} />
                      Previous
                    </button>
                    <button
                      type="button"
                      className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-700 px-4 text-sm font-bold text-white transition hover:bg-blue-800 disabled:cursor-not-allowed disabled:bg-slate-400"
                      onClick={() =>
                        setPage((current) => Math.min(totalPages, current + 1))
                      }
                      disabled={currentPage >= totalPages || isFetching}
                    >
                      Next
                      <ChevronRight size={17} />
                    </button>
                  </div>
                </div>
              </>
            )}
          </section>
        </div>
      </div>
    </main>
  );
}
