import { NextRequest, NextResponse } from "next/server";
import {
  checkRateLimit,
  createSessionToken,
  getClientIp,
  hasRegisteredUser,
  resetRateLimit,
  sessionCookieName,
  sessionCookieOptions,
  verifyCredentials
} from "@/lib/server/auth";

export const runtime = "nodejs";

function isLoginBody(value: unknown): value is { username: string; password: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { username?: unknown }).username === "string" &&
    typeof (value as { password?: unknown }).password === "string"
  );
}

export async function POST(request: NextRequest) {
  if (!hasRegisteredUser()) {
    return NextResponse.json({ error: "Belum ada akun. Silakan register terlebih dahulu." }, { status: 409 });
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (!isLoginBody(body)) {
    return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit("login", clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Terlalu banyak percobaan login. Coba lagi beberapa menit lagi." }, { status: 429 });
  }

  const result = verifyCredentials(body.username, body.password);

  if (!result.ok && result.reason === "config") {
    return NextResponse.json({ error: "Belum ada akun. Silakan register terlebih dahulu." }, { status: 409 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: "Username atau password salah." }, { status: 401 });
  }

  resetRateLimit("login", clientIp);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, createSessionToken(result.username), sessionCookieOptions());
  return response;
}
