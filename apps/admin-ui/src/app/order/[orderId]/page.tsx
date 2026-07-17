"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import { useParams } from "next/navigation";

type OrderItem = {
  id: string;
  title: string;
  quantity: number;
  size: string;
  price: string;
  image: string;
};

type OrderDetail = {
  id: string;
  orderId: string;
  paymentStatus: string;
  deliveryStatus: string;
  totalPaid: string;
  date: string;
  shippingAddress: {
    name: string;
    street: string;
    cityLine: string;
    country: string;
  };
  items: OrderItem[];
};

const deliverySteps = [
  "Ordered",
  "Packed",
  "Shipped",
  "Out for Delivery",
  "Delivered",
];

const fetchOrder = async (orderId: string) => {
  const response = await axios.get<{ order: OrderDetail }>(
    `/api/admin/orders/${encodeURIComponent(orderId)}`,
    {
      withCredentials: true,
    }
  );

  return response.data.order;
};

const getStepIndex = (deliveryStatus: string) => {
  const normalizedStatus = deliveryStatus.toLowerCase();
  const index = deliverySteps.findIndex(
    (step) => step.toLowerCase() === normalizedStatus
  );

  return index >= 0 ? index : 0;
};

const ProductImage = ({ item }: { item: OrderItem }) => {
  if (item.image) {
    return (
      <img
        src={item.image}
        alt={item.title}
        className="h-[72px] w-[72px] rounded-md object-cover"
      />
    );
  }

  return (
    <div className="flex h-[72px] w-[72px] items-center justify-center rounded-md bg-[#111729] text-[11px] font-semibold text-[#6f778c]">
      Item
    </div>
  );
};

const OrderDetailPage = () => {
  const params = useParams<{ orderId: string }>();
  const orderId = params.orderId;
  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["admin-order", orderId],
    queryFn: () => fetchOrder(orderId),
    enabled: Boolean(orderId),
  });
  const currentStep = order ? getStepIndex(order.deliveryStatus) : 0;

  return (
    <main className="min-h-screen bg-[#080d1d] px-6 py-14 text-white">
      <div className="mx-auto w-full max-w-[1180px]">
        {isLoading && (
          <div className="text-[15px] font-semibold text-[#aeb4c4]">
            Loading order...
          </div>
        )}

        {isError && (
          <div className="rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-[15px] font-semibold text-red-300">
            Order could not be loaded.
          </div>
        )}

        {order && (
          <>
            <h1 className="text-[26px] font-semibold leading-8 text-[#f1f2f4]">
              Order {order.orderId}
            </h1>

            <section className="mt-8">
              <div className="grid grid-cols-5 gap-0">
                {deliverySteps.map((step, index) => {
                  const isActive = index <= currentStep;
                  const labelColor =
                    index < currentStep
                      ? "text-[#55b965]"
                      : index === currentStep
                      ? "text-[#356df4]"
                      : "text-[#d9dce5]";

                  return (
                    <div key={step} className="relative">
                      <div
                        className={`mb-4 text-[13px] font-semibold ${labelColor}`}
                      >
                        {step}
                      </div>
                      <div className="relative flex items-center">
                        {index < deliverySteps.length - 1 && (
                          <div
                            className={`absolute left-3 top-1/2 h-[3px] w-full -translate-y-1/2 ${
                              index < currentStep
                                ? "bg-[#356df4]"
                                : "bg-[#e5e7eb]"
                            }`}
                          />
                        )}
                        <span
                          className={`relative z-10 h-5 w-5 rounded-full ${
                            isActive ? "bg-[#356df4]" : "bg-[#e5e7eb]"
                          }`}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>

            <section className="mt-7 space-y-2 text-[15px] font-semibold text-[#c9ceda]">
              <p>
                Payment Status:{" "}
                <span className="text-[#55b965]">{order.paymentStatus}</span>
              </p>
              <p>Total Paid: {order.totalPaid}</p>
              <p>Date: {order.date}</p>
            </section>

            <section className="mt-9">
              <h2 className="text-[17px] font-semibold text-[#d9dce5]">
                Shipping Address
              </h2>
              <div className="mt-4 space-y-1 text-[15px] font-semibold leading-5 text-[#d9dce5]">
                <p>{order.shippingAddress.name || "No address name"}</p>
                <p>{order.shippingAddress.street || "No street address"}</p>
                <p>{order.shippingAddress.cityLine}</p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </section>

            <section className="mt-9">
              <h2 className="text-[20px] font-semibold text-[#d9dce5]">
                Order Items
              </h2>

              <div className="mt-6 space-y-4">
                {order.items.length ? (
                  order.items.map((item) => (
                    <div
                      key={item.id}
                      className="flex min-h-[104px] items-center justify-between rounded-md border border-[#8c92a3] bg-transparent px-5 py-4 transition duration-150 hover:border-[#aeb7ce] hover:bg-white/[0.02]"
                    >
                      <div className="flex items-center gap-4">
                        <ProductImage item={item} />
                        <div className="space-y-1 text-[15px] font-semibold text-[#d8dce7]">
                          <p className="text-[16px] text-white">{item.title}</p>
                          <p>Quantity: {item.quantity}</p>
                          <p>Size: {item.size}</p>
                        </div>
                      </div>

                      <div className="text-[16px] font-semibold text-[#f1f2f4]">
                        {item.price}
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-md border border-[#8c92a3] px-5 py-6 text-[15px] font-semibold text-[#aeb4c4]">
                    No order items found.
                  </div>
                )}
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
};

export default OrderDetailPage;
