import { NextRequest, NextResponse } from "next/server";

import { getDatabaseOrders } from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const paginate = <T>(items: T[], page: number, limit: number) => {
  const safePage = Math.max(1, Number(page) || 1);
  const safeLimit = Math.max(1, Number(limit) || 10);
  const start = (safePage - 1) * safeLimit;

  return {
    orders: items.slice(start, start + safeLimit),
    pagination: {
      page: safePage,
      limit: safeLimit,
      total: items.length,
      totalPages: Math.max(1, Math.ceil(items.length / safeLimit)),
    },
  };
};

const getBackendOrders = async (query: string) => {
  for (const base of backendBases) {
    for (const path of [`/admin/orders${query}`, `/auth/admin/orders${query}`]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (Array.isArray(payload) && payload.length > 0) {
          return { orders: payload };
        }
        if (Array.isArray(payload?.orders) && payload.orders.length > 0) {
          return payload;
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
    const backendResult = await getBackendOrders(query);
    if (backendResult) {
      return NextResponse.json({ success: true, ...backendResult });
    }
  } catch {
  }

  try {
    const databaseOrders = await getDatabaseOrders(search);
    if (databaseOrders.length > 0) {
      return NextResponse.json({ success: true, ...paginate(databaseOrders, page, limit) });
    }

    return NextResponse.json({ success: true, ...paginate([], page, limit) });
  } catch {
    return NextResponse.json({ success: true, ...paginate([], page, limit) });
  }
}
