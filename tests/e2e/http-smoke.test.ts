import assert from "node:assert/strict";
import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { once } from "node:events";
import { cpSync, existsSync, mkdtempSync, rmSync } from "node:fs";
import { createServer } from "node:net";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { setTimeout as delay } from "node:timers/promises";
import test from "node:test";

async function availablePort() {
  const server = createServer();
  await new Promise<void>((resolve, reject) => {
    server.once("error", reject);
    server.listen(0, "127.0.0.1", resolve);
  });
  const address = server.address();
  assert.ok(address && typeof address === "object");
  await new Promise<void>((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  return address.port;
}

async function stopServer(server: ChildProcessWithoutNullStreams) {
  if (server.exitCode !== null) {
    return;
  }

  server.kill("SIGTERM");
  await Promise.race([once(server, "exit"), delay(5_000)]);
  if (server.exitCode === null) {
    server.kill("SIGKILL");
    await once(server, "exit");
  }
}

async function waitForServer(origin: string, server: ChildProcessWithoutNullStreams, output: () => string) {
  const deadline = Date.now() + 20_000;
  while (Date.now() < deadline) {
    if (server.exitCode !== null) {
      throw new Error(`Production server exited early.\n${output()}`);
    }

    try {
      const response = await fetch(`${origin}/api/auth/status`);
      if (response.ok) {
        return;
      }
    } catch {
      // The server may still be binding its socket.
    }

    await delay(100);
  }

  throw new Error(`Timed out waiting for production server.\n${output()}`);
}

function locationPath(response: Response) {
  const location = response.headers.get("location");
  assert.ok(location);
  return new URL(location).pathname;
}

test("production HTTP flow covers auth, middleware, CRUD, backup restore, and logout", { timeout: 45_000 }, async (context) => {
  const standaloneRoot = join(process.cwd(), ".next", "standalone");
  const standaloneServer = join(standaloneRoot, "server.js");
  const sourceStatic = join(process.cwd(), ".next", "static");
  const standaloneStatic = join(standaloneRoot, ".next", "static");
  assert.ok(existsSync(standaloneServer), "Run npm run build before npm run test:e2e.");
  assert.ok(existsSync(sourceStatic), "Built static assets are missing.");
  rmSync(standaloneStatic, { recursive: true, force: true });
  cpSync(sourceStatic, standaloneStatic, { recursive: true });

  const directory = mkdtempSync(join(tmpdir(), "youpi-e2e-"));
  const port = await availablePort();
  const origin = `http://127.0.0.1:${port}`;
  const server = spawn(process.execPath, [standaloneServer], {
    cwd: process.cwd(),
    env: {
      ...process.env,
      APP_INTERNAL_ORIGIN: origin,
      HOSTNAME: "127.0.0.1",
      PORT: String(port),
      SQLITE_PATH: join(directory, "activity.sqlite"),
      TRUST_PROXY_HEADERS: "false"
    },
    stdio: "pipe"
  });
  let serverOutput = "";
  const capture = (chunk: Buffer) => {
    serverOutput = `${serverOutput}${chunk.toString()}`.slice(-20_000);
  };
  server.stdout.on("data", capture);
  server.stderr.on("data", capture);

  context.after(async () => {
    await stopServer(server);
    rmSync(directory, { recursive: true, force: true });
  });

  await waitForServer(origin, server, () => serverOutput);

  const protectedPage = await fetch(`${origin}/dashboard`, { redirect: "manual" });
  assert.ok(protectedPage.status >= 300 && protectedPage.status < 400);
  assert.equal(locationPath(protectedPage), "/register");

  const registerPage = await fetch(`${origin}/register`);
  assert.equal(registerPage.status, 200);
  const registerHtml = await registerPage.text();
  assert.match(registerHtml, /YouPi/);
  const staticAssetPath = registerHtml.match(/(?:src|href)="([^"]*\/_next\/static\/[^"]+)"/)?.[1];
  assert.ok(staticAssetPath, "Rendered page should reference a built static asset.");
  const staticAsset = await fetch(new URL(staticAssetPath, origin));
  assert.equal(staticAsset.status, 200);
  assert.ok((await staticAsset.arrayBuffer()).byteLength > 0);

  const credentials = { username: "owner", password: "Password1" };
  const register = await fetch(`${origin}/api/auth/register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  assert.equal(register.status, 200);

  const login = await fetch(`${origin}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(credentials)
  });
  assert.equal(login.status, 200);
  const setCookie = login.headers.get("set-cookie");
  assert.ok(setCookie);
  const cookie = setCookie.split(";", 1)[0];

  const tasksPage = await fetch(`${origin}/tasks`, { headers: { cookie } });
  assert.equal(tasksPage.status, 200);
  assert.match(await tasksPage.text(), /YouPi/);

  const create = await fetch(`${origin}/api/tasks`, {
    method: "POST",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({
      title: "E2E task",
      description: "Validate the production HTTP flow",
      status: "Akan Datang",
      priority: "Sedang",
      startDate: "2026-12-01",
      deadline: "2026-12-02",
      startTime: null,
      endTime: null,
      completedAt: null
    })
  });
  assert.equal(create.status, 201);
  const task = await create.json() as { id: string; title: string };
  assert.equal(task.title, "E2E task");

  const update = await fetch(`${origin}/api/tasks/${task.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify({ title: "Updated E2E task" })
  });
  assert.equal(update.status, 200);
  assert.equal((await update.json() as { title: string }).title, "Updated E2E task");

  const backupResponse = await fetch(`${origin}/api/backup`, { headers: { cookie } });
  assert.equal(backupResponse.status, 200);
  const backup = await backupResponse.json();

  const remove = await fetch(`${origin}/api/tasks/${task.id}`, {
    method: "DELETE",
    headers: { cookie }
  });
  assert.equal(remove.status, 200);

  const restore = await fetch(`${origin}/api/backup`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", cookie },
    body: JSON.stringify(backup)
  });
  assert.equal(restore.status, 200);

  const list = await fetch(`${origin}/api/tasks`, { headers: { cookie } });
  assert.equal(list.status, 200);
  const tasks = await list.json() as Array<{ id: string; title: string }>;
  assert.deepEqual(tasks.map((item) => item.title), ["Updated E2E task"]);

  const logout = await fetch(`${origin}/api/auth/logout`, {
    method: "POST",
    headers: { cookie }
  });
  assert.equal(logout.status, 200);

  const afterLogout = await fetch(`${origin}/api/tasks`, {
    headers: { cookie },
    redirect: "manual"
  });
  assert.equal(afterLogout.status, 401);

  const loginRedirect = await fetch(`${origin}/dashboard`, {
    headers: { cookie },
    redirect: "manual"
  });
  assert.ok(loginRedirect.status >= 300 && loginRedirect.status < 400);
  assert.equal(locationPath(loginRedirect), "/login");
});
