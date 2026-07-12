import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import type { NextRequest } from "next/server";
import { getClientIpFromRequest } from "@/lib/server/client-ip";
import { getDatabase } from "@/lib/server/dashboard-db";
import { getCurrentTimestampInTimeZone } from "@/lib/time";

export const sessionCookieName = "activity_session";
const sessionMaxAgeSeconds = 60 * 60 * 24 * 7;
const sessionIdleTimeoutMs = 15 * 60 * 1000;
const registerWindowMs = 15 * 60 * 1000;
const loginWindowMs = 15 * 60 * 1000;
const registerLimit = 5;
const loginLimit = 10;
const loginLockoutDurationsMs = [60_000, 5 * 60_000, 10 * 60_000, 30 * 60_000, 60 * 60_000] as const;

interface SessionPayload {
  sid: string;
  userId: string;
  user: string;
  exp: number;
}

interface AuthConfig {
  userId: string;
  username: string;
  passwordHash: string;
  sessionSecret: string;
}

interface LoginLockoutRow {
  failed_attempts: number;
  next_lock_index: number;
  locked_until: number;
}

interface SessionRow {
  id: string;
  user_id: string;
  username: string;
  expires_at: number;
  last_activity_at: number;
}

export interface AuthSession {
  sessionId: string;
  userId: string;
  user: string;
}

export type RateLimitAction = "login" | "register";

export interface LoginLockoutStatus {
  locked: boolean;
  lockedUntil: number | null;
  retryAfterSeconds: number;
}

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
      user_id TEXT,
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
    CREATE TABLE IF NOT EXISTS auth_login_lockouts (
      client_key TEXT PRIMARY KEY,
      failed_attempts INTEGER NOT NULL,
      next_lock_index INTEGER NOT NULL,
      locked_until INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS auth_sessions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      username TEXT NOT NULL,
      expires_at INTEGER NOT NULL,
      last_activity_at INTEGER NOT NULL,
      created_at INTEGER NOT NULL
    );
  `);

  const tableInfo = getDatabase().prepare("PRAGMA table_info(auth_config)").all();
  const hasUserId = tableInfo.some((row) => String(row.name) === "user_id");

  if (!hasUserId) {
    getDatabase().exec("ALTER TABLE auth_config ADD COLUMN user_id TEXT");
  }

  getDatabase().prepare("UPDATE auth_config SET user_id = COALESCE(user_id, 'user-1') WHERE id = 1").run();
}

function readSessionRow(sessionId: string): SessionRow | null {
  ensureAuthTables();
  const row = getDatabase()
    .prepare("SELECT id, user_id, username, expires_at, last_activity_at FROM auth_sessions WHERE id = ?")
    .get(sessionId);

  if (!row) {
    return null;
  }

  return {
    id: String(row.id),
    user_id: String(row.user_id),
    username: String(row.username),
    expires_at: Number(row.expires_at),
    last_activity_at: Number(row.last_activity_at)
  };
}

export function deleteSession(sessionId: string) {
  ensureAuthTables();
  getDatabase().prepare("DELETE FROM auth_sessions WHERE id = ?").run(sessionId);
}

export function deleteSessionsForUser(userId: string) {
  ensureAuthTables();
  getDatabase().prepare("DELETE FROM auth_sessions WHERE user_id = ?").run(userId);
}

export function deleteAllSessions() {
  ensureAuthTables();
  getDatabase().prepare("DELETE FROM auth_sessions").run();
}

function readAuthConfig(): AuthConfig | null {
  ensureAuthTables();
  const row = getDatabase().prepare("SELECT user_id, username, password_hash, session_secret FROM auth_config WHERE id = 1").get();

  if (!row) {
    return null;
  }

  return {
    userId: String(row.user_id || "user-1"),
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
  const now = getCurrentTimestampInTimeZone();
  const passwordHash = createPasswordHash(password);
  const sessionSecret = randomBytes(32).toString("base64url");
  const userId = "user-1";

  getDatabase()
    .prepare(
      "INSERT INTO auth_config (id, user_id, username, password_hash, session_secret, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?)"
    )
    .run(userId, normalizedUsername, passwordHash, sessionSecret, now, now);

  return { ok: true as const, userId, username: normalizedUsername };
}

export function resetUserCredentials(username: string, password: string) {
  ensureAuthTables();

  const normalizedUsername = username.trim();
  const authConfig = readAuthConfig();
  const now = getCurrentTimestampInTimeZone();
  const passwordHash = createPasswordHash(password);
  const sessionSecret = randomBytes(32).toString("base64url");
  const userId = authConfig?.userId || "user-1";
  const db = getDatabase();

  if (!authConfig) {
    db.prepare(
      "INSERT INTO auth_config (id, user_id, username, password_hash, session_secret, created_at, updated_at) VALUES (1, ?, ?, ?, ?, ?, ?)"
    ).run(userId, normalizedUsername, passwordHash, sessionSecret, now, now);
    db.prepare("DELETE FROM auth_rate_limits").run();
    db.prepare("DELETE FROM auth_login_lockouts").run();
    db.prepare("DELETE FROM auth_sessions").run();
    return { ok: true as const, action: "created" as const, userId, username: normalizedUsername };
  }

  db.prepare("UPDATE auth_config SET user_id = ?, username = ?, password_hash = ?, session_secret = ?, updated_at = ? WHERE id = 1").run(
    userId,
    normalizedUsername,
    passwordHash,
    sessionSecret,
    now
  );
  db.prepare("DELETE FROM auth_rate_limits").run();
  db.prepare("DELETE FROM auth_login_lockouts").run();
  db.prepare("DELETE FROM auth_sessions").run();

  return { ok: true as const, action: "updated" as const, userId, username: normalizedUsername };
}

export function verifyCredentials(username: string, password: string) {
  const authConfig = readAuthConfig();

  if (!authConfig) {
    return { ok: false as const, reason: "config" as const };
  }

  if (username !== authConfig.username || !verifyPasswordHash(password, authConfig.passwordHash)) {
    return { ok: false as const, reason: "credentials" as const };
  }

  return { ok: true as const, userId: authConfig.userId, username: authConfig.username };
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
    .run(createPasswordHash(newPassword), getCurrentTimestampInTimeZone());

  return { ok: true as const };
}

export function createSessionToken(userId: string, username: string, now = Date.now()) {
  const authConfig = readAuthConfig();

  if (!authConfig) {
    throw new Error("Auth is not configured.");
  }

  const sessionId = randomBytes(32).toString("base64url");
  const expiresAt = now + sessionMaxAgeSeconds * 1000;
  const db = getDatabase();

  db.exec("BEGIN");
  try {
    db.prepare("DELETE FROM auth_sessions WHERE user_id = ?").run(userId);
    db.prepare("INSERT INTO auth_sessions (id, user_id, username, expires_at, last_activity_at, created_at) VALUES (?, ?, ?, ?, ?, ?)")
      .run(sessionId, userId, username, expiresAt, now, now);
    db.exec("COMMIT");
  } catch (error) {
    db.exec("ROLLBACK");
    throw error;
  }

  const payload = base64UrlJson({ sid: sessionId, userId, user: username, exp: expiresAt } satisfies SessionPayload);
  return `${payload}.${sign(payload, authConfig.sessionSecret)}`;
}

export function verifySessionToken(token: string | undefined, now = Date.now(), touch = true): AuthSession | null {
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

    if (!payload.sid || !payload.userId || !payload.user || payload.user !== authConfig.username || payload.userId !== authConfig.userId || !payload.exp || payload.exp <= now) {
      return null;
    }

    const sessionRow = readSessionRow(payload.sid);

    if (!sessionRow || sessionRow.user_id !== payload.userId || sessionRow.username !== payload.user || sessionRow.expires_at <= now) {
      if (sessionRow) {
        deleteSession(sessionRow.id);
      }
      return null;
    }

    if (sessionRow.last_activity_at + sessionIdleTimeoutMs <= now) {
      deleteSession(sessionRow.id);
      return null;
    }

    if (touch) {
      getDatabase().prepare("UPDATE auth_sessions SET last_activity_at = ? WHERE id = ?").run(now, sessionRow.id);
    }

    return { sessionId: sessionRow.id, userId: payload.userId, user: payload.user };
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
  return getClientIpFromRequest(request);
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

function getLoginLockoutDurationMs(index: number) {
  return loginLockoutDurationsMs[Math.min(index, loginLockoutDurationsMs.length - 1)];
}

function readLoginLockoutRow(clientKey: string): LoginLockoutRow | null {
  ensureAuthTables();
  const row = getDatabase()
    .prepare("SELECT failed_attempts, next_lock_index, locked_until FROM auth_login_lockouts WHERE client_key = ?")
    .get(clientKey);

  if (!row) {
    return null;
  }

  return {
    failed_attempts: Number(row.failed_attempts),
    next_lock_index: Number(row.next_lock_index),
    locked_until: Number(row.locked_until)
  };
}

function writeLoginLockoutRow(clientKey: string, row: LoginLockoutRow) {
  getDatabase()
    .prepare(
      "INSERT OR REPLACE INTO auth_login_lockouts (client_key, failed_attempts, next_lock_index, locked_until) VALUES (?, ?, ?, ?)"
    )
    .run(clientKey, row.failed_attempts, row.next_lock_index, row.locked_until);
}

export function getLoginLockoutStatus(clientKey: string, now = Date.now()): LoginLockoutStatus {
  const row = readLoginLockoutRow(clientKey);
  const lockedUntil = row && row.locked_until > now ? row.locked_until : null;

  return {
    locked: Boolean(lockedUntil),
    lockedUntil,
    retryAfterSeconds: lockedUntil ? Math.max(1, Math.ceil((lockedUntil - now) / 1000)) : 0
  };
}

export function recordLoginFailure(clientKey: string, now = Date.now()) {
  const status = getLoginLockoutStatus(clientKey, now);

  if (status.locked) {
    return {
      ...status,
      failedAttempts: 0,
      justLocked: false,
      lockoutSeconds: status.retryAfterSeconds
    };
  }

  const row = readLoginLockoutRow(clientKey) ?? {
    failed_attempts: 0,
    next_lock_index: 0,
    locked_until: 0
  };
  const failedAttempts = row.failed_attempts + 1;

  if (failedAttempts < 3) {
    writeLoginLockoutRow(clientKey, {
      failed_attempts: failedAttempts,
      next_lock_index: row.next_lock_index,
      locked_until: 0
    });
    return {
      locked: false as const,
      lockedUntil: null,
      retryAfterSeconds: 0,
      failedAttempts,
      justLocked: false,
      lockoutSeconds: 0
    };
  }

  const lockoutMs = getLoginLockoutDurationMs(row.next_lock_index);
  const lockedUntil = now + lockoutMs;

  writeLoginLockoutRow(clientKey, {
    failed_attempts: 0,
    next_lock_index: Math.min(row.next_lock_index + 1, loginLockoutDurationsMs.length - 1),
    locked_until: lockedUntil
  });

  return {
    locked: true as const,
    lockedUntil,
    retryAfterSeconds: Math.ceil(lockoutMs / 1000),
    failedAttempts,
    justLocked: true,
    lockoutSeconds: Math.ceil(lockoutMs / 1000)
  };
}

export function resetLoginLockout(clientKey: string) {
  ensureAuthTables();
  getDatabase().prepare("DELETE FROM auth_login_lockouts WHERE client_key = ?").run(clientKey);
}
