"use client";

import ProductCard from "@/components/ProductCard/page";
import SectionTitle from "@/components/SectionTitle/page";
import { useRecommendedProducts } from "@/hooks/useRecommendedProducts";
import type { RecommendedProduct } from "@/hooks/useRecommendedProducts";

const getProductKey = (
  product: RecommendedProduct,
  section: string,
  index: number
) => product.id || product._id || product.slug || `${section}-${index}`;

const RecommendedProductsSkeleton = () => (
  <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
    {Array.from({ length: 10 }).map((_, index) => (
      <div
        key={index}
        className="h-[430px] animate-pulse rounded-lg bg-gray-300"
      />
    ))}
  </div>
);

const RecommendedProducts = () => {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useRecommendedProducts();

  if (isError || (!isLoading && products.length === 0)) {
    return null;
  }

  return (
    <section className="mb-10">
      <div className="mb-8">
        <SectionTitle title="Recommended For You" />
      </div>

      {isLoading && <RecommendedProductsSkeleton />}

      {!isLoading && products.length > 0 && (
        <div className="m-auto grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
          {products.map((product, index) => (
            <ProductCard
              key={getProductKey(product, "recommended", index)}
              product={product}
            />
          ))}
        </div>
      )}
    </section>
  );
};

export default RecommendedProducts;
