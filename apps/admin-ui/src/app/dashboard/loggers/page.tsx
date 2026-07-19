"use client";

import { useQuery } from "@tanstack/react-query";
import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";
import { useEffect, useMemo, useState } from "react";

type ActivityLog = {
  id: string;
  userId: string;
  userName: string;
  userRole: string;
  action: string;
  module: string;
  description: string;
  targetId: string;
  targetName: string;
  ipAddress: string;
  userAgent: string;
  requestMethod: string;
  endpoint: string;
  status: string;
  createdAt: string;
  updatedAt: string;
};

type LoggerResponse = {
  logs: ActivityLog[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalLogs: number;
    totalPages: number;
  };
};

type SortField =
  | "createdAt"
  | "userName"
  | "userRole"
  | "module"
  | "action"
  | "status"
  | "endpoint";

const roleOptions = ["Admin", "Seller", "User", "System"];
const statusOptions = ["Success", "Failed"];
const moduleOptions = [
  "Admin",
  "Dashboard",
  "Seller",
  "User",
  "Product",
  "Shop",
  "Orders",
  "Payments",
  "Media",
  "Wishlist",
  "Cart",
  "Offer",
  "Event",
  "System",
];
const actionOptions = [
  "Login",
  "Register",
  "Create",
  "Update",
  "Delete",
  "Create Product",
  "Edit Product",
  "Delete Product",
  "Create Shop",
  "Update Shop",
  "Delete Shop",
  "Follow Shop",
  "Unfollow Shop",
  "Place Order",
  "Change Order Status",
  "Payment Created",
  "Payment Success",
  "Dashboard",
  "Dashboard Action",
  "API Error",
];

const formatDateTime = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const escapeCsvValue = (value: unknown) =>
  `"${String(value ?? "N/A").replace(/"/g, '""')}"`;

const downloadFile = (content: string, type: string, fileName: string) => {
  const url = URL.createObjectURL(new Blob([content], { type }));
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.click();
  URL.revokeObjectURL(url);
};

const fetchLogs = async (params: Record<string, string | number>) => {
  const query = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (String(value).trim()) {
      query.set(key, String(value));
    }
  });

  const response = await axios.get<LoggerResponse>(
    `/api/admin/loggers?${query.toString()}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

const SearchIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#737b91]">
    <path
      d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const DownloadIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path
      d="M12 3v11m0 0 4-4m-4 4-4-4M4 17v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const RefreshIcon = () => (
  <svg width="17" height="17" viewBox="0 0 24 24" fill="none">
    <path
      d="M20 12a8 8 0 0 1-14.9 4M4 12A8 8 0 0 1 18.9 8M18 3v5h-5M6 21v-5h5"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const EyeIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" className="text-[#4f86ee]">
    <path
      d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const FilterSelect = ({
  label,
  value,
  options,
  onChange,
}: {
  label: string;
  value: string;
  options: string[];
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="mb-2 block text-[12px] font-semibold text-[#8f97aa]">
      {label}
    </span>
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-md border border-[#121a2d] bg-[#0d1324] px-3 text-[14px] font-semibold text-[#d8dbe3] outline-none transition focus:border-[#214d91]"
    >
      <option value="">All</option>
      {options.map((option) => (
        <option key={option} value={option}>
          {option}
        </option>
      ))}
    </select>
  </label>
);

const DateFilter = ({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) => (
  <label className="block">
    <span className="mb-2 block text-[12px] font-semibold text-[#8f97aa]">
      {label}
    </span>
    <input
      type="date"
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="h-11 w-full rounded-md border border-[#121a2d] bg-[#0d1324] px-3 text-[14px] font-semibold text-[#d8dbe3] outline-none transition focus:border-[#214d91]"
    />
  </label>
);

const StatusBadge = ({ status }: { status: string }) => (
  <span
    className={`inline-flex rounded-full px-3 py-1 text-[12px] font-bold ${
      status === "Success"
        ? "bg-[#0d3d23] text-[#7af5a4]"
        : "bg-[#4a1118] text-[#ff8892]"
    }`}
  >
    {status || "N/A"}
  </span>
);

const SortButton = ({
  field,
  sortBy,
  sortOrder,
  onSort,
  children,
}: {
  field: SortField;
  sortBy: SortField;
  sortOrder: "asc" | "desc";
  onSort: (field: SortField) => void;
  children: ReactNode;
}) => (
  <button
    type="button"
    onClick={() => onSort(field)}
    className="inline-flex items-center gap-1 transition hover:text-white"
  >
    {children}
    <span className="text-[10px] text-[#6f7890]">
      {sortBy === field ? (sortOrder === "asc" ? "ASC" : "DESC") : ""}
    </span>
  </button>
);

const DetailRow = ({
  label,
  value,
}: {
  label: string;
  value?: string;
}) => (
  <div className="grid gap-2 border-b border-[#182239] py-3 sm:grid-cols-[150px_1fr]">
    <span className="text-[13px] font-semibold text-[#8f97aa]">{label}</span>
    <span className="break-words text-[14px] font-semibold text-[#e4e7ef]">
      {value || "N/A"}
    </span>
  </div>
);

const LoggerDetailsModal = ({
  log,
  onClose,
}: {
  log: ActivityLog;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
    <div className="max-h-[90vh] w-full max-w-3xl overflow-y-auto rounded-lg border border-[#182239] bg-[#0b1020] p-6 shadow-2xl">
      <div className="mb-4 flex items-center justify-between gap-4">
        <div>
          <h2 className="text-[20px] font-semibold text-[#f1f2f4]">
            Activity Details
          </h2>
          <p className="mt-1 text-[13px] font-semibold text-[#8f97aa]">
            {formatDateTime(log.createdAt)}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="flex h-9 w-9 items-center justify-center rounded-md bg-[#111a2e] text-[#c9ceda] transition hover:bg-[#17233c] hover:text-white"
        >
          X
        </button>
      </div>

      <DetailRow label="User" value={log.userName} />
      <DetailRow label="User ID" value={log.userId} />
      <DetailRow label="Role" value={log.userRole} />
      <DetailRow label="Module" value={log.module} />
      <DetailRow label="Action" value={log.action} />
      <DetailRow label="Description" value={log.description} />
      <DetailRow label="Target ID" value={log.targetId} />
      <DetailRow label="Target Name" value={log.targetName} />
      <DetailRow label="IP Address" value={log.ipAddress} />
      <DetailRow label="User Agent" value={log.userAgent} />
      <DetailRow label="Method" value={log.requestMethod} />
      <DetailRow label="Endpoint" value={log.endpoint} />
      <DetailRow label="Status" value={log.status} />
      <DetailRow label="Created At" value={formatDateTime(log.createdAt)} />
      <DetailRow label="Updated At" value={formatDateTime(log.updatedAt)} />
    </div>
  </div>
);

const LoggersPage = () => {
  const router = useRouter();
  const [isAdminReady, setIsAdminReady] = useState(false);
  const [search, setSearch] = useState("");
  const [userRole, setUserRole] = useState("");
  const [module, setModule] = useState("");
  const [action, setAction] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState<SortField>("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [selectedLog, setSelectedLog] = useState<ActivityLog | null>(null);
  const queryParams = useMemo(
    () => ({
      search,
      userRole,
      module,
      action,
      status,
      startDate,
      endDate,
      page,
      limit: 10,
      sortBy,
      sortOrder,
    }),
    [action, endDate, module, page, search, sortBy, sortOrder, startDate, status, userRole]
  );
  const { data, isLoading, isFetching, refetch, error } = useQuery({
    queryKey: ["admin-loggers", queryParams],
    queryFn: () => fetchLogs(queryParams),
    enabled: isAdminReady,
  });
  const logs = data?.logs || [];
  const pagination = data?.pagination || {
    page,
    limit: 10,
    total: 0,
    totalLogs: 0,
    totalPages: 1,
  };
  const totalLogs = pagination.totalLogs ?? pagination.total ?? 0;

  useEffect(() => {
    const storedAdmin = window.localStorage.getItem("admin");

    if (!storedAdmin) {
      router.push("/");
      return;
    }

    setIsAdminReady(true);
  }, [router]);

  const updateFilter = (setter: (value: string) => void, value: string) => {
    setter(value);
    setPage(1);
  };

  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder((current) => (current === "asc" ? "desc" : "asc"));
      return;
    }

    setSortBy(field);
    setSortOrder("asc");
  };

  const exportRows = () =>
    logs.map((log) => [
      formatDateTime(log.createdAt),
      log.userName,
      log.userRole,
      log.module,
      log.action,
      log.description,
      log.status,
      log.ipAddress,
      log.endpoint,
      log.requestMethod,
      log.targetId,
      log.targetName,
    ]);

  const exportCsv = () => {
    const header = [
      "Date & Time",
      "User",
      "Role",
      "Module",
      "Action",
      "Description",
      "Status",
      "IP Address",
      "Endpoint",
      "Method",
      "Target ID",
      "Target Name",
    ];
    const csv = [header, ...exportRows()]
      .map((row) => row.map(escapeCsvValue).join(","))
      .join("\n");

    downloadFile(csv, "text/csv;charset=utf-8;", "activity-logs.csv");
  };

  const exportExcel = () => {
    const header = [
      "Date & Time",
      "User",
      "Role",
      "Module",
      "Action",
      "Description",
      "Status",
      "IP Address",
      "Endpoint",
      "Method",
      "Target ID",
      "Target Name",
    ];
    const rows = [header, ...exportRows()]
      .map(
        (row) =>
          `<tr>${row
            .map((value) => `<td>${String(value ?? "N/A").replace(/</g, "&lt;")}</td>`)
            .join("")}</tr>`
      )
      .join("");

    downloadFile(
      `<table>${rows}</table>`,
      "application/vnd.ms-excel;charset=utf-8;",
      "activity-logs.xls"
    );
  };

  if (!isAdminReady) {
    return (
      <div className="min-h-screen bg-black px-6 py-8 text-white lg:px-8">
        <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
          Activity Loggers
        </h1>
        <p className="mt-4 text-[14px] font-semibold text-[#8f97aa]">
          Checking admin access...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black px-6 py-8 text-white lg:px-8">
      <div className="mb-6 flex flex-col gap-5 xl:flex-row xl:items-start xl:justify-between">
        <div>
          <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
            Activity Loggers
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/dashboard" className="text-[#4f86ee]">
              Dashboard
            </Link>
            <span className="text-[#aeb3c0]">›</span>
            <span className="text-[#d7d9df]">Loggers</span>
          </div>
          <p className="mt-3 text-[13px] font-semibold text-[#8f97aa]">
            {totalLogs} saved activity {totalLogs === 1 ? "record" : "records"}
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={() => refetch()}
            className="flex h-9 items-center gap-2 rounded-md bg-[#17233c] px-4 text-[13px] font-semibold text-[#dce4f5] transition hover:bg-[#203052]"
          >
            <RefreshIcon />
            {isFetching ? "Refreshing..." : "Refresh"}
          </button>
          <button
            type="button"
            onClick={exportCsv}
            className="flex h-9 items-center gap-2 rounded-md bg-[#26b84b] px-4 text-[13px] font-semibold text-white transition hover:bg-[#31c957]"
          >
            <DownloadIcon />
            Export CSV
          </button>
          <button
            type="button"
            onClick={exportExcel}
            className="flex h-9 items-center gap-2 rounded-md bg-[#0f67d8] px-4 text-[13px] font-semibold text-white transition hover:bg-[#1776ef]"
          >
            <DownloadIcon />
            Export Excel
          </button>
        </div>
      </div>

      <div className="mb-5 grid gap-4 xl:grid-cols-[1.3fr_repeat(4,minmax(140px,1fr))]">
        <label className="block">
          <span className="mb-2 block text-[12px] font-semibold text-[#8f97aa]">
            Search
          </span>
          <div className="relative">
            <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
              <SearchIcon />
            </div>
            <input
              value={search}
              onChange={(event) => updateFilter(setSearch, event.target.value)}
              placeholder="Search user, action, module, endpoint..."
              className="h-11 w-full rounded-md border border-[#121a2d] bg-[#0d1324] pl-10 pr-4 text-[14px] font-semibold text-[#d8dbe3] outline-none transition placeholder:text-[#777f93] focus:border-[#214d91]"
            />
          </div>
        </label>
        <FilterSelect
          label="Role"
          value={userRole}
          options={roleOptions}
          onChange={(value) => updateFilter(setUserRole, value)}
        />
        <FilterSelect
          label="Module"
          value={module}
          options={moduleOptions}
          onChange={(value) => updateFilter(setModule, value)}
        />
        <FilterSelect
          label="Action"
          value={action}
          options={actionOptions}
          onChange={(value) => updateFilter(setAction, value)}
        />
        <FilterSelect
          label="Status"
          value={status}
          options={statusOptions}
          onChange={(value) => updateFilter(setStatus, value)}
        />
      </div>

      <div className="mb-5 grid gap-4 md:grid-cols-2 xl:max-w-[430px]">
        <DateFilter
          label="Start Date"
          value={startDate}
          onChange={(value) => updateFilter(setStartDate, value)}
        />
        <DateFilter
          label="End Date"
          value={endDate}
          onChange={(value) => updateFilter(setEndDate, value)}
        />
      </div>

      <div className="overflow-hidden rounded-lg border border-[#121a2d] bg-[#0b1020] px-5 py-5 shadow-[0_0_0_1px_rgba(255,255,255,0.02)]">
        <div className="overflow-x-auto">
          <table className="min-w-[1180px] w-full border-collapse text-left text-[13px] font-semibold">
            <thead>
              <tr className="text-[#d9dbe1]">
                <th className="px-3 pb-4">
                  <SortButton field="createdAt" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Date & Time
                  </SortButton>
                </th>
                <th className="px-3 pb-4">
                  <SortButton field="userName" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    User
                  </SortButton>
                </th>
                <th className="px-3 pb-4">
                  <SortButton field="userRole" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Role
                  </SortButton>
                </th>
                <th className="px-3 pb-4">
                  <SortButton field="module" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Module
                  </SortButton>
                </th>
                <th className="px-3 pb-4">
                  <SortButton field="action" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Action
                  </SortButton>
                </th>
                <th className="px-3 pb-4">Description</th>
                <th className="px-3 pb-4">
                  <SortButton field="status" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Status
                  </SortButton>
                </th>
                <th className="px-3 pb-4">IP Address</th>
                <th className="px-3 pb-4">
                  <SortButton field="endpoint" sortBy={sortBy} sortOrder={sortOrder} onSort={handleSort}>
                    Endpoint
                  </SortButton>
                </th>
                <th className="px-3 pb-4 text-center">View Details</th>
              </tr>
            </thead>
            <tbody>
              {isLoading && (
                <tr className="border-t border-[#161f33] text-[#8e94a4]">
                  <td className="px-3 py-5" colSpan={10}>
                    Loading activity logs...
                  </td>
                </tr>
              )}

              {!isLoading && error && (
                <tr className="border-t border-[#161f33] text-[#ff8892]">
                  <td className="px-3 py-5" colSpan={10}>
                    Logger data could not be loaded.
                  </td>
                </tr>
              )}

              {!isLoading && !error && logs.length === 0 && (
                <tr className="border-t border-[#161f33] text-[#8e94a4]">
                  <td className="px-3 py-5" colSpan={10}>
                    No activity logs found.
                  </td>
                </tr>
              )}

              {!isLoading &&
                !error &&
                logs.map((log) => (
                  <tr
                    key={log.id}
                    className="border-t border-[#161f33] text-[#b9bdc9] transition hover:bg-[#111a2e] hover:text-white"
                  >
                    <td className="px-3 py-4 whitespace-nowrap">
                      {formatDateTime(log.createdAt)}
                    </td>
                    <td className="px-3 py-4 max-w-[150px] truncate">
                      {log.userName || "N/A"}
                    </td>
                    <td className="px-3 py-4">{log.userRole || "N/A"}</td>
                    <td className="px-3 py-4">{log.module || "N/A"}</td>
                    <td className="px-3 py-4 max-w-[150px] truncate">
                      {log.action || "N/A"}
                    </td>
                    <td className="px-3 py-4 max-w-[260px] truncate">
                      {log.description || "N/A"}
                    </td>
                    <td className="px-3 py-4">
                      <StatusBadge status={log.status} />
                    </td>
                    <td className="px-3 py-4">{log.ipAddress || "N/A"}</td>
                    <td className="px-3 py-4 max-w-[230px] truncate">
                      {log.endpoint || "N/A"}
                    </td>
                    <td className="px-3 py-4">
                      <button
                        type="button"
                        onClick={() => setSelectedLog(log)}
                        className="mx-auto flex h-8 w-8 items-center justify-center rounded-md transition hover:scale-105 hover:bg-[#17233c]"
                        aria-label={`View ${log.action} details`}
                      >
                        <EyeIcon />
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col gap-4 border-t border-[#161f33] pt-5 text-[14px] font-semibold text-[#c4c8d4] md:flex-row md:items-center md:justify-between">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            className="rounded-full bg-[#0f3d98] px-6 py-3 text-[#d8e4ff] transition hover:bg-[#154cb8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>

          <span className="text-center">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            type="button"
            disabled={pagination.page >= pagination.totalPages}
            onClick={() =>
              setPage((currentPage) =>
                Math.min(currentPage + 1, pagination.totalPages)
              )
            }
            className="rounded-full bg-[#0f3d98] px-6 py-3 text-[#d8e4ff] transition hover:bg-[#154cb8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      </div>

      {selectedLog && (
        <LoggerDetailsModal
          log={selectedLog}
          onClose={() => setSelectedLog(null)}
        />
      )}
    </div>
  );
};

export default LoggersPage;
