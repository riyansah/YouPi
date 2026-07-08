import { NextResponse, type NextRequest } from "next/server";

interface AuthStatus {
  registered: boolean;
  authenticated: boolean;
}

function isAuthStatusPath(pathname: string) {
  return pathname === "/api/auth/status";
}

function isAuthApiPath(pathname: string) {
  return pathname === "/api/auth/login" || pathname === "/api/auth/logout" || pathname === "/api/auth/register";
}

function isPublicWhenRegistered(pathname: string) {
  return pathname === "/login" || pathname === "/register" || isAuthApiPath(pathname) || isAuthStatusPath(pathname);
}

function isPublicBeforeRegister(pathname: string) {
  return pathname === "/register" || pathname === "/login" || pathname === "/api/auth/register" || pathname === "/api/auth/login" || pathname === "/api/auth/logout" || isAuthStatusPath(pathname);
}

function getInternalOrigin() {
  return process.env.APP_INTERNAL_ORIGIN || `http://127.0.0.1:${process.env.PORT || "3000"}`;
}

function getRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") || crypto.randomUUID();
}

async function readAuthStatus(request: NextRequest, requestId: string): Promise<AuthStatus> {
  const response = await fetch(new URL("/api/auth/status", getInternalOrigin()), {
    headers: {
      cookie: request.headers.get("cookie") || "",
      "x-request-id": requestId,
      "user-agent": request.headers.get("user-agent") || "middleware"
    },
    cache: "no-store"
  });

  if (!response.ok) {
    return { registered: true, authenticated: false };
  }

  return (await response.json()) as AuthStatus;
}

function finalizeResponse(response: NextResponse, requestId: string) {
  response.headers.set("x-request-id", requestId);
  return response;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const requestId = getRequestId(request);

  if (isAuthStatusPath(pathname)) {
    return finalizeResponse(NextResponse.next(), requestId);
  }

  const status = await readAuthStatus(request, requestId);

  if (!status.registered) {
    if (isPublicBeforeRegister(pathname)) {
      return finalizeResponse(NextResponse.next(), requestId);
    }

    if (pathname.startsWith("/api/")) {
      return finalizeResponse(NextResponse.json({ error: "Belum ada akun. Silakan register terlebih dahulu." }, { status: 401 }), requestId);
    }

    return finalizeResponse(NextResponse.redirect(new URL("/register", request.url)), requestId);
  }

  if (status.authenticated && (pathname === "/login" || pathname === "/register")) {
    return finalizeResponse(NextResponse.redirect(new URL("/dashboard", request.url)), requestId);
  }

  if (status.authenticated || isPublicWhenRegistered(pathname)) {
    return finalizeResponse(NextResponse.next(), requestId);
  }

  if (pathname.startsWith("/api/")) {
    return finalizeResponse(NextResponse.json({ error: "Unauthorized" }, { status: 401 }), requestId);
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return finalizeResponse(NextResponse.redirect(loginUrl), requestId);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|icon.svg).*)"]
};
