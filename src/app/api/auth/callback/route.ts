import { NextRequest, NextResponse } from "next/server";
import { exchangeCodeForTokens, getProfile } from "@/lib/whoop";
import { saveTokens } from "@/lib/db";
import { getSession } from "@/lib/session";

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const error = searchParams.get("error");
  if (error) {
    return NextResponse.redirect(
      new URL(`/login?error=${encodeURIComponent(error)}`, request.url)
    );
  }

  const code = searchParams.get("code");
  const state = searchParams.get("state");
  const session = await getSession();

  if (!code || !state || !session.oauthState || state !== session.oauthState) {
    return NextResponse.redirect(new URL("/login?error=invalid_state", request.url));
  }

  try {
    const tokens = await exchangeCodeForTokens(code);
    const expiresAt = Date.now() + tokens.expires_in * 1000;

    // getProfile() in lib/whoop.ts reads tokens from the DB keyed by WHOOP user id,
    // which we don't have yet, so fetch the profile directly with the fresh token first.
    const profile = await fetchProfileWithToken(tokens.access_token);

    saveTokens({
      userId: profile.user_id,
      firstName: profile.first_name,
      lastName: profile.last_name,
      email: profile.email,
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token,
      expiresAt,
    });

    session.whoopUserId = profile.user_id;
    session.oauthState = undefined;
    await session.save();

    return NextResponse.redirect(new URL("/", request.url));
  } catch (err) {
    console.error("WHOOP OAuth callback failed", err);
    return NextResponse.redirect(new URL("/login?error=token_exchange_failed", request.url));
  }
}

async function fetchProfileWithToken(accessToken: string) {
  const res = await fetch("https://api.prod.whoop.com/developer/v2/user/profile/basic", {
    headers: { Authorization: `Bearer ${accessToken}` },
    cache: "no-store",
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch WHOOP profile: ${res.status} ${await res.text()}`);
  }
  return res.json() as Promise<{
    user_id: number;
    email: string;
    first_name: string;
    last_name: string;
  }>;
}
