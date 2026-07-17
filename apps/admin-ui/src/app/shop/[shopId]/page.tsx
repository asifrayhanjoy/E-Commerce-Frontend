"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useParams } from "next/navigation";

type SellerDetail = {
  id: string;
  shopId: string;
  avatar: string;
  name: string;
  email: string;
  shopName: string;
  address: string;
  joined: string;
  phone: string;
  country: string;
  category: string;
  rating: number;
  updated: string;
};

const fetchSeller = async (shopId: string) => {
  const response = await axios.get<{ seller: SellerDetail }>(
    `/api/admin/sellers/${encodeURIComponent(shopId)}`,
    {
      withCredentials: true,
    }
  );

  return response.data.seller;
};

const ShopPage = () => {
  const params = useParams<{ shopId: string }>();
  const shopId = params.shopId;
  const { data: seller, isLoading, isError } = useQuery({
    queryKey: ["admin-seller", shopId],
    queryFn: () => fetchSeller(shopId),
    enabled: Boolean(shopId),
  });

  return (
    <main className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-7">
        <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
          Shop Details
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
          <Link href="/dashboard" className="text-[#4f86ee]">
            Dashboard
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <Link href="/dashboard/sellers" className="text-[#4f86ee]">
            All Sellers
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <span className="text-[#d7d9df]">Shop</span>
        </div>
      </div>

      {isLoading && (
        <div className="text-[15px] font-semibold text-[#aeb4c4]">
          Loading shop...
        </div>
      )}

      {isError && (
        <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[15px] font-semibold text-red-300">
          Shop could not be loaded.
        </div>
      )}

      {seller && (
        <section className="max-w-[820px] rounded-lg border border-[#121a2d] bg-[#0b1020] p-6">
          <div className="flex items-center gap-5">
            {seller.avatar ? (
              <img
                src={seller.avatar}
                alt={seller.shopName}
                className="h-24 w-24 rounded-full object-cover"
              />
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-full bg-[#111729] text-[32px] font-semibold text-[#9aa3b9]">
                {seller.shopName.slice(0, 1).toUpperCase()}
              </div>
            )}

            <div>
              <h2 className="text-[26px] font-semibold text-[#f1f2f4]">
                {seller.shopName}
              </h2>
              <p className="mt-2 text-[15px] font-semibold text-[#aeb4c4]">
                {seller.name} · {seller.email}
              </p>
            </div>
          </div>

          <div className="mt-7 grid grid-cols-3 gap-4">
            {[
              ["Address", seller.address],
              ["Category", seller.category],
              ["Rating", seller.rating],
              ["Phone", seller.phone],
              ["Country", seller.country],
              ["Joined", seller.joined],
            ].map(([label, value]) => (
              <div
                key={label}
                className="rounded-md border border-[#141d31] bg-black/30 px-4 py-3"
              >
                <p className="text-[12px] font-semibold text-[#747b90]">
                  {label}
                </p>
                <p className="mt-1 text-[15px] font-semibold text-[#e2e5ec]">
                  {value || "-"}
                </p>
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
};

export default ShopPage;
