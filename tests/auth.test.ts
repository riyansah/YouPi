import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { validateAuthPassword, validateAuthUsername } from "../lib/auth-validation";

test("database auth handles sessions, register rate limits, and staged login lockouts", async () => {
  const previousSqlitePath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = join(mkdtempSync(join(tmpdir(), "activity-auth-")), "activity.sqlite");

  try {
    const auth = await import("../lib/server/auth");

    assert.equal(auth.hasRegisteredUser(), false);
    assert.deepEqual(auth.registerUser("owner", "Correct1!"), { ok: true, userId: "user-1", username: "owner" });
    assert.equal(auth.hasRegisteredUser(), true);
    assert.deepEqual(auth.registerUser("second", "correct horse"), { ok: false, reason: "exists" });
    assert.deepEqual(auth.verifyCredentials("owner", "Correct1!"), { ok: true, userId: "user-1", username: "owner" });
    assert.deepEqual(auth.verifyCredentials("owner", "Wrong1!"), { ok: false, reason: "credentials" });
    assert.deepEqual(auth.changePassword("owner", "Wrong1!", "Better2!"), { ok: false, reason: "current-password" });
    assert.deepEqual(auth.changePassword("owner", "Correct1!", "Correct1!"), { ok: false, reason: "same-password" });
    assert.deepEqual(auth.changePassword("owner", "Correct1!", "Better2!"), { ok: true });
    assert.deepEqual(auth.verifyCredentials("owner", "Correct1!"), { ok: false, reason: "credentials" });
    assert.deepEqual(auth.verifyCredentials("owner", "Better2!"), { ok: true, userId: "user-1", username: "owner" });

    const token = auth.createSessionToken("user-1", "owner", 1000);
    const session = auth.verifySessionToken(token, 2000);
    assert.equal(session?.userId, "user-1");
    assert.equal(session?.user, "owner");
    assert.equal(typeof session?.sessionId, "string");

    const idleToken = auth.createSessionToken("user-1", "owner", 5000);
    assert.equal(auth.verifySessionToken(token, 5001, false), null);
    assert.equal(auth.verifySessionToken(idleToken, 5001, false)?.userId, "user-1");
    assert.equal(auth.verifySessionToken(idleToken, 5000 + 15 * 60 * 1000, false), null);
    assert.equal(auth.verifySessionToken(token, 1000 + 60 * 60 * 24 * 8 * 1000), null);
    assert.equal(auth.verifySessionToken(`${token}x`, 2000), null);

    for (let index = 0; index < 5; index += 1) {
      assert.equal(auth.checkRateLimit("register", "register-test-ip", 1000).allowed, true);
    }

    assert.equal(auth.checkRateLimit("register", "register-test-ip", 1000).allowed, false);

    const cycleStarts = [10_000, 80_000, 390_000, 1_050_000, 2_900_000, 6_600_000];
    const expectedSeconds = [60, 300, 600, 1800, 3600, 3600];

    cycleStarts.forEach((now, index) => {
      assert.deepEqual(auth.recordLoginFailure("lockout-ip", now), {
        locked: false,
        lockedUntil: null,
        retryAfterSeconds: 0,
        failedAttempts: 1,
        justLocked: false,
        lockoutSeconds: 0
      });
      assert.deepEqual(auth.recordLoginFailure("lockout-ip", now + 1_000), {
        locked: false,
        lockedUntil: null,
        retryAfterSeconds: 0,
        failedAttempts: 2,
        justLocked: false,
        lockoutSeconds: 0
      });

      const locked = auth.recordLoginFailure("lockout-ip", now + 2_000);
      assert.equal(locked.locked, true);
      assert.equal(locked.justLocked, true);
      assert.equal(locked.retryAfterSeconds, expectedSeconds[index]);
      assert.equal(locked.lockoutSeconds, expectedSeconds[index]);
      assert.equal(locked.lockedUntil, now + 2_000 + expectedSeconds[index] * 1000);
      assert.deepEqual(auth.getLoginLockoutStatus("lockout-ip", now + 3_000), {
        locked: true,
        lockedUntil: now + 2_000 + expectedSeconds[index] * 1000,
        retryAfterSeconds: expectedSeconds[index] - 1
      });
    });

    assert.deepEqual(auth.getLoginLockoutStatus("lockout-ip", 10_202_000), {
      locked: false,
      lockedUntil: null,
      retryAfterSeconds: 0
    });

    auth.resetLoginLockout("lockout-ip");
    assert.deepEqual(auth.recordLoginFailure("lockout-ip", 20_000), {
      locked: false,
      lockedUntil: null,
      retryAfterSeconds: 0,
      failedAttempts: 1,
      justLocked: false,
      lockoutSeconds: 0
    });
    auth.resetLoginLockout("lockout-ip");

    auth.recordLoginFailure("reset-ip", 40_000);
    auth.recordLoginFailure("reset-ip", 41_000);
    auth.recordLoginFailure("reset-ip", 42_000);
    const resetResult = auth.resetUserCredentials("rescued", "Rescued1A");
    assert.deepEqual(resetResult, { ok: true, action: "updated", userId: "user-1", username: "rescued" });
    assert.deepEqual(auth.verifyCredentials("owner", "Better2!"), { ok: false, reason: "credentials" });
    assert.deepEqual(auth.verifyCredentials("rescued", "Rescued1A"), { ok: true, userId: "user-1", username: "rescued" });
    assert.equal(auth.checkRateLimit("register", "register-test-ip", 1000).allowed, true);
    assert.deepEqual(auth.getLoginLockoutStatus("reset-ip", 42_500), {
      locked: false,
      lockedUntil: null,
      retryAfterSeconds: 0
    });

    const resetToken = auth.createSessionToken("user-1", "rescued", 3000);
    const resetSession = auth.verifySessionToken(resetToken, 4000);
    assert.equal(resetSession?.userId, "user-1");
    assert.equal(resetSession?.user, "rescued");
    assert.equal(typeof resetSession?.sessionId, "string");
    assert.equal(auth.verifySessionToken(token, 4000), null);
    assert.deepEqual(auth.recordLoginFailure("lockout-ip", 100_000), {
      locked: false,
      lockedUntil: null,
      retryAfterSeconds: 0,
      failedAttempts: 1,
      justLocked: false,
      lockoutSeconds: 0
    });
  } finally {
    if (previousSqlitePath === undefined) {
      delete process.env.SQLITE_PATH;
    } else {
      process.env.SQLITE_PATH = previousSqlitePath;
    }
  }
});

test("login route invalidates older sessions for the same user", async () => {
  const previousSqlitePath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = join(mkdtempSync(join(tmpdir(), "activity-auth-route-")), "activity.sqlite");

  try {
    const auth = await import("../lib/server/auth");
    const login = await import("../app/api/auth/login/route");
    const logout = await import("../app/api/auth/logout/route");
    const dashboard = await import("../app/api/dashboard/route");

    assert.deepEqual(auth.registerUser("owner", "Password1"), { ok: true, userId: "user-1", username: "owner" });

    function loginRequest() {
      return new NextRequest(new URL("/api/auth/login", "http://localhost"), {
        method: "POST",
        headers: new Headers({ "content-type": "application/json" }),
        body: JSON.stringify({ username: "owner", password: "Password1" })
      });
    }

    function authenticatedRequest(path: string, token: string, method = "GET") {
      return new NextRequest(new URL(path, "http://localhost"), {
        method,
        headers: new Headers({ cookie: `${auth.sessionCookieName}=${token}` })
      });
    }

    function sessionTokenFrom(response: Response) {
      const setCookie = response.headers.get("set-cookie") || "";
      const match = setCookie.match(new RegExp(`${auth.sessionCookieName}=([^;]+)`));
      assert.ok(match, "login response should set a session cookie");
      return match[1];
    }

    const firstLogin = await login.POST(loginRequest());
    assert.equal(firstLogin.status, 200);
    const firstToken = sessionTokenFrom(firstLogin);
    assert.equal((await dashboard.GET(authenticatedRequest("/api/dashboard", firstToken))).status, 200);

    const secondLogin = await login.POST(loginRequest());
    assert.equal(secondLogin.status, 200);
    const secondToken = sessionTokenFrom(secondLogin);
    assert.equal((await dashboard.GET(authenticatedRequest("/api/dashboard", firstToken))).status, 401);
    assert.equal((await dashboard.GET(authenticatedRequest("/api/dashboard", secondToken))).status, 200);

    const logoutResponse = await logout.POST(authenticatedRequest("/api/auth/logout", secondToken, "POST"));
    assert.equal(logoutResponse.status, 200);
    assert.equal((await dashboard.GET(authenticatedRequest("/api/dashboard", secondToken))).status, 401);
  } finally {
    if (previousSqlitePath === undefined) {
      delete process.env.SQLITE_PATH;
    } else {
      process.env.SQLITE_PATH = previousSqlitePath;
    }
  }
});

test("scrypt password hashes verify only the matching password", async () => {
  const { createPasswordHash, verifyPasswordHash } = await import("../lib/server/auth");
  const hash = createPasswordHash("correct horse", Buffer.from("fixed-test-salt"));

  assert.equal(verifyPasswordHash("correct horse", hash), true);
  assert.equal(verifyPasswordHash("wrong horse", hash), false);
});

test("auth validation enforces register username and password rules", () => {
  assert.deepEqual(validateAuthUsername("ab"), ["Username minimal 3 karakter."]);
  assert.deepEqual(validateAuthUsername("abcdefghijklmnopqrstu"), ["Username maksimal 20 karakter."]);
  assert.deepEqual(validateAuthUsername("User1"), ["Username hanya boleh berisi huruf kecil dan angka."]);
  assert.deepEqual(validateAuthUsername("user_1"), ["Username hanya boleh berisi huruf kecil dan angka."]);
  assert.deepEqual(validateAuthUsername("user1"), []);

  assert.deepEqual(validateAuthPassword("short1A"), ["Password minimal 8 karakter."]);
  assert.deepEqual(validateAuthPassword("lowercase1"), ["Password wajib memiliki minimal 1 huruf besar."]);
  assert.deepEqual(validateAuthPassword("NoNumber"), ["Password wajib memiliki minimal 1 angka."]);
  assert.deepEqual(validateAuthPassword("Password 1"), ["Password tidak boleh mengandung spasi."]);
  assert.deepEqual(validateAuthPassword(`${"A".repeat(64)}1`), ["Password maksimal 64 karakter."]);
  assert.deepEqual(validateAuthPassword("Password1!"), []);
});
