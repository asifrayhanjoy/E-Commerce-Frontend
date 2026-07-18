import { NextRequest, NextResponse } from "next/server";

import { getDatabaseEvents } from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8181/api/v1",
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const pagination = (page: number, limit: number, total = 0) => ({
  page,
  limit,
  total,
  totalEvents: total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

const getBackendEvents = async (query: string) => {
  for (const base of backendBases) {
    for (const path of [
      `/products/get-public-events${query}`,
      `/admin/events${query}`,
      `/auth/admin/events${query}`,
    ]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (Array.isArray(payload) && payload.length > 0) {
          return { events: payload };
        }
        if (Array.isArray(payload?.events) && payload.events.length > 0) {
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
    const backendResult = await getBackendEvents(query);
    if (backendResult) {
      return NextResponse.json({ success: true, ...backendResult });
    }
  } catch {
  }

  try {
    const databaseResult = await getDatabaseEvents(search, page, limit);
    if (databaseResult.events.length > 0) {
      return NextResponse.json({ success: true, ...databaseResult });
    }

    return NextResponse.json({
      success: true,
      events: [],
      pagination: databaseResult.pagination ?? pagination(page, limit),
    });
  } catch {
    return NextResponse.json({
      success: true,
      events: [],
      pagination: pagination(page, limit),
    });
  }
}
