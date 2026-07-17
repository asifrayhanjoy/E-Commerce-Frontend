import { NextRequest, NextResponse } from "next/server";

import { getDatabaseOrder } from "../../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ orderId: string }> | { orderId: string };
};

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getBackendOrder = async (orderId: string) => {
  for (const base of backendBases) {
    for (const path of [`/admin/orders/${orderId}`, `/auth/admin/orders/${orderId}`]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (payload?.order) return payload.order;
        if (payload?.id || payload?._id) return payload;
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { orderId } = await context.params;

  try {
    const backendOrder = await getBackendOrder(orderId);
    if (backendOrder) {
      return NextResponse.json({ success: true, order: backendOrder });
    }
  } catch {
  }

  try {
    const order = await getDatabaseOrder(orderId);
    if (order) {
      return NextResponse.json({ success: true, order });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Order could not be loaded." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, message: "Order not found." },
    { status: 404 }
  );
}
