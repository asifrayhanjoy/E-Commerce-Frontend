"use client";

import QuickActionCard from "@/contexts/QuickActionCard";
import useUser from "@/hooks/use.User";
import { getImageUrl } from "@/utils/shopImages";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import {
  BadgeCheck,
  Bell,
  CheckCircle,
  Clock,
  Gift,
  Inbox,
  Lock,
  LogOut,
  MapPin,
  PackageCheck,
  PhoneCall,
  Receipt,
  Settings,
  ShoppingBag,
  Truck,
  User,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";

type UserAddress = {
  id?: string;
  label?: string;
  name?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
};

type OrderCartItem = {
  id?: string;
  productId?: string;
  title?: string;
  quantity?: number;
  sale_price?: number;
  images?: { url?: string }[];
  product?: {
    title?: string;
    images?: { url?: string }[];
  };
};

type TrackingStep = {
  label: string;
  completed: boolean;
  current: boolean;
};

type UserOrder = {
  id: string;
  cart: OrderCartItem[];
  itemCount?: number;
  totalAmount?: number;
  paymentStatus?: string;
  deliveryStatus?: string;
  paymentIntentId?: string | null;
  paymentSessionId?: string | null;
  createdAt?: string;
  trackingSteps?: TrackingStep[];
  shippingAddress?: UserAddress | null;
  shop?: {
    id?: string;
    name?: string;
    category?: string;
    address?: string;
    avatar?: { url?: string }[];
    sellers?: {
      name?: string;
      email?: string;
      phone_number?: string;
    };
  } | null;
};

type OrderStats = {
  totalOrders: number;
  processingOrders: number;
  completedOrders: number;
};

const emptyOrderStats: OrderStats = {
  totalOrders: 0,
  processingOrders: 0,
  completedOrders: 0,
};

const formatCurrency = (value?: number) =>
  new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
  }).format(Number(value || 0));

const formatDate = (value?: string) => {
  if (!value) {
    return "N/A";
  }

  return new Date(value).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

const getOrderDisplayId = (order?: UserOrder) =>
  order?.paymentSessionId || order?.paymentIntentId || order?.id || "";

const getAddressText = (address?: UserAddress | null) => {
  if (!address) {
    return "No shipping address found.";
  }

  return [address.street, address.city, address.zip, address.country]
    .filter(Boolean)
    .join(", ");
};

const getStatusBadgeClass = (status?: string) => {
  if (status === "Delivered" || status === "Paid") {
    return "border-emerald-100 bg-emerald-50 text-emerald-700";
  }

  if (status === "Cancelled" || status === "Failed") {
    return "border-red-100 bg-red-50 text-red-600";
  }

  return "border-blue-100 bg-blue-50 text-blue-700";
};

const getErrorMessage = (error: any) =>
  error?.response?.data?.message ||
  error?.message ||
  "Order details could not be loaded.";

interface NavItemProps {
  href: string;
  label: string;
  Icon: LucideIcon;
  active?: boolean;
  danger?: boolean;
}

function NavItem({
  href,
  label,
  Icon,
  active = false,
  danger = false,
}: NavItemProps) {
  return (
    <Link
      href={href}
      className={`flex w-full items-center gap-3 rounded-md px-4 py-3 text-left text-sm font-medium transition ${
        danger
          ? "text-red-600 hover:bg-red-50 hover:text-red-900"
          : active
          ? "bg-blue-50 text-blue-700"
          : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
      }`}
    >
      <Icon
        size={18}
        className={danger ? "text-red-500" : "text-blue-500"}
        aria-hidden="true"
      />
      {label}
    </Link>
  );
}

export default function UserOrderDetailsPage() {
  const params = useParams();
  const routeOrderId = params?.orderId;
  const orderId = Array.isArray(routeOrderId)
    ? routeOrderId[0]
    : String(routeOrderId || "");
  const { user, isLoading: isUserLoading } = useUser();

  const {
    data: orderStats = emptyOrderStats,
    isLoading: isStatsLoading,
  } = useQuery({
    queryKey: ["my-orders", "stats"],
    enabled: Boolean(user),
    queryFn: async () => {
      const response = await axios.get("/api/order/my-orders");

      return {
        ...emptyOrderStats,
        ...(response.data?.stats || {}),
      } as OrderStats;
    },
    staleTime: 1000 * 60,
  });

  const {
    data: order,
    isLoading: isOrderLoading,
    isError: isOrderError,
    error,
  } = useQuery({
    queryKey: ["my-order", orderId],
    enabled: Boolean(user && orderId),
    queryFn: async () => {
      const response = await axios.get(
        `/api/order/my-orders/${encodeURIComponent(orderId)}`
      );

      return response.data?.order as UserOrder;
    },
    staleTime: 1000 * 60,
  });

  const stats = [
    { title: "Total Orders", count: orderStats.totalOrders, Icon: Clock },
    {
      title: "Processing Orders",
      count: orderStats.processingOrders,
      Icon: Truck,
    },
    {
      title: "Completed Orders",
      count: orderStats.completedOrders,
      Icon: CheckCircle,
    },
  ];
  const shopAvatarUrl = getImageUrl(order?.shop?.avatar);

  if (!isUserLoading && !user) {
    return (
      <main className="min-h-[70vh] bg-gray-50 p-6">
        <section className="mx-auto flex min-h-[320px] max-w-3xl items-center justify-center rounded-md bg-white text-center shadow-sm">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Account</h1>
            <p className="mt-2 text-sm font-semibold text-gray-500">
              Sign in to view your order details.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex h-11 items-center rounded-md bg-blue-600 px-5 text-sm font-bold text-white"
            >
              Sign In
            </Link>
          </div>
        </section>
      </main>
    );
  }

  return (
    <main className="bg-gray-50 p-6 pb-14">
      <div className="mx-auto max-w-[1488px]">
        <div className="mb-[54px] text-center text-2xl font-bold">
          <h1 className="text-[32px] font-bold leading-none text-gray-800">
            Welcome back,{" "}
            <span className="text-blue-600">
              {isUserLoading ? "User" : user?.name || "User"}
            </span>{" "}
            👋
          </h1>
        </div>

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 md:grid-cols-3">
          {stats.map(({ title, count, Icon }) => (
            <div
              key={title}
              className="flex min-h-[104px] items-center justify-between rounded bg-white px-6 py-6 shadow-sm"
            >
              <div>
                <p className="text-sm font-medium text-gray-400">{title}</p>
                <p className="mt-1 text-2xl font-bold leading-none text-gray-900">
                  {isStatsLoading ? "..." : count}
                </p>
              </div>

              <Icon
                size={44}
                strokeWidth={1.8}
                className="text-blue-500"
                aria-hidden="true"
              />
            </div>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-7 md:flex-row">
          <aside className="w-full rounded-md border border-gray-100 bg-white p-5 shadow-md md:w-[300px]">
            <nav className="space-y-2">
              <NavItem href="/profile?active=Profile" label="Profile" Icon={User} />
              <NavItem
                href="/profile?active=My%20Orders"
                label="My Orders"
                Icon={ShoppingBag}
                active
              />
              <NavItem href="/inbox" label="Inbox" Icon={Inbox} />
              <NavItem
                href="/profile?active=Notifications"
                label="Notifications"
                Icon={Bell}
              />
              <NavItem
                href="/profile?active=Shipping%20Address"
                label="Shipping Address"
                Icon={MapPin}
              />
              <NavItem
                href="/profile?active=Change%20Password"
                label="Change Password"
                Icon={Lock}
              />
              <NavItem href="/login" label="Logout" Icon={LogOut} danger />
            </nav>
          </aside>

          <section className="min-h-[520px] w-full rounded bg-white px-7 py-8 shadow-[0_2px_10px_rgba(15,23,42,0.12)] md:w-[820px] md:flex-none">
            {isOrderLoading ? (
              <div className="flex h-[420px] items-center justify-center text-[17px] font-semibold text-gray-700">
                Loading order details...
              </div>
            ) : isOrderError || !order ? (
              <div className="flex h-[420px] items-center justify-center text-center">
                <div>
                  <h2 className="text-[25px] font-bold text-gray-900">
                    Order not found
                  </h2>
                  <p className="mt-2 text-sm font-semibold text-red-600">
                    {getErrorMessage(error)}
                  </p>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex flex-col gap-4 border-b border-gray-100 pb-6 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <h2 className="text-[25px] font-bold leading-none text-gray-900">
                      Order Details
                    </h2>
                    <p className="mt-3 text-sm font-semibold text-gray-500">
                      #{getOrderDisplayId(order).slice(-8).toUpperCase()}
                    </p>
                    <p className="mt-1 text-sm font-semibold text-gray-500">
                      Placed on {formatDate(order.createdAt)}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                        order.paymentStatus
                      )}`}
                    >
                      {order.paymentStatus || "Paid"}
                    </span>
                    <span
                      className={`inline-flex rounded-full border px-3 py-1 text-xs font-bold ${getStatusBadgeClass(
                        order.deliveryStatus
                      )}`}
                    >
                      {order.deliveryStatus || "Ordered"}
                    </span>
                  </div>
                </div>

                <div className="mt-7 grid gap-5 sm:grid-cols-3">
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Total
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {formatCurrency(order.totalAmount)}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Items
                    </p>
                    <p className="mt-2 text-xl font-bold text-gray-900">
                      {order.itemCount || 0}
                    </p>
                  </div>
                  <div className="rounded-md border border-gray-100 bg-gray-50 p-4">
                    <p className="text-xs font-bold uppercase text-gray-400">
                      Shop
                    </p>
                    <p className="mt-2 truncate text-xl font-bold text-gray-900">
                      {order.shop?.name || "Shop"}
                    </p>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900">
                    Tracking
                  </h3>
                  <div className="mt-5 grid gap-3 md:grid-cols-5">
                    {(order.trackingSteps || []).map((step) => (
                      <div
                        key={step.label}
                        className={`rounded-md border px-3 py-4 ${
                          step.completed
                            ? "border-blue-100 bg-blue-50"
                            : "border-gray-100 bg-gray-50"
                        }`}
                      >
                        <PackageCheck
                          size={22}
                          className={
                            step.completed ? "text-blue-600" : "text-gray-300"
                          }
                          aria-hidden="true"
                        />
                        <p
                          className={`mt-3 text-sm font-bold ${
                            step.current
                              ? "text-blue-700"
                              : step.completed
                              ? "text-gray-900"
                              : "text-gray-400"
                          }`}
                        >
                          {step.label}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-8 grid gap-5 md:grid-cols-2">
                  <div className="rounded-md border border-gray-100 p-4">
                    <h3 className="text-base font-bold text-gray-900">
                      Shipping Address
                    </h3>
                    <p className="mt-3 text-sm font-semibold leading-6 text-gray-600">
                      {order.shippingAddress?.name && (
                        <>
                          {order.shippingAddress.name}
                          <br />
                        </>
                      )}
                      {getAddressText(order.shippingAddress)}
                    </p>
                  </div>

                  <div className="rounded-md border border-gray-100 p-4">
                    <h3 className="text-base font-bold text-gray-900">
                      Seller
                    </h3>
                    <div className="mt-4 flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md bg-gray-100">
                        {shopAvatarUrl ? (
                          <img
                            src={shopAvatarUrl}
                            alt={order.shop?.name || "Shop"}
                            className="h-full w-full rounded-md object-cover"
                          />
                        ) : (
                          <ShoppingBag
                            size={22}
                            className="text-gray-300"
                            aria-hidden="true"
                          />
                        )}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold text-gray-900">
                          {order.shop?.name || "Shop"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {order.shop?.category || "Seller shop"}
                        </p>
                        <p className="mt-1 text-xs font-semibold text-gray-500">
                          {order.shop?.address || "Shop address unavailable"}
                        </p>
                        {order.shop?.id && (
                          <Link
                            href={`/shops/${order.shop.id}`}
                            className="mt-2 inline-flex text-xs font-bold text-blue-600"
                          >
                            Visit Shop
                          </Link>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="mt-8">
                  <h3 className="text-lg font-bold text-gray-900">
                    Ordered Items
                  </h3>
                  <div className="mt-4 divide-y divide-gray-100 rounded-md border border-gray-100">
                    {order.cart.map((item, index) => {
                      const imageUrl = getImageUrl(
                        item.images,
                        item.product?.images
                      );
                      const title =
                        item.title || item.product?.title || "Product";

                      return (
                        <div
                          key={`${item.id || item.productId || title}-${index}`}
                          className="flex items-center gap-4 px-4 py-4"
                        >
                          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md bg-gray-100">
                            {imageUrl ? (
                              <img
                                src={imageUrl}
                                alt={title}
                                className="h-full w-full rounded-md object-cover"
                              />
                            ) : (
                              <ShoppingBag
                                size={22}
                                className="text-gray-300"
                                aria-hidden="true"
                              />
                            )}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-bold text-gray-900">
                              {title}
                            </p>
                            <p className="mt-1 text-xs font-semibold text-gray-500">
                              Quantity: {item.quantity || 0}
                            </p>
                          </div>
                          <p className="text-sm font-bold text-gray-900">
                            {formatCurrency(item.sale_price)}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </section>

          <aside className="w-full space-y-4 md:w-1/4">
            <QuickActionCard
              Icon={Gift}
              title="Referral Program"
              description="Invite friends and earn rewards."
            />
            <QuickActionCard
              Icon={BadgeCheck}
              title="Your Badges"
              description="View your earned achievements."
            />
            <QuickActionCard
              Icon={Settings}
              title="Account Settings"
              description="Manage preferences and security."
            />
            <QuickActionCard
              Icon={Receipt}
              title="Billing History"
              description="Check your recent payments."
            />
            <QuickActionCard
              Icon={PhoneCall}
              title="Support Center"
              description="Need help? Contact support."
            />
          </aside>
        </div>
      </div>
    </main>
  );
}
