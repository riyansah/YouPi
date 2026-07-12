"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Lock, LogIn, User } from "lucide-react";
import {
  CapsLockWarning,
  getValidationDisplayMode,
  InputShell,
  PasswordToggle,
  ValidationFeedback,
  type ValidationItem
} from "@/components/AuthFormControls";
import { BRAND_NAME, BRAND_TAGLINE, tAuthErrorCode, useStoredLanguage } from "@/lib/i18n";
import { validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";

function getSafeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function getCapsLockState(event: KeyboardEvent<HTMLInputElement>) {
  return event.getModifierState("CapsLock");
}

function padCountdown(value: number) {
  return String(value).padStart(2, "0");
}

function formatLockoutCountdown(totalSeconds: number) {
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return hours > 0
    ? `${padCountdown(hours)}:${padCountdown(minutes)}:${padCountdown(seconds)}`
    : `${padCountdown(minutes)}:${padCountdown(seconds)}`;
}

type LoginLockoutPayload = {
  error?: string;
  code?: string;
  locked?: boolean;
  lockedUntil?: number | null;
  retryAfterSeconds?: number;
};

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [language] = useStoredLanguage();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [capsLockActive, setCapsLockActive] = useState(false);
  const [usernameFocused, setUsernameFocused] = useState(false);
  const [passwordFocused, setPasswordFocused] = useState(false);
  const [usernameTouched, setUsernameTouched] = useState(false);
  const [passwordTouched, setPasswordTouched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [lockoutUntil, setLockoutUntil] = useState<number | null>(null);
  const [remainingSeconds, setRemainingSeconds] = useState(0);

  const usernameErrors = useMemo(() => validateAuthUsername(username), [username]);
  const passwordErrors = useMemo(() => validateAuthPassword(password), [password]);
  const usernameValid = usernameErrors.length === 0;
  const passwordValid = passwordErrors.length === 0;
  const formValid = usernameValid && passwordValid;
  const locked = lockoutUntil !== null && remainingSeconds > 0;
  const controlsDisabled = submitting || locked;

  const reason = searchParams.get("reason");
  const text = {
    description: language === "id" ? "Masuk untuk membuka dashboard perencanaan pribadi Anda." : "Sign in to open your personal planning dashboard.",
    idleReason: language === "id" ? "Sesi berakhir karena tidak aktif selama 15 menit. Silakan masuk kembali." : "Your session ended after 15 minutes of inactivity. Please sign in again.",
    lockedInline: language === "id" ? `Terlalu banyak percobaan login. Coba lagi dalam ${formatLockoutCountdown(remainingSeconds)}.` : `Too many login attempts. Try again in ${formatLockoutCountdown(remainingSeconds)}.`,
    lockedGeneral: language === "id" ? "Terlalu banyak percobaan login. Coba lagi setelah hitung mundur selesai." : "Too many login attempts. Try again after the countdown finishes.",
    invalidForm: language === "id" ? "Periksa kembali username dan password." : "Please review your username and password.",
    usernameMin: language === "id" ? "Minimal 3 karakter." : "Minimum 3 characters.",
    usernameMax: language === "id" ? "Maksimal 20 karakter." : "Maximum 20 characters.",
    usernameFormat: language === "id" ? "Hanya huruf kecil dan angka." : "Lowercase letters and numbers only.",
    passwordMin: language === "id" ? "Minimal 8 karakter." : "Minimum 8 characters.",
    passwordMax: language === "id" ? "Maksimal 64 karakter." : "Maximum 64 characters.",
    passwordUpper: language === "id" ? "Minimal 1 huruf besar." : "At least 1 uppercase letter.",
    passwordNumber: language === "id" ? "Minimal 1 angka." : "At least 1 number.",
    passwordSpace: language === "id" ? "Tidak boleh mengandung spasi." : "Must not contain spaces.",
    usernamePlaceholder: language === "id" ? "Masukkan username" : "Enter username",
    passwordPlaceholder: language === "id" ? "Masukkan password" : "Enter password",
    usernameHelper: language === "id" ? "Gunakan 3-20 karakter huruf kecil dan angka." : "Use 3-20 lowercase letters and numbers.",
    usernameSummary: language === "id" ? "Format username valid." : "Username format is valid.",
    passwordHelper: language === "id" ? "Gunakan 8-64 karakter, 1 huruf besar, 1 angka, tanpa spasi." : "Use 8-64 characters, 1 uppercase letter, 1 number, and no spaces.",
    passwordSummary: language === "id" ? "Format password valid." : "Password format is valid.",
    showPassword: language === "id" ? "Tampilkan password" : "Show password",
    hidePassword: language === "id" ? "Sembunyikan password" : "Hide password",
    checking: language === "id" ? "Memeriksa..." : "Checking...",
    signIn: language === "id" ? "Masuk" : "Sign In",
    noAccount: language === "id" ? "Belum punya akun?" : "Need an account?",
    register: language === "id" ? "Register" : "Register",
    lockedTitle: language === "id" ? "Percobaan login dikunci sementara." : "Login is temporarily locked.",
    lockedRetry: language === "id" ? "Coba lagi dalam" : "Try again in"
  };

  useEffect(() => {
    let cancelled = false;

    async function loadStatus() {
      const response = await fetch("/api/auth/login", { method: "GET", cache: "no-store" }).catch(() => null);

      if (!response?.ok) {
        return;
      }

      const body = (await response.json().catch(() => null)) as LoginLockoutPayload | null;

      if (cancelled || !body?.locked || typeof body.lockedUntil !== "number") {
        return;
      }

      setLockoutUntil(body.lockedUntil);
      setRemainingSeconds(Math.max(1, Math.ceil((body.lockedUntil - Date.now()) / 1000)));
      setError(tAuthErrorCode(body.code, language) || body.error || text.lockedGeneral);
    }

    void loadStatus();

    return () => {
      cancelled = true;
    };
  }, [language, text.lockedGeneral]);

  useEffect(() => {
    if (lockoutUntil === null) {
      return;
    }

    const syncCountdown = () => {
      const nextSeconds = Math.max(0, Math.ceil((lockoutUntil - Date.now()) / 1000));
      setRemainingSeconds(nextSeconds);

      if (nextSeconds === 0) {
        setLockoutUntil(null);
        setError(null);
      }
    };

    syncCountdown();
    const timer = window.setInterval(syncCountdown, 1000);

    return () => window.clearInterval(timer);
  }, [lockoutUntil]);

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

  const usernameMode = getValidationDisplayMode({ focused: usernameFocused, touched: usernameTouched, value: username, valid: usernameValid });
  const passwordMode = getValidationDisplayMode({ focused: passwordFocused, touched: passwordTouched, value: password, valid: passwordValid });

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (locked) {
      return;
    }

    setSubmitting(true);
    setError(null);
    setUsernameTouched(true);
    setPasswordTouched(true);

    if (!formValid) {
      setError(text.invalidForm);
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as LoginLockoutPayload | null;
      if (response.status === 409) {
        router.replace("/register");
        router.refresh();
        return;
      }

      const message = tAuthErrorCode(body?.code, language) || body?.error;
      if (response.status === 429 && typeof body?.lockedUntil === "number") {
        setLockoutUntil(body.lockedUntil);
        setRemainingSeconds(Math.max(1, Math.ceil((body.lockedUntil - Date.now()) / 1000)));
        setError(message || text.lockedGeneral);
      } else {
        setError(message || (language === "id" ? "Login gagal." : "Sign-in failed."));
      }

      setSubmitting(false);
      return;
    }

    setLockoutUntil(null);
    setRemainingSeconds(0);
    router.replace(getSafeNext(searchParams.get("next")));
    router.refresh();
  }

  return (
    <div className="relative w-full max-w-sm">
      <form onSubmit={handleSubmit} className="rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div>
          <p className="text-sm font-semibold uppercase text-teal-700">{BRAND_NAME}</p>
          <h1 className="mt-1 text-2xl font-bold text-slate-950">{BRAND_TAGLINE}</h1>
          <p className="mt-2 text-sm text-slate-500">{text.description}</p>
        </div>

        {reason === "idle" && !error ? (
          <p className="mt-5 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800">{text.idleReason}</p>
        ) : null}

        {error ? (
          <p className={locked ? "mt-5 rounded border border-amber-200 bg-amber-50 p-3 text-sm text-amber-800" : "mt-5 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"}>
            {locked ? text.lockedInline : error}
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Username</span>
            <InputShell icon={User} filled={Boolean(username)} error={usernameTouched && !usernameValid} disabled={controlsDisabled}>
              <input
                value={username}
                onChange={(event) => {
                  setUsernameTouched(true);
                  setUsername(event.target.value);
                }}
                onFocus={() => {
                  setUsernameFocused(true);
                  setUsernameTouched(true);
                }}
                onBlur={() => setUsernameFocused(false)}
                autoComplete="username"
                placeholder={text.usernamePlaceholder}
                className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
                required
                disabled={controlsDisabled}
              />
            </InputShell>
            <ValidationFeedback helperText={text.usernameHelper} summaryText={text.usernameSummary} mode={usernameMode} items={usernameChecks} />
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <InputShell
              icon={Lock}
              action={<PasswordToggle visible={showPassword} onClick={() => setShowPassword((current) => !current)} label={showPassword ? text.hidePassword : text.showPassword} disabled={controlsDisabled} />}
              filled={Boolean(password)}
              error={passwordTouched && !passwordValid}
              disabled={controlsDisabled}
            >
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => {
                  setPasswordTouched(true);
                  setPassword(event.target.value);
                }}
                onFocus={() => {
                  setPasswordFocused(true);
                  setPasswordTouched(true);
                }}
                onBlur={() => {
                  setPasswordFocused(false);
                  setCapsLockActive(false);
                }}
                onKeyDown={(event) => setCapsLockActive(getCapsLockState(event))}
                onKeyUp={(event) => setCapsLockActive(getCapsLockState(event))}
                autoComplete="current-password"
                placeholder={text.passwordPlaceholder}
                className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none disabled:cursor-not-allowed"
                required
                disabled={controlsDisabled}
              />
            </InputShell>
            <CapsLockWarning active={capsLockActive && !locked} />
            <ValidationFeedback helperText={text.passwordHelper} summaryText={text.passwordSummary} mode={passwordMode} items={passwordChecks} />
          </label>
        </div>

        <button type="submit" disabled={controlsDisabled || !formValid} className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70">
          <LogIn className="h-4 w-4" />
          {submitting ? text.checking : text.signIn}
        </button>

        <p className="mt-4 text-center text-sm text-slate-600">
          {text.noAccount} {locked ? <span className="font-semibold text-slate-400">{text.register}</span> : <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800">{text.register}</Link>}
        </p>
      </form>

      {locked ? (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded bg-white/85 px-6 text-center backdrop-blur-[1px]">
          <div className="rounded border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800 shadow-sm">
            <p className="font-semibold">{text.lockedTitle}</p>
            <p className="mt-1">{text.lockedRetry} <span className="font-bold tabular-nums">{formatLockoutCountdown(remainingSeconds)}</span>.</p>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function LoginPage() {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f7fb] px-4 py-10">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </main>
  );
}
