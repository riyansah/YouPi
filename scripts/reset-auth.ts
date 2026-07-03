import { normalizeAuthUsername, validateAuthPassword, validateAuthUsername } from "../lib/auth-validation";
import { resetUserCredentials } from "../lib/server/auth";

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
  console.error("Reset auth gagal.");
  process.exit(1);
}

console.log(
  result.action === "created"
    ? `Auth berhasil dibuat ulang untuk user ${result.username}.`
    : `Auth berhasil direset untuk user ${result.username}.`
);
console.log("Semua sesi login sebelumnya sudah tidak berlaku.");
