import { AsyncLocalStorage } from "node:async_hooks";
import { randomUUID } from "node:crypto";
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { logger, sanitizeForLogging, type LogCategory, type LogLevel } from "@/lib/server/logger";

interface ActorContext {
  id: string | null;
  name: string | null;
  type: string | null;
}

interface RequestContextState {
  requestId: string;
  ipAddress: string | null;
  userAgent: string | null;
  actor: ActorContext;
  metadata: Record<string, unknown>;
}

const storage = new AsyncLocalStorage<RequestContextState>();

function defaultActor(): ActorContext {
  return {
    id: null,
    name: null,
    type: null
  };
}

export function getOrCreateRequestId(request: NextRequest) {
  return request.headers.get("x-request-id") || randomUUID();
}

function getClientIpFromHeaders(request: NextRequest) {
  const forwardedFor = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  return forwardedFor || request.headers.get("x-real-ip") || "local";
}

function buildContext(request: NextRequest): RequestContextState {
  return {
    requestId: getOrCreateRequestId(request),
    ipAddress: getClientIpFromHeaders(request),
    userAgent: request.headers.get("user-agent"),
    actor: defaultActor(),
    metadata: {}
  };
}

export function getRequestContext() {
  return storage.getStore() || null;
}

export function setRequestActor(actor: Partial<ActorContext> | null) {
  const context = storage.getStore();
  if (!context || !actor) {
    return;
  }

  context.actor = {
    ...context.actor,
    ...actor
  };
}

export function setRequestMetadata(values: Record<string, unknown>) {
  const context = storage.getStore();
  if (!context) {
    return;
  }

  context.metadata = {
    ...context.metadata,
    ...sanitizeForLogging(values)
  };
}

export async function parseJsonBody<T>(request: NextRequest): Promise<T | null> {
  const body = (await request.json().catch(() => null)) as T | null;
  if (body !== null) {
    setRequestMetadata({ request_body: body });
  }
  return body;
}

interface LogFromContextInput {
  level: LogLevel;
  category: LogCategory;
  action: string;
  activity: string;
  entityType?: string | null;
  entityId?: string | number | null;
  status?: string | null;
  description?: string | null;
  metadata?: Record<string, unknown> | null;
  error?: unknown;
  actor?: Partial<ActorContext> | null;
}

export function logWithContext(input: LogFromContextInput) {
  const context = getRequestContext();
  const actor = {
    ...(context?.actor || defaultActor()),
    ...(input.actor || {})
  };
  const error = input.error instanceof Error ? input.error : null;

  return logger.log({
    level: input.level,
    category: input.category,
    action: input.action,
    activity: input.activity,
    entity_type: input.entityType ?? null,
    entity_id: input.entityId ?? null,
    status: input.status ?? null,
    description: input.description ?? null,
    request_id: context?.requestId ?? null,
    ip_address: context?.ipAddress ?? null,
    user_agent: context?.userAgent ?? null,
    actor_id: actor.id ?? null,
    actor_name: actor.name ?? null,
    actor_type: actor.type ?? null,
    metadata: {
      ...(context?.metadata || {}),
      ...(input.metadata || {})
    },
    error_message: error?.message ?? null,
    stack_trace: error?.stack ?? null
  });
}

export function withRequestContext<T extends [NextRequest, ...unknown[]], R>(
  handler: (...args: T) => Promise<R> | R
) {
  return async (...args: T): Promise<R> => {
    const [request] = args;
    const context = buildContext(request);

    return storage.run(context, async () => {
      try {
        const result = await handler(...args);
        if (result instanceof NextResponse) {
          result.headers.set("x-request-id", context.requestId);
        }
        return result;
      } catch (error) {
        logWithContext({
          level: "error",
          category: "ERROR",
          action: "server.error",
          activity: "Server error",
          status: "failed",
          description: error instanceof Error ? error.message : "Unhandled server error",
          error,
          metadata: {
            method: request.method,
            pathname: request.nextUrl.pathname
          }
        });

        const response = NextResponse.json({ error: "Internal server error", request_id: context.requestId }, { status: 500 });
        response.headers.set("x-request-id", context.requestId);
        return response as R;
      }
    });
  };
}
