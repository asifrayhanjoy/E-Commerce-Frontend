"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useState } from "react";

type AdminPayment = {
  id: string;
  orderId: string;
  shop: string;
  buyer: string;
  adminFee: string;
  sellerEarnings: string;
  paymentStatus: string;
  date: string;
};

type PaymentsResponse = {
  payments: AdminPayment[];
  pagination?: {
    page: number;
    limit: number;
    totalPayments: number;
    totalPages: number;
  };
};

type AdminPaymentSettings = {
  settings: {
    stripeEnabled: boolean;
    bkashEnabled: boolean;
    nagadEnabled: boolean;
    bankTransferEnabled: boolean;
    paymentDemoLock: boolean;
  };
  demoLocked: boolean;
  environmentLockEnforced: boolean;
};

type PaymentAuditRow = {
  id: string;
  userId?: string | null;
  orderId?: string | null;
  gateway: string;
  paymentMethod?: string | null;
  currency?: string | null;
  totalAmount?: number | null;
  maskedPaymentIdentifier?: string | null;
  action: string;
  status: string;
  reason?: string | null;
  ipAddress?: string | null;
  createdAt: string;
};

const formatCurrencyTotals = (
  totals: Record<string, Record<string, number>> | undefined,
  key: string
) => {
  const entries = Object.entries(totals || {}).filter(
    ([, values]) => Number.isFinite(values[key])
  );
  if (entries.length === 0) return "$0.00";

  return entries
    .map(([currency, values]) => {
      const amount = Number(values[key] || 0).toFixed(2);
      return currency === "BDT" ? `BDT ${amount}` : `$${amount}`;
    })
    .join(" · ");
};

const fetchPayments = async (search: string) => {
  const query = new URLSearchParams({
    limit: "12",
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await axios.get<PaymentsResponse>(
    `/api/admin/payments?${query.toString()}`,
    {
      withCredentials: true,
    }
  );

  return response.data.payments;
};

const getStatusClass = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (
    normalizedStatus.includes("paid") ||
    normalizedStatus.includes("success") ||
    normalizedStatus.includes("complete")
  ) {
    return "border-[#357a39] bg-[#35b657] text-white shadow-[0_0_0_1px_rgba(53,182,87,0.25)]";
  }

  if (normalizedStatus.includes("pending")) {
    return "border-[#8a6c16] bg-[#2f270f] text-[#ffd957]";
  }

  return "border-[#79333a] bg-[#321116] text-[#f06d79]";
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

const PaymentsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [actionMessage, setActionMessage] = useState("");
  const { data: payments = [], isLoading, isError: isPaymentsError } = useQuery({
    queryKey: ["admin-payments", search],
    queryFn: () => fetchPayments(search),
  });
  const { data: overview, isError: isOverviewError } = useQuery({
    queryKey: ["admin-payment-overview"],
    queryFn: async () => (await axios.get("/api/admin/payments/overview", { withCredentials: true })).data,
  });
  const {
    data: payouts = [],
    isLoading: isPayoutsLoading,
    isError: isPayoutsError,
    refetch: refetchPayouts,
  } = useQuery({
    queryKey: ["admin-payouts"],
    queryFn: async () => (await axios.get("/api/admin/payout-requests", { withCredentials: true })).data?.payouts || [],
  });
  const {
    data: paymentSettings,
    isLoading: isSettingsLoading,
    isError: isSettingsError,
  } =
    useQuery<AdminPaymentSettings>({
      queryKey: ["admin-payment-settings"],
      queryFn: async () =>
        (await axios.get("/api/admin/payment-settings", { withCredentials: true }))
          .data,
    });
  const {
    data: attempts = [],
    isLoading: isAttemptsLoading,
    isError: isAttemptsError,
  } = useQuery<PaymentAuditRow[]>({
    queryKey: ["admin-payment-attempts"],
    queryFn: async () =>
      (await axios.get("/api/admin/payments/attempts", { withCredentials: true }))
        .data?.attempts || [],
  });
  const {
    data: auditLogs = [],
    isLoading: isAuditLogsLoading,
    isError: isAuditLogsError,
  } = useQuery<PaymentAuditRow[]>({
    queryKey: ["admin-payment-audit-logs"],
    queryFn: async () =>
      (await axios.get("/api/admin/payments/audit-logs", { withCredentials: true }))
        .data?.logs || [],
  });
  const settingsMutation = useMutation({
    mutationFn: async (settings: Partial<AdminPaymentSettings["settings"]>) =>
      axios.put("/api/admin/payment-settings", settings, { withCredentials: true }),
    onSuccess: async () => {
      setActionMessage("Payment settings updated.");
      await queryClient.invalidateQueries({ queryKey: ["admin-payment-settings"] });
      await queryClient.invalidateQueries({ queryKey: ["admin-payment-overview"] });
    },
    onError: () => setActionMessage("Payment settings could not be updated."),
  });
  const effectiveDemoLock = isSettingsError
    ? true
    : paymentSettings?.demoLocked ?? overview?.demoLocked ?? true;
  const gatewayControls = [
    {
      label: "Stripe card",
      enabled: Boolean(paymentSettings?.settings.stripeEnabled),
      update: () =>
        settingsMutation.mutate({
          stripeEnabled: !paymentSettings?.settings.stripeEnabled,
        }),
    },
    {
      label: "bKash",
      enabled: Boolean(paymentSettings?.settings.bkashEnabled),
      update: () =>
        settingsMutation.mutate({
          bkashEnabled: !paymentSettings?.settings.bkashEnabled,
        }),
    },
    {
      label: "Nagad",
      enabled: Boolean(paymentSettings?.settings.nagadEnabled),
      update: () =>
        settingsMutation.mutate({
          nagadEnabled: !paymentSettings?.settings.nagadEnabled,
        }),
    },
    {
      label: "Bank transfer",
      enabled: Boolean(paymentSettings?.settings.bankTransferEnabled),
      update: () =>
        settingsMutation.mutate({
          bankTransferEnabled: !paymentSettings?.settings.bankTransferEnabled,
        }),
    },
  ];

  const verifyPayment = async (orderId: string, decision: "APPROVE" | "REJECT") => {
    try {
      await axios.patch(`/api/admin/orders/${orderId}/verify-payment`, { decision }, { withCredentials: true });
      setActionMessage(`Payment ${decision === "APPROVE" ? "approved" : "rejected"}.`);
      await queryClient.invalidateQueries({ queryKey: ["admin-payments"] });
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setActionMessage(message || "Payment decision could not be saved.");
    }
  };

  const updatePayout = async (requestId: string, decision: "PAID" | "REJECT") => {
    try {
      await axios.patch(`/api/admin/payout-requests/${requestId}`, {
        decision,
        transactionReference: decision === "PAID" ? window.prompt("Enter payout transaction reference") || "" : null,
      }, { withCredentials: true });
      setActionMessage(`Payout ${decision === "PAID" ? "marked paid" : "rejected"}.`);
      await refetchPayouts();
    } catch (error) {
      const message = axios.isAxiosError(error)
        ? error.response?.data?.message
        : undefined;
      setActionMessage(message || "Payout decision could not be saved.");
    }
  };

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

      <div className="mb-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {[
          [
            "Total volume",
            isOverviewError
              ? "Unavailable"
              : formatCurrencyTotals(overview?.totalsByCurrency, "totalVolume"),
          ],
          [
            "Platform commission",
            isOverviewError
              ? "Unavailable"
              : formatCurrencyTotals(
                  overview?.totalsByCurrency,
                  "platformCommissionEarned"
                ),
          ],
          [
            "Pending verifications",
            isOverviewError ? "Unavailable" : overview?.pendingVerifications || 0,
          ],
          [
            "Pending seller payouts",
            isOverviewError ? "Unavailable" : overview?.pendingSellerPayouts || 0,
          ],
        ].map(([label, value]) => (
          <div key={String(label)} className="rounded-lg border border-[#121a2d] bg-[#0b1020] p-4">
            <p className="text-sm text-[#8e94a4]">{label}</p>
            <p className="mt-2 text-2xl font-semibold">{String(value)}</p>
          </div>
        ))}
      </div>

      {actionMessage && (
        <p role="status" className="mb-5 rounded-md border border-[#263653] bg-[#0b1020] px-4 py-3 text-sm text-[#d9e3f7]">
          {actionMessage}
        </p>
      )}

      <section className="mb-6 rounded-lg border border-[#263653] bg-[#0b1020] p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-lg font-semibold">Gateway controls</h2>
            <p className="mt-1 text-sm leading-6 text-[#8e94a4]">
              Gateway availability is configurable. Final charge and payout actions remain blocked while Demo Mode is locked.
            </p>
          </div>
          <span className={`rounded-full px-3 py-1.5 text-xs font-extrabold tracking-wider ${effectiveDemoLock ? "bg-amber-950 text-amber-300" : "bg-emerald-950 text-emerald-300"}`}>
            {isSettingsLoading ? "LOADING…" : effectiveDemoLock ? "DEMO LOCKED" : "DEMO LOCK OFF"}
          </span>
        </div>
        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          {gatewayControls.map((gateway) => (
            <button
              key={gateway.label}
              type="button"
              disabled={isSettingsLoading || isSettingsError || settingsMutation.isPending}
              aria-pressed={gateway.enabled}
              onClick={gateway.update}
              className="flex items-center justify-between rounded-md border border-[#18243b] bg-[#080d18] px-4 py-3 text-left transition hover:border-[#35527f] disabled:opacity-50"
            >
              <span className="text-sm font-semibold">{gateway.label}</span>
              <span className={`text-xs font-extrabold ${gateway.enabled ? "text-emerald-400" : "text-slate-500"}`}>
                {gateway.enabled ? "ACTIVE" : "DISABLED"}
              </span>
            </button>
          ))}
        </div>
        <div className="mt-4 flex flex-wrap items-center justify-between gap-4 border-t border-[#18243b] pt-4">
          <div>
            <p className="text-sm font-semibold">Final payment lock</p>
            <p className="mt-1 text-xs text-[#8e94a4]">
              {paymentSettings?.environmentLockEnforced
                ? "Enforced by PAYMENT_DEMO_LOCK in the backend environment."
                : "Controlled by the persisted platform setting."}
            </p>
          </div>
          <button
            type="button"
            disabled={
              isSettingsLoading ||
              isSettingsError ||
              settingsMutation.isPending ||
              Boolean(paymentSettings?.environmentLockEnforced)
            }
            onClick={() =>
              settingsMutation.mutate({
                paymentDemoLock: !effectiveDemoLock,
              })
            }
            className={`rounded-md px-4 py-2 text-xs font-extrabold tracking-wider disabled:cursor-not-allowed disabled:opacity-50 ${effectiveDemoLock ? "bg-amber-700 text-white" : "bg-emerald-700 text-white"}`}
          >
            {effectiveDemoLock ? "LOCK ENABLED" : "LOCK DISABLED"}
          </button>
        </div>
        {isSettingsError && (
          <p role="alert" className="mt-4 text-sm font-semibold text-rose-300">
            Payment settings could not be loaded. Gateway controls are disabled and the demo lock remains treated as enabled.
          </p>
        )}
      </section>

      {effectiveDemoLock && (
        <div className="mb-6 rounded-md border border-amber-900/70 bg-amber-950/40 px-4 py-3 text-sm font-medium leading-6 text-amber-200">
          Demo Mode blocks payment approval and payout disbursement. Attempts are recorded for audit; no order can be marked paid from this dashboard.
        </div>
      )}

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
              <th className="px-3 pb-4">Admin Fee (10%)</th>
              <th className="px-3 pb-4">Seller Earnings</th>
              <th className="px-3 pb-4">Payment Status</th>
              <th className="px-3 pb-4">Date</th>
              <th className="px-3 pb-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5" colSpan={8}>
                  Loading payments...
                </td>
              </tr>
            )}

            {!isLoading && isPaymentsError && (
              <tr className="border-t border-[#161f33] text-rose-300">
                <td className="px-3 py-5 text-center" colSpan={8} role="alert">
                  Payments could not be loaded. Check admin access and the payment service.
                </td>
              </tr>
            )}

            {!isLoading && !isPaymentsError && payments.length === 0 && (
              <tr className="border-t border-[#161f33] text-[#8e94a4]">
                <td className="px-3 py-5 text-center" colSpan={8}>
                  No payments found.
                </td>
              </tr>
            )}

            {!isLoading &&
              !isPaymentsError &&
              payments.map((payment) => (
                <tr
                  key={payment.id || payment.orderId}
                  className="border-t border-[#161f33] text-[#b9bdc9] transition duration-150 hover:bg-[#111a2e] hover:text-white"
                >
                  <td className="px-3 py-4">{payment.orderId}</td>
                  <td className="px-3 py-4">{payment.shop}</td>
                  <td className="px-3 py-4">{payment.buyer}</td>
                  <td className="px-3 py-4 font-bold text-[#42bf72]">
                    {payment.adminFee}
                  </td>
                  <td className="px-3 py-4">{payment.sellerEarnings}</td>
                  <td className="px-3 py-4">
                    <span
                      className={`inline-flex h-7 items-center rounded-full border px-3 text-[12px] font-semibold ${getStatusClass(
                        payment.paymentStatus
                      )}`}
                    >
                      {payment.paymentStatus}
                    </span>
                    {payment.paymentStatus?.toUpperCase() === "UNDER_REVIEW" && (
                      <div className="mt-2 flex gap-2">
                        <button type="button" disabled={effectiveDemoLock} onClick={() => void verifyPayment(payment.id, "APPROVE")} title={effectiveDemoLock ? "Payment approval is disabled in Demo Mode" : undefined} className="rounded bg-emerald-700 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40">Approve</button>
                        <button type="button" onClick={() => void verifyPayment(payment.id, "REJECT")} className="rounded bg-red-700 px-2 py-1 text-xs">Reject</button>
                      </div>
                    )}
                  </td>
                  <td className="px-3 py-4">{payment.date}</td>
                  <td className="px-3 py-4">
                    <Link
                      href={`/order/${payment.id}`}
                      className="mx-auto flex h-8 w-8 items-center justify-center rounded-md transition duration-150 hover:scale-105 hover:bg-[#17233c]"
                      aria-label={`View ${payment.orderId}`}
                    >
                      <EyeIcon />
                    </Link>
                  </td>
                </tr>
              ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6 overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] px-5 py-5">
        <h2 className="mb-4 text-lg font-semibold">Seller payout requests</h2>
        {isPayoutsLoading && <p className="text-sm text-[#8e94a4]">Loading payout requests...</p>}
        {!isPayoutsLoading && isPayoutsError && (
          <p role="alert" className="text-sm text-rose-300">Payout requests could not be loaded.</p>
        )}
        {!isPayoutsLoading && !isPayoutsError && payouts.length === 0 && <p className="text-sm text-[#8e94a4]">No payout requests.</p>}
        {!isPayoutsError && payouts.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead><tr className="text-[#d9dbe1]"><th className="p-3">Seller</th><th className="p-3">Amount</th><th className="p-3">Method</th><th className="p-3">Status</th><th className="p-3">Actions</th></tr></thead>
              <tbody>{payouts.map((payout: any) => (
                <tr key={payout.id} className="border-t border-[#161f33]">
                  <td className="p-3">{payout.sellerId}</td>
                  <td className="p-3">${Number(payout.amount || 0).toFixed(2)}</td>
                  <td className="p-3">{payout.method}</td>
                  <td className="p-3">{payout.status}</td>
                  <td className="p-3">
                    {payout.status !== "PAID" && payout.status !== "REJECTED" && (
                      <div className="flex gap-2">
                        <button type="button" disabled={effectiveDemoLock} onClick={() => void updatePayout(payout.id, "PAID")} title={effectiveDemoLock ? "Payout disbursement is disabled in Demo Mode" : undefined} className="rounded bg-emerald-700 px-2 py-1 text-xs disabled:cursor-not-allowed disabled:opacity-40">Mark paid</button>
                        <button type="button" onClick={() => void updatePayout(payout.id, "REJECT")} className="rounded bg-red-700 px-2 py-1 text-xs">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>

      <section className="mt-6 overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] p-5">
        <h2 className="text-lg font-semibold">Payment attempts</h2>
        <p className="mt-1 text-sm text-[#8e94a4]">
          Recent checkout validation and final-charge interception records.
        </p>
        {isAttemptsLoading ? (
          <p className="mt-4 text-sm text-[#8e94a4]">Loading attempts...</p>
        ) : isAttemptsError ? (
          <p role="alert" className="mt-4 text-sm text-rose-300">Payment attempts could not be loaded.</p>
        ) : attempts.length === 0 ? (
          <p className="mt-4 text-sm text-[#8e94a4]">No payment attempts recorded.</p>
        ) : (
          <div className="mt-4 max-h-[440px] overflow-auto">
            <table className="w-full min-w-[850px] text-left text-xs">
              <thead className="sticky top-0 bg-[#0b1020] text-[#8e94a4]">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Gateway</th>
                  <th className="p-3">Status / action</th>
                  <th className="p-3">Total</th>
                  <th className="p-3">Masked identifier</th>
                  <th className="p-3">Reason</th>
                </tr>
              </thead>
              <tbody>
                {attempts.map((attempt) => (
                  <tr key={attempt.id} className="border-t border-[#161f33] text-[#c5cad5]">
                    <td className="p-3">{new Date(attempt.createdAt).toLocaleString()}</td>
                    <td className="p-3 font-semibold">{attempt.gateway}</td>
                    <td className="p-3">{attempt.status} · {attempt.action}</td>
                    <td className="p-3">
                      {attempt.totalAmount == null
                        ? "—"
                        : `${attempt.currency || "USD"} ${Number(attempt.totalAmount).toFixed(2)}`}
                    </td>
                    <td className="p-3">{attempt.maskedPaymentIdentifier || "—"}</td>
                    <td className="p-3">{attempt.reason || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="mt-6 overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] p-5">
        <h2 className="text-lg font-semibold">Security audit log</h2>
        <p className="mt-1 text-sm text-[#8e94a4]">
          Sensitive credentials are excluded; only masked identifiers and audit metadata are shown.
        </p>
        {isAuditLogsLoading ? (
          <p className="mt-4 text-sm text-[#8e94a4]">Loading audit logs...</p>
        ) : isAuditLogsError ? (
          <p role="alert" className="mt-4 text-sm text-rose-300">Security audit logs could not be loaded.</p>
        ) : auditLogs.length === 0 ? (
          <p className="mt-4 text-sm text-[#8e94a4]">No security audit entries.</p>
        ) : (
          <div className="mt-4 max-h-[440px] overflow-auto">
            <table className="w-full min-w-[900px] text-left text-xs">
              <thead className="sticky top-0 bg-[#0b1020] text-[#8e94a4]">
                <tr>
                  <th className="p-3">When</th>
                  <th className="p-3">Actor</th>
                  <th className="p-3">Gateway / action</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Reason</th>
                  <th className="p-3">IP</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.map((entry) => (
                  <tr key={entry.id} className="border-t border-[#161f33] text-[#c5cad5]">
                    <td className="p-3">{new Date(entry.createdAt).toLocaleString()}</td>
                    <td className="p-3">{entry.userId || "System"}</td>
                    <td className="p-3">{entry.gateway} · {entry.action}</td>
                    <td className="p-3">{entry.status}</td>
                    <td className="p-3">{entry.reason || "—"}</td>
                    <td className="p-3">{entry.ipAddress || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
};

export default PaymentsPage;
