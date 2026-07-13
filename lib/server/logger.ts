import { appendFileSync, existsSync, mkdirSync, readdirSync, statSync, unlinkSync } from "node:fs";
import { join } from "node:path";
import {
  APP_DEFAULT_TIME_ZONE,
  getDateKeyFromTimestamp,
  getDateTimePartsInTimeZone,
  getTimestampInTimeZone
} from "@/lib/time";

export type LogLevel = "debug" | "info" | "warn" | "error" | "fatal";
export type LogCategory = "AUTH" | "USER_ACTIVITY" | "SYSTEM_ACTIVITY" | "SECURITY" | "ERROR";

export interface LogEvent {
  timestamp?: string | null;
  level: LogLevel;
  category: LogCategory;
  actor_id?: string | number | null;
  actor_name?: string | null;
  actor_type?: string | null;
  action: string;
  activity: string;
  entity_type?: string | null;
  entity_id?: string | number | null;
  status?: string | null;
  description?: string | null;
  request_id?: string | null;
  ip_address?: string | null;
  user_agent?: string | null;
  metadata?: Record<string, unknown> | null;
  error_message?: string | null;
  stack_trace?: string | null;
}

interface LoggerOptions {
  logsDir?: string;
  retentionDays?: number;
  now?: () => Date;
  stdoutWriter?: (line: string) => void;
  stderrWriter?: (line: string) => void;
}

const SENSITIVE_KEY_PATTERN = /(pass(word)?|token|secret|otp|session|cookie|authorization|api[-_]?key|private[-_]?key)/i;
const LOG_FILE_PATTERN = /^app-\d{4}-\d{2}-\d{2}\.log$/;

function defaultWriter(method: "stdout" | "stderr") {
  return (line: string) => {
    const stream = method === "stdout" ? process.stdout : process.stderr;
    stream.write(`${line}\n`);
  };
}

function formatConsoleTimestamp(date: Date) {
  const parts = getDateTimePartsInTimeZone(date, APP_DEFAULT_TIME_ZONE);
  return `${parts.year}-${parts.month}-${parts.day} ${parts.hour}:${parts.minute}:${parts.second}`;
}

function toLogValue(value: unknown, depth = 0): unknown {
  if (depth > 6) {
    return "[Truncated]";
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    };
  }

  if (Array.isArray(value)) {
    return value.map((item) => toLogValue(item, depth + 1));
  }

  if (value instanceof Date) {
    return getTimestampInTimeZone(value);
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>).map(([key, item]) => [key, toLogValue(item, depth + 1)]);
    return Object.fromEntries(entries);
  }

  return value;
}

export function sanitizeForLogging<T>(value: T, keyPath = "", depth = 0): T {
  if (depth > 6) {
    return "[Truncated]" as T;
  }

  if (Array.isArray(value)) {
    return value.map((item, index) => sanitizeForLogging(item, `${keyPath}[${index}]`, depth + 1)) as T;
  }

  if (value instanceof Error) {
    return {
      name: value.name,
      message: value.message,
      stack: value.stack
    } as T;
  }

  if (!value || typeof value !== "object") {
    return value;
  }

  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};

  for (const [key, item] of Object.entries(input)) {
    const nextPath = keyPath ? `${keyPath}.${key}` : key;

    if (SENSITIVE_KEY_PATTERN.test(key) || SENSITIVE_KEY_PATTERN.test(nextPath)) {
      output[key] = "[REDACTED]";
      continue;
    }

    output[key] = sanitizeForLogging(item, nextPath, depth + 1);
  }

  return output as T;
}

function normalizeEvent(event: LogEvent, now: Date): Required<LogEvent> {
  return {
    timestamp: event.timestamp || getTimestampInTimeZone(now),
    level: event.level,
    category: event.category,
    actor_id: event.actor_id ?? null,
    actor_name: event.actor_name ?? null,
    actor_type: event.actor_type ?? null,
    action: event.action,
    activity: event.activity,
    entity_type: event.entity_type ?? null,
    entity_id: event.entity_id ?? null,
    status: event.status ?? null,
    description: event.description ?? null,
    request_id: event.request_id ?? null,
    ip_address: event.ip_address ?? null,
    user_agent: event.user_agent ?? null,
    metadata: sanitizeForLogging(toLogValue(event.metadata ?? {})) as Record<string, unknown>,
    error_message: event.error_message ?? null,
    stack_trace: event.stack_trace ?? null
  };
}

function consoleLine(event: Required<LogEvent>, now: Date) {
  const parts = [
    `[${formatConsoleTimestamp(now)} WIB]`,
    event.level.toUpperCase(),
    event.category,
    event.action,
    "-",
    event.activity
  ];

  const suffix = [
    event.actor_name ? `actor=${event.actor_name}` : null,
    event.actor_id !== null ? `actor_id=${event.actor_id}` : null,
    event.entity_type ? `entity_type=${event.entity_type}` : null,
    event.entity_id !== null ? `entity_id=${event.entity_id}` : null,
    event.status ? `status=${event.status}` : null,
    event.ip_address ? `ip=${event.ip_address}` : null,
    event.request_id ? `request_id=${event.request_id}` : null,
    event.error_message ? `error=${JSON.stringify(event.error_message)}` : null
  ].filter(Boolean);

  return suffix.length ? `${parts.join(" ")} | ${suffix.join(" ")}` : parts.join(" ");
}

export function createLogger(options: LoggerOptions = {}) {
  const logsDir = options.logsDir || join(process.cwd(), "logs");
  const retentionDays = options.retentionDays ?? 30;
  const now = options.now || (() => new Date());
  const stdoutWriter = options.stdoutWriter || defaultWriter("stdout");
  const stderrWriter = options.stderrWriter || defaultWriter("stderr");
  let activeDateKey = "";

  function ensureLogsDir() {
    mkdirSync(logsDir, { recursive: true });
  }

  function cleanupOldLogs(current: Date) {
    ensureLogsDir();
    const cutoffMs = retentionDays * 24 * 60 * 60 * 1000;

    for (const fileName of readdirSync(logsDir)) {
      if (!LOG_FILE_PATTERN.test(fileName)) {
        continue;
      }

      const filePath = join(logsDir, fileName);
      const stats = statSync(filePath);
      if (current.getTime() - stats.mtimeMs > cutoffMs) {
        unlinkSync(filePath);
      }
    }
  }

  function resolveFilePath(current: Date) {
    const dateKey = getDateKeyFromTimestamp(current);
    if (activeDateKey !== dateKey || !existsSync(logsDir)) {
      ensureLogsDir();
      cleanupOldLogs(current);
      activeDateKey = dateKey;
    }

    return join(logsDir, `app-${dateKey}.log`);
  }

  return {
    log(event: LogEvent) {
      const current = now();
      const payload = normalizeEvent(event, current);
      const line = consoleLine(payload, current);

      if (payload.level === "error" || payload.level === "fatal") {
        stderrWriter(line);
      } else {
        stdoutWriter(line);
      }

      try {
        appendFileSync(resolveFilePath(current), `${JSON.stringify(payload)}\n`, "utf8");
      } catch {
        try {
          stderrWriter(`[${formatConsoleTimestamp(current)} WIB] WARN ERROR logger.file_write_failed - Gagal menulis log ke file`);
        } catch {
          // File logging is best-effort and must not affect the application flow.
        }
      }

      return payload;
    }
  };
}

export const logger = createLogger();
