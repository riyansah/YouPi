"use client";

import Link from "next/link";
import { FormEvent, Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { LogIn } from "lucide-react";

function getSafeNext(value: string | null) {
  return value && value.startsWith("/") && !value.startsWith("//") ? value : "/dashboard";
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSubmitting(true);
    setError(null);

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
          <input
            value={username}
            onChange={(event) => setUsername(event.target.value)}
            autoComplete="username"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            required
          />
        </label>

        <label className="space-y-1">
          <span className="text-sm font-medium text-slate-700">Password</span>
          <input
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoComplete="current-password"
            className="w-full rounded border border-slate-300 px-3 py-2 text-sm focus:border-teal-500 focus:outline-none"
            required
          />
        </label>
      </div>

      <button
        type="submit"
        disabled={submitting}
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
