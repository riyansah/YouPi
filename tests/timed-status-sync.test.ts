import assert from "node:assert/strict";
import test from "node:test";
import { syncTimedStatusChanges } from "../lib/timed-status-sync";

test("failed timed status sync recovers without mutating local state and remains retryable", async () => {
  const current = [{ id: "task-1", status: "Akan Datang" }];
  const normalized = [{ id: "task-1", status: "Berjalan" }];
  const pendingIds = new Set<string>();
  let attempts = 0;
  let recoveries = 0;

  const sync = () =>
    syncTimedStatusChanges(
      current,
      normalized,
      pendingIds,
      async () => {
        attempts += 1;
        throw new Error("network failure");
      },
      async () => {
        recoveries += 1;
      }
    );

  await sync();
  await sync();

  assert.equal(current[0].status, "Akan Datang");
  assert.equal(attempts, 2);
  assert.equal(recoveries, 2);
  assert.equal(pendingIds.size, 0);
});

test("timed status sync prevents overlapping persistence for the same item", async () => {
  const current = [{ id: "activity-1", status: "Direncanakan" }];
  const normalized = [{ id: "activity-1", status: "Berjalan" }];
  const pendingIds = new Set<string>();
  let attempts = 0;
  let resolvePersist: (() => void) | undefined;
  const persist = () => {
    attempts += 1;
    return new Promise<void>((resolve) => {
      resolvePersist = resolve;
    });
  };

  const first = syncTimedStatusChanges(current, normalized, pendingIds, persist, async () => undefined);
  await syncTimedStatusChanges(current, normalized, pendingIds, persist, async () => undefined);

  assert.equal(attempts, 1);
  assert.equal(pendingIds.has("activity-1"), true);

  assert.ok(resolvePersist);
  resolvePersist();
  await first;
  assert.equal(pendingIds.size, 0);
});
