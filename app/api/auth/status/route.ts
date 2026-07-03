import { NextRequest, NextResponse } from "next/server";
import { getSessionFromRequest, hasRegisteredUser } from "@/lib/server/auth";

export const runtime = "nodejs";

export function GET(request: NextRequest) {
  const registered = hasRegisteredUser();
  const session = getSessionFromRequest(request);

  return NextResponse.json({
    registered,
    authenticated: Boolean(session),
    user: session?.user ?? null
  });
}
