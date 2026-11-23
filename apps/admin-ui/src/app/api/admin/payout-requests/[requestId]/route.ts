import { NextRequest } from "next/server";
import { proxyPaymentApi } from "../../_lib/paymentProxy";

type RouteContext = {
  params: Promise<{ requestId: string }> | { requestId: string };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function PATCH(request: NextRequest, context: RouteContext) {
  const { requestId } = await context.params;
  return proxyPaymentApi(
    request,
    `admin/payout-requests/${encodeURIComponent(requestId)}`
  );
}
