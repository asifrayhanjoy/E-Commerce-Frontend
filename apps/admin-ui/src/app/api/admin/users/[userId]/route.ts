import { NextRequest, NextResponse } from "next/server";

import { getDatabaseUser } from "../../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type RouteContext = {
  params: Promise<{ userId: string }> | { userId: string };
};

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getBackendUser = async (userId: string) => {
  for (const base of backendBases) {
    for (const path of [`/admin/users/${userId}`, `/auth/admin/users/${userId}`]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const payload = data?.data ?? data;
        if (payload?.user) return payload.user;
        if (payload?.id || payload?._id) return payload;
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET(_request: NextRequest, context: RouteContext) {
  const { userId } = await context.params;

  try {
    const backendUser = await getBackendUser(userId);
    if (backendUser) {
      return NextResponse.json({ success: true, user: backendUser });
    }
  } catch {
  }

  try {
    const user = await getDatabaseUser(userId);
    if (user) {
      return NextResponse.json({ success: true, user });
    }
  } catch {
    return NextResponse.json(
      { success: false, message: "User could not be loaded." },
      { status: 500 }
    );
  }

  return NextResponse.json(
    { success: false, message: "User not found." },
    { status: 404 }
  );
}
