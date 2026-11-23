import { NextRequest, NextResponse } from "next/server";
import { getOrderBackendBases } from "./backend";

const paymentBackendBases = Array.from(
  new Set(
    getOrderBackendBases().map((base) =>
      base.replace(/\/api\/v1\/?$/i, "/api")
    )
  )
);

export async function proxyPaymentApi(
  request: NextRequest,
  backendPath: string
) {
  const headers = new Headers();
  for (const headerName of ["authorization", "cookie", "content-type", "x-auth-role"]) {
    const value = request.headers.get(headerName);
    if (value) headers.set(headerName, value);
  }
  const body =
    request.method === "GET" || request.method === "HEAD"
      ? undefined
      : await request.arrayBuffer();

  let lastResponse: Response | null = null;
  for (const base of paymentBackendBases) {
    try {
      const response = await fetch(
        `${base}/${backendPath}${request.nextUrl.search}`,
        {
          method: request.method,
          headers,
          body,
          cache: "no-store",
        }
      );

      if (response.status === 401 || response.status === 403) {
        return new Response(await response.arrayBuffer(), {
          status: response.status,
          headers: {
            "content-type":
              response.headers.get("content-type") || "application/json",
          },
        });
      }

      if (response.ok) {
        return new Response(await response.arrayBuffer(), {
          status: response.status,
          headers: {
            "content-type":
              response.headers.get("content-type") || "application/json",
          },
        });
      }

      lastResponse = response;
      if (response.status !== 404 && response.status < 500) {
        break;
      }
    } catch {
      continue;
    }
  }

  if (lastResponse) {
    return new Response(await lastResponse.arrayBuffer(), {
      status: lastResponse.status,
      headers: {
        "content-type":
          lastResponse.headers.get("content-type") || "application/json",
      },
    });
  }

  return NextResponse.json(
    { success: false, message: "Payment service is unavailable." },
    { status: 502 }
  );
}
