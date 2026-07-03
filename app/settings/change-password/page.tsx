"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { getPasswordStrength, validateAuthPassword } from "@/lib/auth-validation";
import {
  CapsLockWarning,
  getValidationDisplayMode,
  InputShell,
  PasswordToggle,
  ValidationFeedback,
  type ValidationItem
} from "@/components/AuthFormControls";
import { cn } from "@/lib/utils";

function getCapsLockState(event: KeyboardEvent<HTMLInputElement>) {
  return event.getModifierState("CapsLock");
}

function StrengthMeter({ password }: { password: string }) {
  if (!password) {
    return null;
  }

  const strength = getPasswordStrength(password);
  const width = strength === "Kuat" ? "w-full" : strength === "Sedang" ? "w-2/3" : "w-1/3";
  const color = strength === "Kuat" ? "bg-teal-600" : strength === "Sedang" ? "bg-amber-500" : "bg-rose-500";

  return (
    <div className="space-y-1">
      <div className="h-2 overflow-hidden rounded bg-slate-100">
        <div className={cn("h-full rounded", width, color)} />
      </div>
      <p className="text-xs font-medium text-slate-600">Kekuatan password baru: {strength}</p>
    </div>
  );
}

export default function ChangePasswordPage() {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [currentPasswordCapsLockActive, setCurrentPasswordCapsLockActive] = useState(false);
  const [newPasswordCapsLockActive, setNewPasswordCapsLockActive] = useState(false);
  const [confirmPasswordCapsLockActive, setConfirmPasswordCapsLockActive] = useState(false);
  const [currentPasswordFocused, setCurrentPasswordFocused] = useState(false);
  const [newPasswordFocused, setNewPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [currentPasswordTouched, setCurrentPasswordTouched] = useState(false);
  const [newPasswordTouched, setNewPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const currentPasswordErrors = useMemo(() => (currentPassword ? [] : ["Password lama wajib diisi."]), [currentPassword]);
  const newPasswordErrors = useMemo(() => validateAuthPassword(newPassword), [newPassword]);
  const confirmPasswordErrors = useMemo(() => {
    if (!confirmPassword) {
      return ["Konfirmasi password baru wajib diisi."];
    }

    if (newPassword !== confirmPassword) {
      return ["Konfirmasi password baru tidak sama."];
    }

    return [];
  }, [confirmPassword, newPassword]);
  const samePasswordErrors = useMemo(() => {
    if (currentPassword && newPassword && currentPassword === newPassword) {
      return ["Password baru tidak boleh sama dengan password lama."];
    }

    return [];
  }, [currentPassword, newPassword]);

  const currentPasswordValid = currentPasswordErrors.length === 0;
  const newPasswordValid = newPasswordErrors.length === 0 && samePasswordErrors.length === 0;
  const confirmPasswordValid = confirmPasswordErrors.length === 0;
  const formValid = currentPasswordValid && newPasswordValid && confirmPasswordValid;

  const currentPasswordChecks: ValidationItem[] = [
    { id: "current-required", label: "Password lama wajib diisi.", valid: Boolean(currentPassword) }
  ];
  const newPasswordChecks: ValidationItem[] = [
    { id: "new-min", label: "Minimal 8 karakter.", valid: newPassword.length >= 8 },
    { id: "new-max", label: "Maksimal 64 karakter.", valid: newPassword.length <= 64 },
    { id: "new-uppercase", label: "Minimal 1 huruf besar.", valid: /[A-Z]/.test(newPassword) },
    { id: "new-number", label: "Minimal 1 angka.", valid: /[0-9]/.test(newPassword) },
    { id: "new-space", label: "Tidak boleh mengandung spasi.", valid: !/\s/.test(newPassword) },
    {
      id: "new-different",
      label: "Tidak sama dengan password lama.",
      valid: Boolean(newPassword) && (!currentPassword || currentPassword !== newPassword)
    }
  ];
  const confirmPasswordChecks: ValidationItem[] = [
    { id: "confirm-required", label: "Konfirmasi password baru wajib diisi.", valid: Boolean(confirmPassword) },
    {
      id: "confirm-match",
      label: "Konfirmasi password baru harus sama.",
      valid: Boolean(confirmPassword) && newPassword === confirmPassword
    }
  ];

  const currentPasswordMode = getValidationDisplayMode({
    focused: currentPasswordFocused,
    touched: currentPasswordTouched,
    value: currentPassword,
    valid: currentPasswordValid
  });
  const newPasswordMode = getValidationDisplayMode({
    focused: newPasswordFocused,
    touched: newPasswordTouched,
    value: newPassword,
    valid: newPasswordValid
  });
  const confirmPasswordMode = getValidationDisplayMode({
    focused: confirmPasswordFocused,
    touched: confirmPasswordTouched,
    value: confirmPassword,
    valid: confirmPasswordValid
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPasswordTouched(true);
    setNewPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setError(null);
    setMessage(null);

    if (!formValid) {
      setError("Periksa kembali password yang diisi.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!response.ok) {
      setError(body?.error || "Password gagal diubah.");
      setSubmitting(false);
      return;
    }

    setMessage(body?.message || "Password berhasil diubah.");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
    setCurrentPasswordFocused(false);
    setNewPasswordFocused(false);
    setConfirmPasswordFocused(false);
    setCurrentPasswordCapsLockActive(false);
    setNewPasswordCapsLockActive(false);
    setConfirmPasswordCapsLockActive(false);
    setCurrentPasswordTouched(false);
    setNewPasswordTouched(false);
    setConfirmPasswordTouched(false);
    setSubmitting(false);
  }

  return (
    <div className="space-y-6">
      <div>
        <p className="text-sm font-medium text-teal-700">Pengaturan</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950 sm:text-3xl">Ubah Password</h1>
        <p className="mt-2 text-sm text-slate-500">Ganti password akun yang digunakan untuk masuk ke dashboard.</p>
      </div>

      <form onSubmit={handleSubmit} className="grid max-w-xl gap-5 rounded border border-slate-200 bg-white p-5 shadow-sm">
        {error ? <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">{message}</p> : null}

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Password lama</span>
          <InputShell
            icon={Lock}
            action={
              <PasswordToggle
                visible={showCurrentPassword}
                onClick={() => setShowCurrentPassword((current) => !current)}
                label={showCurrentPassword ? "Sembunyikan password lama" : "Tampilkan password lama"}
              />
            }
          >
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => {
                setCurrentPasswordTouched(true);
                setCurrentPassword(event.target.value);
              }}
              onFocus={() => {
                setCurrentPasswordTouched(true);
                setCurrentPasswordFocused(true);
              }}
              onBlur={() => {
                setCurrentPasswordFocused(false);
                setCurrentPasswordCapsLockActive(false);
              }}
              onKeyDown={(event) => setCurrentPasswordCapsLockActive(getCapsLockState(event))}
              onKeyUp={(event) => setCurrentPasswordCapsLockActive(getCapsLockState(event))}
              autoComplete="current-password"
              placeholder="Masukkan password lama"
              className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
              required
            />
          </InputShell>
          <CapsLockWarning active={currentPasswordCapsLockActive} />
          <ValidationFeedback
            helperText="Masukkan password yang dipakai saat ini."
            summaryText="Password lama sudah diisi."
            mode={currentPasswordMode}
            items={currentPasswordChecks}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Password baru</span>
          <InputShell
            icon={Lock}
            action={
              <PasswordToggle
                visible={showNewPassword}
                onClick={() => setShowNewPassword((current) => !current)}
                label={showNewPassword ? "Sembunyikan password baru" : "Tampilkan password baru"}
              />
            }
          >
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => {
                setNewPasswordTouched(true);
                setNewPassword(event.target.value);
              }}
              onFocus={() => {
                setNewPasswordTouched(true);
                setNewPasswordFocused(true);
              }}
              onBlur={() => {
                setNewPasswordFocused(false);
                setNewPasswordCapsLockActive(false);
              }}
              onKeyDown={(event) => setNewPasswordCapsLockActive(getCapsLockState(event))}
              onKeyUp={(event) => setNewPasswordCapsLockActive(getCapsLockState(event))}
              autoComplete="new-password"
              placeholder="Buat password"
              className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
              required
            />
          </InputShell>
          <CapsLockWarning active={newPasswordCapsLockActive} />
          <StrengthMeter password={newPassword} />
          <ValidationFeedback
            helperText="Gunakan 8-64 karakter, 1 huruf besar, 1 angka, tanpa spasi."
            summaryText="Password baru memenuhi semua syarat."
            mode={newPasswordMode}
            items={newPasswordChecks}
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Konfirmasi password baru</span>
          <InputShell
            icon={Lock}
            action={
              <PasswordToggle
                visible={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
                label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              />
            }
          >
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => {
                setConfirmPasswordTouched(true);
                setConfirmPassword(event.target.value);
              }}
              onFocus={() => {
                setConfirmPasswordTouched(true);
                setConfirmPasswordFocused(true);
              }}
              onBlur={() => {
                setConfirmPasswordFocused(false);
                setConfirmPasswordCapsLockActive(false);
              }}
              onKeyDown={(event) => setConfirmPasswordCapsLockActive(getCapsLockState(event))}
              onKeyUp={(event) => setConfirmPasswordCapsLockActive(getCapsLockState(event))}
              autoComplete="new-password"
              placeholder="Ulangi password"
              className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
              required
            />
          </InputShell>
          <CapsLockWarning active={confirmPasswordCapsLockActive} />
          <ValidationFeedback
            helperText="Ulangi password yang sama."
            summaryText="Konfirmasi password sudah cocok."
            mode={confirmPasswordMode}
            items={confirmPasswordChecks}
          />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={submitting || !formValid}
            className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
          >
            <KeyRound className="h-4 w-4" />
            {submitting ? "Menyimpan..." : "Simpan password"}
          </button>
          <Link href="/settings" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            Kembali ke pengaturan
          </Link>
        </div>
      </form>
    </div>
  );
}
