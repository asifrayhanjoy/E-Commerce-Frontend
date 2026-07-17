import { NextResponse } from "next/server";

import { getDatabaseDashboard } from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const fallbackDashboard = {
  stats: {
    totalUsers: 0,
    totalSellers: 0,
    totalProducts: 0,
    totalEvents: 0,
    totalOrders: 0,
    totalRevenue: 0,
    successfulOrders: 0,
    pendingOrders: 0,
  },
  revenue: [
    { month: "Jan", total: 0, count: 0 },
    { month: "Feb", total: 0, count: 0 },
    { month: "Mar", total: 0, count: 0 },
    { month: "Apr", total: 0, count: 0 },
    { month: "May", total: 0, count: 0 },
    { month: "Jun", total: 0, count: 0 },
    { month: "Jul", total: 0, count: 0 },
  ],
  revenueMarker: {
    index: 4,
    month: "May",
    value: 0,
    total: 0,
  },
  deviceUsage: { phone: 1, tablet: 1, computer: 1 },
  distribution: [],
  recentOrders: [],
};

const hasDashboardRows = (data: any) =>
  Boolean(
    data?.stats?.totalUsers ||
      data?.stats?.totalSellers ||
      data?.stats?.totalProducts ||
      data?.stats?.totalEvents ||
      data?.stats?.totalOrders ||
      data?.recentOrders?.length
  );

const getBackendDashboard = async () => {
  for (const base of backendBases) {
    for (const path of ["/admin/dashboard", "/auth/admin/dashboard"]) {
      try {
        const response = await fetch(`${base}${path}`, { cache: "no-store" });
        if (!response.ok) continue;

        const data = await response.json();
        const dashboard = data?.data ?? data?.dashboard ?? data;
        if (hasDashboardRows(dashboard)) return dashboard;
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET() {
  try {
    const backendDashboard = await getBackendDashboard();
    if (backendDashboard) {
      return NextResponse.json({
        success: true,
        data: backendDashboard,
        dashboard: backendDashboard,
        ...backendDashboard,
      });
    }
  } catch {
  }

  try {
    const databaseDashboard = await getDatabaseDashboard();
    if (hasDashboardRows(databaseDashboard)) {
      return NextResponse.json({
        success: true,
        data: databaseDashboard,
        dashboard: databaseDashboard,
        ...databaseDashboard,
      });
    }
  } catch {
    return NextResponse.json({
      success: true,
      data: fallbackDashboard,
      dashboard: fallbackDashboard,
      ...fallbackDashboard,
    });
  }

  return NextResponse.json({
    success: true,
    data: fallbackDashboard,
    dashboard: fallbackDashboard,
    ...fallbackDashboard,
  });
}
