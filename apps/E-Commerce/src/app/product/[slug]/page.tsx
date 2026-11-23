"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect } from "react";
import {
  PRODUCT_DETAILS_PATH,
  saveSelectedProductDetails,
} from "@/utils/productDetailsRoute";

export default function ProductSlugRedirect() {
  const router = useRouter();
  const params = useParams<{ slug?: string }>();

  useEffect(() => {
    saveSelectedProductDetails({ slug: params?.slug || "" });
    router.replace(PRODUCT_DETAILS_PATH);
  }, [params?.slug, router]);

  return (
    <main className="flex min-h-[320px] items-center justify-center bg-[#fafafa]">
      <div className="h-[160px] w-[92%] max-w-7xl animate-pulse rounded-[28px] bg-white" />
    </main>
  );
}
