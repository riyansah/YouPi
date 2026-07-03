import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getDatabase } from "@/lib/server/dashboard-db";

export const sessionCookieName = "activity_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const registerWindowMs = 15 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const registerLimit = 5;
const loginLimit = 10;

interface SessionPayload {
  user: string;
  exp: number;
}

interface AuthConfig {
  username: string;
  passwordHash: string;
  sessionSecret: string;
}

export type RateLimitAction = "login" | "register";

function base64UrlJson(value: unknown) {
  return Buffer.from(JSON.stringify(value), "utf8").toString("base64url");
}

function sign(value: string, secret: string) {
  return createHmac("sha256", secret).update(value).digest("base64url");
}

function ensureAuthTables() {
  getDatabase().exec(`
    CREATE TABLE IF NOT EXISTS auth_config (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      username TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      session_secret TEXT NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_rate_limits (
      action TEXT NOT NULL,
      client_key TEXT NOT NULL,
      attempts INTEGER NOT NULL,
      reset_at INTEGER NOT NULL,
      PRIMARY KEY (action, client_key)
    );
  `);
}

function readAuthConfig(): AuthConfig | null {
  ensureAuthTables();
  const row = getDatabase().prepare("SELECT username, password_hash, session_secret FROM auth_config WHERE id = 1").get();

  if (!row) {
    return null;
  }

  return {
    username: String(row.username),
    passwordHash: String(row.password_hash),
    sessionSecret: String(row.session_secret)
  };
}

export function hasRegisteredUser() {
  return readAuthConfig() !== null;
}

export function createPasswordHash(password: string, salt = randomBytes(16)) {
  const hash = scryptSync(password, salt, 64);
  return `scrypt:${salt.toString("base64url")}:${hash.toString("base64url")}`;
}

export function verifyPasswordHash(password: string, passwordHash: string) {
  const [algorithm, saltValue, hashValue] = passwordHash.split(":");

  if (algorithm !== "scrypt" || !saltValue || !hashValue) {
    return false;
  }

  const salt = Buffer.from(saltValue, "base64url");
  const expected = Buffer.from(hashValue, "base64url");
  const actual = scryptSync(password, salt, expected.length);

  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export function registerUser(username: string, password: string) {
  ensureAuthTables();

  if (hasRegisteredUser()) {
    return { ok: false as const, reason: "exists" as const };
  }

  const normalizedUsername = username.trim();
  const now = new Date().toISOString();
  const passwordHash = createPasswordHash(password);
  const sessionSecret = randomBytes(32).toString("base64url");

  getDatabase()
    .prepare(
      "INSERT INTO auth_config (id, username, password_hash, session_secret, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?)"
    )
    .run(normalizedUsername, passwordHash, sessionSecret, now, now);

  return { ok: true as const, username: normalizedUsername };
}

export function resetUserCredentials(username: string, password: string) {
  ensureAuthTables();

  const normalizedUsername = username.trim();
  const authConfig = readAuthConfig();
  const now = new Date().toISOString();
  const passwordHash = createPasswordHash(password);
  const sessionSecret = randomBytes(32).toString("base64url");
  const db = getDatabase();

  if (!authConfig) {
    db.prepare(
      "INSERT INTO auth_config (id, username, password_hash, session_secret, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?)"
    ).run(normalizedUsername, passwordHash, sessionSecret, now, now);
    db.prepare("DELETE FROM auth_rate_limits").run();
    return { ok: true as const, action: "created" as const, username: normalizedUsername };
  }

  db.prepare("UPDATE auth_config SET username = ?, password_hash = ?, session_secret = ?, updated_at = ? WHERE id = 1").run(
    normalizedUsername,
    passwordHash,
    sessionSecret,
    now
  );
  db.prepare("DELETE FROM auth_rate_limits").run();

  return { ok: true as const, action: "updated" as const, username: normalizedUsername };
}

export function verifyCredentials(username: string, password: string) {
  const authConfig = readAuthConfig();

  if (!authConfig) {
    return { ok: false as const, reason: "config" as const };
  }

  if (username !== authConfig.username || !verifyPasswordHash(password, authConfig.passwordHash)) {
    return { ok: false as const, reason: "credentials" as const };
  }

  return { ok: true as const, username: authConfig.username };
}

export function changePassword(username: string, currentPassword: string, newPassword: string) {
  const authConfig = readAuthConfig();

  if (!authConfig || username !== authConfig.username) {
    return { ok: false as const, reason: "credentials" as const };
  }

  if (!verifyPasswordHash(currentPassword, authConfig.passwordHash)) {
    return { ok: false as const, reason: "current-password" as const };
  }

  if (currentPassword === newPassword) {
    return { ok: false as const, reason: "same-password" as const };
  }

  getDatabase()
    .prepare("UPDATE auth_config SET password_hash = ?, updated_at = ? WHERE id = 1")
    .run(createPasswordHash(newPassword), new Date().toISOString());

  return { ok: true as const };
}

export function createSessionToken(username: string, now = Date.now()) {
  const authConfig = readAuthConfig();

  if (!authConfig) {
    throw new Error("Auth is not configured.");
  }

  const payload = base64UrlJson({ user: username, exp: now + sessionMaxAgeSeconds * 1000 } satisfies SessionPayload);
  return `${payload}.${sign(payload, authConfig.sessionSecret)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now()) {
  const authConfig = readAuthConfig();

  if (!token || !authConfig) {
    return null;
  }

  const [payloadValue, signature] = token.split(".");

  if (!payloadValue || !signature) {
    return null;
  }

  const expected = Buffer.from(sign(payloadValue, authConfig.sessionSecret), "base64url");
  const actual = Buffer.from(signature, "base64url");

  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadValue, "base64url").toString("utf8")) as Partial<SessionPayload>;

    if (!payload.user || payload.user !== authConfig.username || !payload.exp || payload.exp <= now) {
      return null;
    }

    return { user: payload.user };
  } catch {
    return null;
  }
}

export function getSessionFromRequest(request: NextRequest) {
  return verifySessionToken(request.cookies.get(sessionCookieName)?.value);
}

export function sessionCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: sessionMaxAgeSeconds
  };
}

function rateLimitConfig(action: RateLimitAction) {
  return action === "register"
    ? { limit: registerLimit, windowMs: registerWindowMs }
    : { limit: loginLimit, windowMs: loginWindowMs };
}

export function getClientIp(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

export function checkRateLimit(action: RateLimitAction, clientKey: string, now = Date.now()) {
  ensureAuthTables();
  const { limit, windowMs } = rateLimitConfig(action);
  const resetAt = now + windowMs;
  const db = getDatabase();
  const row = db
    .prepare("SELECT attempts, reset_at FROM auth_rate_limits WHERE action = ? AND client_key = ?")
    .get(action, clientKey);

  if (!row || Number(row.reset_at) <= now) {
    db.prepare("INSERT OR REPLACE INTO auth_rate_limits (action, client_key, attempts, reset_at) VALUES (?, ?, ?, ?)").run(
      action,
      clientKey,
      1,
      resetAt
    );
    return { allowed: true as const, remaining: limit - 1, resetAt };
  }

  const attempts = Number(row.attempts);

  if (attempts >= limit) {
    return { allowed: false as const, remaining: 0, resetAt: Number(row.reset_at) };
  }

  db.prepare("UPDATE auth_rate_limits SET attempts = attempts + 1 WHERE action = ? AND client_key = ?").run(action, clientKey);
  return { allowed: true as const, remaining: limit - attempts - 1, resetAt: Number(row.reset_at) };
}

export function resetRateLimit(action: RateLimitAction, clientKey: string) {
  ensureAuthTables();
  getDatabase().prepare("DELETE FROM auth_rate_limits WHERE action = ? AND client_key = ?").run(action, clientKey);
}
