import { NextRequest, NextResponse } from "next/server";

import { getDatabaseOrders } from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ADMIN_FEE_RATE = 0.1;

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8282/api",
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const formatCurrency = (value: number) => `$${Number(value || 0).toFixed(2)}`;

const getMoneyValue = (...values: unknown[]) => {
  for (const value of values) {
    if (typeof value === "number" && Number.isFinite(value)) {
      return value;
    }

    if (typeof value === "string") {
      const parsed = Number(value.replace(/[^0-9.-]+/g, ""));

      if (Number.isFinite(parsed)) {
        return parsed;
      }
    }
  }

  return 0;
};

const mapOrderToPayment = (order: any) => {
  const totalValue = getMoneyValue(
    order.totalValue,
    order.totalAmount,
    order.total,
    order.amount,
    order.totalPaid
  );
  const adminFeeValue = Number((totalValue * ADMIN_FEE_RATE).toFixed(2));
  const sellerEarningsValue = Number((totalValue - adminFeeValue).toFixed(2));

  return {
    id: order.id || order.orderId,
    orderId: order.orderId || order.id,
    shop: order.shop || "Unknown shop",
    buyer: order.buyer || order.customer || "Unknown buyer",
    adminFee: formatCurrency(adminFeeValue),
    adminFeeValue,
    sellerEarnings: formatCurrency(sellerEarningsValue),
    sellerEarningsValue,
    total: formatCurrency(totalValue),
    totalValue,
    paymentStatus: order.paymentStatus || order.status || "Pending",
    date: order.date || "",
    createdAt: order.createdAt,
  };
};

const paginate = <T,>(items: T[], page: number, limit: number) => {
  const requestedPage = Number(page || 1);
  const requestedLimit = Number(limit || 10);
  const safePage = Number.isFinite(requestedPage)
    ? Math.max(requestedPage, 1)
    : 1;
  const safeLimit = Number.isFinite(requestedLimit)
    ? Math.min(Math.max(requestedLimit, 1), 100)
    : 10;
  const totalPages = Math.max(1, Math.ceil(items.length / safeLimit));
  const currentPage = Math.min(safePage, totalPages);
  const start = (currentPage - 1) * safeLimit;

  return {
    payments: items.slice(start, start + safeLimit),
    pagination: {
      page: currentPage,
      limit: safeLimit,
      totalPayments: items.length,
      totalPages,
    },
  };
};

const getSummary = (payments: ReturnType<typeof mapOrderToPayment>[]) => {
  const totalRevenue = payments.reduce(
    (sum, payment) => sum + payment.totalValue,
    0
  );
  const totalAdminFees = payments.reduce(
    (sum, payment) => sum + payment.adminFeeValue,
    0
  );
  const totalSellerEarnings = payments.reduce(
    (sum, payment) => sum + payment.sellerEarningsValue,
    0
  );

  return {
    totalRevenue: formatCurrency(totalRevenue),
    totalAdminFees: formatCurrency(totalAdminFees),
    totalSellerEarnings: formatCurrency(totalSellerEarnings),
  };
};

const getBackendPayments = async (query: string) => {
  for (const base of backendBases) {
    for (const path of [
      `/admin/payments${query}`,
      `/auth/admin/payments${query}`,
      `/admin/orders${query}`,
      `/auth/admin/orders${query}`,
    ]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;

        if (Array.isArray(payload?.payments) && payload.payments.length > 0) {
          return payload;
        }

        if (Array.isArray(payload?.orders) && payload.orders.length > 0) {
          const payments = payload.orders.map(mapOrderToPayment);

          return {
            payments,
            pagination: {
              page: 1,
              limit: payments.length,
              totalPayments: payments.length,
              totalPages: 1,
            },
            summary: getSummary(payments),
          };
        }
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") ?? "";
  const page = Number(searchParams.get("page") ?? 1);
  const limit = Number(searchParams.get("limit") ?? 10);
  const query = request.nextUrl.search;

  try {
    const backendResult = await getBackendPayments(query);

    if (backendResult) {
      return NextResponse.json({
        success: true,
        ...backendResult,
      });
    }
  } catch {
  }

  try {
    const orders = await getDatabaseOrders(search);
    const payments = orders.map(mapOrderToPayment);

    return NextResponse.json({
      success: true,
      ...paginate(payments, page, limit),
      summary: getSummary(payments),
    });
  } catch {
    return NextResponse.json({
      success: true,
      ...paginate([], page, limit),
      summary: {
        totalRevenue: "$0.00",
        totalAdminFees: "$0.00",
        totalSellerEarnings: "$0.00",
      },
    });
  }
}
