"use client";

import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { Eye, EyeOff, KeyRound } from "lucide-react";
import { getPasswordStrength, validateAuthPassword } from "@/lib/auth-validation";
import { cn } from "@/lib/utils";

function PasswordToggle({ visible, onClick, label }: { visible: boolean; onClick: () => void; label: string }) {
  const Icon = visible ? EyeOff : Eye;

  return (
    <button
      type="button"
      onClick={onClick}
      className="inline-flex h-10 w-10 items-center justify-center rounded border border-slate-200 text-slate-600 hover:bg-slate-100"
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
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
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
  const formValid =
    !currentPasswordErrors.length && !newPasswordErrors.length && !confirmPasswordErrors.length && !samePasswordErrors.length;
  const showLiveErrors = submitted || currentPassword || newPassword || confirmPassword;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitted(true);
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
    setSubmitted(false);
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
          <span className="flex gap-2">
            <input
              type={showCurrentPassword ? "text" : "password"}
              value={currentPassword}
              onChange={(event) => setCurrentPassword(event.target.value)}
              autoComplete="current-password"
              className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              required
            />
            <PasswordToggle
              visible={showCurrentPassword}
              onClick={() => setShowCurrentPassword((current) => !current)}
              label={showCurrentPassword ? "Sembunyikan password lama" : "Tampilkan password lama"}
            />
          </span>
          {showLiveErrors ? <FieldErrors errors={currentPasswordErrors} /> : null}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Password baru</span>
          <span className="flex gap-2">
            <input
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(event) => setNewPassword(event.target.value)}
              autoComplete="new-password"
              className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              required
            />
            <PasswordToggle
              visible={showNewPassword}
              onClick={() => setShowNewPassword((current) => !current)}
              label={showNewPassword ? "Sembunyikan password baru" : "Tampilkan password baru"}
            />
          </span>
          <StrengthMeter password={newPassword} />
          {showLiveErrors ? <FieldErrors errors={[...newPasswordErrors, ...samePasswordErrors]} /> : null}
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Konfirmasi password baru</span>
          <span className="flex gap-2">
            <input
              type={showConfirmPassword ? "text" : "password"}
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              autoComplete="new-password"
              className="min-w-0 flex-1 rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
              required
            />
            <PasswordToggle
              visible={showConfirmPassword}
              onClick={() => setShowConfirmPassword((current) => !current)}
              label={showConfirmPassword ? "Sembunyikan konfirmasi password" : "Tampilkan konfirmasi password"}
            />
          </span>
          {showLiveErrors ? <FieldErrors errors={confirmPasswordErrors} /> : null}
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
