import assert from "node:assert/strict";
import test from "node:test";
import { tRoute } from "../lib/i18n";
import { activityFormStatuses, activityStatuses, taskFormStatuses, taskStatuses } from "../lib/types";

test("history route label resolves in both languages", () => {
  assert.equal(tRoute("/history", "id"), "Riwayat");
  assert.equal(tRoute("/history", "en"), "History");
});

test("form status options exclude cancelled while list status options keep it", () => {
  assert.equal(taskFormStatuses.includes("Dibatalkan"), false);
  assert.equal(taskStatuses.includes("Dibatalkan"), true);
  assert.equal(activityFormStatuses.includes("Dibatalkan"), false);
  assert.equal(activityStatuses.includes("Dibatalkan"), true);
});
