import { NextRequest, NextResponse } from "next/server";

import {
  getDatabaseCustomization,
  updateDatabaseCustomization,
} from "../_lib/admin-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const getCustomizationPaths = () => [
  "/admin/customization",
  "/auth/admin/customization",
];

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

const getBackendCustomization = async (request: NextRequest) => {
  for (const base of backendBases) {
    for (const path of getCustomizationPaths()) {
      try {
        const response = await fetch(`${base}${path}`, {
          cache: "no-store",
          headers: getForwardHeaders(request),
        });

        if (!response.ok) {
          continue;
        }

        const data = await response.json();
        const customization = data?.customization ?? data?.data ?? data;

        if (customization?.categories) {
          return customization;
        }
      } catch {
        continue;
      }
    }
  }

  return null;
};

const updateBackendCustomization = async (
  request: NextRequest,
  body: Record<string, any>
) => {
  for (const base of backendBases) {
    for (const path of getCustomizationPaths()) {
      try {
        const response = await fetch(`${base}${path}`, {
          method: "PATCH",
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

        return {
          error: false,
          data: data?.customization ?? data?.data ?? data,
        };
      } catch {
        continue;
      }
    }
  }

  return null;
};

export async function GET(request: NextRequest) {
  try {
    const backendCustomization = await getBackendCustomization(request);

    if (backendCustomization) {
      return NextResponse.json({
        success: true,
        customization: backendCustomization,
      });
    }
  } catch {
  }

  try {
    const customization = await getDatabaseCustomization();

    return NextResponse.json({
      success: true,
      customization,
    });
  } catch {
    return NextResponse.json({
      success: true,
      customization: {
        categories: [],
        subCategories: {},
        logoUrl: "",
        bannerUrl: "",
      },
    });
  }
}

export async function PATCH(request: NextRequest) {
  const body = (await request.json().catch(() => ({}))) as Record<string, any>;
  const backendResult = await updateBackendCustomization(request, body);

  if (backendResult?.error && backendResult.status !== 413) {
    const message =
      backendResult.data?.message ||
      backendResult.data?.error ||
      "Unable to update customization.";

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
      customization: backendResult.data,
    });
  }

  try {
    const customization = await updateDatabaseCustomization(body);

    return NextResponse.json({
      success: true,
      customization,
    });
  } catch (error) {
    const status = (error as { status?: number })?.status ?? 500;
    const message =
      error instanceof Error ? error.message : "Unable to update customization.";

    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status }
    );
  }
}
