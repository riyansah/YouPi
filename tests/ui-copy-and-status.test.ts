import assert from "node:assert/strict";
import test from "node:test";
import { tPeriod, tReportPeriodLabel, tRoute } from "../lib/i18n";
import { activityFormStatuses, activityStatuses, taskFormStatuses, taskStatuses } from "../lib/types";

test("history route label resolves in both languages", () => {
  assert.equal(tRoute("/history", "id"), "Riwayat");
  assert.equal(tRoute("/history", "en"), "History");
});

test("custom report period labels resolve in both languages", () => {
  assert.equal(tPeriod("Kustom", "id"), "Kustom");
  assert.equal(tPeriod("Kustom", "en"), "Custom");
  assert.equal(tReportPeriodLabel("Kustom", "id"), "Rentang Kustom");
  assert.equal(tReportPeriodLabel("Kustom", "en"), "Custom Range");
});

test("form status options exclude cancelled while list status options keep it", () => {
  assert.equal(taskFormStatuses.includes("Dibatalkan"), false);
  assert.equal(taskStatuses.includes("Dibatalkan"), true);
  assert.equal(activityFormStatuses.includes("Dibatalkan"), false);
  assert.equal(activityStatuses.includes("Dibatalkan"), true);
});
