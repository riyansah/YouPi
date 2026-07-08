"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useMemo, useState } from "react";
import { KeyRound, Lock } from "lucide-react";
import { PageHeader } from "@/components/PageHeader";
import { getPasswordStrength, validateAuthPassword } from "@/lib/auth-validation";
import { tAuthErrorCode, tPasswordStrength } from "@/lib/i18n";
import { useDashboardStore } from "@/lib/dashboard-store";
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

function StrengthMeter({ password, language }: { password: string; language: "en" | "id" }) {
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
      <p className="text-xs font-medium text-slate-600">
        {language === "id" ? "Kekuatan password baru:" : "New password strength:"} {tPasswordStrength(strength, language)}
      </p>
    </div>
  );
}

export default function ChangePasswordPage() {
  const { settings } = useDashboardStore();
  const language = settings.language;
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

  const currentPasswordErrors = useMemo(() => (currentPassword ? [] : [language === "id" ? "Password lama wajib diisi." : "Current password is required."]), [currentPassword, language]);
  const newPasswordErrors = useMemo(() => validateAuthPassword(newPassword), [newPassword]);
  const confirmPasswordErrors = useMemo(() => {
    if (!confirmPassword) {
      return [language === "id" ? "Konfirmasi password baru wajib diisi." : "New password confirmation is required."];
    }

    if (newPassword !== confirmPassword) {
      return [language === "id" ? "Konfirmasi password baru tidak sama." : "New password confirmation does not match."];
    }

    return [];
  }, [confirmPassword, language, newPassword]);
  const samePasswordErrors = useMemo(() => {
    if (currentPassword && newPassword && currentPassword === newPassword) {
      return [language === "id" ? "Password baru tidak boleh sama dengan password lama." : "New password must be different from the current password."];
    }

    return [];
  }, [currentPassword, language, newPassword]);

  const currentPasswordValid = currentPasswordErrors.length === 0;
  const newPasswordValid = newPasswordErrors.length === 0 && samePasswordErrors.length === 0;
  const confirmPasswordValid = confirmPasswordErrors.length === 0;
  const formValid = currentPasswordValid && newPasswordValid && confirmPasswordValid;

  const text = {
    eyebrow: language === "id" ? "Pengaturan" : "Settings",
    title: language === "id" ? "Ubah Password" : "Change Password",
    description: language === "id" ? "Ganti password akun yang digunakan untuk masuk ke dashboard." : "Update the password used to sign in to the dashboard.",
    invalidForm: language === "id" ? "Periksa kembali password yang diisi." : "Please review the password fields.",
    submitError: language === "id" ? "Password gagal diubah." : "Failed to change password.",
    submitSuccess: language === "id" ? "Password berhasil diubah." : "Password changed successfully.",
    currentRequired: language === "id" ? "Password lama wajib diisi." : "Current password is required.",
    newMin: language === "id" ? "Minimal 8 karakter." : "Minimum 8 characters.",
    newMax: language === "id" ? "Maksimal 64 karakter." : "Maximum 64 characters.",
    newUpper: language === "id" ? "Minimal 1 huruf besar." : "At least 1 uppercase letter.",
    newNumber: language === "id" ? "Minimal 1 angka." : "At least 1 number.",
    newSpace: language === "id" ? "Tidak boleh mengandung spasi." : "Must not contain spaces.",
    newDifferent: language === "id" ? "Tidak sama dengan password lama." : "Must be different from the current password.",
    confirmRequired: language === "id" ? "Konfirmasi password baru wajib diisi." : "New password confirmation is required.",
    confirmMatch: language === "id" ? "Konfirmasi password baru harus sama." : "New password confirmation must match.",
    showCurrent: language === "id" ? "Tampilkan password lama" : "Show current password",
    hideCurrent: language === "id" ? "Sembunyikan password lama" : "Hide current password",
    showNew: language === "id" ? "Tampilkan password baru" : "Show new password",
    hideNew: language === "id" ? "Sembunyikan password baru" : "Hide new password",
    showConfirm: language === "id" ? "Tampilkan konfirmasi password" : "Show password confirmation",
    hideConfirm: language === "id" ? "Sembunyikan konfirmasi password" : "Hide password confirmation",
    currentPlaceholder: language === "id" ? "Masukkan password lama" : "Enter current password",
    newPlaceholder: language === "id" ? "Buat password" : "Create a password",
    confirmPlaceholder: language === "id" ? "Ulangi password" : "Repeat password",
    currentHelper: language === "id" ? "Masukkan password yang dipakai saat ini." : "Enter the password currently used for this account.",
    currentSummary: language === "id" ? "Password lama sudah diisi." : "Current password has been entered.",
    newHelper: language === "id" ? "Gunakan 8-64 karakter, 1 huruf besar, 1 angka, tanpa spasi." : "Use 8-64 characters, 1 uppercase letter, 1 number, and no spaces.",
    newSummary: language === "id" ? "Password baru memenuhi semua syarat." : "New password meets all requirements.",
    confirmHelper: language === "id" ? "Ulangi password yang sama." : "Repeat the same password.",
    confirmSummary: language === "id" ? "Konfirmasi password sudah cocok." : "Password confirmation matches.",
    saving: language === "id" ? "Menyimpan..." : "Saving...",
    save: language === "id" ? "Simpan password" : "Save password",
    back: language === "id" ? "Kembali ke pengaturan" : "Back to settings"
  };

  const currentPasswordChecks: ValidationItem[] = [{ id: "current-required", label: text.currentRequired, valid: Boolean(currentPassword) }];
  const newPasswordChecks: ValidationItem[] = [
    { id: "new-min", label: text.newMin, valid: newPassword.length >= 8 },
    { id: "new-max", label: text.newMax, valid: newPassword.length <= 64 },
    { id: "new-uppercase", label: text.newUpper, valid: /[A-Z]/.test(newPassword) },
    { id: "new-number", label: text.newNumber, valid: /[0-9]/.test(newPassword) },
    { id: "new-space", label: text.newSpace, valid: !/\s/.test(newPassword) },
    { id: "new-different", label: text.newDifferent, valid: Boolean(newPassword) && (!currentPassword || currentPassword !== newPassword) }
  ];
  const confirmPasswordChecks: ValidationItem[] = [
    { id: "confirm-required", label: text.confirmRequired, valid: Boolean(confirmPassword) },
    { id: "confirm-match", label: text.confirmMatch, valid: Boolean(confirmPassword) && newPassword === confirmPassword }
  ];

  const currentPasswordMode = getValidationDisplayMode({ focused: currentPasswordFocused, touched: currentPasswordTouched, value: currentPassword, valid: currentPasswordValid });
  const newPasswordMode = getValidationDisplayMode({ focused: newPasswordFocused, touched: newPasswordTouched, value: newPassword, valid: newPasswordValid });
  const confirmPasswordMode = getValidationDisplayMode({ focused: confirmPasswordFocused, touched: confirmPasswordTouched, value: confirmPassword, valid: confirmPasswordValid });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setCurrentPasswordTouched(true);
    setNewPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setError(null);
    setMessage(null);

    if (!formValid) {
      setError(text.invalidForm);
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/change-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword, newPassword, confirmPassword })
    });
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string; code?: string } | null;

    if (!response.ok) {
      setError(tAuthErrorCode(body?.code, language) || body?.error || text.submitError);
      setSubmitting(false);
      return;
    }

    setMessage(tAuthErrorCode(body?.code, language) || body?.message || text.submitSuccess);
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
      <PageHeader eyebrow={text.eyebrow} title={text.title} description={text.description} language={language} />

      <form onSubmit={handleSubmit} className="grid max-w-xl gap-5 rounded border border-slate-200 bg-white p-5 shadow-sm">
        {error ? <p className="rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {message ? <p className="rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">{message}</p> : null}

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{language === "id" ? "Password lama" : "Current password"}</span>
          <InputShell icon={Lock} action={<PasswordToggle visible={showCurrentPassword} onClick={() => setShowCurrentPassword((current) => !current)} label={showCurrentPassword ? text.hideCurrent : text.showCurrent} />} filled={Boolean(currentPassword)} error={currentPasswordTouched && !currentPasswordValid}>
            <input type={showCurrentPassword ? "text" : "password"} value={currentPassword} onChange={(event) => { setCurrentPasswordTouched(true); setCurrentPassword(event.target.value); }} onFocus={() => { setCurrentPasswordTouched(true); setCurrentPasswordFocused(true); }} onBlur={() => { setCurrentPasswordFocused(false); setCurrentPasswordCapsLockActive(false); }} onKeyDown={(event) => setCurrentPasswordCapsLockActive(getCapsLockState(event))} onKeyUp={(event) => setCurrentPasswordCapsLockActive(getCapsLockState(event))} autoComplete="current-password" placeholder={text.currentPlaceholder} className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none" required />
          </InputShell>
          <CapsLockWarning active={currentPasswordCapsLockActive} />
          <ValidationFeedback helperText={text.currentHelper} summaryText={text.currentSummary} mode={currentPasswordMode} items={currentPasswordChecks} />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{language === "id" ? "Password baru" : "New password"}</span>
          <InputShell icon={Lock} action={<PasswordToggle visible={showNewPassword} onClick={() => setShowNewPassword((current) => !current)} label={showNewPassword ? text.hideNew : text.showNew} />} filled={Boolean(newPassword)} error={newPasswordTouched && !newPasswordValid}>
            <input type={showNewPassword ? "text" : "password"} value={newPassword} onChange={(event) => { setNewPasswordTouched(true); setNewPassword(event.target.value); }} onFocus={() => { setNewPasswordTouched(true); setNewPasswordFocused(true); }} onBlur={() => { setNewPasswordFocused(false); setNewPasswordCapsLockActive(false); }} onKeyDown={(event) => setNewPasswordCapsLockActive(getCapsLockState(event))} onKeyUp={(event) => setNewPasswordCapsLockActive(getCapsLockState(event))} autoComplete="new-password" placeholder={text.newPlaceholder} className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none" required />
          </InputShell>
          <CapsLockWarning active={newPasswordCapsLockActive} />
          <StrengthMeter password={newPassword} language={language} />
          <ValidationFeedback helperText={text.newHelper} summaryText={text.newSummary} mode={newPasswordMode} items={newPasswordChecks} />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">{language === "id" ? "Konfirmasi password baru" : "Confirm new password"}</span>
          <InputShell icon={Lock} action={<PasswordToggle visible={showConfirmPassword} onClick={() => setShowConfirmPassword((current) => !current)} label={showConfirmPassword ? text.hideConfirm : text.showConfirm} />} filled={Boolean(confirmPassword)} error={confirmPasswordTouched && !confirmPasswordValid}>
            <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => { setConfirmPasswordTouched(true); setConfirmPassword(event.target.value); }} onFocus={() => { setConfirmPasswordTouched(true); setConfirmPasswordFocused(true); }} onBlur={() => { setConfirmPasswordFocused(false); setConfirmPasswordCapsLockActive(false); }} onKeyDown={(event) => setConfirmPasswordCapsLockActive(getCapsLockState(event))} onKeyUp={(event) => setConfirmPasswordCapsLockActive(getCapsLockState(event))} autoComplete="new-password" placeholder={text.confirmPlaceholder} className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none" required />
          </InputShell>
          <CapsLockWarning active={confirmPasswordCapsLockActive} />
          <ValidationFeedback helperText={text.confirmHelper} summaryText={text.confirmSummary} mode={confirmPasswordMode} items={confirmPasswordChecks} />
        </label>

        <div className="flex flex-wrap items-center gap-3">
          <button type="submit" disabled={submitting || !formValid} className="inline-flex items-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70">
            <KeyRound className="h-4 w-4" />
            {submitting ? text.saving : text.save}
          </button>
          <Link href="/settings" className="text-sm font-semibold text-slate-600 hover:text-slate-950">
            {text.back}
          </Link>
        </div>
      </form>
    </div>
  );
}
