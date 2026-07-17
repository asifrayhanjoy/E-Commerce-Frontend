"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";

type AdminProduct = {
  id: string;
  image: string;
  title: string;
  price: string;
  stock: string;
  category: string;
  rating: number;
  shop: string;
  created: string;
};

type ProductResponse = {
  products: AdminProduct[];
  pagination: {
    page: number;
    limit: number;
    totalProducts: number;
    totalPages: number;
  };
};

const fetchProducts = async (search: string, page: number) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: "8",
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await axios.get<ProductResponse>(
    `/api/admin/products?${query.toString()}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-[#737b91]"
  >
    <path
      d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-[#4f86ee]"
  >
    <path
      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const ProductImage = ({ product }: { product: AdminProduct }) => {
  if (product.image) {
    return (
      <img
        src={product.image}
        alt={product.title}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111729] text-[10px] font-semibold text-[#747b90]">
      IMG
    </div>
  );
};

const ProductsPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products", search, page],
    queryFn: () => fetchProducts(search, page),
  });
  const products = data?.products || [];
  const pagination = data?.pagination || {
    page,
    limit: 8,
    totalProducts: 0,
    totalPages: 1,
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const exportCsv = () => {
    const header = [
      "Title",
      "Price",
      "Stock",
      "Category",
      "Rating",
      "Shop",
      "Created",
    ];
    const rows = products.map((product) => [
      product.title,
      product.price,
      product.stock,
      product.category,
      String(product.rating),
      product.shop,
      product.created,
    ]);
    const csv = [header, ...rows]
      .map((row) =>
        row.map((value) => `"${String(value).replace(/"/g, '""')}"`).join(",")
      )
      .join("\n");
    const url = URL.createObjectURL(
      new Blob([csv], { type: "text/csv;charset=utf-8;" })
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = "products.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
            All Products
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/dashboard" className="text-[#4f86ee]">
              Dashboard
            </Link>
            <span className="text-[#aeb3c0]">›</span>
            <span className="text-[#d7d9df]">All Products</span>
          </div>
        </div>

        <button
          type="button"
          onClick={exportCsv}
          className="flex h-9 items-center gap-2 rounded-md bg-[#26b84b] px-4 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#31c957]"
        >
          <DownloadIcon />
          Export CSV
        </button>
      </div>

      <div className="relative mb-5">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </div>
        <input
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search products..."
          className="h-12 w-full rounded-md border border-[#121a2d] bg-[#0d1324] pl-10 pr-4 text-[15px] font-semibold text-[#d8dbe3] outline-none transition duration-200 placeholder:text-[#777f93] focus:border-[#214d91] focus:bg-[#10182d]"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] px-5 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <table className="w-full border-collapse text-left text-[14px] font-semibold">
          <thead>
            <tr className="text-[#d9dbe1]">
              <th className="px-3 pb-4">Image</th>
              <th className="px-3 pb-4">Title</th>
              <th className="px-3 pb-4">Price</th>
              <th className="px-3 pb-4">Stock</th>
              <th className="px-3 pb-4">Category</th>
              <th className="px-3 pb-4">Rating</th>
              <th className="px-3 pb-4">Shop</th>
              <th className="px-3 pb-4">Created</th>
              <th className="px-3 pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5" colSpan={9}>
                  Loading products...
                </td>
              </tr>
            )}

            {!isLoading && products.length === 0 && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5" colSpan={9}>
                  No products found.
                </td>
              </tr>
            )}

            {!isLoading &&
              products.map((product) => (
                <tr
                  key={product.id}
                  className="border-t border-[#161f33] text-[#b9bdc9] transition duration-150 hover:bg-[#111a2e] hover:text-white"
                >
                  <td className="px-3 py-4">
                    <ProductImage product={product} />
                  </td>
                  <td className="px-3 py-4">
                    <span className="text-[#5c76d8]">{product.title}</span>
                  </td>
                  <td className="px-3 py-4">{product.price}</td>
                  <td className="px-3 py-4">{product.stock}</td>
                  <td className="px-3 py-4">{product.category}</td>
                  <td className="px-3 py-4">{product.rating}</td>
                  <td className="px-3 py-4">
                    <span className="text-[#8f4bd8]">{product.shop}</span>
                  </td>
                  <td className="px-3 py-4">{product.created}</td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/product/${product.id}`}
                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-md transition duration-150 hover:scale-105 hover:bg-[#17233c]"
                      aria-label={`View ${product.title}`}
                    >
                      <EyeIcon />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-[#161f33] pt-5 text-[14px] font-semibold text-[#c4c8d4]">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            className="rounded-full bg-[#0f3d98] px-6 py-3 text-[#d8e4ff] transition duration-150 hover:bg-[#154cb8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>

          <span>
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPage((currentPage) =>
                Math.min(currentPage + 1, pagination.totalPages)
              )
            }
            className="rounded-full bg-[#0f3d98] px-6 py-3 text-[#d8e4ff] transition duration-150 hover:bg-[#154cb8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductsPage;
