"use client";

import Hero from "@/components/Hero/page";
import ProductCard from "@/components/ProductCard/page";
import SectionTitle from "@/components/SectionTitle/page";
import axiosInstance from "@/utils/axiosinstance";
import { useQuery } from "@tanstack/react-query";

export default function Index() {
  const {
    data: products = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["products"],
    queryFn: async () => {
      const res = await axiosInstance.get(
        "/api/v1/products/get-all-products?page=1&limit=10"
      );

      return res.data.products;
    },
    staleTime: 1000 * 60 * 2,
  });

  return (
    <div>
      <Hero />
      <div className="md:w-[80%] w-[90%] my-10 m-auto">
        <div className="mb-8">
          <SectionTitle title="Suggested Products" />
        </div>
        {isLoading && (
          <div className="grid grid-cols-1 sm:grid-cols-3 md:grid-cols-4 2xl:grid-cols-5 gap-6">
            {Array.from({ length: 10 }).map((_, index) => (
              <div
                key={index}
                className="h-[250px] bg-gray-300 animate-pulse rounded-xl"
              />
            ))}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="m-auto grid grid-cols-1 gap-6 sm:grid-cols-3 md:grid-cols-4">
            {products.map((product: any) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
