"use client";

import Link from "next/link";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { getPasswordStrength, validateAuthPassword, validateAuthUsername } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

function PasswordToggle({ visible, onClick, label }: { visible: boolean; onClick: () => void; label: string }) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-9 w-9 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
      aria-label={label}
      title={label}
    >
      <Icon className="h-4 w-4" />
    </button>
  );
}

function FieldErrors({ errors }: { errors: string[] }) {
  if (!errors.length) {
    return null;
  }

  return (
    <ul className="space-y-1 text-xs text-rose-700">
      {errors.map((item) => (
        <li key={item}>{item}</li>
      ))}
    </ul>
  );
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
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [countdown, setCountdown] = useState(5);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

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
  const formValid = !usernameErrors.length && !passwordErrors.length && !confirmPasswordErrors.length;

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

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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

  const showLiveErrors = submitted || username || password || confirmPassword;

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
            <input
              value={username}
              onChange={(event) => setUsername(event.target.value)}
              autoComplete="username"
              className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              required
              disabled={Boolean(success)}
            />
            {showLiveErrors ? <FieldErrors errors={usernameErrors} /> : null}
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <span className="flex gap-2">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="new-password"
                className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                required
                disabled={Boolean(success)}
              />
              <PasswordToggle
                visible={showPassword}
                onClick={() => setShowPassword((current) => !current)}
                label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
              />
            </span>
            <StrengthMeter password={password} />
            {showLiveErrors ? <FieldErrors errors={passwordErrors} /> : null}
          </label>

          <label className="space-y-1">
            <span className="text-sm font-medium text-slate-700">Konfirmasi Password</span>
            <span className="flex gap-2">
              <input
                type={showConfirmPassword ? "text" : "password"}
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                autoComplete="new-password"
                className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
                required
                disabled={Boolean(success)}
              />
              <PasswordToggle
                visible={showConfirmPassword}
                onClick={() => setShowConfirmPassword((current) => !current)}
                label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
              />
            </span>
            {showLiveErrors ? <FieldErrors errors={confirmPasswordErrors} /> : null}
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
