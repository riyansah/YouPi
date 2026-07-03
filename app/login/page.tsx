"use client";

import Link from "next/link";
import { FormEvent, KeyboardEvent, Suspense, useMemo, useState } from "react";
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
import { validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";

function getSafeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function getCapsLockState(event: KeyboardEvent<HTMLInputElement>) {
  return event.getModifierState("CapsLock");
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
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

  const usernameErrors = useMemo(() => validateAuthUsername(username), [username]);
  const passwordErrors = useMemo(() => validateAuthPassword(password), [password]);
  const usernameValid = usernameErrors.length === 0;
  const passwordValid = passwordErrors.length === 0;
  const formValid = usernameValid && passwordValid;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);
    setUsernameTouched(true);
    setPasswordTouched(true);

    if (!formValid) {
      setError("Periksa kembali username dan password.");
      setSubmitting(false);
      return;
    }

    const response = await fetch("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, password })
    });

    if (!response.ok) {
      const body = (await response.json().catch(() => null)) as { error?: string } | null;
      if (response.status === 409) {
        router.replace("/register");
        router.refresh();
        return;
      }

      setError(body?.error || "Login gagal.");
      setSubmitting(false);
      return;
    }

    router.replace(getSafeNext(searchParams.get("next")));
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm rounded border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <p className="text-sm font-semibold uppercase text-teal-700">Personal</p>
        <h1 className="mt-1 text-2xl font-bold text-slate-950">Activity Hub</h1>
        <p className="mt-2 text-sm text-slate-500">Masuk untuk membuka dashboard pribadi.</p>
      </div>

      {error ? <p className="mt-5 rounded border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">{error}</p> : null}

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
                setUsernameFocused(true);
                setUsernameTouched(true);
              }}
              onBlur={() => setUsernameFocused(false)}
              autoComplete="username"
              placeholder="Masukkan username"
              className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
              required
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
              placeholder="Masukkan password"
              className="w-full bg-transparent py-2 pr-3 text-sm placeholder:text-slate-400 focus:outline-none"
              required
            />
          </InputShell>
          <CapsLockWarning active={capsLockActive} />
          <ValidationFeedback
            helperText="Gunakan 8-64 karakter, 1 huruf besar, 1 angka, tanpa spasi."
            summaryText="Format password valid."
            mode={passwordMode}
            items={passwordChecks}
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting || !formValid}
        className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded bg-teal-700 px-4 py-2 text-sm font-semibold text-white hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
      >
        <LogIn className="h-4 w-4" />
        {submitting ? "Memeriksa..." : "Masuk"}
      </button>

      <p className="mt-4 text-center text-sm text-slate-600">
        Belum punya akun? <Link href="/register" className="font-semibold text-teal-700 hover:text-teal-800">Register</Link>
      </p>
    </form>
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
