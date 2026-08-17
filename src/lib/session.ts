import { getIronSession, type SessionOptions } from "iron-session";
import { cookies } from "next/headers";

export interface SessionData {
  whoopUserId?: number;
  oauthState?: string;
}

function requireSecret() {
  const secret = process.env.SESSION_SECRET;
  if (!secret || secret.length < 32) {
    throw new Error(
      "SESSION_SECRET is missing or too short. Set a 32+ char value in .env.local (openssl rand -base64 32)."
    );
  }
  return secret;
}

export const sessionOptions: SessionOptions = {
  get password() {
    return requireSecret();
  },
  cookieName: "whoop_dashboard_session",
  cookieOptions: {
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
  },
};

export async function getSession() {
  return getIronSession<SessionData>(await cookies(), sessionOptions);
}
