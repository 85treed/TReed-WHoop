import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { buildAuthorizeUrl } from "@/lib/whoop";
import { getSession } from "@/lib/session";

export async function GET() {
  const session = await getSession();
  const state = randomUUID();
  session.oauthState = state;
  await session.save();

  return NextResponse.redirect(buildAuthorizeUrl(state));
}
