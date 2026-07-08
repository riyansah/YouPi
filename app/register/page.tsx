"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, UserPlus } from "lucide-react";
import { getPasswordStrength, validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";
import { BRAND_NAME, BRAND_TAGLINE, tAuthErrorCode, tPasswordStrength, useStoredLanguage } from "@/lib/i18n";
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
        {language === "id" ? "Kekuatan password:" : "Password strength:"} {tPasswordStrength(strength, language)}
      </p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
  const [language] = useStoredLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [passwordCapsLockActive, setPasswordCapsLockActive] = useState(false);
  const [confirmPasswordCapsLockActive, setConfirmPasswordCapsLockActive] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [confirmPasswordFocused, setConfirmPasswordFocused] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [confirmPasswordTouched, setConfirmPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [submitting, setSubmitting] = useState(false);

  const usernameErrors = useMemo(() => validateAuthUsername(username), [username]);
  const passwordErrors = useMemo(() => validateAuthPassword(password), [password]);
  const confirmPasswordErrors = useMemo(() => {
    if (!confirmPassword) {
      return [language === "id" ? "Konfirmasi password wajib diisi." : "Password confirmation is required."];
    }

    if (password !== confirmPassword) {
      return [language === "id" ? "Konfirmasi password tidak sama." : "Password confirmation does not match."];
    }

    return [];
  }, [confirmPassword, language, password]);
  const usernameValid = usernameErrors.length === 0;
  const passwordValid = passwordErrors.length === 0;
  const confirmPasswordValid = confirmPasswordErrors.length === 0;
  const formValid = usernameValid && passwordValid && confirmPasswordValid;

  const text = {
    eyebrow: language === "id" ? "Setup Awal" : "Initial Setup",
    title: language === "id" ? "Buat Akun" : "Create Account",
    description: language === "id" ? "Akun pertama akan disimpan aman di database lokal aplikasi." : "The first account will be stored securely in the app's local database.",
    redirecting: language === "id" ? `Mengarahkan ke halaman login dalam ${countdown} detik.` : `Redirecting to the sign-in page in ${countdown} seconds.`,
    invalidForm: language === "id" ? "Periksa kembali username dan password." : "Please review your username and password.",
    registerFailed: language === "id" ? "Register gagal." : "Registration failed.",
    usernameMin: language === "id" ? "Minimal 3 karakter." : "Minimum 3 characters.",
    usernameMax: language === "id" ? "Maksimal 20 karakter." : "Maximum 20 characters.",
    usernameFormat: language === "id" ? "Hanya huruf kecil dan angka." : "Lowercase letters and numbers only.",
    passwordMin: language === "id" ? "Minimal 8 karakter." : "Minimum 8 characters.",
    passwordMax: language === "id" ? "Maksimal 64 karakter." : "Maximum 64 characters.",
    passwordUpper: language === "id" ? "Minimal 1 huruf besar." : "At least 1 uppercase letter.",
    passwordNumber: language === "id" ? "Minimal 1 angka." : "At least 1 number.",
    passwordSpace: language === "id" ? "Tidak boleh mengandung spasi." : "Must not contain spaces.",
    confirmRequired: language === "id" ? "Konfirmasi password wajib diisi." : "Password confirmation is required.",
    confirmMatch: language === "id" ? "Konfirmasi password harus sama." : "Password confirmation must match.",
    usernameHelper: language === "id" ? "Gunakan 3-20 karakter huruf kecil dan angka." : "Use 3-20 lowercase letters and numbers.",
    usernameSummary: language === "id" ? "Format username valid." : "Username format is valid.",
    passwordHelper: language === "id" ? "Gunakan 8-64 karakter, 1 huruf besar, 1 angka, tanpa spasi." : "Use 8-64 characters, 1 uppercase letter, 1 number, and no spaces.",
    passwordSummary: language === "id" ? "Password memenuhi semua syarat." : "Password meets all requirements.",
    confirmHelper: language === "id" ? "Ulangi password yang sama." : "Repeat the same password.",
    confirmSummary: language === "id" ? "Konfirmasi password sudah cocok." : "Password confirmation matches.",
    usernamePlaceholder: language === "id" ? "contoh: user123" : "example: user123",
    passwordPlaceholder: language === "id" ? "Buat password" : "Create a password",
    confirmPlaceholder: language === "id" ? "Ulangi password" : "Repeat password",
    showPassword: language === "id" ? "Tampilkan password" : "Show password",
    hidePassword: language === "id" ? "Sembunyikan password" : "Hide password",
    showConfirm: language === "id" ? "Tampilkan konfirmasi password" : "Show password confirmation",
    hideConfirm: language === "id" ? "Sembunyikan konfirmasi password" : "Hide password confirmation",
    creating: language === "id" ? "Membuat akun..." : "Creating account...",
    register: language === "id" ? "Register" : "Register",
    haveAccount: language === "id" ? "Sudah punya akun?" : "Already have an account?",
    signIn: language === "id" ? "Masuk" : "Sign In"
  };

  useEffect(() => {
    if (!success) {
      return;
    }

    setCountdown(5);
    const interval = window.setInterval(() => {
      setCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(interval);
          router.replace("/login");
          router.refresh();
          return 0;
        }

        return current - 1;
      });
    }, 1000);

    return () => window.clearInterval(interval);
  }, [router, success]);

  const usernameChecks: ValidationItem[] = [
    { id: "username-min", label: text.usernameMin, valid: username.trim().length >= 3 },
    { id: "username-max", label: text.usernameMax, valid: username.trim().length <= 20 },
    { id: "username-format", label: text.usernameFormat, valid: !username.trim() || /^[a-z0-9]+$/.test(username.trim()) }
  ];
  const passwordChecks: ValidationItem[] = [
    { id: "password-min", label: text.passwordMin, valid: password.length >= 8 },
    { id: "password-max", label: text.passwordMax, valid: password.length <= 64 },
    { id: "password-uppercase", label: text.passwordUpper, valid: /[A-Z]/.test(password) },
    { id: "password-number", label: text.passwordNumber, valid: /[0-9]/.test(password) },
    { id: "password-space", label: text.passwordSpace, valid: !/\s/.test(password) }
  ];
  const confirmPasswordChecks: ValidationItem[] = [
    { id: "confirm-required", label: text.confirmRequired, valid: Boolean(confirmPassword) },
    { id: "confirm-match", label: text.confirmMatch, valid: Boolean(confirmPassword) && password === confirmPassword }
  ];

  const usernameMode = getValidationDisplayMode({ focused: usernameFocused, touched: usernameTouched, value: username, valid: usernameValid });
  const passwordMode = getValidationDisplayMode({ focused: passwordFocused, touched: passwordTouched, value: password, valid: passwordValid });
  const confirmPasswordMode = getValidationDisplayMode({ focused: confirmPasswordFocused, touched: confirmPasswordTouched, value: confirmPassword, valid: confirmPasswordValid });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setError(null);
    setSuccess(null);

    if (!formValid) {
      setError(text.invalidForm);
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string; code?: string } | null;

    if (!response.ok) {
      setError(tAuthErrorCode(body?.code, language) || body?.error || text.registerFailed);
      setSubmitting(false);

      if (response.status === 409) {
        router.replace("/login");
        router.refresh();
      }

      return;
    }

    setSuccess(tAuthErrorCode(body?.code, language) || body?.message || (language === "id" ? "Akun berhasil dibuat. Silakan login." : "Account created successfully. Please sign in."));
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase text-teal-700">{text.eyebrow}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{BRAND_NAME} {BRAND_TAGLINE}</h1>
          <p className="mt-2 text-sm text-slate-500">{text.description}</p>
        </div>

        {error ? <p className="mt-5 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {success ? <p className="mt-5 rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">{success} {text.redirecting}</p> : null}

        <div className="mt-5 space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <InputShell icon={User} filled={Boolean(username)} error={usernameTouched && !usernameValid} disabled={Boolean(success)}>
              <input value={username} onChange={(event) => { setUsernameTouched(true); setUsername(event.target.value); }} onFocus={() => { setUsernameTouched(true); setUsernameFocused(true); }} onBlur={() => setUsernameFocused(false)} autoComplete="username" placeholder={text.usernamePlaceholder} className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none" required disabled={Boolean(success)} />
            </InputShell>
            <ValidationFeedback helperText={text.usernameHelper} summaryText={text.usernameSummary} mode={usernameMode} items={usernameChecks} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <InputShell icon={Lock} action={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((current) => !current)} label={showPassword ? text.hidePassword : text.showPassword} disabled={Boolean(success)} />} filled={Boolean(password)} error={passwordTouched && !passwordValid} disabled={Boolean(success)}>
              <input type={showPassword ? "text" : "password"} value={password} onChange={(event) => { setPasswordTouched(true); setPassword(event.target.value); }} onFocus={() => { setPasswordTouched(true); setPasswordFocused(true); }} onBlur={() => { setPasswordFocused(false); setPasswordCapsLockActive(false); }} onKeyDown={(event) => setPasswordCapsLockActive(getCapsLockState(event))} onKeyUp={(event) => setPasswordCapsLockActive(getCapsLockState(event))} autoComplete="new-password" placeholder={text.passwordPlaceholder} className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none" required disabled={Boolean(success)} />
            </InputShell>
            <CapsLockWarning active={passwordCapsLockActive} />
            <StrengthMeter password={password} language={language} />
            <ValidationFeedback helperText={text.passwordHelper} summaryText={text.passwordSummary} mode={passwordMode} items={passwordChecks} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">{language === "id" ? "Konfirmasi Password" : "Confirm Password"}</span>
            <InputShell icon={Lock} action={<PasswordToggle visible={showConfirmPassword} onClick={() => setShowConfirmPassword((current) => !current)} label={showConfirmPassword ? text.hideConfirm : text.showConfirm} disabled={Boolean(success)} />} filled={Boolean(confirmPassword)} error={confirmPasswordTouched && !confirmPasswordValid} disabled={Boolean(success)}>
              <input type={showConfirmPassword ? "text" : "password"} value={confirmPassword} onChange={(event) => { setConfirmPasswordTouched(true); setConfirmPassword(event.target.value); }} onFocus={() => { setConfirmPasswordTouched(true); setConfirmPasswordFocused(true); }} onBlur={() => { setConfirmPasswordFocused(false); setConfirmPasswordCapsLockActive(false); }} onKeyDown={(event) => setConfirmPasswordCapsLockActive(getCapsLockState(event))} onKeyUp={(event) => setConfirmPasswordCapsLockActive(getCapsLockState(event))} autoComplete="new-password" placeholder={text.confirmPlaceholder} className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none" required disabled={Boolean(success)} />
            </InputShell>
            <CapsLockWarning active={confirmPasswordCapsLockActive} />
            <ValidationFeedback helperText={text.confirmHelper} summaryText={text.confirmSummary} mode={confirmPasswordMode} items={confirmPasswordChecks} />
          </label>
        </div>

        <button type="submit" disabled={submitting || !formValid || Boolean(success)} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70">
          <UserPlus className="h-4 w-4" />
          {submitting ? text.creating : text.register}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          {text.haveAccount} <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">{text.signIn}</Link>
        </p>
      </form>
    </main>
  );
}
