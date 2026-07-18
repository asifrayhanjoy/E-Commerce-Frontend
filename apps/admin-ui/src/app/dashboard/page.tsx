"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";

type RevenuePoint = {
  month: string;
  total: number;
  count: number;
  active?: boolean;
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
    totalEvents?: number;
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

const fallbackDashboard: DashboardData = {
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
  revenue: fallbackRevenue,
  revenueMarker: {
    index: 4,
    month: "May",
    value: 0,
    total: 0,
  },
  deviceUsage: { phone: 0, tablet: 0, computer: 0 },
  distribution: [],
  recentOrders: [],
};

const numberFormatter = new Intl.NumberFormat("en-US");
const currencyFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

const fetchDashboard = async () => {
  const response = await axios.get<{
    data?: DashboardData;
    dashboard?: DashboardData;
  }>(API_URL, {
    withCredentials: true,
  });

  return response.data.data || response.data.dashboard || fallbackDashboard;
};

const formatNumber = (value: number) => numberFormatter.format(value || 0);
const formatCurrency = (value: number) => currencyFormatter.format(value || 0);

const statusClass = (status: string) => {
  const normalizedStatus = status.toLowerCase();

  if (
    ["paid", "delivered", "completed", "success"].some((keyword) =>
      normalizedStatus.includes(keyword)
    )
  ) {
    return "border-[#2f8f4e]/50 bg-[#10331f] text-[#6ee083]";
  }

  if (normalizedStatus.includes("pending")) {
    return "border-[#856c1d]/60 bg-[#312909] text-[#ffd957]";
  }

  return "border-[#7f2630]/60 bg-[#351217] text-[#ff767f]";
};

const getRevenueMetric = (item: RevenuePoint) => item.total || item.count;

const getRevenuePoints = (revenue: RevenuePoint[]) => {
  const hasData = revenue.some((item) => getRevenueMetric(item) > 0);
  const maxTotal = Math.max(...revenue.map((item) => getRevenueMetric(item)), 1);
  const left = 34;
  const right = 728;
  const top = 24;
  const bottom = 252;
  const width = right - left;
  const height = bottom - top;
  const step = width / Math.max(revenue.length - 1, 1);

  return revenue.map((item, index) => {
    const x = left + index * step;
    const y = hasData
      ? bottom - (getRevenueMetric(item) / maxTotal) * height
      : 164;

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
      const controlOffset = (point.x - previousPoint.x) * 0.42;

      return `C ${(previousPoint.x + controlOffset).toFixed(2)} ${previousPoint.y.toFixed(
        2
      )}, ${(point.x - controlOffset).toFixed(2)} ${point.y.toFixed(2)}, ${point.x.toFixed(
        2
      )} ${point.y.toFixed(2)}`;
    })
    .join(" ");
};

const getRevenueFillPath = (linePath: string) =>
  linePath ? `${linePath} L728 264 L34 264 Z` : "";

const getCurrentRevenuePoint = (
  revenue: RevenuePoint[],
  marker: DashboardData["revenueMarker"]
) => {
  const points = getRevenuePoints(revenue);
  const activeIndex = revenue.findIndex((item) => item.active);
  const markerIndex = Number.isFinite(marker.index) ? marker.index : activeIndex;
  const index = Math.min(
    Math.max(markerIndex >= 0 ? markerIndex : activeIndex >= 0 ? activeIndex : 4, 0),
    Math.max(points.length - 1, 0)
  );
  const point = points[index] || { x: 500, y: 164 };
  const item = revenue[index] || { total: 0, count: 0, month: marker.month };

  return {
    x: point.x,
    y: point.y,
    month: item.month || marker.month,
    total: item.total || marker.total || 0,
    count: item.count || marker.value || 0,
  };
};

const getDeviceTotal = (deviceUsage: DashboardData["deviceUsage"]) =>
  Math.max(
    Number(deviceUsage.phone || 0) +
      Number(deviceUsage.tablet || 0) +
      Number(deviceUsage.computer || 0),
    1
  );

const getDeviceGradient = (deviceUsage: DashboardData["deviceUsage"]) => {
  const phone = Math.max(deviceUsage.phone, 0);
  const tablet = Math.max(deviceUsage.tablet, 0);
  const computer = Math.max(deviceUsage.computer, 0);
  const total = phone + tablet + computer || 1;
  const phoneEnd = (phone / total) * 360;
  const tabletEnd = phoneEnd + (tablet / total) * 360;

  return `conic-gradient(#58d47a 0deg ${phoneEnd}deg, #f4c84b ${phoneEnd}deg ${tabletEnd}deg, #4d7cff ${tabletEnd}deg 360deg)`;
};

const getPercent = (value: number, total: number) =>
  Math.round((Math.max(value, 0) / total) * 100);

const StatBadge = ({
  label,
  value,
  hint,
  color,
}: {
  label: string;
  value: string;
  hint: string;
  color: string;
}) => (
  <div className="rounded-md border border-[#101a31] bg-[#050810] p-5 shadow-[0_0_0_1px_rgba(36,87,223,0.03)] transition duration-150 hover:border-[#1f3260] hover:bg-[#071021]">
    <div className="flex items-center justify-between gap-4">
      <span className="text-[13px] font-semibold text-[#8d95aa]">{label}</span>
      <span
        className="flex h-9 w-9 items-center justify-center rounded-md text-[15px] font-bold text-white"
        style={{ backgroundColor: color }}
      >
        {label.slice(0, 1)}
      </span>
    </div>
    <p className="mt-5 text-[30px] font-bold leading-none text-[#f4f6fb]">
      {value}
    </p>
    <p className="mt-3 text-[12px] font-semibold text-[#6e7689]">{hint}</p>
  </div>
);

const EmptyState = ({ text }: { text: string }) => (
  <div className="rounded-md border border-dashed border-[#19233b] bg-[#03050a] px-4 py-8 text-center text-[14px] font-semibold text-[#737b90]">
    {text}
  </div>
);

const DashboardPage = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-dashboard"],
    queryFn: fetchDashboard,
    staleTime: 0,
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
  });

  const dashboard = data || fallbackDashboard;
  const revenue = dashboard.revenue.length ? dashboard.revenue : fallbackRevenue;
  const revenuePath = getRevenuePath(revenue);
  const revenueFillPath = getRevenueFillPath(revenuePath);
  const currentPoint = getCurrentRevenuePoint(
    revenue,
    dashboard.revenueMarker || fallbackDashboard.revenueMarker
  );
  const deviceTotal = getDeviceTotal(dashboard.deviceUsage);
  const distributionTotal = Math.max(
    ...dashboard.distribution.map((item) => item.sellers),
    1
  );

  const stats = [
    {
      label: "Users",
      value: formatNumber(dashboard.stats.totalUsers),
      hint: "Registered customer accounts",
      color: "#2457df",
    },
    {
      label: "Sellers",
      value: formatNumber(dashboard.stats.totalSellers),
      hint: "Approved seller profiles",
      color: "#18a058",
    },
    {
      label: "Products",
      value: formatNumber(dashboard.stats.totalProducts),
      hint: "Products loaded from backend",
      color: "#7c5cff",
    },
    {
      label: "Orders",
      value: formatNumber(dashboard.stats.totalOrders),
      hint: "Total order records",
      color: "#e18b26",
    },
  ];

  const orderSummary = [
    {
      label: "Successful",
      value: dashboard.stats.successfulOrders,
      className: "text-[#6ee083]",
    },
    {
      label: "Pending",
      value: dashboard.stats.pendingOrders,
      className: "text-[#ffd957]",
    },
    {
      label: "Events",
      value: dashboard.stats.totalEvents || 0,
      className: "text-[#7da0ff]",
    },
  ];

  return (
    <div className="min-h-screen bg-black px-8 py-[44px] text-white">
      <style>{`
        @keyframes dashboardRevenueLineDraw {
          from {
            stroke-dashoffset: 1;
          }
          to {
            stroke-dashoffset: 0;
          }
        }

        @keyframes dashboardRevenueFillRise {
          from {
            opacity: 0;
            transform: scaleY(0.15);
          }
          to {
            opacity: 1;
            transform: scaleY(1);
          }
        }

        @keyframes dashboardMarkerPulse {
          0%, 100% {
            transform: scale(1);
            opacity: 1;
          }
          50% {
            transform: scale(1.28);
            opacity: 0.72;
          }
        }

        @keyframes dashboardTooltipFloat {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-8px);
          }
        }

        @keyframes dashboardDonutSpin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }

        .dashboard-revenue-line {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: dashboardRevenueLineDraw 1.35s ease-out forwards;
        }

        .dashboard-revenue-fill {
          opacity: 0;
          transform-box: fill-box;
          transform-origin: center bottom;
          animation: dashboardRevenueFillRise 1s ease-out 0.15s forwards;
        }

        .dashboard-revenue-dot {
          transform-box: fill-box;
          transform-origin: center;
          animation: dashboardMarkerPulse 1.65s ease-in-out infinite;
        }

        .dashboard-revenue-tooltip {
          animation: dashboardTooltipFloat 2s ease-in-out infinite;
        }

        .dashboard-donut-ring {
          animation: dashboardDonutSpin 14s linear infinite;
        }

        @media (prefers-reduced-motion: reduce) {
          .dashboard-revenue-line,
          .dashboard-revenue-fill,
          .dashboard-revenue-dot,
          .dashboard-revenue-tooltip,
          .dashboard-donut-ring {
            animation: none;
            opacity: 1;
            stroke-dashoffset: 0;
          }
        }
      `}</style>

      <div className="mb-8 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[25px] font-semibold leading-8 text-[#f2f3f5]">
            Dashboard
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/dashboard" className="text-[#4f73d9]">
              Dashboard
            </Link>
            <span className="text-[#aeb3c0]">&gt;</span>
            <span className="text-[#d7d9df]">Overview</span>
          </div>
        </div>

        <div className="rounded-full border border-[#16203a] bg-[#081022] px-5 py-3 text-[13px] font-semibold text-[#9aa6c0]">
          Backend dashboard data
        </div>
      </div>

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

      <section className="grid gap-5 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <StatBadge key={stat.label} {...stat} />
        ))}
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[1.42fr_0.78fr]">
        <div className="rounded-md border border-[#101a31] bg-[#050810] p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold leading-6 text-[#f1f2f4]">
                Revenue
              </h2>
              <p className="mt-2 text-[14px] font-semibold text-[#747c90]">
                Last seven months performance
              </p>
            </div>

            <div className="rounded-md border border-[#16223f] bg-[#0a1122] px-4 py-3 text-right">
              <p className="text-[12px] font-semibold text-[#80889a]">
                Total Revenue
              </p>
              <p className="mt-1 text-[18px] font-bold text-[#f5f7fb]">
                {formatCurrency(dashboard.stats.totalRevenue)}
              </p>
            </div>
          </div>

          <div className="relative mt-8 h-[330px]">
            <svg
              viewBox="0 0 760 290"
              className="h-full w-full overflow-visible"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="revenueFill" x1="0" x2="0" y1="0" y2="1">
                  <stop offset="0%" stopColor="#2457df" stopOpacity="0.56" />
                  <stop offset="100%" stopColor="#2457df" stopOpacity="0.04" />
                </linearGradient>
                <filter id="lineGlow">
                  <feGaussianBlur stdDeviation="2.5" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
              </defs>

              {[52, 102, 152, 202, 252].map((y) => (
                <line
                  key={y}
                  x1="34"
                  y1={y}
                  x2="728"
                  y2={y}
                  stroke="#131d31"
                  strokeWidth="1"
                />
              ))}

              <path
                d={revenueFillPath}
                fill="url(#revenueFill)"
                className="dashboard-revenue-fill"
              />
              <path
                d={revenuePath}
                fill="none"
                stroke="#3e70ff"
                strokeWidth="3"
                filter="url(#lineGlow)"
                pathLength={1}
                className="dashboard-revenue-line"
              />
              <line
                x1={currentPoint.x}
                y1="24"
                x2={currentPoint.x}
                y2="252"
                stroke="#cbd5e1"
                strokeDasharray="3 7"
                strokeOpacity="0.42"
                strokeWidth="2"
              />
              <circle
                cx={currentPoint.x}
                cy={currentPoint.y}
                r="6"
                fill="#2457df"
                stroke="#9db7ff"
                strokeWidth="3"
                className="dashboard-revenue-dot"
              />
            </svg>

            <div
              className="dashboard-revenue-tooltip absolute min-w-[102px] rounded-md border border-[#223253] bg-white px-3 py-2 text-center text-[12px] font-bold text-[#111827] shadow-xl"
              style={{
                left: `${Math.min((currentPoint.x / 760) * 100, 82)}%`,
                top: `${Math.max((currentPoint.y / 290) * 100 - 13, 4)}%`,
              }}
            >
              <p>{currentPoint.month}</p>
              <p className="text-[#2457df]">{formatCurrency(currentPoint.total)}</p>
            </div>

            <div className="absolute bottom-0 left-0 grid w-full grid-cols-7 px-2 text-[13px] font-semibold text-[#71798c]">
              {revenue.map((item) => (
                <span key={item.month}>{item.month}</span>
              ))}
            </div>
          </div>
        </div>

        <div className="grid gap-6">
          <div className="rounded-md border border-[#101a31] bg-[#050810] p-7">
            <h2 className="text-[22px] font-semibold leading-6 text-[#f1f2f4]">
              Device Usage
            </h2>
            <p className="mt-2 text-[14px] font-semibold text-[#747c90]">
              How users access the platform
            </p>

            <div className="mt-8 flex items-center justify-center">
              <div className="relative flex h-[178px] w-[178px] items-center justify-center rounded-full">
                <div
                  className="dashboard-donut-ring absolute inset-0 rounded-full"
                  style={{ background: getDeviceGradient(dashboard.deviceUsage) }}
                />
                <div className="relative z-10 flex h-[106px] w-[106px] flex-col items-center justify-center rounded-full bg-black">
                  <span className="text-[24px] font-bold text-white">
                    {formatNumber(deviceTotal)}
                  </span>
                  <span className="text-[11px] font-semibold text-[#7b8497]">
                    visits
                  </span>
                </div>
              </div>
            </div>

            <div className="mt-8 grid gap-3 text-[13px] font-semibold">
              {[
                { label: "Phone", value: dashboard.deviceUsage.phone, color: "#58d47a" },
                { label: "Tablet", value: dashboard.deviceUsage.tablet, color: "#f4c84b" },
                {
                  label: "Computer",
                  value: dashboard.deviceUsage.computer,
                  color: "#4d7cff",
                },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between">
                  <span className="flex items-center gap-2 text-[#c9cdd7]">
                    <span
                      className="h-3 w-3 rounded-full"
                      style={{ backgroundColor: item.color }}
                    />
                    {item.label}
                  </span>
                  <span className="text-[#8892a8]">
                    {getPercent(item.value, deviceTotal)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-md border border-[#101a31] bg-[#050810] p-7">
            <h2 className="text-[22px] font-semibold leading-6 text-[#f1f2f4]">
              Orders
            </h2>
            <div className="mt-5 grid grid-cols-3 gap-3">
              {orderSummary.map((item) => (
                <div
                  key={item.label}
                  className="rounded-md border border-[#121d34] bg-[#080d19] px-4 py-4"
                >
                  <p className={`text-[22px] font-bold ${item.className}`}>
                    {formatNumber(item.value)}
                  </p>
                  <p className="mt-1 text-[12px] font-semibold text-[#7b8497]">
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 grid gap-6 xl:grid-cols-[0.8fr_1.2fr]">
        <div className="rounded-md border border-[#101a31] bg-[#050810] p-7">
          <h2 className="text-[22px] font-semibold leading-6 text-[#f1f2f4]">
            Seller Distribution
          </h2>
          <p className="mt-2 text-[14px] font-semibold text-[#747c90]">
            Seller count by region
          </p>

          <div className="mt-6 grid gap-4">
            {dashboard.distribution.length ? (
              dashboard.distribution.slice(0, 6).map((item, index) => (
                <div key={`${item.country}-${index}`}>
                  <div className="mb-2 flex items-center justify-between text-[13px] font-semibold">
                    <span className="text-[#d8dce7]">{item.country}</span>
                    <span className="text-[#7f8aa1]">{formatNumber(item.sellers)}</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-[#111a2c]">
                    <div
                      className="h-full rounded-full bg-[#2457df]"
                      style={{
                        width: `${Math.max((item.sellers / distributionTotal) * 100, 6)}%`,
                      }}
                    />
                  </div>
                </div>
              ))
            ) : (
              <EmptyState text="No seller distribution found." />
            )}
          </div>
        </div>

        <div className="rounded-md border border-[#101a31] bg-[#050810] p-7">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-[22px] font-semibold leading-6 text-[#f1f2f4]">
                Recent Orders
              </h2>
              <p className="mt-2 text-[14px] font-semibold text-[#747c90]">
                Latest transactions from backend
              </p>
            </div>
          </div>

          <div className="mt-6 overflow-hidden rounded-md border border-[#121d34]">
            <table className="w-full border-collapse text-left text-[14px] font-semibold">
              <thead>
                <tr className="h-[52px] bg-[#0b1122] text-[#cfd3df]">
                  <th className="px-5">Order ID</th>
                  <th className="px-5">Customer</th>
                  <th className="px-5">Amount</th>
                  <th className="px-5">Status</th>
                </tr>
              </thead>
              <tbody>
                {dashboard.recentOrders.length ? (
                  dashboard.recentOrders.map((order) => (
                    <tr
                      key={order.id}
                      className="h-[58px] border-t border-[#11172b] text-[#b8bcc8] transition duration-150 hover:bg-[#080f1d]"
                    >
                      <td className="px-5 text-[#e1e4eb]">{order.id}</td>
                      <td className="px-5">{order.customer}</td>
                      <td className="px-5">{order.amount}</td>
                      <td className="px-5">
                        <span
                          className={`inline-flex h-8 items-center rounded-full border px-3 text-[12px] font-bold ${statusClass(
                            order.status
                          )}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr className="h-[76px] border-t border-[#11172b] text-[#747780]">
                    <td className="px-5" colSpan={4}>
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
