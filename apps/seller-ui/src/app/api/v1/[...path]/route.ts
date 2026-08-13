import { NextRequest } from "next/server";

type ApiRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const isProduction = process.env.NODE_ENV === "production";
const apiRequestTimeoutMs = 15000;

const normalizeApiRoot = (url: string) =>
  url.replace(/\/$/, "").replace(/\/api\/v1\/?$/, "");

const getServiceRoot = (
  configuredUrls: Array<string | undefined>,
  localFallback: string
) => {
  const configuredUrl = configuredUrls.find((url) => url?.trim());

  if (configuredUrl) {
    return normalizeApiRoot(configuredUrl.trim());
  }

  return isProduction ? "" : localFallback;
};

const gatewayUrl = getServiceRoot(
  [
    process.env.NEXT_PUBLIC_API_URL,
    process.env.NEXT_PUBLIC_SERVER_URI,
    process.env.API_GATEWAY_URL,
  ],
  "http://localhost:8080"
);
const productServiceUrl = getServiceRoot(
  [process.env.PRODUCT_SERVICE_URL],
  "http://localhost:8181"
);
const chattingServiceUrl = getServiceRoot(
  [process.env.CHATTING_SERVICE_URL, process.env.NEXT_PUBLIC_CHAT_API_URL],
  "http://localhost:8484"
);

const splitSetCookieHeader = (header: string) =>
  header.split(/,(?=\s*[^;,=\s]+=[^;,]+)/g).map((value) => value.trim());

const normalizeSetCookie = (cookie: string) =>
  /;\s*path=/i.test(cookie) ? cookie : `${cookie}; Path=/`;

const getTargetUrl = (path: string[], search: string) => {
  const requestPath = path.join("/");

  if (path[0] === "products") {
    return productServiceUrl
      ? `${productServiceUrl}/api/v1/${requestPath}${search}`
      : "";
  }

  if (path[0] === "chats") {
    return chattingServiceUrl
      ? `${chattingServiceUrl}/api/v1/${requestPath}${search}`
      : "";
  }

  return gatewayUrl ? `${gatewayUrl}/api/v1/${requestPath}${search}` : "";
};

const proxyApiRequest = async (
  request: NextRequest,
  context: ApiRouteContext
) => {
  const { path = [] } = await context.params;
  const targetUrl = getTargetUrl(path, request.nextUrl.search);

  if (!targetUrl) {
    return Response.json(
      { message: "Backend service URL is not configured." },
      { status: 503 }
    );
  }

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
