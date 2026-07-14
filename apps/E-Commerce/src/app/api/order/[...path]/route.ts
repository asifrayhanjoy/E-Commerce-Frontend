import { NextRequest } from "next/server";

type OrderRouteContext = {
  params: Promise<{
    path?: string[];
  }>;
};

const orderServiceUrl =
  process.env.ORDER_SERVICE_URL?.replace(/\/$/, "") || "http://localhost:8282";

const proxyOrderRequest = async (
  request: NextRequest,
  context: OrderRouteContext
) => {
  const { path = [] } = await context.params;
  const targetUrl = `${orderServiceUrl}/api/${path.join("/")}${request.nextUrl.search}`;
  const headers = new Headers();
  const contentType = request.headers.get("content-type");
  const cookie = request.headers.get("cookie");
  const authorization = request.headers.get("authorization");

  if (contentType) {
    headers.set("content-type", contentType);
  }

  if (cookie) {
    headers.set("cookie", cookie);
  }

  if (authorization) {
    headers.set("authorization", authorization);
  }

  try {
    const upstreamResponse = await fetch(targetUrl, {
      method: request.method,
      headers,
      body:
        request.method === "GET" || request.method === "HEAD"
          ? undefined
          : await request.text(),
      cache: "no-store",
    });

    const responseHeaders = new Headers();
    const responseContentType = upstreamResponse.headers.get("content-type");

    if (responseContentType) {
      responseHeaders.set("content-type", responseContentType);
    }

    return new Response(await upstreamResponse.arrayBuffer(), {
      status: upstreamResponse.status,
      headers: responseHeaders,
    });
  } catch {
    return Response.json(
      { message: "Order service is unavailable." },
      { status: 502 }
    );
  }
};

export const GET = proxyOrderRequest;
export const POST = proxyOrderRequest;
