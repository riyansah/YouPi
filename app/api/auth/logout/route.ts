import { NextRequest, NextResponse } from "next/server";
import { deleteSession, getSessionFromRequest, sessionCookieName } from "@/lib/server/auth";
import { logWithContext, setRequestActor, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const POST = withRequestContext(async function POST(request: NextRequest) {
  const session = getSessionFromRequest(request);

  if (session) {
    setRequestActor({ id: session.userId, name: session.user, type: "user" });
    deleteSession(session.sessionId);
  }

  const response = NextResponse.json({ ok: true });
  response.cookies.set(sessionCookieName, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 0
  });

  logWithContext({
    level: "info",
    category: "AUTH",
    action: "auth.logout",
    activity: "Logout",
    entityType: "user",
    entityId: session?.userId ?? null,
    status: "success",
    description: session ? `${session.user} logged out.` : "Anonymous logout request completed."
  });

  return response;
});
