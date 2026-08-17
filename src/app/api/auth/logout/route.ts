import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { deleteTokens } from "@/lib/db";

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (session.whoopUserId) {
    deleteTokens(session.whoopUserId);
  }
  session.destroy();
  return NextResponse.redirect(new URL("/login", request.url));
}
