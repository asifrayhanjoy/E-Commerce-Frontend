import { NextRequest, NextResponse } from "next/server";

import { getDatabaseProduct } from "../../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ productId: string }> | { productId: string };
};

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getBackendProduct = async (productId: string) => {
  for (const base of backendBases) {
    for (const path of [
      `/admin/products/${productId}`,
      `/auth/admin/products/${productId}`,
    ]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (payload?.product) return payload.product;
        if (payload?.id || payload?._id) return payload;
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { productId } = await context.params;

  try {
    const backendProduct = await getBackendProduct(productId);
    if (backendProduct) {
      return NextResponse.json({ success: true, product: backendProduct });
    }
  } catch {
  }

  try {
    const product = await getDatabaseProduct(productId);
    if (product) {
      return NextResponse.json({ success: true, product });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "Product could not be loaded." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, message: "Product not found." },
    { status: 404 }
  );
}
