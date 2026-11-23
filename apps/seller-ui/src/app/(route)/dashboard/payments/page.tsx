"use client";

import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { ChevronRight, Eye, Search, Trash2 } from "lucide-react";
import axiosInstance from "@/utils/axiosInstance";

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

type PayoutGateway = "STRIPE" | "BANK_TRANSFER" | "BKASH" | "NAGAD";

type SellerPayoutMethod = {
  id: string;
  method: PayoutGateway;
  label?: string | null;
  maskedPaymentIdentifier?: string | null;
  bankName?: string | null;
  accountHolderName?: string | null;
  isDefault: boolean;
};

const fetchSellerPayments = async () => {
  const response = await axiosInstance.get("/api/order/get-Seller-Payments", {
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
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState("");
  const [payoutMethod, setPayoutMethod] = useState("BKASH");
  const [selectedPayoutMethodId, setSelectedPayoutMethodId] = useState("");
  const [newPayoutMethod, setNewPayoutMethod] =
    useState<PayoutGateway>("BANK_TRANSFER");
  const [payoutLabel, setPayoutLabel] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolderName, setAccountHolderName] = useState("");
  const [accountLast4, setAccountLast4] = useState("");
  const [walletNumber, setWalletNumber] = useState("");
  const [stripeAccountId, setStripeAccountId] = useState("");
  const [isDefaultPayoutMethod, setIsDefaultPayoutMethod] = useState(false);
  const [payoutMethodMessage, setPayoutMethodMessage] = useState("");
  const queryClient = useQueryClient();

  const { data: earnings } = useQuery({
    queryKey: ["seller-earnings"],
    queryFn: async () => (await axiosInstance.get("/api/v1/seller/earnings-summary", { withCredentials: true })).data,
  });
  const payoutMutation = useMutation({
    mutationFn: async () =>
      axiosInstance.post(
        "/api/v1/seller/payout-requests",
        {
          amount: Number(payoutAmount),
          method: payoutMethod,
          payoutMethodId: selectedPayoutMethodId || undefined,
        },
        { withCredentials: true }
      ),
    onSuccess: () => {
      setShowPayoutModal(false);
      setPayoutAmount("");
      queryClient.invalidateQueries({ queryKey: ["seller-earnings"] });
    },
  });
  const {
    data: payoutMethods = [],
    isLoading: isPayoutMethodsLoading,
    isError: isPayoutMethodsError,
    refetch: refetchPayoutMethods,
  } = useQuery<SellerPayoutMethod[]>({
    queryKey: ["seller-payout-methods"],
    queryFn: async () =>
      (await axiosInstance.get("/api/v1/seller/payout-methods", { withCredentials: true }))
        .data?.methods || [],
  });
  const addPayoutMethodMutation = useMutation({
    mutationFn: async () => {
      const details: Record<string, unknown> = {
        method: newPayoutMethod,
        label: payoutLabel.trim() || undefined,
        isDefault: isDefaultPayoutMethod,
      };
      if (newPayoutMethod === "STRIPE") {
        details.providerAccountId = stripeAccountId.trim();
      } else if (newPayoutMethod === "BANK_TRANSFER") {
        details.bankName = bankName.trim();
        details.accountHolderName = accountHolderName.trim();
        details.accountLast4 = accountLast4;
      } else {
        details.walletNumber = walletNumber;
      }
      return axiosInstance.post("/api/v1/seller/payout-methods", details, {
        withCredentials: true,
      });
    },
    onSuccess: async () => {
      setPayoutMethodMessage("Payout destination saved as a masked demo record.");
      setPayoutLabel("");
      setBankName("");
      setAccountHolderName("");
      setAccountLast4("");
      setWalletNumber("");
      setStripeAccountId("");
      setIsDefaultPayoutMethod(false);
      await refetchPayoutMethods();
    },
    onError: () => {
      setPayoutMethodMessage("Could not save this payout destination. Check the details and try again.");
    },
  });
  const deletePayoutMethodMutation = useMutation({
    mutationFn: async (methodId: string) =>
      axiosInstance.delete(
        `/api/v1/seller/payout-methods/${encodeURIComponent(methodId)}`,
        { withCredentials: true }
      ),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["seller-payout-methods"] });
      setSelectedPayoutMethodId("");
    },
  });

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
  const availablePayoutMethods = payoutMethods.filter(
    (method) => method.method === payoutMethod
  );

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

      <div className="mt-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          ["Gross sales", earnings?.grossSales],
          ["Platform fees", earnings?.platformFees],
          ["Available balance", earnings?.netAvailableBalance],
          ["Pending withdrawals", earnings?.pendingClearance],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-gray-800 bg-gray-900 p-4">
            <p className="text-sm text-gray-400">{label}</p>
            <p className="mt-2 text-2xl font-semibold">${Number(value || 0).toFixed(2)}</p>
          </div>
        ))}
      </div>

      <button type="button" onClick={() => setShowPayoutModal(true)} className="mt-5 h-11 rounded-lg bg-emerald-600 px-5 text-sm font-semibold text-white">
        Request payout
      </button>

      {showPayoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="w-full max-w-md rounded-lg border border-gray-700 bg-gray-900 p-5">
            <h3 className="text-lg font-semibold">Request payout</h3>
            <label className="mt-4 block text-sm text-gray-300">Amount</label>
            <input type="number" min="1" value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3" />
            <label className="mt-4 block text-sm text-gray-300">Method</label>
            <select value={payoutMethod} onChange={(event) => {
              setPayoutMethod(event.target.value);
              setSelectedPayoutMethodId("");
            }} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3">
              <option value="STRIPE">Stripe</option>
              <option value="BKASH">bKash</option>
              <option value="NAGAD">Nagad</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
            </select>
            <label className="mt-4 block text-sm text-gray-300">Payout destination</label>
            <select
              value={selectedPayoutMethodId}
              onChange={(event) => setSelectedPayoutMethodId(event.target.value)}
              className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3"
              disabled={isPayoutMethodsLoading || isPayoutMethodsError || availablePayoutMethods.length === 0}
            >
              <option value="">
                {isPayoutMethodsLoading
                  ? "Loading destinations..."
                  : isPayoutMethodsError
                    ? "Destinations unavailable"
                    : "Select saved destination"}
              </option>
              {availablePayoutMethods.map((method) => (
                <option key={method.id} value={method.id}>
                  {method.label || method.method} · {method.maskedPaymentIdentifier || "Masked destination"}
                  {method.isDefault ? " · Default" : ""}
                </option>
              ))}
            </select>
            {availablePayoutMethods.length === 0 && !isPayoutMethodsLoading && (
              <p className="mt-2 text-xs text-amber-300">
                {isPayoutMethodsError
                  ? "Could not load saved destinations. Refresh before requesting a withdrawal."
                  : "Add a payout destination below before requesting a withdrawal."}
              </p>
            )}
            {payoutMutation.isError && <p className="mt-3 text-sm text-red-400">Payout request could not be created.</p>}
            <div className="mt-5 flex justify-end gap-3">
              <button type="button" onClick={() => setShowPayoutModal(false)} className="h-10 rounded-md border border-gray-700 px-4 text-sm">Cancel</button>
              <button type="button" disabled={!payoutAmount || !selectedPayoutMethodId || payoutMutation.isPending} onClick={() => payoutMutation.mutate()} className="h-10 rounded-md bg-emerald-600 px-4 text-sm font-semibold disabled:opacity-50">
                Submit
              </button>
            </div>
          </div>
        </div>
      )}

      <section className="mt-6 grid gap-6 rounded-lg border border-gray-800 bg-gray-900 p-5 lg:grid-cols-[minmax(0,1fr)_minmax(320px,0.8fr)]">
        <div>
          <h3 className="text-lg font-semibold">Saved payout destinations</h3>
          <p className="mt-1 text-sm leading-6 text-gray-400">
            Demo records retain masked previews only. No full bank account, card number, PIN, or OTP is stored.
          </p>
          <div className="mt-4 space-y-3">
            {isPayoutMethodsLoading && (
              <p className="text-sm text-gray-400">Loading payout destinations...</p>
            )}
            {isPayoutMethodsError && (
              <p role="alert" className="rounded-md border border-red-800 bg-red-950/30 p-4 text-sm text-red-300">
                Payout destinations could not be loaded.
              </p>
            )}
            {!isPayoutMethodsLoading && !isPayoutMethodsError && payoutMethods.length === 0 && (
              <p className="rounded-md border border-dashed border-gray-700 p-4 text-sm text-gray-400">
                No payout destinations saved.
              </p>
            )}
            {payoutMethods.map((method) => (
              <div
                key={method.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-800 bg-black/40 p-4"
              >
                <div>
                  <p className="text-sm font-semibold text-white">
                    {method.label || method.method}
                    {method.isDefault && (
                      <span className="ml-2 rounded-full bg-emerald-950 px-2 py-1 text-[10px] font-bold text-emerald-300">
                        DEFAULT
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-xs text-gray-400">
                    {method.bankName ? `${method.bankName} · ` : ""}
                    {method.maskedPaymentIdentifier || "Masked destination"}
                  </p>
                </div>
                <button
                  type="button"
                  aria-label={`Remove ${method.label || method.method}`}
                  disabled={deletePayoutMethodMutation.isPending}
                  onClick={() => deletePayoutMethodMutation.mutate(method.id)}
                  className="rounded-md p-2 text-gray-400 transition hover:bg-red-950 hover:text-red-300 disabled:opacity-50"
                >
                  <Trash2 size={17} />
                </button>
              </div>
            ))}
          </div>
        </div>

        <form
          className="rounded-md border border-gray-800 bg-black/30 p-4"
          onSubmit={(event) => {
            event.preventDefault();
            setPayoutMethodMessage("");
            addPayoutMethodMutation.mutate();
          }}
        >
          <h3 className="text-base font-semibold">Add payout destination</h3>
          <label className="mt-4 block text-sm text-gray-300">Method</label>
          <select
            value={newPayoutMethod}
            onChange={(event) =>
              setNewPayoutMethod(event.target.value as PayoutGateway)
            }
            className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3"
          >
            <option value="BANK_TRANSFER">Bank account</option>
            <option value="STRIPE">Stripe Connect</option>
            <option value="BKASH">bKash</option>
            <option value="NAGAD">Nagad</option>
          </select>
          <label className="mt-4 block text-sm text-gray-300">Label (optional)</label>
          <input
            value={payoutLabel}
            maxLength={60}
            onChange={(event) => setPayoutLabel(event.target.value)}
            className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3"
            placeholder="e.g. Business account"
          />
          {newPayoutMethod === "BANK_TRANSFER" && (
            <div className="mt-1 grid gap-3 sm:grid-cols-2">
              <label className="mt-3 block text-sm text-gray-300">
                Bank name
                <input value={bankName} maxLength={80} onChange={(event) => setBankName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3" />
              </label>
              <label className="mt-3 block text-sm text-gray-300">
                Account holder
                <input value={accountHolderName} maxLength={100} onChange={(event) => setAccountHolderName(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3" />
              </label>
              <label className="mt-1 block text-sm text-gray-300 sm:col-span-2">
                Account last four digits
                <input value={accountLast4} inputMode="numeric" maxLength={4} onChange={(event) => setAccountLast4(event.target.value.replace(/\D/g, "").slice(0, 4))} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3" placeholder="1234" />
              </label>
            </div>
          )}
          {newPayoutMethod === "STRIPE" && (
            <label className="mt-4 block text-sm text-gray-300">
              Stripe Connect account ID
              <input value={stripeAccountId} maxLength={40} onChange={(event) => setStripeAccountId(event.target.value)} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3" placeholder="acct_..." />
            </label>
          )}
          {(newPayoutMethod === "BKASH" || newPayoutMethod === "NAGAD") && (
            <label className="mt-4 block text-sm text-gray-300">
              Wallet number
              <input value={walletNumber} inputMode="numeric" maxLength={11} onChange={(event) => setWalletNumber(event.target.value.replace(/\D/g, "").slice(0, 11))} className="mt-2 h-11 w-full rounded-md border border-gray-700 bg-black px-3" placeholder="01XXXXXXXXX" />
            </label>
          )}
          <label className="mt-4 flex items-center gap-2 text-xs text-gray-300">
            <input checked={isDefaultPayoutMethod} onChange={(event) => setIsDefaultPayoutMethod(event.target.checked)} type="checkbox" className="size-4 accent-emerald-500" />
            Set as default destination
          </label>
          {payoutMethodMessage && (
            <p className="mt-3 text-xs text-amber-300" role="status">{payoutMethodMessage}</p>
          )}
          {deletePayoutMethodMutation.isError && (
            <p className="mt-3 text-xs text-red-400" role="alert">Could not remove payout destination.</p>
          )}
          <button
            type="submit"
            disabled={addPayoutMethodMutation.isPending}
            className="mt-5 h-11 w-full rounded-md bg-emerald-600 px-4 text-sm font-semibold text-white disabled:opacity-50"
          >
            {addPayoutMethodMutation.isPending ? "Saving..." : "Save masked destination"}
          </button>
        </form>
      </section>

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
