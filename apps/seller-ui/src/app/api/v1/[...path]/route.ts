import { NextRequest } from "next/server";

type ApiRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const gatewayUrl =
  (
    process.env.NEXT_PUBLIC_API_URL ||
    process.env.API_GATEWAY_URL ||
    "http://localhost:8080"
  )
    .replace(/\/$/, "")
    .replace(/\/api\/v1\/?$/, "");
const productServiceUrl = (
  process.env.PRODUCT_SERVICE_URL || "http://localhost:8181"
).replace(/\/$/, "");
const chattingServiceUrl = (
  process.env.CHATTING_SERVICE_URL || "http://localhost:8484"
).replace(/\/$/, "");
const apiRequestTimeoutMs = 15000;

const splitSetCookieHeader = (header: string) =>
  header.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((value) => value.trim());

const normalizeSetCookie = (cookie: string) =>
  /;\s*path=/i.test(cookie) ? cookie : `${cookie}; Path=/`;

const getTargetUrl = (path: string[], search: string) => {
  const requestPath = path.join("/");

  if (path[0] === "products") {
    return `${productServiceUrl}/api/v1/${requestPath}${search}`;
  }

  if (path[0] === "chats") {
    return `${chattingServiceUrl}/api/v1/${requestPath}${search}`;
  }

  return `${gatewayUrl}/api/v1/${requestPath}${search}`;
};

const proxyApiRequest = async (
  request: NextRequest,
  context: ApiRouteContext
) => {
  const { path = [] } = await context.params;
  const targetUrl = getTargetUrl(path, request.nextUrl.search);
  const requestHeaders = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");
  const authRole = request.headers.get("x-auth-role");
  const abortController = new AbortController();
  const timeout = setTimeout(() => abortController.abort(), apiRequestTimeoutMs);

  if (contentType) {
    requestHeaders.set("content-type", contentType);
  }

  if (cookie) {
    requestHeaders.set("cookie", cookie);
  }

  if (authorization) {
    requestHeaders.set("authorization", authorization);
  }

  if (authRole) {
    requestHeaders.set("x-auth-role", authRole);
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers: requestHeaders,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.arrayBuffer(),
      cache: "no-store",
      signal: abortController.signal,
    });
    clearTimeout(timeout);
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
    clearTimeout(timeout);
    return Response.json(
      { message: "Backend service is unavailable." },
      { status: 502 }
    );
  }
};

export const GET = proxyApiRequest;
export const POST = proxyApiRequest;
export const PUT = proxyApiRequest;
export const PATCH = proxyApiRequest;
export const DELETE = proxyApiRequest;
