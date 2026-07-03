"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Lock, User, UserPlus } from "lucide-react";
import { getPasswordStrength, validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";
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
      <p className="text-xs font-medium text-slate-600">Kekuatan password: {strength}</p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();
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
      return ["Konfirmasi password wajib diisi."];
    }

    if (password !== confirmPassword) {
      return ["Konfirmasi password tidak sama."];
    }

    return [];
  }, [confirmPassword, password]);
  const usernameValid = usernameErrors.length === 0;
  const passwordValid = passwordErrors.length === 0;
  const confirmPasswordValid = confirmPasswordErrors.length === 0;
  const formValid = usernameValid && passwordValid && confirmPasswordValid;

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
    { id: "username-min", label: "Minimal 3 karakter.", valid: username.trim().length >= 3 },
    { id: "username-max", label: "Maksimal 20 karakter.", valid: username.trim().length <= 20 },
    {
      id: "username-format",
      label: "Hanya huruf kecil dan angka.",
      valid: !username.trim() || /^[a-z0-9]+$/.test(username.trim())
    }
  ];
  const passwordChecks: ValidationItem[] = [
    { id: "password-min", label: "Minimal 8 karakter.", valid: password.length >= 8 },
    { id: "password-max", label: "Maksimal 64 karakter.", valid: password.length <= 64 },
    { id: "password-uppercase", label: "Minimal 1 huruf besar.", valid: /[A-Z]/.test(password) },
    { id: "password-number", label: "Minimal 1 angka.", valid: /[0-9]/.test(password) },
    { id: "password-space", label: "Tidak boleh mengandung spasi.", valid: !/\s/.test(password) }
  ];
  const confirmPasswordChecks: ValidationItem[] = [
    { id: "confirm-required", label: "Konfirmasi password wajib diisi.", valid: Boolean(confirmPassword) },
    { id: "confirm-match", label: "Konfirmasi password harus sama.", valid: Boolean(confirmPassword) && password === confirmPassword }
  ];

  const usernameMode = getValidationDisplayMode({
    focused: usernameFocused,
    touched: usernameTouched,
    value: username,
    valid: usernameValid
  });
  const passwordMode = getValidationDisplayMode({
    focused: passwordFocused,
    touched: passwordTouched,
    value: password,
    valid: passwordValid
  });
  const confirmPasswordMode = getValidationDisplayMode({
    focused: confirmPasswordFocused,
    touched: confirmPasswordTouched,
    value: confirmPassword,
    valid: confirmPasswordValid
  });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setUsernameTouched(true);
    setPasswordTouched(true);
    setConfirmPasswordTouched(true);
    setError(null);
    setSuccess(null);

    if (!formValid) {
      setError("Periksa kembali username dan password.");
      return;
    }

    setSubmitting(true);

    const response = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });
    const body = (await response.json().catch(() => null)) as { error?: string; message?: string } | null;

    if (!response.ok) {
      setError(body?.error || "Register gagal.");
      setSubmitting(false);

      if (response.status === 409) {
        router.replace("/login");
        router.refresh();
      }

      return;
    }

    setSuccess(body?.message || "Akun berhasil dibuat. Silakan login.");
    setSubmitting(false);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-10">
      <form onSubmit={handleSubmit} className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase text-teal-700">Setup Awal</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">Buat Akun</h1>
          <p className="mt-2 text-sm text-slate-500">Akun pertama akan disimpan aman di database lokal aplikasi.</p>
        </div>

        {error ? <p className="mt-5 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}
        {success ? (
          <p className="mt-5 rounded border border-teal-200 bg-teal-50 p-3 text-sm text-teal-700">
            {success} Mengarahkan ke halaman login dalam {countdown} detik.
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <InputShell icon={User}>
              <input
                value={username}
                onChange={(event) => {
                  setUsernameTouched(true);
                  setUsername(event.target.value);
                }}
                onFocus={() => {
                  setUsernameTouched(true);
                  setUsernameFocused(true);
                }}
                onBlur={() => setUsernameFocused(false)}
                autoComplete="username"
                placeholder="contoh: user123"
                className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
                required
                disabled={Boolean(success)}
              />
            </InputShell>
            <ValidationFeedback
              helperText="Gunakan 3-20 karakter huruf kecil dan angka."
              summaryText="Format username valid."
              mode={usernameMode}
              items={usernameChecks}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <InputShell
              icon={Lock}
              action={
                <PasswordToggle
                  visible={showPassword}
                  onClick={() => setShowPassword((current) => !current)}
                  label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                />
              }
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPasswordTouched(true);
                  setPassword(event.target.value);
                }}
                onFocus={() => {
                  setPasswordTouched(true);
                  setPasswordFocused(true);
                }}
                onBlur={() => {
                  setPasswordFocused(false);
                  setPasswordCapsLockActive(false);
                }}
                onKeyDown={(event) => setPasswordCapsLockActive(getCapsLockState(event))}
                onKeyUp={(event) => setPasswordCapsLockActive(getCapsLockState(event))}
                autoComplete="new-password"
                placeholder="Buat password"
                className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
                required
                disabled={Boolean(success)}
              />
            </InputShell>
            <CapsLockWarning active={passwordCapsLockActive} />
            <StrengthMeter password={password} />
            <ValidationFeedback
              helperText="Gunakan 8-64 karakter, 1 huruf besar, 1 angka, tanpa spasi."
              summaryText="Password memenuhi semua syarat."
              mode={passwordMode}
              items={passwordChecks}
            />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Konfirmasi Password</span>
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
                disabled={Boolean(success)}
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
        </div>

        <button
          type="submit"
          disabled={submitting || !formValid || Boolean(success)}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          <UserPlus className="h-4 w-4" />
          {submitting ? "Membuat akun..." : "Register"}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          Sudah punya akun? <Link href="/login" className="font-semibold text-teal-700 hover:text-teal-800">Masuk</Link>
        </p>
      </form>
    </main>
  );
}
