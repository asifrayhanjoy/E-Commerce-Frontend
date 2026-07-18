"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios, { AxiosError } from "axios";
import Link from "next/link";
import { useState } from "react";
import type { FormEvent } from "react";

type AdminNotification = {
  id: string;
  title: string;
  message: string;
  creatorId: string;
  receiverId: string;
  redirectLink: string;
  created: string;
};

type NotificationResponse = {
  notifications: AdminNotification[];
  pagination?: {
    page: number;
    limit: number;
    totalNotifications: number;
    totalPages: number;
  };
};

type NotificationForm = {
  title: string;
  message: string;
  receiverId: string;
  redirectLink: string;
};

const initialForm: NotificationForm = {
  title: "",
  message: "",
  receiverId: "all",
  redirectLink: "",
};

const fetchNotifications = async (search: string, page: number) => {
  const query = new URLSearchParams({
    page: String(page),
    limit: "12",
  });

  if (search.trim()) {
    query.set("search", search.trim());
  }

  const response = await axios.get<NotificationResponse>(
    `/api/admin/notifications?${query.toString()}`,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

const createNotification = async (
  form: NotificationForm & { creatorId: string }
) => {
  const response = await axios.post<{ success: boolean }>(
    "/api/admin/notifications",
    form,
    {
      withCredentials: true,
    }
  );

  return response.data;
};

const getErrorMessage = (error: AxiosError<{ message?: string }>) =>
  error.response?.data?.message ||
  error.message ||
  "Unable to create notification.";

const getStoredAdminId = () => {
  const fallback = "admin";

  try {
    const storedAdmin = window.localStorage.getItem("admin");
    if (!storedAdmin) {
      return fallback;
    }

    const admin = JSON.parse(storedAdmin) as { id?: string; email?: string };
    return admin.id || admin.email || fallback;
  } catch {
    return fallback;
  }
};

const BellIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M6 9a6 6 0 0 1 12 0c0 7 2 7 2 9H4c0-2 2-2 2-9Zm4 12h4"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const LinkIcon = () => (
  <svg
    width="17"
    height="17"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
  >
    <path
      d="M10 13a5 5 0 0 0 7.1.1l2-2a5 5 0 0 0-7-7.1l-1.1 1.1M14 11a5 5 0 0 0-7.1-.1l-2 2a5 5 0 0 0 7 7.1l1.1-1.1"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const SearchIcon = () => (
  <svg
    width="18"
    height="18"
    viewBox="0 0 24 24"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    className="text-[#737b91]"
  >
    <path
      d="m21 21-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const targetOptions = [
  { label: "All", value: "all" },
  { label: "Users", value: "users" },
  { label: "Sellers", value: "sellers" },
  { label: "Admins", value: "admins" },
];

const NotificationsPage = () => {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState<NotificationForm>(initialForm);
  const [serverError, setServerError] = useState<string | null>(null);
  const { data, isLoading } = useQuery({
    queryKey: ["admin-notifications", search, page],
    queryFn: () => fetchNotifications(search, page),
  });
  const notifications = data?.notifications || [];
  const pagination = data?.pagination || {
    page,
    limit: 12,
    totalNotifications: notifications.length,
    totalPages: 1,
  };
  const linkedNotifications = notifications.filter(
    (notification) => notification.redirectLink
  ).length;
  const targetedNotifications = notifications.filter(
    (notification) => notification.receiverId !== "all"
  ).length;
  const createNotificationMutation = useMutation({
    mutationFn: createNotification,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-notifications"] });
      setForm(initialForm);
      setServerError(null);
      setIsModalOpen(false);
    },
    onError: (error: AxiosError<{ message?: string }>) => {
      setServerError(getErrorMessage(error));
    },
  });

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const openModal = () => {
    setServerError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (createNotificationMutation.isPending) {
      return;
    }

    setForm(initialForm);
    setServerError(null);
    setIsModalOpen(false);
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setServerError(null);
    createNotificationMutation.mutate({
      ...form,
      creatorId: getStoredAdminId(),
    });
  };

  return (
    <div className="min-h-screen bg-black px-8 py-8 text-white">
      <div className="mb-6 flex items-start justify-between gap-5">
        <div>
          <h1 className="text-[22px] font-semibold leading-7 text-[#f1f2f4]">
            Notifications
          </h1>
          <div className="mt-3 flex items-center gap-2 text-[14px] font-semibold">
            <Link href="/dashboard" className="text-[#4f86ee]">
              Dashboard
            </Link>
            <span className="text-[#aeb3c0]">&gt;</span>
            <span className="text-[#d7d9df]">Notifications</span>
          </div>
        </div>

        <button
          type="button"
          onClick={openModal}
          className="flex h-10 items-center gap-2 rounded-full bg-[#2457df] px-5 text-[14px] font-semibold text-white shadow-[0_0_0_1px_rgba(102,140,255,0.22)] transition duration-150 hover:bg-[#3266ee]"
        >
          <BellIcon />
          Create
        </button>
      </div>

      <div className="mb-5 grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="rounded-md border border-[#121a2d] bg-[#080d19] px-5 py-4">
          <p className="text-[12px] font-semibold text-[#8f97ab]">Total</p>
          <p className="mt-2 text-[28px] font-semibold text-[#f4f6fb]">
            {pagination.totalNotifications}
          </p>
        </div>
        <div className="rounded-md border border-[#121a2d] bg-[#080d19] px-5 py-4">
          <p className="text-[12px] font-semibold text-[#8f97ab]">Targeted</p>
          <p className="mt-2 text-[28px] font-semibold text-[#f4f6fb]">
            {targetedNotifications}
          </p>
        </div>
        <div className="rounded-md border border-[#121a2d] bg-[#080d19] px-5 py-4">
          <p className="text-[12px] font-semibold text-[#8f97ab]">With Links</p>
          <p className="mt-2 text-[28px] font-semibold text-[#f4f6fb]">
            {linkedNotifications}
          </p>
        </div>
      </div>

      <div className="relative mb-5">
        <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2">
          <SearchIcon />
        </div>
        <input
          value={search}
          onChange={(event) => handleSearch(event.target.value)}
          placeholder="Search notifications..."
          className="h-12 w-full rounded-md border border-[#121a2d] bg-[#0d1324] pl-10 pr-4 text-[15px] font-semibold text-[#d8dbe3] outline-none transition duration-200 placeholder:text-[#777f93] focus:border-[#214d91] focus:bg-[#10182d]"
        />
      </div>

      <div className="overflow-hidden rounded-md border border-[#121a2d] bg-black">
        <table className="w-full border-collapse text-left text-[14px] font-semibold">
          <thead>
            <tr className="h-[52px] bg-[#0b1122] text-[#cfd3df]">
              <th className="w-[24%] px-4">Title</th>
              <th className="w-[36%] px-4">Message</th>
              <th className="px-4">Receiver</th>
              <th className="px-4">Date</th>
              <th className="px-4 text-center">Link</th>
            </tr>
          </thead>
          <tbody>
            {isLoading && (
              <tr className="h-[56px] border-t border-[#11172b] text-[#979dad]">
                <td className="px-4" colSpan={5}>
                  Loading notifications...
                </td>
              </tr>
            )}

            {!isLoading && notifications.length === 0 && (
              <tr className="h-[56px] border-t border-[#11172b] text-[#979dad]">
                <td className="px-4" colSpan={5}>
                  No notifications found.
                </td>
              </tr>
            )}

            {!isLoading &&
              notifications.map((notification) => (
                <tr
                  key={notification.id || `${notification.title}-${notification.created}`}
                  className="border-t border-[#11172b] text-[#b8bcc8] transition duration-150 hover:bg-[#080d19] hover:text-white"
                >
                  <td className="px-4 py-4 text-[#e5e7ed]">
                    {notification.title}
                  </td>
                  <td className="px-4 py-4">
                    <p className="line-clamp-2 max-w-[520px]">
                      {notification.message}
                    </p>
                  </td>
                  <td className="px-4 py-4">
                    <span className="rounded-full bg-[#111a2e] px-3 py-1 text-[12px] text-[#d9e3ff]">
                      {notification.receiverId}
                    </span>
                  </td>
                  <td className="px-4 py-4">{notification.created || "N/A"}</td>
                  <td className="px-4 py-4">
                    {notification.redirectLink ? (
                      <a
                        href={notification.redirectLink}
                        className="mx-auto flex h-8 w-8 items-center justify-center rounded-md text-[#4f86ee] transition duration-150 hover:bg-[#17233c]"
                        aria-label="Open notification link"
                      >
                        <LinkIcon />
                      </a>
                    ) : (
                      <span className="block text-center text-[#626a7d]">
                        None
                      </span>
                    )}
                  </td>
                </tr>
              ))}
          </tbody>
        </table>

        <div className="flex items-center justify-between border-t border-[#11172b] px-5 py-4 text-[14px] font-semibold text-[#c4c8d4]">
          <button
            type="button"
            disabled={pagination.page <= 1}
            onClick={() => setPage((currentPage) => Math.max(currentPage - 1, 1))}
            className="rounded-full bg-[#0f3d98] px-5 py-2 text-[#d8e4ff] transition duration-150 hover:bg-[#154cb8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Previous
          </button>

          <span>
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
            className="rounded-full bg-[#0f3d98] px-5 py-2 text-[#d8e4ff] transition duration-150 hover:bg-[#154cb8] disabled:cursor-not-allowed disabled:opacity-45"
          >
            Next
          </button>
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4">
          <form
            onSubmit={handleSubmit}
            className="w-full max-w-[520px] rounded-lg border border-[#17203a] bg-[#05070d] p-6 shadow-2xl"
          >
            <h2 className="text-[20px] font-semibold text-[#f3f4f7]">
              Create Notification
            </h2>

            <label className="mt-5 block text-[13px] font-semibold text-[#c5cad7]">
              Title
              <input
                value={form.title}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    title: event.target.value,
                  }))
                }
                required
                className="mt-2 h-11 w-full rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
                placeholder="Order update"
              />
            </label>

            <label className="mt-4 block text-[13px] font-semibold text-[#c5cad7]">
              Message
              <textarea
                value={form.message}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    message: event.target.value,
                  }))
                }
                required
                rows={4}
                className="mt-2 w-full resize-none rounded-md border border-[#18223b] bg-[#0b1120] px-3 py-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
                placeholder="Write notification message"
              />
            </label>

            <div className="mt-4">
              <p className="text-[13px] font-semibold text-[#c5cad7]">
                Receiver
              </p>
              <div className="mt-2 grid grid-cols-4 gap-2">
                {targetOptions.map((option) => (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() =>
                      setForm((current) => ({
                        ...current,
                        receiverId: option.value,
                      }))
                    }
                    className={`h-10 rounded-md border text-[13px] font-semibold transition duration-150 ${
                      form.receiverId === option.value
                        ? "border-[#3d6df2] bg-[#173b92] text-white"
                        : "border-[#1c2640] bg-[#0b1120] text-[#c7ccd8] hover:bg-[#10182d]"
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>

            <label className="mt-4 block text-[13px] font-semibold text-[#c5cad7]">
              Custom Receiver
              <input
                value={targetOptions.some((option) => option.value === form.receiverId) ? "" : form.receiverId}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    receiverId: event.target.value || "all",
                  }))
                }
                className="mt-2 h-11 w-full rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
                placeholder="User, seller, or admin id"
              />
            </label>

            <label className="mt-4 block text-[13px] font-semibold text-[#c5cad7]">
              Redirect Link
              <input
                value={form.redirectLink}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    redirectLink: event.target.value,
                  }))
                }
                className="mt-2 h-11 w-full rounded-md border border-[#18223b] bg-[#0b1120] px-3 text-[14px] font-semibold text-white outline-none transition duration-150 placeholder:text-[#697184] focus:border-[#2858ba]"
                placeholder="/dashboard/orders"
              />
            </label>

            {serverError && (
              <p className="mt-3 text-[13px] font-semibold text-[#ff6b6b]">
                {serverError}
              </p>
            )}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={closeModal}
                disabled={createNotificationMutation.isPending}
                className="h-10 rounded-md border border-[#1c2640] px-4 text-[13px] font-semibold text-[#c7ccd8] transition duration-150 hover:bg-[#0d1425] disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createNotificationMutation.isPending}
                className="h-10 rounded-md bg-[#2457df] px-5 text-[13px] font-semibold text-white transition duration-150 hover:bg-[#3266ee] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {createNotificationMutation.isPending ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default NotificationsPage;
