"use client";

import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { ChevronRight, Eye, Search } from "lucide-react";

type PaymentBuyer = {
  id?: string;
  name?: string;
  email?: string;
};

type SellerPayment = {
  id?: string;
  orderId?: string;
  buyer?: PaymentBuyer;
  buyerName?: string;
  buyerEmail?: string | null;
  totalAmount?: number | string;
  sellerEarning?: number | string;
  adminFee?: number | string;
  status?: string;
  paymentIntentId?: string | null;
  paymentSessionId?: string | null;
  createdAt?: string;
  updatedAt?: string;
};

const fetchSellerPayments = async () => {
  const response = await axios.get("/api/order/get-Seller-Payments", {
    withCredentials: true,
  });

  return Array.isArray(response.data?.payments)
    ? (response.data.payments as SellerPayment[])
    : [];
};

const toFiniteNumber = (value: number | string | undefined) => {
  const amount = Number(value || 0);

  return Number.isFinite(amount) ? amount : 0;
};

const formatCurrency = (value: number | string | undefined) =>
  `$${toFiniteNumber(value).toFixed(2)}`;

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

const getPaymentOrderId = (payment: SellerPayment) =>
  payment.orderId || payment.id || payment.paymentSessionId || "order";

const formatOrderId = (payment: SellerPayment) =>
  `#${getPaymentOrderId(payment).slice(-6).toUpperCase()}`;

const getBuyerName = (payment: SellerPayment) =>
  payment.buyerName ||
  payment.buyer?.name ||
  payment.buyerEmail ||
  payment.buyer?.email ||
  "Unknown Buyer";

const getPaymentStatus = (payment: SellerPayment) => payment.status || "Paid";

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

function PaymentsPage() {
  const [globalFilter, setGlobalFilter] = useState("");

  const {
    data: payments = [],
    isLoading,
    isError,
  } = useQuery<SellerPayment[]>({
    queryKey: ["seller-payments"],
    queryFn: fetchSellerPayments,
    staleTime: 1000 * 60,
  });

  const filteredPayments = useMemo(() => {
    const normalizedFilter = globalFilter.trim().toLowerCase();

    if (!normalizedFilter) {
      return payments;
    }

    return payments.filter((payment) => {
      const searchableValue = [
        formatOrderId(payment),
        getBuyerName(payment),
        formatCurrency(payment.sellerEarning),
        formatCurrency(payment.adminFee),
        getPaymentStatus(payment),
        formatDate(payment.createdAt),
      ]
        .join(" ")
        .toLowerCase();

      return searchableValue.includes(normalizedFilter);
    });
  }, [globalFilter, payments]);

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <h2 className="text-2xl font-semibold text-white">Payments</h2>

      <div className="mt-2 flex items-center text-white">
        <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Payments</span>
      </div>

      <div className="mt-6 mb-5 flex h-12 items-center rounded-md bg-gray-900 px-3">
        <Search size={20} className="mr-2 shrink-0 text-gray-400" />
        <input
          type="text"
          placeholder="Search payments..."
          className="w-full bg-transparent text-white outline-none placeholder:text-gray-400"
          value={globalFilter}
          onChange={(event) => setGlobalFilter(event.target.value)}
        />
      </div>

      <div className="overflow-x-auto rounded-lg bg-gray-900 p-4">
        <table className="w-full min-w-[980px] table-fixed text-white">
          <thead>
            <tr className="border-b border-gray-800">
              <th className="w-[13%] p-3 text-left text-sm font-semibold">
                Order ID
              </th>
              <th className="w-[19%] p-3 text-left text-sm font-semibold">
                Buyer
              </th>
              <th className="w-[18%] p-3 text-left text-sm font-semibold">
                Seller Earning
              </th>
              <th className="w-[16%] p-3 text-left text-sm font-semibold">
                Admin Fee
              </th>
              <th className="w-[11%] p-3 text-left text-sm font-semibold">
                Status
              </th>
              <th className="w-[15%] p-3 text-left text-sm font-semibold">
                Date
              </th>
              <th className="w-[8%] p-3 text-left text-sm font-semibold">
                Actions
              </th>
            </tr>
          </thead>

          <tbody>
            {isLoading && (
              <tr>
                <td colSpan={7} className="p-5 text-center text-gray-400">
                  Loading payments...
                </td>
              </tr>
            )}

            {isError && !isLoading && (
              <tr>
                <td colSpan={7} className="p-5 text-center text-red-400">
                  Failed to load payments.
                </td>
              </tr>
            )}

            {!isLoading && !isError && filteredPayments.length === 0 && (
              <tr>
                <td colSpan={7} className="p-5 text-center text-gray-400">
                  No payments found.
                </td>
              </tr>
            )}

            {!isLoading &&
              !isError &&
              filteredPayments.map((payment) => {
                const status = getPaymentStatus(payment);

                return (
                  <tr
                    key={getPaymentOrderId(payment)}
                    className="border-b border-gray-800 transition last:border-b-0 hover:bg-gray-800/40"
                  >
                    <td className="p-3 text-sm font-semibold text-gray-300">
                      {formatOrderId(payment)}
                    </td>
                    <td className="truncate p-3 text-sm font-semibold text-gray-300">
                      {getBuyerName(payment)}
                    </td>
                    <td className="p-3 text-sm font-semibold text-green-500">
                      {formatCurrency(payment.sellerEarning)}
                    </td>
                    <td className="p-3 text-sm font-semibold text-yellow-500">
                      {formatCurrency(payment.adminFee)}
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
                      {formatDate(payment.createdAt)}
                    </td>
                    <td className="p-3">
                      <Link
                        href={`/dashboard/orders/${encodeURIComponent(
                          getPaymentOrderId(payment)
                        )}`}
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

export default PaymentsPage;
