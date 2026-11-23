import { NextRequest } from "next/server";
import { proxyPaymentApi } from "../../_lib/paymentProxy";

type RouteContext = {
  params: Promise<{ path: string[] }> | { path: string[] };
};

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest, context: RouteContext) {
  const { path } = await context.params;
  return proxyPaymentApi(
    request,
    `admin/payments/${path.map(encodeURIComponent).join("/")}`
  );
}
