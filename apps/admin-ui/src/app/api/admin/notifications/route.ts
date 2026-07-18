import { NextRequest, NextResponse } from "next/server";

import {
  createDatabaseNotification,
  getDatabaseNotifications,
  normalizeAdminNotification,
} from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getNotificationPaths = (query = "") => [
  `/admin/notifications${query}`,
  `/auth/admin/notifications${query}`,
];

const pagination = (page: number, limit: number, total = 0) => ({
  page,
  limit,
  total,
  totalNotifications: total,
  totalPages: Math.max(1, Math.ceil(total / limit)),
});

type BackendCreateResult =
  | {
      error: true;
      status: number;
      data: any;
    }
  | {
      error: false;
      data: any;
    };

const parseBackendNotificationPayload = (data: any) => {
  const payload = data?.data ?? data;

  if (Array.isArray(payload)) {
    return {
      notifications: payload.map(normalizeAdminNotification),
    };
  }

  if (!Array.isArray(payload?.notifications)) {
    return null;
  }

  return {
    ...payload,
    notifications: payload.notifications.map(normalizeAdminNotification),
  };
};

const getForwardHeaders = (request: NextRequest) => {
  const headers: Record<string, string> = {
    "Content-Type": "application/json",
  };
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");

  if (cookie) {
    headers.Cookie = cookie;
  }

  if (authorization) {
    headers.Authorization = authorization;
  }

  return headers;
};

const getBackendNotifications = async (
  request: NextRequest,
  query: string
) => {
  for (const base of backendBases) {
    for (const path of getNotificationPaths(query)) {
      try {
        const response = await fetch(`${base}${path}`, {
          cache: "no-store",
          headers: getForwardHeaders(request),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const payload = parseBackendNotificationPayload(data);

        if (payload) {
          return payload;
        }

        if (Array.isArray((data?.data ?? data)?.notifications)) {
          return {
            ...(data?.data ?? data),
            notifications: [],
          };
        }
      } catch {
        continue;
      }
    }
  }

  return null;
};

const createBackendNotification = async (
  request: NextRequest,
  body: Record<string, any>
): Promise<BackendCreateResult | null> => {
  for (const base of backendBases) {
    for (const path of getNotificationPaths()) {
      try {
        const response = await fetch(`${base}${path}`, {
          method: "POST",
          cache: "no-store",
          headers: getForwardHeaders(request),
          body: JSON.stringify(body),
        });
        const data = await response.json().catch(() => ({}));

        if (response.status === 404) {
          continue;
        }

        if (!response.ok) {
          return {
            error: true,
            status: response.status,
            data,
          };
        }

        const payload = data?.notification
          ? { notification: normalizeAdminNotification(data.notification) }
          : parseBackendNotificationPayload(data);

        return {
          error: false,
          data: payload ?? data,
        };
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
  const limit = Number(searchParams.get("limit") ?? 20);
  const query = request.nextUrl.search;

  try {
    const backendResult = await getBackendNotifications(request, query);

    if (backendResult) {
      const notifications = backendResult.notifications ?? [];

      return NextResponse.json({
        success: true,
        ...backendResult,
        notifications,
        pagination:
          backendResult.pagination ??
          pagination(page, limit, notifications.length),
      });
    }
  } catch {
  }

  try {
    const databaseResult = await getDatabaseNotifications(search, page, limit);
    return NextResponse.json({ success: true, ...databaseResult });
  } catch {
    return NextResponse.json({
      success: true,
      notifications: [],
      pagination: pagination(page, limit),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const backendResult = await createBackendNotification(request, body);

  if (backendResult?.error) {
    const message =
      backendResult.data?.message ||
      backendResult.data?.error ||
      "Unable to create notification.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: backendResult.status }
    );
  }

  if (backendResult?.data) {
    return NextResponse.json({
      success: true,
      ...backendResult.data,
    });
  }

  try {
    const notification = await createDatabaseNotification(body);

    return NextResponse.json(
      {
        success: true,
        notification,
      },
      { status: 201 }
    );
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error ? error.message : "Unable to create notification.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
