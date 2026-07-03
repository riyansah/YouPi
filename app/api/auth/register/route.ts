import { NextRequest, NextResponse } from "next/server";
import { normalizeAuthUsername, validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";
import { checkRateLimit, getClientIp, hasRegisteredUser, registerUser, resetRateLimit } from "@/lib/server/auth";

export const runtime = "nodejs";

function isRegisterBody(value: unknown): value is { username: string; password: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { username?: unknown }).username === "string" &&
    typeof (value as { password?: unknown }).password === "string"
  );
}

export async function POST(request: NextRequest) {
  if (hasRegisteredUser()) {
    return NextResponse.json({ error: "Akun sudah dibuat. Silakan login." }, { status: 409 });
  }

  const clientIp = getClientIp(request);
  const rateLimit = checkRateLimit("register", clientIp);

  if (!rateLimit.allowed) {
    return NextResponse.json({ error: "Terlalu banyak percobaan register. Coba lagi beberapa menit lagi." }, { status: 429 });
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (!isRegisterBody(body)) {
    return NextResponse.json({ error: "Username dan password wajib diisi." }, { status: 400 });
  }

  const validationError = [...validateAuthUsername(body.username), ...validateAuthPassword(body.password)][0];

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  const result = registerUser(normalizeAuthUsername(body.username), body.password);

  if (!result.ok) {
    return NextResponse.json({ error: "Akun sudah dibuat. Silakan login." }, { status: 409 });
  }

  resetRateLimit("register", clientIp);

  return NextResponse.json({ ok: true, message: "Akun berhasil dibuat. Silakan login." });
}
