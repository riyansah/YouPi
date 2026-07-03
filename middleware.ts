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

async function readAuthStatus(request: NextRequest): Promise<AuthStatus> {
  const response = await fetch(new URL("/api/auth/status", request.url), {
    headers: { cookie: request.headers.get("cookie") || "" },
    cache: "no-store"
  });

  if (!response.ok) {
    return { registered: true, authenticated: false };
  }

  return (await response.json()) as AuthStatus;
}

export async function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;

  if (isAuthStatusPath(pathname)) {
    return NextResponse.next();
  }

  const status = await readAuthStatus(request);

  if (!status.registered) {
    if (isPublicBeforeRegister(pathname)) {
      return NextResponse.next();
    }

    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Belum ada akun. Silakan register terlebih dahulu." }, { status: 401 });
    }

    return NextResponse.redirect(new URL("/register", request.url));
  }

  if (status.authenticated && (pathname === "/login" || pathname === "/register")) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  if (status.authenticated || isPublicWhenRegistered(pathname)) {
    return NextResponse.next();
  }

  if (pathname.startsWith("/api/")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const loginUrl = new URL("/login", request.url);
  loginUrl.searchParams.set("next", `${pathname}${search}`);
  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"]
};
