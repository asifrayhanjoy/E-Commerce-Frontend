import { NextRequest } from "next/server";
import { proxyPaymentApi } from "../_lib/paymentProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  return proxyPaymentApi(request, "admin/payments");
}
