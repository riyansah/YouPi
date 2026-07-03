import assert from "node:assert/strict";
import { mkdtempSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { validateAuthPassword, validateAuthUsername } from "../lib/auth-validation";

test("database auth registers the first user, verifies sessions, and rate limits attempts", async () => {
  const previousSqlitePath = process.env.SQLITE_PATH;
  process.env.SQLITE_PATH = join(mkdtempSync(join(tmpdir(), "activity-auth-")), "activity.sqlite");

  try {
    const auth = await import("../lib/server/auth");

    assert.equal(auth.hasRegisteredUser(), false);
    assert.deepEqual(auth.registerUser("owner", "Correct1!"), { ok: true, username: "owner" });
    assert.equal(auth.hasRegisteredUser(), true);
    assert.deepEqual(auth.registerUser("second", "correct horse"), { ok: false, reason: "exists" });
    assert.deepEqual(auth.verifyCredentials("owner", "Correct1!"), { ok: true, username: "owner" });
    assert.deepEqual(auth.verifyCredentials("owner", "Wrong1!"), { ok: false, reason: "credentials" });
    assert.deepEqual(auth.changePassword("owner", "Wrong1!", "Better2!"), { ok: false, reason: "current-password" });
    assert.deepEqual(auth.changePassword("owner", "Correct1!", "Correct1!"), { ok: false, reason: "same-password" });
    assert.deepEqual(auth.changePassword("owner", "Correct1!", "Better2!"), { ok: true });
    assert.deepEqual(auth.verifyCredentials("owner", "Correct1!"), { ok: false, reason: "credentials" });
    assert.deepEqual(auth.verifyCredentials("owner", "Better2!"), { ok: true, username: "owner" });

    const token = auth.createSessionToken("owner", 1000);

    assert.deepEqual(auth.verifySessionToken(token, 2000), { user: "owner" });
    assert.equal(auth.verifySessionToken(token, 1000 + 60 * 60 * 24 * 8 * 1000), null);
    assert.equal(auth.verifySessionToken(`${token}x`, 2000), null);

    for (let index = 0; index < 10; index += 1) {
      assert.equal(auth.checkRateLimit("login", "login-test-ip", 1000).allowed, true);
    }

    assert.equal(auth.checkRateLimit("login", "login-test-ip", 1000).allowed, false);
    auth.resetRateLimit("login", "login-test-ip");
    assert.equal(auth.checkRateLimit("login", "login-test-ip", 1000).allowed, true);

    for (let index = 0; index < 5; index += 1) {
      assert.equal(auth.checkRateLimit("register", "register-test-ip", 1000).allowed, true);
    }

    assert.equal(auth.checkRateLimit("register", "register-test-ip", 1000).allowed, false);

    const resetResult = auth.resetUserCredentials("rescued", "Rescued1A");
    assert.deepEqual(resetResult, { ok: true, action: "updated", username: "rescued" });
    assert.deepEqual(auth.verifyCredentials("owner", "Better2!"), { ok: false, reason: "credentials" });
    assert.deepEqual(auth.verifyCredentials("rescued", "Rescued1A"), { ok: true, username: "rescued" });
    assert.equal(auth.checkRateLimit("login", "login-test-ip", 1000).allowed, true);

    const resetToken = auth.createSessionToken("rescued", 3000);
    assert.deepEqual(auth.verifySessionToken(resetToken, 4000), { user: "rescued" });
    assert.equal(auth.verifySessionToken(token, 4000), null);
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
