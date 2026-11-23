import { NextRequest } from "next/server";
import { proxyPaymentApi } from "../../../_lib/paymentProxy";

type RouteContext = {
  params: Promise<{ orderId: string }> | { orderId: string };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { orderId } = await context.params;
  return proxyPaymentApi(
    request,
    `admin/orders/${encodeURIComponent(orderId)}/verify-payment`
  );
}
