"use client";

import { useQuery } from "@tanstack/react-query";
import axiosInstance from "@/utils/axiosinstance";

export type RecommendedProduct = {
  id?: string;
  _id?: string;
  slug?: string;
  [key: string]: unknown;
};

type RecommendedProductsResponse = {
  recommendations?: RecommendedProduct[];
  recommendedProducts?: RecommendedProduct[];
  products?: RecommendedProduct[];
};

const normalizeProducts = (value: unknown): RecommendedProduct[] =>
  Array.isArray(value) ? (value as RecommendedProduct[]) : [];

const getRecommendedProducts = (data?: RecommendedProductsResponse) => {
  if (Array.isArray(data?.recommendations)) {
    return normalizeProducts(data.recommendations);
  }

  if (Array.isArray(data?.recommendedProducts)) {
    return normalizeProducts(data.recommendedProducts);
  }

  return normalizeProducts(data?.products);
};

const fetchRecommendedProducts = async () => {
  const response = await axiosInstance.get<RecommendedProductsResponse>(
    "/recommendation/api/get-recommendation-products"
  );

  return getRecommendedProducts(response.data);
};

export const useRecommendedProducts = () =>
  useQuery({
    queryKey: ["recommended-products"],
    queryFn: fetchRecommendedProducts,
    staleTime: 1000 * 60 * 5,
    retry: false,
  });
