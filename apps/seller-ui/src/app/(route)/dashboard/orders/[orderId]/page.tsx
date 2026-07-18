"use client";

import { useEffect, useMemo, useState } from "react";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Check, ChevronRight, Package, Save } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

const DELIVERY_STEPS = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
] as const;

type DeliveryStatus = (typeof DELIVERY_STEPS)[number];

type OrderUser = {
  id?: string;
  name?: string;
  email?: string;
  avatar?: string;
};

type OrderShop = {
  id?: string;
  name?: string;
  address?: string;
  category?: string;
};

type ShippingAddress = {
  id?: string;
  label?: string;
  name?: string;
  street?: string;
  city?: string;
  zip?: string;
  country?: string;
  isDefault?: boolean;
};

type OrderCartItem = {
  id?: string;
  _id?: string;
  title?: string;
  name?: string;
  quantity?: number | string;
  sale_price?: number | string;
  price?: number | string;
  image?: string;
  images?: { url?: string; file_url?: string }[];
  selectedOptions?: Record<string, string>;
  product?: {
    id?: string;
    _id?: string;
    title?: string;
    name?: string;
    sale_price?: number | string;
    price?: number | string;
    image?: string;
    images?: { url?: string; file_url?: string }[];
  };
};

type SellerOrder = {
  id?: string;
  _id?: string;
  user?: OrderUser;
  shop?: OrderShop;
  shippingAddress?: ShippingAddress | null;
  cart?: OrderCartItem[] | string | null;
  coupon?: unknown;
  totalAmount?: number | string;
  paymentIntentId?: string | null;
  paymentSessionId?: string | null;
  paymentStatus?: string;
  deliveryStatus?: string;
  shippingAddressId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const isDeliveryStatus = (value: string): value is DeliveryStatus =>
  DELIVERY_STEPS.includes(value as DeliveryStatus);

const normalizeDeliveryStatus = (value?: string | null): DeliveryStatus =>
  value && isDeliveryStatus(value) ? value : "Ordered";

const fetchSellerOrder = async (orderId: string) => {
  const response = await axiosInstance.get(
    `/api/order/get-Seller-Order/${encodeURIComponent(orderId)}`,
    { withCredentials: true }
  );

  return response.data?.order as SellerOrder;
};

const updateDeliveryStatus = async ({
  orderId,
  deliveryStatus,
}: {
  orderId: string;
  deliveryStatus: DeliveryStatus;
}) => {
  const response = await axiosInstance.patch(
    `/api/order/get-Seller-Order/${encodeURIComponent(orderId)}/delivery-status`,
    { deliveryStatus },
    { withCredentials: true }
  );

  return response.data?.order as SellerOrder;
};

const formatCurrency = (value: number | string | undefined) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 2,
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

  const day = String(date.getUTCDate()).padStart(2, "0");
  const month = String(date.getUTCMonth() + 1).padStart(2, "0");
  const year = date.getUTCFullYear();

  return `${day}/${month}/${year}`;
};

const getOrderItems = (order?: SellerOrder) => {
  if (!order) {
    return [];
  }

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

const getItemTitle = (item: OrderCartItem) =>
  item.title || item.name || item.product?.title || item.product?.name || "Product";

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

const getItemImage = (item: OrderCartItem) =>
  item.image ||
  item.images?.[0]?.url ||
  item.images?.[0]?.file_url ||
  item.product?.image ||
  item.product?.images?.[0]?.url ||
  item.product?.images?.[0]?.file_url ||
  "";

const getOrderTotal = (order?: SellerOrder) => {
  if (!order) {
    return 0;
  }

  const totalAmount = Number(order.totalAmount);

  if (Number.isFinite(totalAmount)) {
    return totalAmount;
  }

  return getOrderItems(order).reduce(
    (total, item) => total + getItemPrice(item) * getItemQuantity(item),
    0
  );
};

const getOrderId = (order?: SellerOrder) =>
  order?.id || order?._id || order?.paymentSessionId || "order";

const formatOrderId = (order?: SellerOrder, fallback?: string) =>
  `#${(order ? getOrderId(order) : fallback || "order").slice(-6).toUpperCase()}`;

const getPaymentStatus = (order?: SellerOrder) => {
  if (order?.paymentStatus) {
    return order.paymentStatus;
  }

  return order?.paymentIntentId ? "Paid" : "Pending";
};

const getShippingLines = (address?: ShippingAddress | null) => {
  if (!address) {
    return [];
  }

  const cityLine = [address.city, address.zip].filter(Boolean).join(", ");

  return [address.label, address.name, address.street, cityLine, address.country].filter(
    Boolean
  );
};

function OrderDetailsPage() {
  const params = useParams<{ orderId?: string | string[] }>();
  const queryClient = useQueryClient();
  const orderIdParam = params.orderId;
  const orderId = Array.isArray(orderIdParam) ? orderIdParam[0] : orderIdParam || "";
  const [selectedDeliveryStatus, setSelectedDeliveryStatus] =
    useState<DeliveryStatus>("Ordered");

  const {
    data: order,
    isLoading,
    isError,
  } = useQuery<SellerOrder>({
    queryKey: ["seller-order", orderId],
    queryFn: () => fetchSellerOrder(orderId),
    enabled: Boolean(orderId),
    staleTime: 1000 * 60,
  });

  const deliveryMutation = useMutation({
    mutationFn: updateDeliveryStatus,
    onSuccess: (updatedOrder) => {
      queryClient.setQueryData(["seller-order", orderId], updatedOrder);
      queryClient.invalidateQueries({ queryKey: ["seller-orders"] });
      setSelectedDeliveryStatus(normalizeDeliveryStatus(updatedOrder.deliveryStatus));
    },
  });

  useEffect(() => {
    if (order) {
      setSelectedDeliveryStatus(normalizeDeliveryStatus(order.deliveryStatus));
    }
  }, [order]);

  const items = useMemo(() => getOrderItems(order), [order]);
  const total = getOrderTotal(order);
  const savedDeliveryStatus = normalizeDeliveryStatus(order?.deliveryStatus);
  const activeStepIndex = DELIVERY_STEPS.indexOf(selectedDeliveryStatus);
  const progressPercent =
    activeStepIndex <= 0
      ? 0
      : (activeStepIndex / (DELIVERY_STEPS.length - 1)) * 100;
  const shippingLines = getShippingLines(order?.shippingAddress);
  const canUpdate =
    Boolean(orderId) &&
    Boolean(order) &&
    selectedDeliveryStatus !== savedDeliveryStatus &&
    !deliveryMutation.isPending;

  const handleUpdateDeliveryStatus = () => {
    if (!canUpdate) {
      return;
    }

    deliveryMutation.mutate({
      orderId,
      deliveryStatus: selectedDeliveryStatus,
    });
  };

  return (
    <div className="min-h-screen w-full bg-[#080d1d] p-6 text-white md:p-12">
      <div className="mx-auto max-w-6xl">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-semibold text-gray-300 transition hover:text-white"
        >
          <ArrowLeft size={18} />
          Go Back to Dashboard
        </Link>

        {isLoading && (
          <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
            Loading order details...
          </div>
        )}

        {isError && !isLoading && (
          <div className="mt-8 rounded-lg border border-red-500/40 bg-red-950/40 p-5 text-sm text-red-200">
            Order details could not be loaded.
          </div>
        )}

        {!isLoading && !isError && !order && (
          <div className="mt-8 rounded-lg border border-gray-800 bg-gray-900 p-6 text-sm text-gray-400">
            Order not found.
          </div>
        )}

        {order && (
          <>
            <div className="mt-8">
              <div className="flex flex-wrap items-center gap-2 text-sm text-gray-400">
                <Link href="/dashboard/orders" className="text-[#80Deea]">
                  All Orders
                </Link>
                <ChevronRight size={18} />
                <span>{formatOrderId(order)}</span>
              </div>

              <h1 className="mt-4 text-3xl font-semibold text-white">
                Order {formatOrderId(order)}
              </h1>
            </div>

            <section className="mt-6">
              <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                <label
                  htmlFor="delivery-status"
                  className="text-sm font-semibold text-gray-300"
                >
                  Update Delivery Status:
                </label>
                <select
                  id="delivery-status"
                  value={selectedDeliveryStatus}
                  onChange={(event) =>
                    setSelectedDeliveryStatus(
                      normalizeDeliveryStatus(event.target.value)
                    )
                  }
                  className="h-10 w-full rounded-md border border-gray-600 bg-[#0b1022] px-3 text-sm font-semibold text-white outline-none transition focus:border-blue-500 sm:w-48"
                >
                  {DELIVERY_STEPS.map((step) => (
                    <option key={step} value={step}>
                      {step}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  disabled={!canUpdate}
                  onClick={handleUpdateDeliveryStatus}
                  className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-blue-600 px-4 text-sm font-semibold text-white transition hover:bg-blue-500 disabled:cursor-not-allowed disabled:bg-gray-700 disabled:text-gray-400"
                >
                  <Save size={16} />
                  {deliveryMutation.isPending ? "Updating..." : "Update Order"}
                </button>
              </div>

              {deliveryMutation.isError && (
                <p className="mt-3 text-sm text-red-300">
                  Delivery status could not be updated.
                </p>
              )}

              {deliveryMutation.isSuccess &&
                selectedDeliveryStatus === savedDeliveryStatus && (
                  <p className="mt-3 text-sm text-green-300">
                    Delivery status updated.
                  </p>
                )}

              <div className="mt-8">
                <div className="relative px-3">
                  <div className="absolute left-3 right-3 top-[34px] h-1 rounded-full bg-gray-300" />
                  <div
                    className="absolute left-3 top-[34px] h-1 rounded-full bg-blue-600 transition-all"
                    style={{ width: `calc(${progressPercent}% - 0px)` }}
                  />
                  <div className="relative grid grid-cols-5 gap-2">
                    {DELIVERY_STEPS.map((step, index) => {
                      const isComplete = index <= activeStepIndex;
                      const isActive = index === activeStepIndex;

                      return (
                        <div key={step} className="flex flex-col items-center gap-4">
                          <p
                            className={`min-h-5 text-center text-xs font-semibold md:text-sm ${
                              isComplete ? "text-blue-400" : "text-gray-400"
                            }`}
                          >
                            {step}
                          </p>
                          <div
                            className={`z-10 flex h-5 w-5 items-center justify-center rounded-full ring-2 ring-[#080d1d] ${
                              isComplete ? "bg-blue-600" : "bg-gray-300"
                            }`}
                          >
                            {isActive && <Check size={13} className="text-white" />}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            <section className="mt-8 space-y-8">
              <div className="space-y-2 text-base font-semibold text-gray-200">
                <p>
                  Payment Status:{" "}
                  <span className="text-green-400">{getPaymentStatus(order)}</span>
                </p>
                <p>Total Paid: {formatCurrency(total)}</p>
                <p>Date: {formatDate(order.createdAt)}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-white">Shipping Address</h2>
                <div className="mt-3 space-y-1 text-sm font-medium text-gray-300">
                  {shippingLines.length > 0 ? (
                    shippingLines.map((line) => <p key={line}>{line}</p>)
                  ) : (
                    <p>
                      {order.shippingAddressId
                        ? `Address ID: ${order.shippingAddressId}`
                        : "No shipping address found."}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h2 className="text-2xl font-semibold text-white">Order Items</h2>
                <div className="mt-5 space-y-4">
                  {items.length === 0 && (
                    <div className="rounded-lg border border-gray-700 p-5 text-center text-sm text-gray-400">
                      No items available.
                    </div>
                  )}

                  {items.map((item, index) => {
                    const quantity = getItemQuantity(item);
                    const price = getItemPrice(item);
                    const imageUrl = getItemImage(item);
                    const options = item.selectedOptions
                      ? Object.entries(item.selectedOptions)
                      : [];

                    return (
                      <div
                        key={item.id || item._id || `${getItemTitle(item)}-${index}`}
                        className="flex items-center justify-between gap-5 rounded-lg border border-gray-500/80 bg-transparent p-4"
                      >
                        <div className="flex min-w-0 items-center gap-4">
                          {imageUrl ? (
                            <img
                              src={imageUrl}
                              alt={getItemTitle(item)}
                              className="h-20 w-20 rounded-md bg-white object-cover"
                            />
                          ) : (
                            <div className="flex h-20 w-20 items-center justify-center rounded-md bg-white/90 text-gray-700">
                              <Package size={26} />
                            </div>
                          )}

                          <div className="min-w-0">
                            <h3 className="truncate text-lg font-semibold text-white">
                              {getItemTitle(item)}
                            </h3>
                            <p className="mt-1 text-sm font-semibold text-gray-300">
                              Quantity: {quantity}
                            </p>
                            {options.length > 0 && (
                              <div className="mt-1 space-y-1 text-sm font-semibold text-gray-400">
                                {options.map(([key, value]) => (
                                  <p key={key}>
                                    {key}: {value}
                                  </p>
                                ))}
                              </div>
                            )}
                          </div>
                        </div>

                        <p className="shrink-0 text-base font-semibold text-white">
                          {formatCurrency(price * quantity)}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            </section>
          </>
        )}
      </div>
    </div>
  );
}

export default OrderDetailsPage;
