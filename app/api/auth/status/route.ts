import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, hasRegisteredUser } from "@/lib/server/auth";
import { setRequestActor, withRequestContext } from "@/lib/server/request-context";

export const runtime = "nodejs";

export const GET = withRequestContext(function GET(request: NextRequest) {
  const registered = hasRegisteredUser();
  const session = getSessionFromRequest(request);

  if (session) {
    setRequestActor({ id: session.userId, name: session.user, type: "user" });
  }

  return NextResponse.json({
    registered,
    authenticated: Boolean(session),
    user: session?.user ?? null
  });
});
