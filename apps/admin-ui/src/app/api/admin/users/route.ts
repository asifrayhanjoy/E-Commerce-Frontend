import { NextRequest, NextResponse } from "next/server";

import { getDatabaseUsers } from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const pagination = (page: number, limit: number, total = 0) => ({
  page,
  limit,
  total,
  totalUsers: total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

const getBackendUsers = async (query: string) => {
  for (const base of backendBases) {
    for (const path of [`/admin/users${query}`, `/auth/admin/users${query}`]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (Array.isArray(payload) && payload.length > 0) {
          return { users: payload };
        }
        if (Array.isArray(payload?.users) && payload.users.length > 0) {
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
    const backendResult = await getBackendUsers(query);
    if (backendResult) {
      return NextResponse.json({ success: true, ...backendResult });
    }
  } catch {
  }

  try {
    const databaseResult = await getDatabaseUsers(search, page, limit);
    if (databaseResult.users.length > 0) {
      return NextResponse.json({ success: true, ...databaseResult });
    }

    return NextResponse.json({
      success: true,
      users: [],
      pagination: databaseResult.pagination ?? pagination(page, limit),
    });
  } catch {
    return NextResponse.json({
      success: true,
      users: [],
      pagination: pagination(page, limit),
    });
  }
}
