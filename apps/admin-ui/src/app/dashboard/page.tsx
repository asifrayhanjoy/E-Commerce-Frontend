"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";

type RevenuePoint = {
  month: string;
  total: number;
  count: number;
};

type RecentOrder = {
  id: string;
  customer: string;
  amount: string;
  status: string;
};

type DistributionItem = {
  country: string;
  sellers: number;
};

type DashboardData = {
  stats: {
    totalUsers: number;
    totalSellers: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    successfulOrders: number;
    pendingOrders: number;
  };
  revenue: RevenuePoint[];
  revenueMarker: {
    index: number;
    month: string;
    value: number;
    total: number;
  };
  deviceUsage: {
    phone: number;
    tablet: number;
    computer: number;
  };
  distribution: DistributionItem[];
  recentOrders: RecentOrder[];
};

const API_URL = "/api/admin/dashboard";

const fallbackRevenue = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul"].map(
  (month) => ({ month, total: 0, count: 0 })
);

const fallbackMarker = {
  index: 4,
  month: "May",
  value: 0,
  total: 0,
};

const fetchDashboard = async () => {
  const response = await axios.get<{ data: DashboardData }>(API_URL, {
    withCredentials: true,
  });

  return response.data.data;
};

const statusClass = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (normalizedStatus === "paid") {
    return "text-[#5fd36b]";
  }

  if (normalizedStatus === "pending") {
    return "text-[#ffd957]";
  }

  return "text-[#f06d79]";
};

const getRevenueMetric = (item: RevenuePoint) => item.total || item.count;

const getRevenuePoints = (revenue: RevenuePoint[]) => {
  const hasData = revenue.some((item) => getRevenueMetric(item) > 0);
  const maxTotal = Math.max(...revenue.map((item) => getRevenueMetric(item)), 1);
  const width = 720;
  const height = 220;
  const step = width / Math.max(revenue.length - 1, 1);

  return revenue
    .map((item, index) => {
      const x = 20 + index * step;
      const y = hasData ? 270 - (getRevenueMetric(item) / maxTotal) * height : 165;

      return { x, y };
    });
};

const getRevenuePath = (revenue: RevenuePoint[]) => {
  const points = getRevenuePoints(revenue);

  if (!points.length) {
    return "";
  }

  return points
    .map((point, index) => {
      if (index === 0) {
        return `M ${point.x.toFixed(2)} ${point.y.toFixed(2)}`;
      }

      const previousPoint = points[index - 1];
      const controlOffset = (point.x - previousPoint.x) * 0.45;

      return `C ${(previousPoint.x + controlOffset).toFixed(2)} ${previousPoint.y.toFixed(
        2
      )}, ${(point.x - controlOffset).toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(
        2
      )} ${point.y.toFixed(2)}`;
    })
    .join(" ");
};

const getRevenueFillPath = (linePath: string) =>
  `${linePath} L740 290 L20 290 Z`;

const getCurrentRevenuePoint = (
  revenue: RevenuePoint[],
  marker: DashboardData["revenueMarker"]
) => {
  const points = getRevenuePoints(revenue);
  const index = Math.min(
    Math.max(Number.isFinite(marker.index) ? marker.index : 4, 0),
    Math.max(points.length - 1, 0)
  );
  const point = points[index] || { x: 500, y: 165 };

  return {
    x: point.x,
    y: point.y,
    value: marker.value,
  };
};

const getDeviceGradient = (deviceUsage: DashboardData["deviceUsage"]) => {
  const phone = Math.max(deviceUsage.phone, 0);
  const tablet = Math.max(deviceUsage.tablet, 0);
  const computer = Math.max(deviceUsage.computer, 0);
  const total = phone + tablet + computer || 1;
  const phoneEnd = (phone / total) * 360;
  const tabletEnd = phoneEnd + (tablet / total) * 360;

  return `conic-gradient(#6adb73 0deg ${phoneEnd}deg, #ffd84f ${phoneEnd}deg ${tabletEnd}deg, #6ba5ff ${tabletEnd}deg 360deg)`;
};

const DashboardPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
  });

  const dashboard = data || {
    stats: {
      totalUsers: 0,
      totalSellers: 0,
      totalProducts: 0,
      totalOrders: 0,
      totalRevenue: 0,
      successfulOrders: 0,
      pendingOrders: 0,
    },
    revenue: fallbackRevenue,
    revenueMarker: fallbackMarker,
    deviceUsage: { phone: 0, tablet: 0, computer: 0 },
    distribution: [],
    recentOrders: [],
  };
  const revenue = dashboard.revenue.length ? dashboard.revenue : fallbackRevenue;
  const revenuePath = getRevenuePath(revenue);
  const currentPoint = getCurrentRevenuePoint(
    revenue,
    dashboard.revenueMarker || fallbackMarker
  );

  return (
    <div className="min-h-screen bg-black px-12 py-9 text-white">
      {isError && (
        <div className="mb-5 rounded-md border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm font-semibold text-red-300">
          Dashboard data could not be loaded.
        </div>
      )}

      {isLoading && (
        <div className="mb-5 rounded-md border border-[#1a2233] bg-[#050609] px-4 py-3 text-sm font-semibold text-[#bfc1c7]">
          Loading dashboard data...
        </div>
      )}

      <section className="grid grid-cols-[1.55fr_0.85fr] gap-12">
        <div>
          <h1 className="text-[21px] font-semibold leading-6 text-[#f1f2f4]">
            Revenue
          </h1>
          <p className="mt-1 text-[14px] font-semibold text-[#747780]">
            Last 6 months performance
          </p>

          <div className="relative mt-8 h-[395px] cursor-pointer rounded-md transition duration-200 hover:scale-[1.01] hover:bg-white/[0.015] hover:drop-shadow-[0_0_18px_rgba(59,130,246,0.22)]">
            <svg
              viewBox="0 0 760 320"
              className="h-full w-full overflow-visible transition duration-200"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.58" />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.18" />
                </linearGradient>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              <path d={getRevenueFillPath(revenuePath)} fill="url(#revenueFill)" />
              <path
                d={revenuePath}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="3"
                filter="url(#lineGlow)"
                className="transition duration-200"
              />
              <line
                x1={currentPoint.x}
                y1="20"
                x2={currentPoint.x}
                y2="290"
                stroke="#cbd5e1"
                strokeDasharray="3 6"
                strokeOpacity="0.55"
                strokeWidth="2"
              />
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="5"
                fill="#3b82f6"
                stroke="#93c5fd"
                strokeWidth="2"
              />
            </svg>

            <div
              className="absolute flex h-11 w-16 items-center justify-center gap-2 rounded-md bg-white text-[13px] font-semibold text-[#101827] shadow-lg transition duration-200 hover:scale-105"
              style={{
                left: `${Math.min((currentPoint.x / 760) * 100, 86)}%`,
                top: `${Math.max((currentPoint.y / 320) * 100 - 8, 12)}%`,
              }}
            >
              <span className="h-3 w-3 rounded-full bg-[#3b82f6]" />
              {currentPoint.value}
            </div>

            <div className="absolute bottom-0 left-0 grid w-full grid-cols-7 px-2 text-[13px] font-semibold text-[#73767f]">
              {revenue.map((item) => (
                <span key={item.month}>{item.month}</span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[21px] font-semibold leading-6 text-[#f1f2f4]">
            Device Usage
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-[#747780]">
            How users access your platform
          </p>

          <div className="mt-20 flex flex-col items-center">
            <div
              className="h-[190px] w-[190px] cursor-pointer rounded-full transition duration-200 hover:scale-105 hover:shadow-[0_0_28px_rgba(106,165,255,0.24)]"
              style={{
                background: getDeviceGradient(dashboard.deviceUsage),
              }}
            >
              <div className="m-auto h-[112px] w-[112px] translate-y-[39px] rounded-full bg-black" />
            </div>

            <div className="mt-16 flex items-center gap-4 text-[14px] font-semibold text-[#c9cbd1]">
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#6adb73]" />
                Phone
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#ffd84f]" />
                Tablet
              </span>
              <span className="flex items-center gap-2">
                <span className="h-3.5 w-3.5 rounded-full bg-[#6ba5ff]" />
                Computer
              </span>
            </div>
          </div>
        </div>
      </section>

      <section className="mt-12 grid grid-cols-[1.35fr_1fr] gap-12">
        <div>
          <h2 className="text-[21px] font-semibold leading-6 text-[#f1f2f4]">
            User & Seller Distribution
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-[#747780]">
            Visual breakdown of global user & seller activity.
          </p>

          <div className="relative mt-6 h-[330px] cursor-pointer overflow-hidden rounded-md transition duration-200 hover:scale-[1.01] hover:bg-white/[0.015] hover:drop-shadow-[0_0_18px_rgba(106,219,115,0.16)]">
            <svg
              viewBox="0 0 760 360"
              className="h-full w-full transition duration-200"
              preserveAspectRatio="xMidYMid meet"
            >
              <rect width="760" height="360" fill="black" />
              <path
                d="M64 122 111 96l88-6 82 28 56-17 68 20 67-16 91 24 65 39 77 11-47 42-85-7-65 34-81-18-94 15-58-16-92 20-85-26-60-52-63-11Z"
                fill="#162033"
              />
              <path d="M75 112 104 101l78 8 55 37-39 41-88-4-44-33Z" fill="#65c760" />
              <path d="M159 93 258 113l32 52-64 40-58-25 21-37Z" fill="#3f75e8" />
              <path d="M350 126 438 109l78 19 39 55-48 45-83-13-72-40Z" fill="#18243a" />
              <path d="M508 172 548 187l9 66-27 55-37-35-4-62Z" fill="#6adb73" />
              <path d="M606 169 707 185l25 56-56 42-75-14-35-44Z" fill="#172238" />
              <path
                d="M61 125c126 8 240 11 350 19 132 9 230 32 304 58"
                fill="none"
                stroke="#22324b"
                strokeWidth="2"
                opacity="0.5"
              />
            </svg>

            <div className="absolute left-5 top-5 grid gap-2 text-[12px] font-semibold text-[#bfc1c7]">
              {dashboard.distribution.slice(0, 4).map((item, index) => (
                <span key={`${item.country}-${index}`}>
                  {item.country}: {item.sellers}
                </span>
              ))}
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-[21px] font-semibold leading-6 text-[#f1f2f4]">
            Recent Orders
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-[#747780]">
            A quick snapshot of your latest transactions.
          </p>

          <div className="mt-6 overflow-hidden rounded-[4px] border border-[#1a2233] transition duration-200 hover:border-[#2b3a5a] hover:shadow-[0_0_18px_rgba(59,130,246,0.12)]">
            <table className="w-full text-left text-[14px] font-semibold">
              <thead className="bg-[#111729] text-[#c6c9d2]">
                <tr>
                  <th className="px-5 py-4">Order ID</th>
                  <th className="px-5 py-4">Customer</th>
                  <th className="px-5 py-4">Amount</th>
                  <th className="px-5 py-4">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.length ? (
                  dashboard.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="border-t border-[#1a2233] text-[#bfc1c7] transition duration-150 hover:bg-[#0b1220] hover:text-white"
                    >
                      <td className="px-5 py-4">{order.id}</td>
                      <td className="px-5 py-4">{order.customer}</td>
                      <td className="px-5 py-4">{order.amount}</td>
                      <td className={`px-5 py-4 ${statusClass(order.status)}`}>
                        {order.status}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="border-t border-[#1a2233] text-[#747780]">
                    <td className="px-5 py-6" colSpan={4}>
                      No recent orders found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
};

export default DashboardPage;
