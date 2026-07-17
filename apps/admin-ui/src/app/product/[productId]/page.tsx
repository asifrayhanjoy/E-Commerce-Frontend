"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";

type AdminProductDetail = {
  id: string;
  image: string;
  title: string;
  slug: string;
  price: string;
  regularPrice: string;
  stock: string;
  stockCount: number;
  category: string;
  subCategory: string;
  rating: number;
  shop: string;
  status: string;
  brand: string;
  tags: string;
  colors: string;
  sizes: string[];
  warranty: string;
  videoUrl: string;
  shortDescription: string;
  detailedDescription: string;
  customSpecifications: Record<string, unknown>;
  customProperties: Record<string, unknown>;
  created: string;
};

const fetchProduct = async (productId: string) => {
  const response = await axios.get<{ product: AdminProductDetail }>(
    `/api/admin/products/${encodeURIComponent(productId)}`,
    {
      withCredentials: true,
    }
  );

  return response.data.product;
};

const ProductImage = ({ product }: { product: AdminProductDetail }) => {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.title}
        className="h-full w-full rounded-lg object-cover"
      />
    );
  }

  return (
    <div className="flex h-full w-full items-center justify-center rounded-lg bg-[#111729] text-[15px] font-semibold text-[#747b90]">
      Product image
    </div>
  );
};

const DetailRow = ({ label, value }: { label: string; value: string | number }) => (
  <div className="rounded-md border border-[#141d31] bg-[#0b1020] px-4 py-3">
    <p className="text-[12px] font-semibold text-[#747b90]">{label}</p>
    <p className="mt-1 text-[15px] font-semibold text-[#e2e5ec]">{value || "-"}</p>
  </div>
);

const ProductDetailPage = () => {
  const params = useParams<{ productId: string }>();
  const productId = params.productId;
  const { data: product, isLoading, isError } = useQuery({
    queryKey: ["admin-product", productId],
    queryFn: () => fetchProduct(productId),
    enabled: Boolean(productId),
  });

  return (
    <main className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
          Product Details
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
          <Link href="/dashboard" className="text-[#4f86ee]">
            Dashboard
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <Link href="/dashboard/products" className="text-[#4f86ee]">
            All Products
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <span className="text-[#d7d9df]">Details</span>
        </div>
      </div>

      {isLoading && (
        <div className="text-[15px] font-semibold text-[#aeb4c4]">
          Loading product...
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[15px] font-semibold text-red-300">
          Product could not be loaded.
        </div>
      )}

      {product && (
        <div className="grid grid-cols-[360px_1fr] gap-8">
          <section className="rounded-lg border border-[#121a2d] bg-[#0b1020] p-5">
            <div className="h-[320px] overflow-hidden rounded-lg border border-[#1a2233] bg-black">
              <ProductImage product={product} />
            </div>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <DetailRow label="Price" value={product.price} />
              <DetailRow label="Stock" value={product.stock} />
              <DetailRow label="Rating" value={product.rating} />
              <DetailRow label="Created" value={product.created} />
            </div>
          </section>

          <section className="rounded-lg border border-[#121a2d] bg-[#0b1020] p-6">
            <div className="flex items-start justify-between gap-5">
              <div>
                <h2 className="text-[26px] font-semibold text-[#f1f2f4]">
                  {product.title}
                </h2>
                <p className="mt-2 text-[14px] font-semibold text-[#747b90]">
                  {product.slug}
                </p>
              </div>

              <span className="rounded-full border border-[#357a39] bg-[#18351d] px-4 py-2 text-[13px] font-semibold text-[#68d774]">
                {product.status}
              </span>
            </div>

            <div className="mt-7 grid grid-cols-3 gap-4">
              <DetailRow label="Category" value={product.category} />
              <DetailRow label="Sub Category" value={product.subCategory} />
              <DetailRow label="Shop" value={product.shop} />
              <DetailRow label="Brand" value={product.brand} />
              <DetailRow label="Regular Price" value={product.regularPrice} />
              <DetailRow label="Warranty" value={product.warranty} />
            </div>

            <div className="mt-7 grid grid-cols-2 gap-5">
              <div>
                <h3 className="text-[16px] font-semibold text-[#e2e5ec]">
                  Short Description
                </h3>
                <p className="mt-3 min-h-[96px] rounded-md border border-[#141d31] bg-black/30 px-4 py-3 text-[14px] font-semibold leading-6 text-[#aeb4c4]">
                  {product.shortDescription || "No short description available."}
                </p>
              </div>

              <div>
                <h3 className="text-[16px] font-semibold text-[#e2e5ec]">
                  Details
                </h3>
                <p className="mt-3 min-h-[96px] rounded-md border border-[#141d31] bg-black/30 px-4 py-3 text-[14px] font-semibold leading-6 text-[#aeb4c4]">
                  {product.detailedDescription || "No detailed description available."}
                </p>
              </div>
            </div>

            <div className="mt-7 flex flex-wrap gap-3 text-[13px] font-semibold">
              {product.sizes.map((size) => (
                <span
                  key={size}
                  className="rounded-full border border-[#233354] bg-[#111729] px-4 py-2 text-[#d7d9df]"
                >
                  {size}
                </span>
              ))}

              {product.tags && (
                <span className="rounded-full border border-[#233354] bg-[#111729] px-4 py-2 text-[#d7d9df]">
                  {product.tags}
                </span>
              )}

              {product.colors && (
                <span className="rounded-full border border-[#233354] bg-[#111729] px-4 py-2 text-[#d7d9df]">
                  {product.colors}
                </span>
              )}
            </div>
          </section>
        </div>
      )}
    </main>
  );
};

export default ProductDetailPage;
