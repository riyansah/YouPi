import { normalizeAuthUsername, validateAuthPassword, validateAuthUsername } from "../lib/auth-validation";
import { resetUserCredentials } from "../lib/server/auth";
import { logger } from "../lib/server/logger";

function getArg(flag: string) {
  const index = process.argv.indexOf(flag);
  if (index === -1) {
    return null;
  }

  return process.argv[index + 1] ?? null;
}

const rawUsername = getArg("--username");
const password = getArg("--password");

if (!rawUsername || !password) {
  console.error("Usage: npm run auth:reset -- --username <username> --password <password>");
  process.exit(1);
}

const username = normalizeAuthUsername(rawUsername);
const usernameErrors = validateAuthUsername(username);
const passwordErrors = validateAuthPassword(password);
const validationErrors = [...usernameErrors, ...passwordErrors];

if (validationErrors.length > 0) {
  for (const error of validationErrors) {
    console.error(`- ${error}`);
  }
  process.exit(1);
}

const result = resetUserCredentials(username, password);

if (!result.ok) {
  logger.log({
    level: "error",
    category: "ERROR",
    action: "system.auth_reset_failed",
    activity: "Reset auth gagal",
    actor_id: "cli_reset_auth",
    actor_name: "reset-auth script",
    actor_type: "system",
    entity_type: "user",
    status: "failed",
    description: "Auth reset failed from CLI script."
  });
  console.error("Reset auth gagal.");
  process.exit(1);
}

logger.log({
  level: "info",
  category: "SYSTEM_ACTIVITY",
  action: result.action === "created" ? "system.auth_created" : "system.auth_reset",
  activity: result.action === "created" ? "Auth dibuat ulang" : "Auth direset",
  actor_id: "cli_reset_auth",
  actor_name: "reset-auth script",
  actor_type: "system",
  entity_type: "user",
  entity_id: result.userId,
  status: "success",
  description: `Auth credentials updated for ${result.username}.`
});
console.log(
  result.action === "created"
    ? `Auth berhasil dibuat ulang untuk user ${result.username}.`
    : `Auth berhasil direset untuk user ${result.username}.`
);
console.log("Semua sesi login sebelumnya sudah tidak berlaku.");
