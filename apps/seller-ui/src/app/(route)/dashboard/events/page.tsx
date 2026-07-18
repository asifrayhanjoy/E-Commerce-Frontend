"use client";

import axiosInstance from "@/utils/axiosInstance";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  CalendarDays,
  ChevronRight,
  Eye,
  Plus,
  Search,
  Trash,
} from "lucide-react";
import Link from "next/link";
import { useMemo, useState } from "react";
import toast from "react-hot-toast";

type ProductImage = {
  url?: string;
  file_url?: string;
};

type SellerEvent = {
  id?: string;
  _id?: string;
  title?: string;
  slug?: string;
  category?: string;
  subCategory?: string;
  sale_price?: number | string;
  stock?: number | string;
  starting_date?: string;
  ending_date?: string;
  images?: ProductImage[];
  image?: string;
  isDeleted?: boolean;
};

const deleteEvent = async (eventId: string) => {
  await axiosInstance.delete(`/api/v1/products/delete-product/${eventId}`);
};

const formatCurrency = (value: number | string | undefined) => {
  const amount = Number(value || 0);

  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(Number.isFinite(amount) ? amount : 0);
};

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

const getEventId = (event: SellerEvent) =>
  event.id || event._id || event.slug || "event";

const isVisibleEvent = (event: SellerEvent) =>
  !event.isDeleted && Boolean(event.starting_date || event.ending_date);

const readEventsResponse = (data: any) =>
  Array.isArray(data?.events) ? (data.events as SellerEvent[]) : [];

const readProductsResponse = (data: any) =>
  Array.isArray(data?.products) ? (data.products as SellerEvent[]) : [];

const mergeEvents = (...eventGroups: SellerEvent[][]) => {
  const eventsById = new Map<string, SellerEvent>();

  eventGroups.flat().forEach((event, index) => {
    if (!isVisibleEvent(event)) return;

    eventsById.set(getEventId(event) || String(index), event);
  });

  return Array.from(eventsById.values());
};

const fetchEvents = async () => {
  try {
    const productsResponse = await axiosInstance.get(
      "/api/v1/products/get-shop-products"
    );

    return mergeEvents(readProductsResponse(productsResponse.data));
  } catch {
    const eventsResponse = await axiosInstance.get(
      "/api/v1/products/get-shop-events"
    );

    return mergeEvents(readEventsResponse(eventsResponse.data));
  }
};

const getEventImage = (event: SellerEvent) =>
  event.images?.[0]?.url || event.images?.[0]?.file_url || event.image || "";

const getEventStatus = (event: SellerEvent) => {
  if (event.isDeleted) return "Deleted";

  const now = Date.now();
  const startsAt = event.starting_date
    ? new Date(event.starting_date).getTime()
    : null;
  const endsAt = event.ending_date ? new Date(event.ending_date).getTime() : null;

  if (endsAt && Number.isFinite(endsAt) && endsAt < now) return "Ended";
  if (startsAt && Number.isFinite(startsAt) && startsAt > now) return "Scheduled";

  return "Live";
};

const getStatusClassName = (status: string) => {
  if (status === "Live") return "bg-green-600 text-white ring-green-400/30";
  if (status === "Scheduled") return "bg-blue-600 text-white ring-blue-400/30";
  if (status === "Ended") return "bg-amber-500 text-black ring-amber-300/30";

  return "bg-red-600 text-white ring-red-400/30";
};

function EventsPage() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [deletingEventId, setDeletingEventId] = useState("");

  const {
    data: events = [],
    isLoading,
    isError,
  } = useQuery<SellerEvent[]>({
    queryKey: ["shop-events"],
    queryFn: fetchEvents,
    staleTime: 0,
    refetchOnMount: "always",
  });

  const deleteMutation = useMutation({
    mutationFn: deleteEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["shop-events"] });
      toast.success("Event deleted successfully.");
    },
    onError: (error: any) => {
      toast.error(error?.response?.data?.message || "Failed to delete event.");
    },
    onSettled: () => {
      setDeletingEventId("");
    },
  });

  const filteredEvents = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    if (!normalizedSearch) return events;

    return events.filter((event) =>
      [
        event.title,
        event.slug,
        event.category,
        event.subCategory,
        getEventStatus(event),
      ]
        .join(" ")
        .toLowerCase()
        .includes(normalizedSearch)
    );
  }, [events, search]);

  return (
    <div className="min-h-screen w-full p-6 text-white md:p-12">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="font-Poppins text-2xl font-semibold text-white">
          All Events
        </h2>

        <Link
          href="/dashboard/create-event"
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-500"
        >
          <Plus size={18} />
          Create Event
        </Link>
      </div>

      <div className="flex items-center text-sm text-white">
        <Link href="/dashboard" className="cursor-pointer text-[#80Deea]">
          Dashboard
        </Link>
        <ChevronRight size={20} className="opacity-[.8]" />
        <span>All Events</span>
      </div>

      <div className="mt-6 flex items-center rounded-md bg-gray-900 p-3">
        <Search size={18} className="mr-2 text-gray-400" />
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search events..."
          className="w-full bg-transparent text-sm text-white outline-none placeholder:text-gray-500"
        />
      </div>

      <div className="mt-6 overflow-x-auto rounded-lg border border-slate-800 bg-gray-950 p-4">
        {isLoading ? (
          <p className="py-10 text-center text-gray-400">Loading events...</p>
        ) : isError ? (
          <p className="py-10 text-center text-red-400">Failed to load events.</p>
        ) : filteredEvents.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-16 text-center text-gray-400">
            <CalendarDays size={34} className="text-blue-400" />
            <p>No events found.</p>
          </div>
        ) : (
          <table className="w-full min-w-[980px] text-white">
            <thead>
              <tr className="border-b border-gray-800 bg-slate-950 text-sm text-gray-300">
                <th className="p-3 text-left">Event</th>
                <th className="p-3 text-left">Category</th>
                <th className="p-3 text-left">Starts</th>
                <th className="p-3 text-left">Ends</th>
                <th className="p-3 text-left">Price</th>
                <th className="p-3 text-left">Stock</th>
                <th className="p-3 text-left">Status</th>
                <th className="p-3 text-left">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredEvents.map((event) => {
                const eventId = getEventId(event);
                const status = getEventStatus(event);
                const imageUrl = getEventImage(event);

                return (
                  <tr
                    key={eventId}
                    className="border-b border-gray-800 text-sm transition hover:bg-gray-900"
                  >
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        {imageUrl ? (
                          <img
                            src={imageUrl}
                            alt={event.title || "Event image"}
                            className="h-12 w-12 rounded-md object-cover"
                          />
                        ) : (
                          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-gray-800 text-xs text-gray-400">
                            No image
                          </div>
                        )}
                        <div>
                          <p className="font-semibold text-white">
                            {event.title || "Untitled Event"}
                          </p>
                          <p className="text-xs text-gray-500">{event.slug || eventId}</p>
                        </div>
                      </div>
                    </td>
                    <td className="p-3 text-gray-300">
                      {event.category || "N/A"}
                      <span className="mx-1 text-gray-600">/</span>
                      {event.subCategory || "N/A"}
                    </td>
                    <td className="p-3 text-gray-300">{formatDate(event.starting_date)}</td>
                    <td className="p-3 text-gray-300">{formatDate(event.ending_date)}</td>
                    <td className="p-3 text-gray-300">
                      {formatCurrency(event.sale_price)}
                    </td>
                    <td className="p-3 text-gray-300">{event.stock ?? 0}</td>
                    <td className="p-3">
                      <span
                        className={`rounded-full px-3 py-1 text-xs font-semibold ring-1 ${getStatusClassName(
                          status
                        )}`}
                      >
                        {status}
                      </span>
                    </td>
                    <td className="p-3">
                      <div className="flex items-center gap-3">
                        <Link
                          href={`${process.env.NEXT_PUBLIC_USER_UI_LINK || ""}/product/${
                            event.slug || eventId
                          }`}
                          className="text-blue-400 transition hover:text-blue-300"
                          title="View event"
                        >
                          <Eye size={18} />
                        </Link>
                        <button
                          type="button"
                          onClick={() => {
                            setDeletingEventId(eventId);
                            deleteMutation.mutate(eventId);
                          }}
                          disabled={!!deletingEventId || event.isDeleted}
                          className="text-red-400 transition hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
                          title="Delete event"
                        >
                          <Trash size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

export default EventsPage;
