"use client";

import axiosInstance from "@/utils/axiosInstance";
import useSeller from "@/hooks/useSeller";
import { useQuery } from "@tanstack/react-query";
import { Bell, ChevronRight, ExternalLink, Search } from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";

type SellerNotification = {
  id?: string;
  title?: string;
  message?: string;
  creatorId?: string;
  receiverId?: string;
  redirectLink?: string;
  redirect_link?: string;
  createdAt?: string;
};

const fetchNotifications = async () => {
  const response = await axiosInstance.get("/api/v1/auth/seller-notifications?limit=100");

  return Array.isArray(response.data?.notifications)
    ? (response.data.notifications as SellerNotification[])
    : [];
};

const normalizeTarget = (value: unknown) =>
  typeof value === "string" ? value.trim().toLowerCase() : "";

const formatDate = (value?: string) => {
  if (!value) return "N/A";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return "N/A";

  return new Intl.DateTimeFormat("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
};

const getNotificationLink = (notification: SellerNotification) =>
  notification.redirectLink || notification.redirect_link || "";

function NotificationsPage() {
  const { seller } = useSeller();
  const [search, setSearch] = useState("");

  const {
    data: notifications = [],
    isLoading,
    isError,
  } = useQuery<SellerNotification[]>({
    queryKey: ["seller-notifications"],
    queryFn: fetchNotifications,
    staleTime: 1000 * 60,
  });

  const sellerTargets = useMemo(
    () =>
      new Set(
        [
          seller?.id,
          seller?._id,
          seller?.email,
          seller?.shop?.id,
          seller?.shop?._id,
          seller?.shop?.name,
        ]
          .map(normalizeTarget)
          .filter(Boolean)
      ),
    [seller]
  );

  const filteredNotifications = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    const sellerWideTargets = new Set([
      "",
      "all",
      "seller",
      "sellers",
      "all-sellers",
      "all_sellers",
    ]);

    return notifications
      .filter((notification) => {
        const receiver = normalizeTarget(notification.receiverId);

        return sellerWideTargets.has(receiver) || sellerTargets.has(receiver);
      })
      .filter((notification) => {
        if (!normalizedSearch) return true;

        return [notification.title, notification.message, notification.creatorId]
          .join(" ")
          .toLowerCase()
          .includes(normalizedSearch);
      });
  }, [notifications, search, sellerTargets]);

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <h2 className="font-Poppins text-2xl font-semibold text-white">
        Notifications
      </h2>

      <div className="mt-2 flex items-center text-sm text-white">
        <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>Notifications</span>
      </div>

      <div className="mt-6 flex items-center rounded-md bg-gray-900 p-3">
        <Search size={18} className="mr-2 text-gray-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search notifications..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
      </div>

      <div className="mt-6 rounded-lg border border-slate-800 bg-gray-950">
        {isLoading ? (
          <p className="py-12 text-center text-gray-400">Loading notifications...</p>
        ) : isError ? (
          <p className="py-12 text-center text-red-400">
            Notifications could not be loaded.
          </p>
        ) : filteredNotifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-400">
            <Bell size={34} className="text-blue-400" />
            <p>No notifications available yet.</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-800">
            {filteredNotifications.map((notification) => {
              const redirectLink = getNotificationLink(notification);

              return (
                <article
                  key={notification.id || `${notification.title}-${notification.createdAt}`}
                  className="flex flex-col gap-4 p-5 transition hover:bg-gray-900 md:flex-row md:items-center md:justify-between"
                >
                  <div className="flex gap-4">
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-blue-600/15 text-blue-400">
                      <Bell size={20} />
                    </div>
                    <div>
                      <h3 className="text-base font-semibold text-white">
                        {notification.title || "Notification"}
                      </h3>
                      <p className="mt-1 max-w-3xl text-sm leading-6 text-gray-400">
                        {notification.message || "No message provided."}
                      </p>
                      <p className="mt-2 text-xs font-semibold text-gray-500">
                        {formatDate(notification.createdAt)}
                      </p>
                    </div>
                  </div>

                  {redirectLink && (
                    redirectLink.startsWith("/") ? (
                      <Link
                        href={redirectLink}
                        className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-blue-500"
                      >
                        Open
                        <ExternalLink size={16} />
                      </Link>
                    ) : (
                      <a
                        href={redirectLink}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-2 rounded-md border border-slate-700 px-3 py-2 text-sm font-semibold text-white transition hover:border-blue-500"
                      >
                        Open
                        <ExternalLink size={16} />
                      </a>
                    )
                  )}
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export default NotificationsPage;
