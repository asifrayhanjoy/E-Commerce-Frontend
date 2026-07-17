"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { ChevronRight, Eye, Search } from "lucide-react";

type OrderUser = {
  id?: string;
  name?: string;
  email?: string;
};

type OrderCartItem = {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  quantity?: number | string;
  sale_price?: number | string;
  price?: number | string;
  product?: {
    id?: string;
    _id?: string;
    title?: string;
    name?: string;
    sale_price?: number | string;
    price?: number | string;
  };
};

type SellerOrder = {
  id?: string;
  _id?: string;
  user?: OrderUser;
  cart?: OrderCartItem[] | string | null;
  totalAmount?: number | string;
  paymentIntentId?: string | null;
  paymentSessionId?: string | null;
  status?: string;
  paymentStatus?: string;
  createdAt?: string;
  updatedAt?: string;
};

const fetchSellerOrders = async () => {
  const response = await axios.get("/api/order/get-Seller-Orders", {
    withCredentials: true,
  });

  return Array.isArray(response.data?.orders)
    ? (response.data.orders as SellerOrder[])
    : [];
};

const formatCurrency = (value: number | string | undefined) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

const formatDate = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return "N/A";
  }

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(date);
};

const getOrderItems = (order: SellerOrder) => {
  if (Array.isArray(order.cart)) {
    return order.cart;
  }

  if (typeof order.cart === "string") {
    try {
      const parsedCart = JSON.parse(order.cart);

      return Array.isArray(parsedCart) ? (parsedCart as OrderCartItem[]) : [];
    } catch {
      return [];
    }
  }

  return [];
};

const getItemQuantity = (item: OrderCartItem) => {
  const quantity = Number(item.quantity || 1);

  return Number.isFinite(quantity) ? quantity : 1;
};

const getItemPrice = (item: OrderCartItem) => {
  const price = Number(
    item.sale_price ?? item.price ?? item.product?.sale_price ?? item.product?.price ?? 0
  );

  return Number.isFinite(price) ? price : 0;
};

const getOrderTotal = (order: SellerOrder) => {
  const totalAmount = Number(order.totalAmount);

  if (Number.isFinite(totalAmount)) {
    return totalAmount;
  }

  return getOrderItems(order).reduce(
    (total, item) => total + getItemPrice(item) * getItemQuantity(item),
    0
  );
};

const getOrderId = (order: SellerOrder) =>
  order.id || order._id || order.paymentSessionId || "order";

const formatOrderId = (order: SellerOrder) =>
  `#${getOrderId(order).slice(-6).toUpperCase()}`;

const getBuyerName = (order: SellerOrder) =>
  order.user?.name || order.user?.email || "Unknown Buyer";

const getOrderStatus = (order: SellerOrder) =>
  order.status || order.paymentStatus || "Paid";

const getStatusClassName = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus.includes("paid") || normalizedStatus.includes("complete")) {
    return "bg-green-600 text-white ring-green-400/30";
  }

  if (normalizedStatus.includes("pending") || normalizedStatus.includes("process")) {
    return "bg-amber-500 text-black ring-amber-300/30";
  }

  if (normalizedStatus.includes("cancel") || normalizedStatus.includes("fail")) {
    return "bg-red-600 text-white ring-red-400/30";
  }

  return "bg-blue-600 text-white ring-blue-400/30";
};

function Page() {
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: orders = [],
    isLoading,
    isError,
  } = useQuery<SellerOrder[]>({
    queryKey: ["seller-orders"],
    queryFn: fetchSellerOrders,
    staleTime: 1000 * 60,
  });

  const filteredOrders = useMemo(() => {
    const normalizedFilter = globalFilter.trim().toLowerCase();

    if (!normalizedFilter) {
      return orders;
    }

    return orders.filter((order) => {
      const searchableValue = [
        formatOrderId(order),
        getBuyerName(order),
        formatCurrency(getOrderTotal(order)),
        getOrderStatus(order),
        formatDate(order.createdAt),
      ]
        .join(" ")
        .toLowerCase();

      return searchableValue.includes(normalizedFilter);
    });
  }, [globalFilter, orders]);

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <h2 className="text-2xl font-semibold text-white">All Orders</h2>

      <div className="mt-2 flex items-center text-white">
        <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>All Orders</span>
      </div>

      <div className="mt-6 mb-5 flex h-12 items-center rounded-md bg-gray-900 px-3">
        <Search size={20} className="mr-2 shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="Search orders..."
          className="w-full bg-transparent text-white outline-none placeholder:text-gray-400"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
        <table className="w-full min-w-[820px] table-fixed text-white">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="w-[17%] p-3 text-left text-sm font-semibold">
                Order ID
              </th>
              <th className="w-[25%] p-3 text-left text-sm font-semibold">
                Buyer
              </th>
              <th className="w-[12%] p-3 text-left text-sm font-semibold">
                Total
              </th>
              <th className="w-[14%] p-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="w-[18%] p-3 text-left text-sm font-semibold">
                Date
              </th>
              <th className="w-[14%] p-3 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={6} className="p-5 text-center text-gray-400">
                  Loading orders...
                </td>
              </tr>
            )}

            {isError && !isLoading && (
              <tr>
                <td colSpan={6} className="p-5 text-center text-red-400">
                  Failed to load orders.
                </td>
              </tr>
            )}

            {!isLoading && !isError && filteredOrders.length === 0 && (
              <tr>
                <td colSpan={6} className="p-5 text-center text-gray-400">
                  No orders found.
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              filteredOrders.map((order) => {
                const status = getOrderStatus(order);

                return (
                  <tr
                    key={getOrderId(order)}
                    className="border-b border-gray-800 transition last:border-b-0 hover:bg-gray-800/40"
                  >
                    <td className="p-3 text-sm font-semibold text-gray-300">
                      {formatOrderId(order)}
                    </td>
                    <td className="truncate p-3 text-sm font-semibold text-gray-300">
                      {getBuyerName(order)}
                    </td>
                    <td className="p-3 text-sm font-semibold text-gray-300">
                      {formatCurrency(getOrderTotal(order))}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex min-w-12 items-center justify-center rounded-full px-2.5 py-1 text-xs font-semibold ring-2 ${getStatusClassName(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3 text-sm font-semibold text-gray-300">
                      {formatDate(order.createdAt)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/orders/${encodeURIComponent(getOrderId(order))}`}
                        className="text-blue-400 transition hover:text-blue-300"
                        title="View order"
                      >
                        <Eye size={18} />
                      </Link>
                    </td>
                  </tr>
                );
              })}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default Page;
