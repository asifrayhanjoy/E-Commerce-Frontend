import { NextRequest } from "next/server";
import { proxyPaymentApi } from "../_lib/paymentProxy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = (request: NextRequest) =>
  proxyPaymentApi(request, "admin/payout-requests");
