import { NextRequest, NextResponse } from "next/server";
import { validateAuthPassword } from "@/lib/auth-validation";
import { changePassword, getSessionFromRequest } from "@/lib/server/auth";

export const runtime = "nodejs";

function isChangePasswordBody(
  value: unknown
): value is { currentPassword: string; newPassword: string; confirmPassword: string } {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    typeof (value as { currentPassword?: unknown }).currentPassword === "string" &&
    typeof (value as { newPassword?: unknown }).newPassword === "string" &&
    typeof (value as { confirmPassword?: unknown }).confirmPassword === "string"
  );
}

export async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = (await request.json().catch(() => null)) as unknown;

  if (!isChangePasswordBody(body)) {
    return NextResponse.json({ error: "Password lama, password baru, dan konfirmasi wajib diisi." }, { status: 400 });
  }

  const validationError = validateAuthPassword(body.newPassword)[0];

  if (validationError) {
    return NextResponse.json({ error: validationError }, { status: 400 });
  }

  if (body.newPassword !== body.confirmPassword) {
    return NextResponse.json({ error: "Konfirmasi password baru tidak sama." }, { status: 400 });
  }

  const result = changePassword(session.user, body.currentPassword, body.newPassword);

  if (!result.ok && result.reason === "same-password") {
    return NextResponse.json({ error: "Password baru tidak boleh sama dengan password lama." }, { status: 400 });
  }

  if (!result.ok) {
    return NextResponse.json({ error: "Password lama tidak sesuai." }, { status: 401 });
  }

  return NextResponse.json({ ok: true, message: "Password berhasil diubah." });
}
