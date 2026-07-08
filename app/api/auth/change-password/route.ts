import { NextRequest, NextResponse } from "next/server";
import { validateAuthPassword } from "@/lib/auth-validation";
import { changePassword, getSessionFromRequest } from "@/lib/server/auth";
import { logWithContext, parseJsonBody, setRequestActor, withRequestContext } from "@/lib/server/request-context";

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

export const POST = withRequestContext(async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (!session) {
    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.change_password_failed",
      activity: "Ubah password gagal",
      entityType: "user",
      status: "failed",
      description: "Unauthorized change password attempt."
    });
    return NextResponse.json({ code: "unauthorized", error: "Unauthorized" }, { status: 401 });
  }

  setRequestActor({ id: session.userId, name: session.user, type: "user" });
  const body = (await parseJsonBody<{ currentPassword: string; newPassword: string; confirmPassword: string }>(request)) as unknown;

  if (!isChangePasswordBody(body)) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.change_password_failed",
      activity: "Ubah password gagal",
      entityType: "user",
      entityId: session.userId,
      status: "failed",
      description: "Change password payload incomplete."
    });
    return NextResponse.json({ code: "missing_change_password_fields", error: "Password lama, password baru, dan konfirmasi wajib diisi." }, { status: 400 });
  }

  const validationError = validateAuthPassword(body.newPassword)[0];

  if (validationError) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.change_password_failed",
      activity: "Ubah password gagal",
      entityType: "user",
      entityId: session.userId,
      status: "failed",
      description: validationError
    });
    return NextResponse.json({ code: "invalid_input", error: validationError }, { status: 400 });
  }

  if (body.newPassword !== body.confirmPassword) {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.change_password_failed",
      activity: "Ubah password gagal",
      entityType: "user",
      entityId: session.userId,
      status: "failed",
      description: "Password confirmation mismatch."
    });
    return NextResponse.json({ code: "confirm_mismatch", error: "Konfirmasi password baru tidak sama." }, { status: 400 });
  }

  const result = changePassword(session.user, body.currentPassword, body.newPassword);

  if (!result.ok && result.reason === "same-password") {
    logWithContext({
      level: "warn",
      category: "AUTH",
      action: "auth.change_password_failed",
      activity: "Ubah password gagal",
      entityType: "user",
      entityId: session.userId,
      status: "failed",
      description: "New password matches current password."
    });
    return NextResponse.json({ code: "same_password", error: "Password baru tidak boleh sama dengan password lama." }, { status: 400 });
  }

  if (!result.ok) {
    logWithContext({
      level: "warn",
      category: "SECURITY",
      action: "auth.change_password_failed",
      activity: "Ubah password gagal",
      entityType: "user",
      entityId: session.userId,
      status: "failed",
      description: "Current password verification failed."
    });
    return NextResponse.json({ code: "invalid_current_password", error: "Password lama tidak sesuai." }, { status: 401 });
  }

  logWithContext({
    level: "info",
    category: "AUTH",
    action: "auth.change_password_success",
    activity: "Ubah password berhasil",
    entityType: "user",
    entityId: session.userId,
    status: "success",
    description: `${session.user} berhasil mengubah password.`
  });

  return NextResponse.json({ ok: true, code: "change_password_success", message: "Password berhasil diubah." });
});
