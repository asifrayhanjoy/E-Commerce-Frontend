"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";

type AdminOrder = {
  id: string;
  orderId: string;
  shop: string;
  buyer: string;
  total: string;
  status: string;
  date: string;
};

const getStatusClass = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "paid") {
    return "border-[#357a39] bg-[#4caf50] text-white shadow-[0_0_0_1px_rgba(74,175,80,0.25)]";
  }

  if (normalizedStatus === "pending") {
    return "border-[#8a6c16] bg-[#2f270f] text-[#ffd957]";
  }

  return "border-[#79333a] bg-[#321116] text-[#f06d79]";
};

const fetchOrders = async (search: string) => {
  const query = search.trim() ? `?search=${encodeURIComponent(search.trim())}` : "";
  const response = await axios.get<{ orders: AdminOrder[] }>(
    `/api/admin/orders${query}`,
    {
      withCredentials: true,
    }
  );

  return response.data.orders;
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

const OrdersPage = () => {
  const [search, setSearch] = useState("");
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ["admin-orders", search],
    queryFn: () => fetchOrders(search),
  });

  return (
    <div className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-6">
        <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
          All Orders
        </h1>
        <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
          <Link href="/dashboard" className="text-[#4f86ee]">
            Dashboard
          </Link>
          <span className="text-[#aeb3c0]">›</span>
          <span className="text-[#d7d9df]">All Orders</span>
        </div>
      </div>

      <div className="relative mb-5">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </div>
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search orders..."
          className="h-12 w-full rounded-md border border-[#121a2d] bg-[#0d1324] pl-10 pr-4 text-[15px] font-semibold text-[#d8dbe3] outline-none transition duration-200 placeholder:text-[#777f93] focus:border-[#214d91] focus:bg-[#10182d]"
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] px-5 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <table className="w-full border-collapse text-left text-[14px] font-semibold">
          <thead>
            <tr className="text-[#d9dbe1]">
              <th className="px-3 pb-4">Order ID</th>
              <th className="px-3 pb-4">Shop</th>
              <th className="px-3 pb-4">Buyer</th>
              <th className="px-3 pb-4">Total</th>
              <th className="px-3 pb-4">Status</th>
              <th className="px-3 pb-4">Date</th>
              <th className="px-3 pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5" colSpan={7}>
                  Loading orders...
                </td>
              </tr>
            )}

            {!isLoading && orders.length === 0 && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 text-center py-5" colSpan={7}>
                  No orders found.
                </td>
              </tr>
            )}

            {!isLoading &&
              orders.map((order) => (
                <tr
                  key={order.id}
                  className="border-t border-[#161f33] text-[#b9bdc9] transition duration-150 hover:bg-[#111a2e] hover:text-white"
                >
                  <td className="px-3 py-4">{order.orderId}</td>
                  <td className="px-3 py-4">{order.shop}</td>
                  <td className="px-3 py-4">{order.buyer}</td>
                  <td className="px-3 py-4">{order.total}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold ${getStatusClass(
                        order.status
                      )}`}
                    >
                      {order.status}
                    </span>
                  </td>
                  <td className="px-3 py-4">{order.date}</td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/order/${order.id}`}
                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-md transition duration-150 hover:scale-105 hover:bg-[#17233c]"
                      aria-label={`View ${order.orderId}`}
                    >
                      <EyeIcon />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default OrdersPage;
