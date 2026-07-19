import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

const emptyLoggerResponse = (page = 1, limit = 10) => ({
  success: true,
  logs: [],
  pagination: {
    page,
    limit,
    total: 0,
    totalLogs: 0,
    totalPages: 1,
  },
});

const proxyLoggerRequest = async (request: NextRequest, method: string) => {
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  const headers = new Headers();

  if (cookie) headers.set("cookie", cookie);
  if (authorization) headers.set("authorization", authorization);

  for (const base of backendBases) {
    for (const path of ["/admin/loggers", "/auth/admin/loggers"]) {
      try {
        const response = await fetch(`${base}${path}${request.nextUrl.search}`, {
          method,
          headers,
          cache: "no-store",
        });

        if (response.status === 401 || response.status === 403) {
          return NextResponse.json(await response.json(), {
            status: response.status,
          });
        }

        if (!response.ok) continue;

        return NextResponse.json(await response.json(), {
          status: response.status,
        });
      } catch {
        continue;
      }
    }
  }

  const page = Number(request.nextUrl.searchParams.get("page") || 1);
  const limit = Number(request.nextUrl.searchParams.get("limit") || 10);

  return NextResponse.json(emptyLoggerResponse(page, limit));
};

export const GET = (request: NextRequest) => proxyLoggerRequest(request, "GET");
