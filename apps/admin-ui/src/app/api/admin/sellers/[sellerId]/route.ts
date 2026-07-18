import { NextRequest, NextResponse } from "next/server";

import { getDatabaseSeller, normalizeAdminSeller } from "../../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ sellerId: string }> | { sellerId: string };
};

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getBackendSeller = async (sellerId: string) => {
  for (const base of backendBases) {
    for (const path of [
      `/admin/sellers/${sellerId}`,
      `/auth/admin/sellers/${sellerId}`,
    ]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (payload?.seller) return payload.seller;
        if (payload?.id || payload?._id) return payload;
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { sellerId } = await context.params;

  try {
    const backendSeller = await getBackendSeller(sellerId);
    if (backendSeller) {
      return NextResponse.json({
        success: true,
        seller: normalizeAdminSeller(backendSeller),
      });
    }
  } catch {
  }

  try {
    const seller = await getDatabaseSeller(sellerId);
    if (seller) {
      return NextResponse.json({ success: true, seller });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Seller could not be loaded." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, message: "Seller not found." },
    { status: 404 }
  );
}
