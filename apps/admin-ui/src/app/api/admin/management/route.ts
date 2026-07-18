import { NextRequest, NextResponse } from "next/server";

import {
  createDatabaseAdmin,
  getDatabaseAdmins,
  normalizeAdminAccount,
} from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getAdminPaths = (query = "") => [
  `/admin/admins${query}`,
  `/auth/admin/admins${query}`,
  `/admin/management${query}`,
  `/auth/admin/management${query}`,
];

const pagination = (page: number, limit: number, total = 0) => ({
  page,
  limit,
  total,
  totalAdmins: total,
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

const parseBackendAdminPayload = (data: any) => {
  const payload = data?.data ?? data;

  if (Array.isArray(payload)) {
    return {
      admins: payload.map(normalizeAdminAccount),
    };
  }

  if (!Array.isArray(payload?.admins)) {
    return null;
  }

  return {
    ...payload,
    admins: payload.admins.map(normalizeAdminAccount),
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

const getBackendAdmins = async (request: NextRequest, query: string) => {
  for (const base of backendBases) {
    for (const path of getAdminPaths(query)) {
      try {
        const response = await fetch(`${base}${path}`, {
          cache: "no-store",
          headers: getForwardHeaders(request),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const payload = parseBackendAdminPayload(data);

        if (payload) {
          return payload;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
};

const createBackendAdmin = async (
  request: NextRequest,
  body: { email?: string; password?: string }
): Promise<BackendCreateResult | null> => {
  for (const base of backendBases) {
    for (const path of getAdminPaths()) {
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

        const payload = data?.admin
          ? { admin: normalizeAdminAccount(data.admin) }
          : parseBackendAdminPayload(data);

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
  const limit = Number(searchParams.get("limit") ?? 100);
  const query = request.nextUrl.search;

  try {
    const backendResult = await getBackendAdmins(request, query);

    if (backendResult) {
      const admins = backendResult.admins ?? [];

      return NextResponse.json({
        success: true,
        ...backendResult,
        admins,
        pagination:
          backendResult.pagination ?? pagination(page, limit, admins.length),
      });
    }
  } catch {
  }

  try {
    const databaseResult = await getDatabaseAdmins(search, page, limit);
    return NextResponse.json({ success: true, ...databaseResult });
  } catch {
    return NextResponse.json({
      success: true,
      admins: [],
      pagination: pagination(page, limit),
    });
  }
}

export async function POST(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as {
    email?: string;
    password?: string;
  };

  const backendResult = await createBackendAdmin(request, body);

  if (backendResult?.error) {
    const message =
      backendResult.data?.message ||
      backendResult.data?.error ||
      "Unable to create admin.";

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
    const admin = await createDatabaseAdmin({
      email: body.email ?? "",
      password: body.password ?? "",
    });

    return NextResponse.json(
      {
        success: true,
        admin,
      },
      { status: 201 }
    );
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error ? error.message : "Unable to create admin.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
