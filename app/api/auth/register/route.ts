import { NextRequest, NextResponse } from "next/server";
import { normalizeAuthUsername, validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";
import { checkRateLimit, getClientIp, hasRegisteredUser, registerUser, resetRateLimit } from "@/lib/server/auth";
import { JsonBodyError, logWithContext, parseJsonBody, setRequestActor, setRequestMetadata, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

const authJsonBodyMaxBytes = 8 * 1024;

function jsonBodyErrorResponse(error: JsonBodyError) {
  const message = error.code === "payload_too_large"
    ? "Payload JSON terlalu besar. Batas maksimum 8 KiB."
    : "Content-Type harus application/json.";
  return NextResponse.json({ code: error.code, error: message }, { status: error.status });
}

function isRegisterBody(value: unknown): value is { username: string; password: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { username?: unknown }).username === "string" &&
    typeof (value as { password?: unknown }).password === "string"
  );
}

export const POST = withRequestContext(async function POST(request: NextRequest) {
  if (hasRegisteredUser()) {
    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.register_failed",
      activity: "Register user gagal",
      entityType: "user",
      status: "failed",
      description: "Register attempted after account already exists."
    });
    return NextResponse.json({ code: "account_exists", error: "Akun sudah dibuat. Silakan login." }, { status: 409 });
  }

  const clientIp = getClientIp(request);
  setRequestMetadata({ auth_client_ip: clientIp });
  const rateLimit = checkRateLimit("register", clientIp);

  if (!rateLimit.allowed) {
    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.register_failed",
      activity: "Register user gagal",
      entityType: "user",
      status: "failed",
      description: "Register blocked by rate limit.",
      metadata: { reset_at: rateLimit.resetAt }
    });
    return NextResponse.json({ code: "rate_limited", error: "Terlalu banyak percobaan register. Coba lagi beberapa menit lagi." }, { status: 429 });
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

  if (!isRegisterBody(body)) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.register_failed",
      activity: "Register user gagal",
      entityType: "user",
      status: "failed",
      description: "Register payload missing username or password."
    });
    return NextResponse.json({ code: "missing_credentials", error: "Username dan password wajib diisi." }, { status: 400 });
  }

  const normalizedUsername = normalizeAuthUsername(body.username);
  const validationError = [...validateAuthUsername(body.username), ...validateAuthPassword(body.password)][0];

  if (validationError) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.register_failed",
      activity: "Register user gagal",
      actor: { name: normalizedUsername, type: "user" },
      entityType: "user",
      status: "failed",
      description: validationError
    });
    return NextResponse.json({ code: "invalid_input", error: validationError }, { status: 400 });
  }

  const result = registerUser(normalizedUsername, body.password);

  if (!result.ok) {
    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.register_failed",
      activity: "Register user gagal",
      actor: { name: normalizedUsername, type: "user" },
      entityType: "user",
      status: "failed",
      description: "Register rejected because account already exists."
    });
    return NextResponse.json({ code: "account_exists", error: "Akun sudah dibuat. Silakan login." }, { status: 409 });
  }

  resetRateLimit("register", clientIp);
  setRequestActor({ id: result.userId, name: result.username, type: "user" });

  logWithContext({
    level: "info",
    category: "AUTH",
    action: "auth.register_success",
    activity: "Register user",
    entityType: "user",
    entityId: result.userId,
    status: "success",
    description: `${result.username} berhasil didaftarkan.`
  });

  return NextResponse.json({ ok: true, code: "register_success", message: "Akun berhasil dibuat. Silakan login." });
});
