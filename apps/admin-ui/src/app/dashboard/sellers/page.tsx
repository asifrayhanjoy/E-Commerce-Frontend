"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";

type AdminSeller = {
  id: string;
  shopId: string;
  avatar: string;
  name: string;
  email: string;
  shopName: string;
  address: string;
  joined: string;
};

type SellerResponse = {
  sellers: AdminSeller[];
  pagination: {
    page: number;
    limit: number;
    totalSellers: number;
    totalPages: number;
  };
};

const fetchSellers = async (search: string, page: number) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: "8",
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await axios.get<SellerResponse>(
    `/api/admin/sellers?${query.toString()}`,
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

const SellerAvatar = ({ seller }: { seller: AdminSeller }) => {
  if (seller.avatar) {
    return (
      <img
        src={seller.avatar}
        alt={seller.name}
        className="h-11 w-11 rounded-full object-cover"
      />
    );
  }

  return (
    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#111729] text-[13px] font-semibold text-[#9aa3b9]">
      {seller.name.slice(0, 1).toUpperCase()}
    </div>
  );
};

const SellersPage = () => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-sellers", search, page],
    queryFn: () => fetchSellers(search, page),
  });
  const sellers = data?.sellers || [];
  const pagination = data?.pagination || {
    page,
    limit: 8,
    totalSellers: 0,
    totalPages: 1,
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const exportCsv = () => {
    const header = ["Name", "Email", "Shop Name", "Address", "Joined"];
    const rows = sellers.map((seller) => [
      seller.name,
      seller.email,
      seller.shopName,
      seller.address,
      seller.joined,
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
    link.download = "sellers.csv";
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
            All Sellers
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/dashboard" className="text-[#4f86ee]">
              Dashboard
            </Link>
            <span className="text-[#aeb3c0]">›</span>
            <span className="text-[#d7d9df]">All Sellers</span>
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
          placeholder="Search sellers..."
          className="h-12 w-full rounded-md border border-[#121a2d] bg-[#0d1324] pl-10 pr-4 text-[15px] font-semibold text-[#d8dbe3] outline-none transition duration-200 placeholder:text-[#777f93] focus:border-[#214d91] focus:bg-[#10182d]"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] px-5 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <table className="w-full border-collapse text-left text-[14px] font-semibold">
          <thead>
            <tr className="text-[#d9dbe1]">
              <th className="px-3 pb-4">Avatar</th>
              <th className="px-3 pb-4">Name</th>
              <th className="px-3 pb-4">Email</th>
              <th className="px-3 pb-4">Shop Name</th>
              <th className="px-3 pb-4">Address</th>
              <th className="px-3 pb-4">Joined</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5" colSpan={6}>
                  Loading sellers...
                </td>
              </tr>
            )}

            {!isLoading && sellers.length === 0 && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5" colSpan={6}>
                  No sellers found.
                </td>
              </tr>
            )}

            {!isLoading &&
              sellers.map((seller) => (
                <tr
                  key={seller.id}
                  className="border-t border-[#161f33] text-[#b9bdc9] transition duration-150 hover:bg-[#111a2e] hover:text-white"
                >
                  <td className="px-3 py-4">
                    <SellerAvatar seller={seller} />
                  </td>
                  <td className="px-3 py-4">{seller.name}</td>
                  <td className="px-3 py-4">{seller.email}</td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/shop/${seller.shopId || seller.id}`}
                      className="text-[#4f86ee] transition hover:text-[#82aaff] hover:underline"
                    >
                      {seller.shopName}
                    </Link>
                  </td>
                  <td className="px-3 py-4">{seller.address}</td>
                  <td className="px-3 py-4">{seller.joined}</td>
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

export default SellersPage;
