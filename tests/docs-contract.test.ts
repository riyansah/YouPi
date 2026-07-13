import assert from "node:assert/strict";
import { readFileSync, readdirSync } from "node:fs";
import { dirname, join, relative, sep } from "node:path";
import test from "node:test";

interface OpenApiOperation {
  parameters?: Array<{ name?: string }>;
  security?: unknown[];
}

interface OpenApiDocument {
  info: { version: string };
  paths: Record<string, Record<string, OpenApiOperation>>;
}

const root = process.cwd();

function readJson<T>(path: string) {
  return JSON.parse(readFileSync(path, "utf8")) as T;
}

function routeFiles(directory: string): string[] {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? routeFiles(path) : entry.name === "route.ts" ? [path] : [];
  });
}

function apiPathFromRoute(filePath: string) {
  const routeDirectory = relative(join(root, "app", "api"), dirname(filePath));
  const segments = routeDirectory.split(sep).map((segment) => {
    const dynamic = segment.match(/^\[(.+)\]$/);
    return dynamic ? `{${dynamic[1]}}` : segment;
  });
  return `/api/${segments.join("/")}`;
}

function parameterNames(document: OpenApiDocument, path: string) {
  return (document.paths[path]?.get?.parameters || []).map((parameter) => parameter.name).sort();
}

test("release versions stay synchronized", () => {
  const packageJson = readJson<{ version: string }>(join(root, "package.json"));
  const openApi = readJson<OpenApiDocument>(join(root, "docs", "openapi.json"));
  const version = readFileSync(join(root, "VERSION"), "utf8").trim();
  const changelog = readFileSync(join(root, "CHANGELOG.md"), "utf8");

  assert.equal(version, packageJson.version);
  assert.equal(openApi.info.version, version);
  assert.match(changelog, new RegExp(`^## ${version.replaceAll(".", "\\.")} - `, "m"));
});

test("OpenAPI covers every implemented API route and method", () => {
  const openApi = readJson<OpenApiDocument>(join(root, "docs", "openapi.json"));

  for (const filePath of routeFiles(join(root, "app", "api"))) {
    const path = apiPathFromRoute(filePath);
    const source = readFileSync(filePath, "utf8");
    const methods = [...source.matchAll(/export const (GET|POST|PUT|PATCH|DELETE)\s*=/g)].map((match) => match[1].toLowerCase());

    assert.ok(openApi.paths[path], `OpenAPI path missing for ${path}`);
    for (const method of methods) {
      assert.ok(openApi.paths[path][method], `OpenAPI operation missing for ${method.toUpperCase()} ${path}`);
    }
  }
});

test("OpenAPI documents schedule and custom report query parameters", () => {
  const openApi = readJson<OpenApiDocument>(join(root, "docs", "openapi.json"));

  assert.deepEqual(parameterNames(openApi, "/api/schedule"), ["anchorDate", "source", "status", "view"]);
  assert.deepEqual(parameterNames(openApi, "/api/reports"), ["period", "rangeFrom", "rangeTo", "selectedDate"]);
  assert.deepEqual(openApi.paths["/api/auth/status"].get.security, []);
  assert.deepEqual(openApi.paths["/api/auth/register"].post.security, []);
  assert.deepEqual(openApi.paths["/api/auth/login"].post.security, []);
});
