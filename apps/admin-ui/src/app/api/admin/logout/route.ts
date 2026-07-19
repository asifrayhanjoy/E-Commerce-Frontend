import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const backendBases = [
  process.env.NEXT_PUBLIC_API_URL,
  process.env.NEXT_PUBLIC_SERVER_URI,
  "http://localhost:8383/api/v1",
  "http://localhost:8080/api/v1",
].filter(Boolean) as string[];

export async function POST(request: NextRequest) {
  const cookie = request.headers.get("cookie");
  const headers = new Headers();

  if (cookie) {
    headers.set("cookie", cookie);
  }

  for (const base of backendBases) {
    try {
      const response = await fetch(`${base}/auth/logout-admin`, {
        method: "POST",
        headers,
        cache: "no-store",
      });
      const responseHeaders = new Headers();
      const getSetCookie = (response.headers as any).getSetCookie;
      const setCookies =
        typeof getSetCookie === "function"
          ? getSetCookie.call(response.headers)
          : [response.headers.get("set-cookie")].filter(Boolean);

      setCookies.forEach((cookie: string) =>
        responseHeaders.append("set-cookie", cookie)
      );

      return NextResponse.json(await response.json(), {
        status: response.status,
        headers: responseHeaders,
      });
    } catch {
      continue;
    }
  }

  return NextResponse.json({
    success: true,
    message: "Logout completed locally.",
  });
}
