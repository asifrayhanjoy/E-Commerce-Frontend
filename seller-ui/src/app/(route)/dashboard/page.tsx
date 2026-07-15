"use client";

import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowUpRight,
  ChevronRight,
  DollarSign,
  Eye,
  Package,
  ShoppingBag,
  Star,
} from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";
import useSeller from "@/hooks/useSeller";

type ProductImage = {
  url?: string;
  file_url?: string;
};

type Product = {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  images?: ProductImage[];
  image?: string;
  sale_price?: number | string;
  stock?: number;
  ratings?: number;
  isDeleted?: boolean;
  createdAt?: string;
};

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

const fetchProducts = async () => {
  const response = await axiosInstance.get("/api/v1/products/get-shop-products");

  return Array.isArray(response.data?.products)
    ? (response.data.products as Product[])
    : [];
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

const trimTrailingZero = (value: string) => value.replace(/\.0$/, "");

const formatCompactCurrency = (value: number) => {
  const amount = Number.isFinite(value) ? value : 0;
  const absoluteAmount = Math.abs(amount);
  const sign = amount < 0 ? "-" : "";

  if (absoluteAmount >= 1_000_000) {
    return `${sign}$${trimTrailingZero((absoluteAmount / 1_000_000).toFixed(1))}M`;
  }

  if (absoluteAmount >= 1_000) {
    return `${sign}$${trimTrailingZero((absoluteAmount / 1_000).toFixed(1))}K`;
  }

  return `${sign}$${trimTrailingZero(absoluteAmount.toFixed(1))}`;
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

const getProductImage = (product: Product) =>
  product.images?.[0]?.url || product.images?.[0]?.file_url || product.image || "";

const getProductId = (product: Product) => product.id || product._id || product.slug || "product";

const getProductPrice = (product: Product) => {
  const price = Number(product.sale_price || 0);

  return Number.isFinite(price) ? price : 0;
};

const monthKey = (date: Date) =>
  `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}`;

function Dashboard() {
  const { seller, isLoading: isSellerLoading } = useSeller();

  const {
    data: products = [],
    isLoading: areProductsLoading,
    isError: isProductsError,
  } = useQuery<Product[]>({
    queryKey: ["shop-products"],
    queryFn: fetchProducts,
    staleTime: 1000 * 60 * 5,
  });

  const {
    data: orders = [],
    isLoading: areOrdersLoading,
    isError: isOrdersError,
  } = useQuery<SellerOrder[]>({
    queryKey: ["seller-orders"],
    queryFn: fetchSellerOrders,
    staleTime: 1000 * 60,
  });

  const dashboardData = useMemo(() => {
    const activeProducts = products.filter((product) => !product.isDeleted);
    const lowStockProducts = activeProducts
      .filter((product) => Number(product.stock || 0) < 10)
      .sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0));
    const revenue = orders.reduce((total, order) => total + getOrderTotal(order), 0);
    const soldItems = orders.reduce(
      (total, order) =>
        total +
        getOrderItems(order).reduce(
          (orderTotal, item) => orderTotal + getItemQuantity(item),
          0
        ),
      0
    );
    const inventoryValue = activeProducts.reduce(
      (total, product) => total + getProductPrice(product) * Number(product.stock || 0),
      0
    );
    const newestProducts = [...activeProducts]
      .sort(
        (a, b) =>
          new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      )
      .slice(0, 4);
    const recentOrders = orders.slice(0, 6);
    const monthlyRevenue = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));

      return {
        key: monthKey(date),
        label: new Intl.DateTimeFormat("en-US", { month: "short" }).format(date),
        total: 0,
      };
    });

    orders.forEach((order) => {
      const date = new Date(order.createdAt || "");

      if (Number.isNaN(date.getTime())) {
        return;
      }

      const revenueMonth = monthlyRevenue.find((item) => item.key === monthKey(date));

      if (revenueMonth) {
        revenueMonth.total += getOrderTotal(order);
      }
    });

    const maxMonthlyRevenue = Math.max(...monthlyRevenue.map((item) => item.total), 1);

    return {
      activeProducts,
      inventoryValue,
      lowStockProducts,
      maxMonthlyRevenue,
      monthlyRevenue,
      newestProducts,
      recentOrders,
      revenue,
      soldItems,
    };
  }, [orders, products]);

  const isLoading = isSellerLoading || areProductsLoading || areOrdersLoading;
  const hasError = isProductsError || isOrdersError;
  const shopName = seller?.shop?.name || seller?.name || "Seller";
  const statCards = [
    {
      title: "Total Revenue",
      value: formatCurrency(dashboardData.revenue),
      meta: `${dashboardData.soldItems} items sold`,
      Icon: DollarSign,
      iconClassName: "bg-blue-600/15 text-blue-400",
    },
    {
      title: "Total Orders",
      value: orders.length.toString(),
      meta: `${dashboardData.recentOrders.length} recent records`,
      Icon: ShoppingBag,
      iconClassName: "bg-green-600/15 text-green-400",
    },
    {
      title: "Active Products",
      value: dashboardData.activeProducts.length.toString(),
      meta: `${formatCompactCurrency(dashboardData.inventoryValue)} inventory`,
      Icon: Package,
      iconClassName: "bg-violet-600/15 text-violet-300",
    },
    {
      title: "Low Stock",
      value: dashboardData.lowStockProducts.length.toString(),
      meta: "Below 10 units",
      Icon: AlertTriangle,
      iconClassName: "bg-amber-500/15 text-amber-300",
    },
  ];

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-white">Dashboard</h2>
          <div className="mt-2 flex items-center text-white">
            <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
              Dashboard
            </Link>
            <ChevronRight size={20} className="opacity-[.8]" />
            <span>Overview</span>
          </div>
        </div>

        <div className="flex flex-wrap gap-3">
          <Link
            href="/dashboard/create-product"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500"
          >
            Add Product
            <ArrowUpRight size={16} />
          </Link>
          <Link
            href="/dashboard/orders"
            className="inline-flex h-10 items-center gap-2 rounded-md border border-slate-700 bg-gray-900 px-4 text-sm font-semibold text-white transition hover:bg-gray-800"
          >
            View Orders
            <ArrowUpRight size={16} />
          </Link>
        </div>
      </div>

      <section className="mt-6 rounded-lg border border-gray-800 bg-gray-900 p-5">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm font-medium text-gray-400">Welcome back</p>
            <h1 className="mt-1 text-2xl font-semibold text-white md:text-3xl">
              {shopName}
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-gray-400">
              {seller?.shop?.address || seller?.email || "Seller dashboard"}
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-sm sm:min-w-[280px]">
            <div className="rounded-md border border-gray-800 bg-black/25 p-3">
              <p className="text-gray-400">Shop Rating</p>
              <p className="mt-1 flex items-center gap-1 font-semibold">
                <Star size={16} fill="#facc15" className="text-yellow-400" />
                {Number(seller?.shop?.ratings || 0).toFixed(1)}
              </p>
            </div>
            <div className="rounded-md border border-gray-800 bg-black/25 p-3">
              <p className="text-gray-400">Category</p>
              <p className="mt-1 truncate font-semibold">
                {seller?.shop?.category || "General"}
              </p>
            </div>
          </div>
        </div>
      </section>

      {hasError && (
        <div className="mt-6 rounded-lg border border-red-500/40 bg-red-950/40 p-4 text-sm text-red-200">
          Dashboard data could not be fully loaded.
        </div>
      )}

      <section className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {statCards.map(({ title, value, meta, Icon, iconClassName }) => (
          <div key={title} className="rounded-lg border border-gray-800 bg-gray-900 p-5">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className="mt-3 text-2xl font-semibold text-white">
                  {isLoading ? "..." : value}
                </p>
              </div>
              <div
                className={`flex h-11 w-11 items-center justify-center rounded-md ${iconClassName}`}
              >
                <Icon size={22} />
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-400">{meta}</p>
          </div>
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1fr)_360px]">
        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Revenue Trend</h3>
              <p className="mt-1 text-sm text-gray-400">Last 6 months</p>
            </div>
            <p className="text-sm font-semibold text-gray-300">
              {formatCurrency(dashboardData.revenue)}
            </p>
          </div>

          <div className="grid h-[220px] grid-cols-6 items-end gap-3 border-b border-gray-800 pb-4">
            {dashboardData.monthlyRevenue.map((item) => {
              const height = Math.max(
                item.total === 0 ? 6 : 18,
                (item.total / dashboardData.maxMonthlyRevenue) * 100
              );

              return (
                <div key={item.key} className="flex h-full flex-col justify-end gap-3">
                  <div className="flex flex-1 items-end">
                    <div
                      className="w-full rounded-t-md bg-blue-600 transition"
                      style={{ height: `${height}%` }}
                      title={`${item.label}: ${formatCurrency(item.total)}`}
                    />
                  </div>
                  <p className="text-center text-xs font-medium text-gray-400">
                    {item.label}
                  </p>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rounded-lg border border-gray-800 bg-gray-900 p-5">
          <div className="mb-5 flex items-center justify-between gap-4">
            <div>
              <h3 className="text-lg font-semibold text-white">Inventory Watch</h3>
              <p className="mt-1 text-sm text-gray-400">Lowest stock first</p>
            </div>
            <Link
              href="/dashboard/all-products"
              className="text-blue-400 transition hover:text-blue-300"
              title="All products"
            >
              <ArrowUpRight size={18} />
            </Link>
          </div>

          <div className="space-y-4">
            {(dashboardData.lowStockProducts.length
              ? dashboardData.lowStockProducts.slice(0, 4)
              : dashboardData.newestProducts
            ).map((product) => {
              const imageUrl = getProductImage(product);

              return (
                <div key={getProductId(product)} className="flex items-center gap-3">
                  {imageUrl ? (
                    <img
                      src={imageUrl}
                      alt={product.title || "Product"}
                      className="h-12 w-12 rounded-md object-cover"
                    />
                  ) : (
                    <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-800 text-xs text-gray-400">
                      N/A
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-white">
                      {product.title || "Untitled product"}
                    </p>
                    <p className="mt-1 text-sm text-gray-400">
                      {formatCurrency(product.sale_price)} · {Number(product.stock || 0)} left
                    </p>
                  </div>
                </div>
              );
            })}

            {!isLoading &&
              dashboardData.lowStockProducts.length === 0 &&
              dashboardData.newestProducts.length === 0 && (
                <p className="rounded-md bg-gray-800 p-4 text-center text-sm text-gray-400">
                  No products found.
                </p>
              )}
          </div>
        </div>
      </section>

      <section className="mt-6 rounded-lg bg-gray-900 p-4">
        <div className="mb-4 flex items-center justify-between gap-4 px-1">
          <div>
            <h3 className="text-lg font-semibold text-white">Recent Orders</h3>
            <p className="mt-1 text-sm text-gray-400">Latest seller orders</p>
          </div>
          <Link
            href="/dashboard/orders"
            className="inline-flex items-center gap-2 text-sm font-semibold text-blue-400 transition hover:text-blue-300"
          >
            All Orders
            <ArrowUpRight size={16} />
          </Link>
        </div>

        <div className="overflow-x-auto">
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
              {areOrdersLoading && (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-gray-400">
                    Loading orders...
                  </td>
                </tr>
              )}

              {!areOrdersLoading && dashboardData.recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="p-5 text-center text-gray-400">
                    No orders found.
                  </td>
                </tr>
              )}

              {!areOrdersLoading &&
                dashboardData.recentOrders.map((order) => {
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
      </section>
    </div>
  );
}

export default Dashboard;
