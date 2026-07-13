import { NextRequest, NextResponse } from "next/server";
import {
  createSessionToken,
  getClientIp,
  getLoginLockoutStatus,
  hasRegisteredUser,
  recordLoginFailure,
  resetLoginLockout,
  sessionCookieName,
  sessionCookieOptions,
  verifyCredentials
} from "@/lib/server/auth";
import { JsonBodyError, logWithContext, parseJsonBody, setRequestMetadata, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

const authJsonBodyMaxBytes = 8 * 1024;

function jsonBodyErrorResponse(error: JsonBodyError) {
  const message = error.code === "payload_too_large"
    ? "Payload JSON terlalu besar. Batas maksimum 8 KiB."
    : "Content-Type harus application/json.";
  return NextResponse.json({ code: error.code, error: message }, { status: error.status });
}

function isLoginBody(value: unknown): value is { username: string; password: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { username?: unknown }).username === "string" &&
    typeof (value as { password?: unknown }).password === "string"
  );
}

function createLockoutPayload(clientIp: string, now = Date.now()) {
  const status = getLoginLockoutStatus(clientIp, now);

  return {
    code: "locked",
    error: "Terlalu banyak percobaan login. Coba lagi setelah hitung mundur selesai.",
    locked: status.locked,
    lockedUntil: status.lockedUntil,
    retryAfterSeconds: status.retryAfterSeconds,
    lockoutSeconds: status.retryAfterSeconds
  };
}

export const GET = withRequestContext(function GET(request: NextRequest) {
  const clientIp = getClientIp(request);
  return NextResponse.json(createLockoutPayload(clientIp));
});

export const POST = withRequestContext(async function POST(request: NextRequest) {
  if (!hasRegisteredUser()) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.login_failed",
      activity: "Login gagal",
      entityType: "user",
      status: "failed",
      description: "Login attempted before account registration."
    });
    return NextResponse.json({ code: "missing_account", error: "Belum ada akun. Silakan register terlebih dahulu." }, { status: 409 });
  }

  const clientIp = getClientIp(request);
  setRequestMetadata({ auth_client_ip: clientIp });
  const lockoutStatus = getLoginLockoutStatus(clientIp);

  if (lockoutStatus.locked) {
    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.login_locked",
      activity: "Login gagal",
      entityType: "user",
      status: "failed",
      description: "Login blocked by staged lockout.",
      metadata: { locked_until: lockoutStatus.lockedUntil, retry_after_seconds: lockoutStatus.retryAfterSeconds }
    });
    return NextResponse.json(createLockoutPayload(clientIp), { status: 429 });
  }

  let body: unknown;
  try {
    body = await parseJsonBody<{ username: string; password: string }>(request, {
      maxBytes: authJsonBodyMaxBytes,
      requireJsonContentType: true
    });
  } catch (error) {
    if (error instanceof JsonBodyError) {
      return jsonBodyErrorResponse(error);
    }
    throw error;
  }

  if (!isLoginBody(body)) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.login_failed",
      activity: "Login gagal",
      entityType: "user",
      status: "failed",
      description: "Login payload missing username or password."
    });
    return NextResponse.json({ code: "missing_credentials", error: "Username dan password wajib diisi." }, { status: 400 });
  }

  const result = verifyCredentials(body.username, body.password);

  if (!result.ok && result.reason === "config") {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.login_failed",
      activity: "Login gagal",
      entityType: "user",
      status: "failed",
      description: "Login attempted without auth config."
    });
    return NextResponse.json({ code: "missing_account", error: "Belum ada akun. Silakan register terlebih dahulu." }, { status: 409 });
  }

  if (!result.ok) {
    const failure = recordLoginFailure(clientIp);

    if (failure.locked) {
      logWithContext({
        level: "warn",
        category: "SECURITY",
        action: "auth.login_locked",
        activity: "Login gagal",
        actor: { name: body.username, type: "user" },
        entityType: "user",
        status: "failed",
        description: "Login failure triggered staged lockout.",
        metadata: { lockout_seconds: failure.lockoutSeconds, failed_attempts: failure.failedAttempts }
      });
      return NextResponse.json(
        {
          code: "locked",
          error: "Terlalu banyak percobaan login. Coba lagi setelah hitung mundur selesai.",
          locked: true,
          lockedUntil: failure.lockedUntil,
          retryAfterSeconds: failure.retryAfterSeconds,
          lockoutSeconds: failure.lockoutSeconds
        },
        { status: 429 }
      );
    }

    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.login_failed",
      activity: "Login gagal",
      actor: { name: body.username.trim(), type: "user" },
      entityType: "user",
      status: "failed",
      description: "Invalid username or password.",
      metadata: { failed_attempts: failure.failedAttempts }
    });
    return NextResponse.json({ code: "invalid_credentials", error: "Username atau password salah." }, { status: 401 });
  }

  resetLoginLockout(clientIp);

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, createSessionToken(result.userId, result.username), sessionCookieOptions());

  logWithContext({
    level: "info",
    category: "AUTH",
    action: "auth.login_success",
    activity: "Login berhasil",
    actor: { id: result.userId, name: result.username, type: "user" },
    entityType: "user",
    entityId: result.userId,
    status: "success",
    description: `${result.username} berhasil login.`
  });

  return response;
});
