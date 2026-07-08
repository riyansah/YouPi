import assert from "node:assert/strict";
import { mkdtempSync, readFileSync, statSync, utimesSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import test from "node:test";
import { NextRequest } from "next/server";
import { createLogger, logger, sanitizeForLogging } from "../lib/server/logger";
import { parseJsonBody, setRequestActor, setRequestMetadata, withRequestContext } from "../lib/server/request-context";

test("logger writes info and error events to daily files and matching console streams", () => {
  const dir = mkdtempSync(join(tmpdir(), "activity-logger-"));
  const stdout: string[] = [];
  const stderr: string[] = [];
  const dates = [new Date("2026-07-07T10:00:00.000Z"), new Date("2026-07-08T10:00:00.000Z")];
  let index = 0;
  const testLogger = createLogger({
    logsDir: dir,
    now: () => dates[Math.min(index++, dates.length - 1)],
    stdoutWriter: (line) => stdout.push(line),
    stderrWriter: (line) => stderr.push(line)
  });

  testLogger.log({
    level: "info",
    category: "AUTH",
    action: "auth.login_success",
    activity: "Login berhasil",
    actor_id: "user-1",
    actor_name: "owner"
  });
  testLogger.log({
    level: "error",
    category: "ERROR",
    action: "server.error",
    activity: "Server error",
    error_message: "boom"
  });

  assert.equal(stdout.length, 1);
  assert.match(stdout[0], /WIB\] INFO AUTH auth\.login_success/);
  assert.equal(stderr.length, 1);
  assert.match(stderr[0], /WIB\] ERROR ERROR server\.error/);

  const firstFile = join(dir, "app-2026-07-07.log");
  const secondFile = join(dir, "app-2026-07-08.log");
  const firstPayload = JSON.parse(readFileSync(firstFile, "utf8").trim()) as { action: string; actor_id: string; timestamp: string };
  const secondPayload = JSON.parse(readFileSync(secondFile, "utf8").trim()) as { action: string; error_message: string; timestamp: string };

  assert.equal(firstPayload.action, "auth.login_success");
  assert.equal(firstPayload.actor_id, "user-1");
  assert.match(firstPayload.timestamp, /\+07:00$/);
  assert.equal(secondPayload.action, "server.error");
  assert.equal(secondPayload.error_message, "boom");
  assert.match(secondPayload.timestamp, /\+07:00$/);
});

test("logger applies retention and redacts sensitive values", () => {
  const dir = mkdtempSync(join(tmpdir(), "activity-logger-retention-"));
  const expiredFile = join(dir, "app-2026-05-01.log");
  writeFileSync(expiredFile, "{\"old\":true}\n");
  const oldDate = new Date("2026-05-01T00:00:00.000Z");
  utimesSync(expiredFile, oldDate, oldDate);

  const testLogger = createLogger({
    logsDir: dir,
    now: () => new Date("2026-07-07T10:00:00.000Z")
  });

  testLogger.log({
    level: "info",
    category: "AUTH",
    action: "auth.login_failed",
    activity: "Login gagal",
    metadata: {
      password: "secret",
      nested: {
        token: "abc",
        safe: "ok"
      }
    }
  });

  assert.throws(() => statSync(expiredFile));
  const payload = JSON.parse(readFileSync(join(dir, "app-2026-07-07.log"), "utf8").trim()) as {
    metadata: { password: string; nested: { token: string; safe: string } };
  };
  assert.equal(payload.metadata.password, "[REDACTED]");
  assert.equal(payload.metadata.nested.token, "[REDACTED]");
  assert.equal(payload.metadata.nested.safe, "ok");
});

test("sanitizeForLogging redacts common sensitive keys recursively", () => {
  const sanitized = sanitizeForLogging({
    password: "secret",
    profile: {
      refresh_token: "token",
      cookie: "raw-cookie",
      name: "owner"
    }
  });

  assert.deepEqual(sanitized, {
    password: "[REDACTED]",
    profile: {
      refresh_token: "[REDACTED]",
      cookie: "[REDACTED]",
      name: "owner"
    }
  });
});

test("request context adds request id, actor data, metadata, and logs unhandled errors", async () => {
  const captured: unknown[] = [];
  const originalLog = logger.log;
  logger.log = ((event: unknown) => {
    captured.push(event);
    return event;
  }) as typeof logger.log;

  try {
    const handler = withRequestContext(async (request: NextRequest) => {
      setRequestActor({ id: "user-1", name: "owner", type: "user" });
      setRequestMetadata({ source: "test" });
      await parseJsonBody(request);
      throw new Error("boom");
    });

    const request = new NextRequest("http://127.0.0.1:3000/api/test", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "user-agent": "logger-test",
        "x-request-id": "req_test_123"
      },
      body: JSON.stringify({ password: "secret", title: "safe" })
    });

    const response = (await handler(request)) as Response;
    assert.equal(response.status, 500);
    assert.equal(response.headers.get("x-request-id"), "req_test_123");

    const event = captured[0] as {
      action: string;
      request_id: string;
      actor_id: string;
      metadata: { source: string; request_body: { password: string; title: string } };
      error_message: string;
    };

    assert.equal(event.action, "server.error");
    assert.equal(event.request_id, "req_test_123");
    assert.equal(event.actor_id, "user-1");
    assert.equal(event.metadata.source, "test");
    assert.equal(event.metadata.request_body.password, "[REDACTED]");
    assert.equal(event.metadata.request_body.title, "safe");
    assert.equal(event.error_message, "boom");
  } finally {
    logger.log = originalLog;
  }
});
