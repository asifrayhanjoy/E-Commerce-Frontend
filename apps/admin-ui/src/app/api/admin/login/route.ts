import { NextRequest } from "next/server";

import { getAdminBackendBases } from "../_lib/backend";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = getAdminBackendBases();

const splitSetCookieHeader = (header: string) =>
  header.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((value) => value.trim());

const normalizeSetCookie = (cookie: string) =>
  /;\s*path=/i.test(cookie) ? cookie : `${cookie}; Path=/`;

export async function POST(request: NextRequest) {
  const requestHeaders = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");

  if (contentType) {
    requestHeaders.set("content-type", contentType);
  }

  if (cookie) {
    requestHeaders.set("cookie", cookie);
  }

  const body = await request.text();

  for (const base of backendBases) {
    try {
      const upstreamResponse = await fetch(`${base}/auth/login-admin`, {
        method: "POST",
        headers: requestHeaders,
        body,
        cache: "no-store",
      });
      const responseHeaders = new Headers();
      const responseContentType = upstreamResponse.headers.get("content-type");
      const getSetCookie = (upstreamResponse.headers as any).getSetCookie;
      const setCookies =
        typeof getSetCookie === "function"
          ? getSetCookie.call(upstreamResponse.headers)
          : splitSetCookieHeader(upstreamResponse.headers.get("set-cookie") || "");

      if (responseContentType) {
        responseHeaders.set("content-type", responseContentType);
      }

      setCookies
        .filter(Boolean)
        .forEach((cookie: string) =>
          responseHeaders.append("set-cookie", normalizeSetCookie(cookie))
        );

      return new Response(await upstreamResponse.arrayBuffer(), {
        status: upstreamResponse.status,
        headers: responseHeaders,
      });
    } catch {
      continue;
    }
  }

  return Response.json(
    { success: false, message: "Admin backend service is unavailable." },
    { status: 502 }
  );
}
